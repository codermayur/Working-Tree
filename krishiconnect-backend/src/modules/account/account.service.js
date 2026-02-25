const User = require('../user/user.model');
const ApiError = require('../../utils/ApiError');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendEmailOnce } = require('../../services/emailService');
const { getAccountDeletionOTPTemplate } = require('../../services/emailTemplates');
const { getRedis } = require('../../config/redis');
const { DELETE_OTP_EXPIRY_SECONDS, DELETE_OTP_MAX_ATTEMPTS } = require('../../config/constants');
const logger = require('../../config/logger');
const sendOTP = require('../../utils/sendOTP');

/**
 * Generate a secure 6-digit OTP and return plain + hashed.
 */
function generateDeleteOTP() {
  const code = crypto.randomInt(100000, 999999).toString();
  return { code, hashed: bcrypt.hashSync(code, 10) };
}

/**
 * Request OTP for account deletion. Sends to email (preferred) or mobile.
 * Rate limiting is applied at route level.
 */
async function requestDeleteOtp(userId) {
  const user = await User.findById(userId)
    .select('name email phoneNumber')
    .lean();

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (user.isDeleted) {
    throw new ApiError(400, 'Account is already deleted');
  }

  const hasEmail = user.email && user.email.trim().length > 0;
  const hasPhone = user.phoneNumber && user.phoneNumber.trim().length > 0;

  if (!hasEmail && !hasPhone) {
    throw new ApiError(400, 'Add an email or ensure phone number is set to request account deletion');
  }

  const { code, hashed } = generateDeleteOTP();
  const expiresAt = new Date(Date.now() + DELETE_OTP_EXPIRY_SECONDS * 1000);

  await User.findByIdAndUpdate(userId, {
    deleteOtpHash: hashed,
    deleteOtpExpiresAt: expiresAt,
    deleteOtpAttempts: 0,
  });

  const expiryMinutes = Math.floor(DELETE_OTP_EXPIRY_SECONDS / 60) || 10;

  if (hasEmail) {
    const template = getAccountDeletionOTPTemplate(user.name, code, expiryMinutes);
    const result = await sendEmailOnce(
      user.email,
      template.subject,
      template,
      'account_deletion_otp',
      userId.toString(),
      5
    );
    if (!result.success && !result.skipped) {
      await User.findByIdAndUpdate(userId, {
        $unset: { deleteOtpHash: 1, deleteOtpExpiresAt: 1 },
        $set: { deleteOtpAttempts: 0 },
      });
      throw new ApiError(500, 'Failed to send verification email');
    }
    if (result.skipped) {
      throw new ApiError(429, 'Please wait before requesting another code');
    }
    logger.info(`Account deletion OTP sent to email for user ${userId}`);
    return { success: true, message: 'Verification code sent to your registered email', expiresIn: DELETE_OTP_EXPIRY_SECONDS };
  }

  // Fallback: SMS to phone
  try {
    await sendOTP(user.phoneNumber, code);
  } catch (err) {
    logger.error('Account deletion OTP send failed:', err);
    await User.findByIdAndUpdate(userId, {
      $unset: { deleteOtpHash: 1, deleteOtpExpiresAt: 1 },
      $set: { deleteOtpAttempts: 0 },
    });
    throw new ApiError(500, 'Failed to send verification code');
  }
  logger.info(`Account deletion OTP sent to phone for user ${userId}`);
  return { success: true, message: 'Verification code sent to your registered mobile', expiresIn: DELETE_OTP_EXPIRY_SECONDS };
}

/**
 * Verify OTP and perform soft delete. Invalidates tokens and anonymizes user data.
 */
async function verifyDeleteOtp(userId, otp) {
  const user = await User.findById(userId)
    .select('+deleteOtpHash +deleteOtpExpiresAt +deleteOtpAttempts')
    .lean();

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (user.isDeleted) {
    throw new ApiError(400, 'Account is already deleted');
  }

  if (!user.deleteOtpHash || !user.deleteOtpExpiresAt) {
    throw new ApiError(400, 'Invalid or expired verification. Please request a new code.');
  }

  if (new Date() > new Date(user.deleteOtpExpiresAt)) {
    await User.findByIdAndUpdate(userId, {
      $unset: { deleteOtpHash: 1, deleteOtpExpiresAt: 1 },
      $set: { deleteOtpAttempts: 0 },
    });
    throw new ApiError(400, 'Invalid or expired verification. Please request a new code.');
  }

  if (user.deleteOtpAttempts >= DELETE_OTP_MAX_ATTEMPTS) {
    await User.findByIdAndUpdate(userId, {
      $unset: { deleteOtpHash: 1, deleteOtpExpiresAt: 1 },
      $set: { deleteOtpAttempts: 0 },
    });
    throw new ApiError(429, 'Too many failed attempts. Please request a new code.');
  }

  const isValid = await bcrypt.compare(otp, user.deleteOtpHash);
  if (!isValid) {
    await User.findByIdAndUpdate(userId, { $inc: { deleteOtpAttempts: 1 } });
    const attemptsLeft = DELETE_OTP_MAX_ATTEMPTS - (user.deleteOtpAttempts + 1);
    throw new ApiError(400, 'Invalid or expired verification. Please request a new code.', [
      ...(attemptsLeft >= 0 ? [{ field: 'attemptsRemaining', message: String(attemptsLeft) }] : []),
    ]);
  }

  await softDeleteUser(userId);
  logger.info(`Account soft-deleted for user ${userId}`);
  return { success: true, message: 'Account deleted successfully' };
}

/**
 * Soft delete: anonymize sensitive data, set isDeleted/isActive, clear OTP and tokens.
 */
async function softDeleteUser(userId) {
  await User.findByIdAndUpdate(userId, {
    $set: {
      isActive: false,
      isDeleted: true,
      deletedAt: new Date(),
      name: 'Deleted User',
      username: `deleted_${userId.toString().slice(-8)}`,
      bio: null,
      refreshTokens: [],
      fcmTokens: [],
      deleteOtpAttempts: 0,
    },
    $unset: {
      email: 1,
      deleteOtpHash: 1,
      deleteOtpExpiresAt: 1,
      avatar: 1,
      profilePhoto: 1,
      background: 1,
    },
  });
}

/**
 * Blacklist current access token so it cannot be used after deletion.
 */
async function blacklistAccessToken(token) {
  const redis = getRedis();
  if (!redis || !token) return;
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.decode(token);
    if (decoded?.exp) {
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await redis.set(`blacklist:${token}`, '1', { EX: ttl });
      }
    }
  } catch (err) {
    // Ignore
  }
}

module.exports = {
  requestDeleteOtp,
  verifyDeleteOtp,
  softDeleteUser,
  blacklistAccessToken,
};
