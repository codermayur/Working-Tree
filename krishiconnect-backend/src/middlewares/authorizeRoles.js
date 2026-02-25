/**
 * Role-based authorization middleware.
 * Use after authenticate. Checks req.user.role against allowed roles.
 * Role is always read from the user document loaded by authenticate (never from client).
 */
const ApiError = require('../utils/ApiError');

/**
 * Returns middleware that allows only the given roles.
 * @param {...string} allowedRoles - One or more roles, e.g. authorizeRoles('admin'), authorizeRoles('admin', 'expert')
 * @returns {Function} Express middleware
 */
const authorizeRoles = (...allowedRoles) => {
  const set = new Set(allowedRoles.length ? allowedRoles : []);

  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const role = req.user.role;
    if (!role || typeof role !== 'string') {
      return next(new ApiError(403, 'Access denied: role not assigned'));
    }

    if (!set.has(role)) {
      return next(new ApiError(403, 'You do not have permission to access this resource'));
    }

    next();
  };
};

/** Convenience: admin only */
const requireAdmin = authorizeRoles('admin');

/** Convenience: expert or admin */
const requireExpertOrAdmin = authorizeRoles('admin', 'expert');

module.exports = {
  authorizeRoles,
  requireAdmin,
  requireExpertOrAdmin,
};
