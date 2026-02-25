const newsService = require('../../services/news.service');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const logger = require('../../config/logger');

/**
 * GET /news/agriculture
 * Returns latest agriculture-related news (cached). No auth required.
 * Always returns 200 with data array; never throws to avoid 502.
 */
const getAgricultureNews = asyncHandler(async (req, res) => {
  let result;
  try {
    result = await newsService.getAgricultureNews();
  } catch (err) {
    logger.error('[news.controller] getAgricultureNews error:', err?.message || err);
    return res.status(200).json(
      new ApiResponse(200, [], 'Unable to load news. Please try again later.')
    );
  }

  if (!result || typeof result !== 'object') {
    return res.status(200).json(
      new ApiResponse(200, [], 'No news available')
    );
  }

  if (!result.success) {
    const message = result.error === 'Invalid API key'
      ? 'News service is not configured'
      : result.error === 'Rate limit exceeded'
        ? 'News service is busy. Try again later.'
        : 'Unable to load news. Please try again later.';
    return res.status(200).json(
      new ApiResponse(200, [], message)
    );
  }

  const data = Array.isArray(result.data) ? result.data : [];
  res.status(200).json(
    new ApiResponse(200, data, data.length ? 'Agriculture news' : 'No news available')
  );
});

module.exports = {
  getAgricultureNews,
};
