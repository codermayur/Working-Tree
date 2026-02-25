const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const User = require('../modules/user/user.model');
const { getRedis } = require('../config/redis');

const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication required');
  }

  const token = authHeader.substring(7);

  try {
    const redis = getRedis();
    if (redis) {
      try {
        const isBlacklisted = await redis.get(`blacklist:${token}`);
        if (isBlacklisted) {
          throw new ApiError(401, 'Token has been revoked');
        }
      } catch (e) {
        if (e instanceof ApiError) throw e;
      }
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password -refreshTokens');

    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Account is deactivated');
    }

    if (user.isDeleted) {
      throw new ApiError(403, 'Account has been deleted');
    }

    if (user.isBanned) {
      throw new ApiError(403, 'Account is banned');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError(401, 'Invalid token');
    }
    throw error;
  }
});

const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password -refreshTokens');

      if (user && user.isActive && !user.isBanned && !user.isDeleted) {
        req.user = user;
      }
    } catch (error) {
      // Silently fail for optional auth
    }
  }

  next();
});

const requireExpert = (req, res, next) => {
  if (!req.user?.isExpert) {
    throw new ApiError(403, 'Expert access required');
  }
  next();
};

module.exports = {
  authenticate,
  optionalAuth,
  requireExpert,
};
