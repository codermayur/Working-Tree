const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../user/user.model');
const sendOTP = require('../../utils/sendOTP.js');
const ApiError = require('../../utils/ApiError');
const { OTP_EXPIRY_SECONDS, OTP_MAX_ATTEMPTS } = require('../../config/constants');
const { getRedis } = require('../../config/redis');
const otpService = require('../../services/otpService');
const logger = require('../../config/logger');

// In-memory fallback for development when Redis unavailable
const memoryStore = new Map();

class AuthService {
  async generateOTP(phoneNumber) {
    const otp = crypto.randomInt(100000, 999999).toString();

    const redis = getRedis();
    if (redis) {
      await redis.set(`otp:${phoneNumber}`, JSON.stringify({ otp, attempts: 0 }), {
        EX: OTP_EXPIRY_SECONDS,
      });
    }

    await sendOTP(phoneNumber, otp);
    return { otpSent: true };
  }

  async verifyOTP(phoneNumber, otp) {
    const redis = getRedis();
    if (!redis) {
      // Development fallback: accept any 6-digit OTP when Redis unavailable
      if (process.env.NODE_ENV === 'development' && /^\d{6}$/.test(otp)) {
        return { verified: true };
      }
      throw new ApiError(500, 'OTP verification unavailable');
    }

    const storedData = await redis.get(`otp:${phoneNumber}`);
    if (!storedData) {
      throw new ApiError(400, 'OTP expired or not found');
    }

    const { otp: storedOTP, attempts } = JSON.parse(storedData);

    if (attempts >= OTP_MAX_ATTEMPTS) {
      await redis.del(`otp:${phoneNumber}`);
      throw new ApiError(429, 'Too many failed attempts');
    }

    if (storedOTP !== otp) {
      await redis.set(`otp:${phoneNumber}`, JSON.stringify({ otp: storedOTP, attempts: attempts + 1 }), {
        EX: OTP_EXPIRY_SECONDS,
      });
      throw new ApiError(400, 'Invalid OTP');
    }

    await redis.del(`otp:${phoneNumber}`);
    return { verified: true };
  }

  async register(userData) {
    if (!userData || typeof userData !== 'object') {
      throw new ApiError(400, 'Invalid registration data');
    }

    const rawPhone = userData.phoneNumber != null ? String(userData.phoneNumber).trim() : '';
    const phoneNumber = rawPhone.replace(/\D/g, '').slice(-10);
    const email = userData.email != null ? String(userData.email).trim() : '';
    const normalizedEmail = email ? email.toLowerCase() : null;
    const name = userData.name != null ? String(userData.name).trim() : '';
    const password = userData.password;
    const location = userData.location && typeof userData.location === 'object' ? userData.location : {};

    if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
      throw new ApiError(400, 'Valid phone number is required (10 digits, starting with 6-9)');
    }
    if (!name || name.length > 100) {
      throw new ApiError(400, 'Name is required (max 100 characters)');
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      throw new ApiError(400, 'Password is required and must be at least 6 characters');
    }

