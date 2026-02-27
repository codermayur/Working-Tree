/**
 * APITube controller: validate input, call service, return normalized response.
 * No business logic; no direct API calls.
 */

const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const apitubeService = require('../../services/apitube.service');

const getNews = asyncHandler(async (req, res) => {
  const { q, page, limit, language, category } = req.query;

  const result = await apitubeService.getNews({
    q,
    page,
    limit,
    language,
    category,
  });

  res.status(200).json(
    new ApiResponse(200, result.data, 'OK', result.meta)
  );
});

/**
 * GET /apitube/health — optional health check for APITube (no auth).
 */
const health = asyncHandler(async (req, res) => {
  const check = await apitubeService.healthCheck();
  if (!check.ok) {
    throw new ApiError(503, check.message || 'News service unavailable');
  }
  res.status(200).json(new ApiResponse(200, { status: 'ok' }, 'OK'));
});

module.exports = {
  getNews,
  health,
};
