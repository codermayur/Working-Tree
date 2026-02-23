/**
 * Types / interfaces for Two-Factor Authentication.
 * JSDoc for IDE support (project uses JavaScript).
 */

/**
 * @typedef {Object} LoginResponse
 * @property {boolean} [requires2FA] - If true, client must collect OTP and call verifyLoginOTP
 * @property {string} [userId] - Required when requires2FA is true
 * @property {Object} [user] - Present when login completes without 2FA
 * @property {Object} [tokens] - Present when login completes without 2FA
 */

/**
 * @typedef {Object} VerifyPasswordResponse
 * @property {boolean} verified
 */

/**
 * @typedef {Object} Send2FAOtpResponse
 * @property {boolean} otpSent
 * @property {string} [message] - e.g. "OTP sent to your email"
 * @property {number} [expiresIn] - seconds
 */

/**
 * @typedef {Object} Enable2FAResponse
 * @property {boolean} twoFactorEnabled
 */

/**
 * @typedef {Object} VerifyLoginOTPResponse
 * @property {Object} user
 * @property {Object} tokens - { accessToken, refreshToken }
 */

export default {};