    try {
      const existingByPhone = await User.findOne({ phoneNumber });
      if (existingByPhone) {
        throw new ApiError(409, 'Phone number already registered');
      }
      if (normalizedEmail) {
        const existingByEmail = await User.findOne({ email: normalizedEmail });
        if (existingByEmail) {
          throw new ApiError(409, 'Email already registered');
        }
      }

      // Email OTP flow: create user (password hashed by User pre-save), send OTP, return otpId
      if (normalizedEmail) {
        const user = await User.create({
          phoneNumber,
          username: `user_${phoneNumber}`,
          email: normalizedEmail,
          name,
          password,
          location: location || {},
          emailVerified: false,
          verificationStatus: 'unverified',
        });
        const result = await otpService.generateAndSendOTP(
          user._id,
          normalizedEmail,
          'registration',
          name
        );
        if (!result.success) {
          await User.findByIdAndDelete(user._id);
          throw new ApiError(500, result.message || 'Failed to send verification email');
        }
        return {
          otpSent: true,
          otpId: result.otpId,
          expiresIn: result.expiresIn,
          email: normalizedEmail,
        };
      }

      // Phone OTP flow
      await this.generateOTP(phoneNumber);
      const userPayload = JSON.stringify({ password, name, location });
      const redis = getRedis();
      if (redis) {
        await redis.set(`temp:user:${phoneNumber}`, userPayload, { EX: 3600 });
      } else if (process.env.NODE_ENV === 'development') {
        memoryStore.set(`temp:user:${phoneNumber}`, userPayload);
        setTimeout(() => memoryStore.delete(`temp:user:${phoneNumber}`), 3600 * 1000);
      }
      return { otpSent: true, phoneNumber };
    } catch (err) {
      if (err instanceof ApiError) throw err;
      logger.error('[auth.register]', err);
      if (err.name === 'MongoServerError' && err.code === 11000) {
        const msg = err.message || '';
        if (msg.includes('username')) {
          throw new ApiError(409, 'Phone number or email already registered');
        }
        const field = msg.includes('email') ? 'Email' : 'Phone number';
        throw new ApiError(409, `${field} already registered`);
      }
      if (err.name === 'ValidationError') {
        const msg = Object.values(err.errors || {}).map((e) => e.message).join('; ') || err.message;
        throw new ApiError(400, msg);
      }
      throw new ApiError(500, 'Registration failed. Please try again.');
    }
  }

  async completeRegistrationWithEmail(otpId, otp) {
    const verifyResult = await otpService.verifyOTP(otpId, otp);
    if (!verifyResult.success) {
      throw new ApiError(400, verifyResult.message, [
        ...(verifyResult.attemptsRemaining != null
          ? [{ field: 'attemptsRemaining', message: String(verifyResult.attemptsRemaining) }]
          : []),
      ]);
    }
    if (verifyResult.type !== 'registration') {
      throw new ApiError(400, 'Invalid OTP type');
    }
    const user = await User.findById(verifyResult.userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    user.emailVerified = true;
    user.verificationStatus = 'verified';
    await user.save({ validateBeforeSave: false });
    await otpService.invalidateOTP(otpId);
    const tokens = this.generateTokens(user._id);
    await this.saveRefreshToken(user._id, tokens.refreshToken);
    const userObj = user.toObject();
    delete userObj.password;
    return { user: userObj, tokens };
  }

  async completeRegistration(phoneNumber, otp) {
    await this.verifyOTP(phoneNumber, otp);

    const redis = getRedis();
    let tempData = redis ? await redis.get(`temp:user:${phoneNumber}`) : null;
    if (!tempData && process.env.NODE_ENV === 'development') {
      tempData = memoryStore.get(`temp:user:${phoneNumber}`);
    }
    if (!tempData) {
      throw new ApiError(400, 'Registration session expired');
    }

    const userData = typeof tempData === 'string' ? JSON.parse(tempData) : tempData;
    const user = await User.create({
      phoneNumber,
      username: `user_${phoneNumber}`,
      ...userData,
    });

    if (redis) {
      await redis.del(`temp:user:${phoneNumber}`);
    }
    memoryStore.delete(`temp:user:${phoneNumber}`);

    const tokens = this.generateTokens(user._id);
    await this.saveRefreshToken(user._id, tokens.refreshToken);

    return {
      user: user.toObject(),
      tokens,
    };
  }

  async login(phoneNumber, email, password) {
    const byPhone = phoneNumber?.trim();
    const byEmail = email?.trim().toLowerCase();
    if (!byPhone && !byEmail) {
      throw new ApiError(400, 'Provide phone number or email');
    }
    const query = byPhone && byEmail
      ? { $or: [{ phoneNumber: byPhone }, { email: byEmail }] }
      : byPhone
        ? { phoneNumber: byPhone }
        : { email: byEmail };
    const user = await User.findOne(query).select('+password');

    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    if (user.isBanned) {
      throw new ApiError(403, 'Account is banned');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid credentials');
    }

    if (user.twoFactorEnabled) {
      if (!user.email) {
        throw new ApiError(400, 'Two-factor authentication requires a verified email. Please add an email to your account.');
      }
      const result = await otpService.send2FAOTPForUser(
        user._id,
        '2fa_login',
        user.name,
        user.email
      );
      if (!result.success && !result.skipped) {
        throw new ApiError(500, result.message || 'Failed to send verification code');
      }
      if (result.skipped) {
        throw new ApiError(429, result.message || 'Please wait before requesting another code');
      }
      return {
        requires2FA: true,
        userId: user._id.toString(),
      };
    }

    const tokens = this.generateTokens(user._id);
    await this.saveRefreshToken(user._id, tokens.refreshToken);

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const userObj = user.toObject();
    delete userObj.password;

    return {
      user: userObj,
      tokens,
    };
  }

  async verifyPassword(userId, password) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    const valid = await user.comparePassword(password);
    if (!valid) {
      throw new ApiError(401, 'Invalid password');
    }
    return { verified: true };
  }

  async send2FAOtp(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    if (user.twoFactorEnabled) {
      throw new ApiError(400, 'Two-factor authentication is already enabled');
    }
    if (!user.email) {
      throw new ApiError(400, 'Add an email to your account to use two-factor authentication');
    }
    const result = await otpService.send2FAOTPForUser(
      user._id,
      '2fa_enable',
      user.name,
      user.email
    );
    if (!result.success && !result.skipped) {
      throw new ApiError(500, result.message || 'Failed to send OTP');
    }
    if (result.skipped) {
      throw new ApiError(429, result.message || 'Please wait before resending');
    }
    return {
      otpSent: true,
      message: 'OTP sent to your registered email',
      expiresIn: result.expiresIn,
    };
  }

  async enable2FA(userId, otp) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    if (user.twoFactorEnabled) {
      throw new ApiError(400, 'Two-factor authentication is already enabled');
    }
    const verifyResult = await otpService.verifyOTPByUserAndType(userId, otp, '2fa_enable');
    if (!verifyResult.success) {
      throw new ApiError(400, verifyResult.message);
    }
    user.twoFactorEnabled = true;
    await user.save({ validateBeforeSave: false });
    return { twoFactorEnabled: true };
  }

  async verifyLoginOTP(userId, otp) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(401, 'Invalid request');
    }
    if (!user.twoFactorEnabled) {
      throw new ApiError(400, 'Two-factor authentication is not enabled for this account');
    }
    const verifyResult = await otpService.verifyOTPByUserAndType(userId, otp, '2fa_login');
    if (!verifyResult.success) {
      throw new ApiError(400, verifyResult.message);
    }
    const tokens = this.generateTokens(user._id);
    await this.saveRefreshToken(user._id, tokens.refreshToken);
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    const userObj = user.toObject();
    delete userObj.password;
    return { user: userObj, tokens };
  }

  async resendLoginOTP(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(401, 'Invalid request');
    }
    if (!user.twoFactorEnabled) {
      throw new ApiError(400, 'Two-factor authentication is not enabled');
    }
    if (!user.email) {
      throw new ApiError(400, 'No email on account');
    }
    const result = await otpService.send2FAOTPForUser(
      user._id,
      '2fa_login',
      user.name,
      user.email
    );
    if (!result.success && !result.skipped) {
      throw new ApiError(500, result.message || 'Failed to resend code');
    }
    if (result.skipped) {
      throw new ApiError(429, result.message || 'Please wait before resending');
    }
    return { otpSent: true, expiresIn: result.expiresIn };
  }

  generateTokens(userId) {
    const accessToken = jwt.sign(
      { userId: userId.toString() },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const refreshToken = jwt.sign(
      { userId: userId.toString(), type: 'refresh' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );

    return { accessToken, refreshToken };
  }

  async saveRefreshToken(userId, refreshToken) {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await User.findByIdAndUpdate(userId, {
      $push: {
        refreshTokens: {
          token: refreshToken,
          expiresAt,
        },
      },
    });
  }

  async refreshAccessToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      const user = await User.findOne({
        _id: decoded.userId,
        'refreshTokens.token': refreshToken,
      });

      if (!user) {
        throw new ApiError(401, 'Invalid refresh token');
      }

      const accessToken = jwt.sign(
        { userId: user._id.toString() },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      return { accessToken };
    } catch (error) {
      throw new ApiError(401, 'Invalid refresh token');
    }
  }

  async logout(userId, refreshToken) {
    const redis = getRedis();
    if (redis && refreshToken) {
      try {
        const decoded = jwt.decode(refreshToken);
        if (decoded?.exp) {
          const ttl = decoded.exp - Math.floor(Date.now() / 1000);
          if (ttl > 0) {
            await redis.set(`blacklist:${refreshToken}`, '1', { EX: ttl });
          }
        }
      } catch (err) {
        // Ignore decode errors
      }
    }

    await User.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: { token: refreshToken } },
    });

    return { success: true };
  }

  async forgotPasswordEmail(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return { success: true, message: 'If this email is registered, you will receive an OTP' };
    }
    const result = await otpService.generateAndSendOTP(
      user._id,
      user.email,
      'password_reset',
      user.name
    );
    if (!result.success) {
      throw new ApiError(500, result.message || 'Failed to send OTP email');
    }
    return {
      success: true,
      message: 'OTP sent to your registered email',
      otpId: result.otpId,
      expiresIn: result.expiresIn,
    };
  }

  async resetPasswordWithOTP(otpId, otp, newPassword) {
    const verifyResult = await otpService.verifyOTP(otpId, otp);
    if (!verifyResult.success) {
      throw new ApiError(400, verifyResult.message, [
        ...(verifyResult.attemptsRemaining != null
          ? [{ field: 'attemptsRemaining', message: String(verifyResult.attemptsRemaining) }]
          : []),
      ]);
    }
    if (verifyResult.type !== 'password_reset') {
      throw new ApiError(400, 'Invalid OTP type');
    }
    const user = await User.findById(verifyResult.userId).select('+password');
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    user.password = newPassword;
    user.lastPasswordChangeAt = new Date();
    await user.save();
    await otpService.invalidateOTP(otpId);
    return { success: true, message: 'Password reset successfully' };
  }

  async resendEmailOTP(otpId) {
    const result = await otpService.resendOTP(otpId);
    if (!result.success) {
      throw new ApiError(400, result.message);
    }
    return {
      success: true,
      message: result.message,
      expiresIn: result.expiresIn,
    };
  }
}

module.exports = new AuthService();
