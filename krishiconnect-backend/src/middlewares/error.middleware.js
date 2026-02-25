const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.name === 'MongoServerError' && error.code === 11000 ? 409 : 500);
    const message = error.statusCode
      ? error.message
      : error.name === 'MongoServerError' && error.code === 11000
        ? 'Resource already exists (duplicate key)'
        : error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message);
  }

  // Log real error for debugging (always log for 500, and in development)
  if (error.statusCode >= 500 || process.env.NODE_ENV !== 'production') {
    logger.error('[Error]', {
      statusCode: error.statusCode,
      message: error.message,
      stack: err.stack || error.stack,
    });
  }

  const payload = {
    success: false,
    message: error.message,
    ...(error.errors && error.errors.length ? { errors: error.errors } : {}),
  };

  res.status(error.statusCode).json(payload);
};

module.exports = errorHandler;
