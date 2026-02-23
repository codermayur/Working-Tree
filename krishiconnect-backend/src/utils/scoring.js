/**
 * Recommendation scoring for network suggestions.
 * Score = locationMatchWeight + mutualFollowersWeight + profileCompletenessWeight.
 * Used to sort candidates by relevance (higher = better).
 */

const DEFAULT_WEIGHTS = {
  /** Location match level: 3 = city, 2 = state, 1 = country, 0 = none */
  locationCity: 40,
  locationState: 25,
  locationCountry: 10,
  locationNone: 0,
  /** Per mutual follower (capped contribution) */
  mutualPerUnit: 2,
  mutualCap: 20,
  /** Profile completeness 0–100 → scaled 0–40 points */
  profileCompletenessMax: 40,
};

/**
 * Get location tier weight.
 * @param {number} level - 3 = city, 2 = state, 1 = country, 0 = none
 * @param {object} weights - optional overrides
 * @returns {number}
 */
function getLocationWeight(level, weights = {}) {
  const w = { ...DEFAULT_WEIGHTS, ...weights };
  if (level >= 3) return w.locationCity;
  if (level >= 2) return w.locationState;
  if (level >= 1) return w.locationCountry;
  return w.locationNone;
}

/**
 * Compute recommendation score for a candidate.
 * @param {number} locationMatchLevel - 3=city, 2=state, 1=country, 0=none
 * @param {number} mutualFollowersCount - number of mutual connections
 * @param {number} profileCompleteness - 0–100
 * @param {object} weights - optional weight overrides
 * @returns {number} score (higher = better)
 */
function computeRecommendationScore(
  locationMatchLevel,
  mutualFollowersCount = 0,
  profileCompleteness = 0,
  weights = {}
) {
  const w = { ...DEFAULT_WEIGHTS, ...weights };
  const locationScore = getLocationWeight(locationMatchLevel, w);
  const mutualScore = Math.min(
    (mutualFollowersCount || 0) * w.mutualPerUnit,
    w.mutualCap
  );
  const completenessScore =
    (Math.min(100, Math.max(0, profileCompleteness || 0)) / 100) *
    w.profileCompletenessMax;
  return locationScore + mutualScore + completenessScore;
}

module.exports = {
  DEFAULT_WEIGHTS,
  getLocationWeight,
  computeRecommendationScore,
};
