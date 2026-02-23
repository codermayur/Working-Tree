/**
 * Search controller: GET /search?q=...&page=1&limit=10
 * Auth required. Validates input, calls service, returns public-safe user list with pagination.
 */
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const searchService = require('./search.service');

const MAX_QUERY_LENGTH = 100;

const search = asyncHandler(async (req, res) => {
  const viewerId = req.user?._id ?? req.user?.id;
  if (!viewerId) {
    throw new ApiError(401, 'Authentication required');
  }

  const { q, page, limit } = req.query;

  if (q != null && typeof q !== 'string') {
    throw new ApiError(400, 'Invalid search query');
  }
  const queryStr = (q || '').trim();
  if (queryStr.length > MAX_QUERY_LENGTH) {
    throw new ApiError(400, `Query too long (max ${MAX_QUERY_LENGTH} characters)`);
  }

  const result = await searchService.search(
    { q: queryStr, page, limit },
    viewerId
  );

  res.status(200).json(
    new ApiResponse(200, result.data, 'Search results', {
      pagination: result.pagination,
    })
  );
});

module.exports = {
  search,
};
