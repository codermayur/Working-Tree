const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const networkService = require('./network.service');

/**
 * GET /network/recommendations
 * Query: page, limit
 * Returns recommended users (location-based, scored), paginated.
 */
const getRecommendations = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));

  const result = await networkService.getRecommendations(userId, { page, limit });

  res.status(200).json(
    new ApiResponse(200, result.data, 'Recommendations fetched successfully', {
      pagination: result.pagination,
    })
  );
});

module.exports = {
  getRecommendations,
};
