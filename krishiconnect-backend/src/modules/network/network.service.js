/**
 * Network recommendation service: location-based suggestions with scoring.
 * Excludes self and already-followed users. Optimized with lean(), projection, single mutual-count aggregation.
 */
const mongoose = require('mongoose');
const User = require('../user/user.model');
const Follow = require('../user/follow.model');
const userService = require('../user/user.service');
const ApiError = require('../../utils/ApiError');
const { computeRecommendationScore } = require('../../utils/scoring');
const logger = require('../../config/logger');

/** DTO: fields returned for each recommended user (no private data) */
const RECOMMENDATION_PROJECTION =
  'name username avatar profilePhoto bio location stats.followersCount stats.followingCount profileCompleteness lastProfileUpdate isExpert expertDetails.specialization createdAt';

/** Max pool size per request to avoid heavy queries (scalability) */
const MAX_POOL_SIZE = 200;

/** Set to true to log recommendation query debug info (e.g. DEBUG_NETWORK=1). */
const DEBUG = process.env.DEBUG_NETWORK === '1' || process.env.DEBUG_NETWORK === 'true';

/**
 * Normalize location for matching. Uses city || district as city equivalent.
 * Trims whitespace to avoid case/whitespace mismatches.
 */
function normalizeLocation(loc) {
  if (!loc || typeof loc !== 'object') return { city: null, state: null, country: 'India' };
  return {
    city: (loc.city || loc.district || '').trim() || null,
    state: (loc.state || '').trim() || null,
    country: (loc.country || 'India').trim() || 'India',
  };
}

/**
 * Get list of user IDs that the current user is already following.
 */
async function getFollowingIds(followerId) {
  const ids = await Follow.find({ follower: followerId })
    .select('following')
    .lean();
  return ids.map((d) => d.following);
}

/**
 * Build case-insensitive regex for location match; allows optional leading/trailing whitespace in DB.
 */
