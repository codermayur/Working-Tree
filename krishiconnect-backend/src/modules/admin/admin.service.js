/**
 * Admin-only operations: role changes, user listing, expert verification, create admin.
 * All routes are protected by authorizeRoles('admin').
 */
const User = require('../user/user.model');
const ApiError = require('../../utils/ApiError');
const { ROLES } = require('../../config/constants');
const Pagination = require('../../utils/pagination');
const logger = require('../../config/logger');

const userPagination = new Pagination(User);

/**
 * Create a new admin user. Only existing admins can create. New admin gets a synthetic phoneNumber.
 */
const createAdmin = async (name, email, password, actor) => {
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    throw new ApiError(400, 'Email is required');
  }
  if (!(name || '').trim()) {
    throw new ApiError(400, 'Name is required');
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters');
  }

  const existing = await User.findOne({ $or: [{ email: normalizedEmail }, { phoneNumber: '9999999999' }] }).lean();
  if (existing) {
    if (existing.email === normalizedEmail) {
      throw new ApiError(409, 'A user with this email already exists');
    }
  }

  const adminCount = await User.countDocuments({ role: 'admin' });
  let phoneToUse = String(Number(9000000000) + adminCount);
  if (phoneToUse.length > 10) {
    phoneToUse = '9' + String(Date.now()).slice(-9);
  }
  const existingPhone = await User.findOne({ phoneNumber: phoneToUse }).lean();
  if (existingPhone) {
    phoneToUse = '9' + String(Date.now()).slice(-9);
  }

  try {
    const user = await User.create({
      name: (name || '').trim(),
      email: normalizedEmail,
      phoneNumber: phoneToUse,
      password,
      role: 'admin',
      username: `admin_${normalizedEmail.replace(/[^a-z0-9]/g, '_')}_${Date.now()}`,
    });

    logger.info('Admin created', {
      event: 'admin_created',
      newAdminId: user._id.toString(),
      newAdminEmail: normalizedEmail,
      performedBy: actor._id?.toString(),
    });

    const u = user.toObject();
    delete u.password;
    delete u.refreshTokens;
    delete u.fcmTokens;
    return u;
  } catch (err) {
    if (err.name === 'MongoServerError' && err.code === 11000) {
      throw new ApiError(409, 'A user with this email or phone already exists');
    }
    if (err.name === 'ValidationError') {
      const msg = Object.values(err.errors || {}).map((e) => e.message).join('; ') || err.message;
      throw new ApiError(400, msg);
    }
    logger.error('[admin.createAdmin]', err);
    throw new ApiError(500, err.message || 'Failed to create admin');
  }
};

/**
 * Update a user's role. Admin only. Logged for audit.
 * @param {string} targetUserId - User to update
 * @param {string} newRole - Must be one of ROLES
 * @param {object} actor - { _id, name } of admin performing the change
 */
const updateUserRole = async (targetUserId, newRole, actor) => {
  if (!ROLES.includes(newRole)) {
    throw new ApiError(400, `Role must be one of: ${ROLES.join(', ')}`);
  }

  const user = await User.findById(targetUserId).select('name role').lean();
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const previousRole = user.role || 'farmer';
  if (previousRole === newRole) {
    return User.findById(targetUserId)
      .select('-password -refreshTokens -fcmTokens')
      .lean();
  }

  const updated = await User.findByIdAndUpdate(
    targetUserId,
    { $set: { role: newRole } },
    { new: true, runValidators: true }
  )
    .select('-password -refreshTokens -fcmTokens')
    .lean();

  logger.info('Role change', {
    event: 'role_change',
    targetUserId,
    targetName: user.name,
    previousRole,
    newRole,
    performedBy: actor._id?.toString(),
    performedByName: actor.name,
  });

  return updated;
};

/**
 * Verify an expert (set expertDetails.isVerifiedExpert = true). Admin only.
 */
const verifyExpert = async (targetUserId, actor) => {
  const user = await User.findById(targetUserId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  if (!user.isExpert) {
    throw new ApiError(400, 'User is not marked as expert');
  }

  user.expertDetails = user.expertDetails || {};
  user.expertDetails.isVerifiedExpert = true;
  user.expertDetails.verifiedAt = new Date();
  user.expertDetails.verifiedBy = actor._id;
  await user.save({ validateBeforeSave: true });

  logger.info('Expert verified', {
    event: 'expert_verified',
    targetUserId,
    performedBy: actor._id?.toString(),
  });

  return User.findById(targetUserId)
    .select('-password -refreshTokens -fcmTokens')
    .lean();
};

/**
 * List users with optional filters. Admin only. Example for "manage users" / analytics.
 */
const listUsers = async (query = {}) => {
  const { page = 1, limit = 20, role, q } = query;
  const filter = {};

  if (role && ROLES.includes(role)) {
    filter.role = role;
  }
  if (q && typeof q === 'string' && q.trim()) {
    filter.$or = [
      { name: { $regex: q.trim(), $options: 'i' } },
      { phoneNumber: { $regex: q.trim(), $options: 'i' } },
      { email: { $regex: q.trim(), $options: 'i' } },
    ];
  }

  return userPagination.paginate(filter, {
    page,
    limit,
    sort: { createdAt: -1 },
    select: '-password -refreshTokens -fcmTokens',
  });
};

module.exports = {
  createAdmin,
  updateUserRole,
  verifyExpert,
  listUsers,
};
