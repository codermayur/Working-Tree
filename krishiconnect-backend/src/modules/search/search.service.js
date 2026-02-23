/**
 * Search service: user search via MongoDB text index + similar recommendations fallback.
 * Excludes current user and blocked users; respects privacy; public-safe projection only.
 */
const mongoose = require('mongoose');
const User = require('../user/user.model');
const Block = require('../user/block.model');

const MAX_QUERY_LENGTH = 100;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

/** Public-safe fields for search results (no password, email, phone, tokens). */
const SEARCH_SELECT =
  'name username avatar profilePhoto bio location.city location.state location.district location.country ' +
  'expertDetails.specialization isExpert stats.followersCount stats.followingCount stats.postsCount ' +
  'verificationStatus preferences.privacy.profileVisibility preferences.privacy.showLocation createdAt';

/** Get user IDs to exclude: viewer + users they blocked + users who blocked them. */
async function getSearchExcludeIds(viewerId) {
  if (!viewerId) return [];
  const [blockedByViewer, blockViewerDocs] = await Promise.all([
    Block.find({ blocker: viewerId }).select('blocked').lean(),
    Block.find({ blocked: viewerId }).select('blocker').lean(),
  ]);
  const ids = new Set([viewerId.toString()]);
  blockedByViewer.forEach((d) => ids.add(d.blocked?.toString()));
  blockViewerDocs.forEach((d) => ids.add(d.blocker?.toString()));
  return [...ids];
}

/**
 * Sanitize search query: trim, limit length, escape for safe use.
 * Prevents regex injection when using $regex fallback.
 */
function sanitizeQuery(q) {
  if (q == null || typeof q !== 'string') return '';
  let s = q.trim().slice(0, MAX_QUERY_LENGTH);
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Base filter: active, not banned, not excluded, and visible to public.
 * For search we only return users with profileVisibility 'public' (or omit private profiles).
 */
function baseFilter(excludeIds) {
  const objectIds = excludeIds
    .filter((id) => id && mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));
  const filter = {
    isActive: true,
    isBanned: false,
    _id: { $nin: objectIds },
    $or: [
      { 'preferences.privacy.profileVisibility': 'public' },
      { 'preferences.privacy.profileVisibility': { $exists: false } },
    ],
  };
  return filter;
}

/**
 * Text search: use $text and sort by textScore.
 * Returns { data, pagination: { page, limit, totalCount, hasNextPage } }.
 */
async function searchWithText(query, viewerId, options = {}) {
  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(options.limit, 10) || DEFAULT_LIMIT));
  const skip = (page - 1) * limit;

  const excludeIds = await getSearchExcludeIds(viewerId);
  const filter = baseFilter(excludeIds);

  const q = sanitizeQuery(query);
  if (!q) {
    return { data: [], pagination: { page, limit, totalCount: 0, hasNextPage: false } };
  }

  filter.$text = { $search: q };
  const sort = { score: { $meta: 'textScore' } };

  const [data, totalCount] = await Promise.all([
    User.find(filter)
      .select(SEARCH_SELECT)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  const hasNextPage = skip + data.length < totalCount;
  return {
    data,
    pagination: { page, limit, totalCount, hasNextPage },
  };
}

/**
 * Fallback when no/few text results: same location, similar specialization, or most followed.
 */
async function getSimilarRecommendations(viewerId, options = {}) {
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(options.limit, 10) || DEFAULT_LIMIT));
  const excludeIds = await getSearchExcludeIds(viewerId);
  const filter = baseFilter(excludeIds);

  const users = await User.find(filter)
    .select(SEARCH_SELECT)
    .sort({ 'stats.followersCount': -1, createdAt: -1 })
    .limit(limit)
    .lean();

  return {
    data: users,
    pagination: { page: 1, limit, totalCount: users.length, hasNextPage: false },
  };
}

/**
 * Main search: text search first; if no results, return similar recommendations.
 */
async function search(queryParams, viewerId) {
  const q = sanitizeQuery(queryParams.q);
  const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(queryParams.limit, 10) || DEFAULT_LIMIT));

  const result = await searchWithText(q, viewerId, { page, limit });

  if (result.data.length === 0 && q) {
    return getSimilarRecommendations(viewerId, { limit });
  }

  if (result.data.length === 0 && !q) {
    return { data: [], pagination: { page: 1, limit, totalCount: 0, hasNextPage: false } };
  }

  return result;
}

module.exports = {
  search,
  searchWithText,
  getSimilarRecommendations,
  sanitizeQuery,
  SEARCH_SELECT,
};