function locationRegex(value) {
  if (value == null || value === '') return null;
  const escaped = String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^\\s*${escaped}\\s*$`, 'i');
}

/**
 * Ensure IDs are ObjectIds for consistent $nin (avoids string vs ObjectId mismatch).
 */
function toObjectIds(ids) {
  const result = [];
  for (const id of ids) {
    if (id == null) continue;
    try {
      result.push(id instanceof mongoose.Types.ObjectId ? id : new mongoose.Types.ObjectId(String(id)));
    } catch {
      // Skip invalid ID
    }
  }
  return result;
}

/**
 * Fetch recommendation candidates by location tier: city → state → country.
 * - City tier: matches location.city OR location.district (same value) so users with only district set are included.
 * - State tier: matches location.state (case-insensitive, optional whitespace).
 * - Country tier: matches location.country OR missing/null (default India) for backward compatibility.
 * Returns array of { user, locationMatchLevel }.
 */
async function fetchCandidatesByLocation(excludeIds, location, poolSize) {
  const { city, state, country } = location;
  const excludeObjectIds = toObjectIds(excludeIds);
  const queryBase = {
    _id: { $nin: excludeObjectIds },
    isActive: true,
    isBanned: { $ne: true },
  };
  const result = [];
  const seen = new Set(excludeIds.map((id) => String(id)));

  const add = (doc, level) => {
    const id = doc._id.toString();
    if (seen.has(id)) return;
    seen.add(id);
    result.push({ user: doc, locationMatchLevel: level });
    return result.length >= poolSize;
  };

  if (city) {
    const cityRegex = locationRegex(city);
    if (cityRegex) {
      const cityQuery = {
        ...queryBase,
        $or: [
          { 'location.city': cityRegex },
          { 'location.district': cityRegex },
        ],
      };
      if (DEBUG) logger.info('[network] City-tier query', JSON.stringify(cityQuery, null, 2));
      const cityUsers = await User.find(cityQuery)
        .select(RECOMMENDATION_PROJECTION)
        .lean()
        .limit(poolSize);
      if (DEBUG) logger.info('[network] City-tier results count: %d', cityUsers.length);
      for (const u of cityUsers) if (add(u, 3)) return result;
    }
  }

  if (state) {
    const stateRegex = locationRegex(state);
    if (stateRegex) {
      const stateQuery = {
        ...queryBase,
        _id: { $nin: result.map((r) => r.user._id) },
        'location.state': stateRegex,
      };
      if (DEBUG) logger.info('[network] State-tier results count (query state=%s)', state);
      const stateUsers = await User.find(stateQuery)
        .select(RECOMMENDATION_PROJECTION)
        .lean()
        .limit(poolSize - result.length);
      if (DEBUG) logger.info('[network] State-tier results count: %d', stateUsers.length);
      for (const u of stateUsers) if (add(u, 2)) return result;
    }
  }

  const countryRegex = locationRegex(country);
  const countryOr = [];
  if (countryRegex) countryOr.push({ 'location.country': countryRegex });
  const isIndia = country && country.toLowerCase() === 'india';
  if (isIndia) {
    countryOr.push(
      { 'location.country': { $in: [null, ''] } },
      { 'location.country': { $exists: false } }
    );
  }
  const countryQuery = {
    ...queryBase,
    _id: { $nin: result.map((r) => r.user._id) },
    $or: countryOr.length ? countryOr : [{ 'location.country': { $exists: true } }],
  };
  if (DEBUG) logger.info('[network] Country-tier query $or length: %d', countryQuery.$or.length);
  const countryUsers = await User.find(countryQuery)
    .select(RECOMMENDATION_PROJECTION)
    .lean()
    .limit(poolSize - result.length);
  if (DEBUG) logger.info('[network] Country-tier results count: %d', countryUsers.length);
  for (const u of countryUsers) add(u, 1);

  return result;
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get mutual follower counts for candidate user IDs (how many of "my following" also follow each candidate).
 * Returns Map<userIdStr, count>.
 */
async function getMutualCounts(candidateIds, myFollowingIds) {
  if (!candidateIds.length || !myFollowingIds.length) {
    return new Map();
  }
  const docs = await Follow.aggregate([
    {
      $match: {
        following: { $in: candidateIds },
        follower: { $in: myFollowingIds },
      },
    },
    { $group: { _id: '$following', count: { $sum: 1 } } },
  ]).exec();
  const map = new Map();
  docs.forEach((d) => map.set(d._id.toString(), d.count));
  return map;
}

/**
 * GET recommendations for the authenticated user.
 * Pagination: page, limit. Sorted by score (location + mutual + profile completeness).
 */
async function getRecommendations(userId, options = {}) {
  const { page = 1, limit: requestedLimit = 20 } = options;
  const limit = Math.min(Math.max(1, requestedLimit), 50);
  const poolSize = Math.min(limit * 5, MAX_POOL_SIZE);

  const [currentUser, followingIds, blockExcludeIds] = await Promise.all([
    User.findById(userId)
      .select('location')
      .lean(),
    getFollowingIds(userId),
    userService.getBlockExcludeIds(userId),
  ]);

  if (!currentUser) {
    throw new ApiError(404, 'User not found');
  }

  const excludeIds = [
    ...new Set([
      String(userId),
      ...followingIds.map((id) => id.toString()),
      ...(blockExcludeIds || []),
    ]),
  ];
  const location = normalizeLocation(currentUser.location);

  if (DEBUG) {
    logger.info('[network] Logged-in user location (raw): %j', currentUser.location);
    logger.info('[network] Normalized location for query: %j', location);
    logger.info('[network] Exclude IDs count (self + following): %d', excludeIds.length);
  }

  const candidates = await fetchCandidatesByLocation(
    excludeIds,
    location,
    poolSize
  );

  if (DEBUG) logger.info('[network] Candidates count after fetchCandidatesByLocation: %d', candidates.length);

  if (candidates.length === 0) {
    return {
      data: [],
      pagination: {
        page: 1,
        limit,
        totalItems: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }

  const candidateIds = candidates.map((c) => c.user._id);
  const mutualCounts = await getMutualCounts(candidateIds, followingIds);

  const scored = candidates.map(({ user, locationMatchLevel }) => {
    const mutual = mutualCounts.get(user._id.toString()) || 0;
    const score = computeRecommendationScore(
      locationMatchLevel,
      mutual,
      user.profileCompleteness ?? 0
    );
    return {
      ...user,
      mutualFollowersCount: mutual,
      _score: score,
    };
  });

  scored.sort((a, b) => {
    if (b._score !== a._score) return b._score - a._score;
    const aDate = a.lastProfileUpdate || a.createdAt || 0;
    const bDate = b.lastProfileUpdate || b.createdAt || 0;
    return new Date(bDate) - new Date(aDate);
  });

  const totalItems = scored.length;
  const skip = (page - 1) * limit;
  const pageData = scored.slice(skip, skip + limit);

  const out = pageData.map((u) => {
    const { _score, ...rest } = u;
    return rest;
  });

  return {
    data: out,
    pagination: {
      page,
      limit,
      totalItems,
      hasNextPage: skip + pageData.length < totalItems,
      hasPrevPage: page > 1,
    },
  };
}

module.exports = {
  getRecommendations,
  getFollowingIds,
  normalizeLocation,
};
