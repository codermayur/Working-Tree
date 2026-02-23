const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const {
  validate,
  registerSchema,
  verifyOTPSchema,
  verifyRegistrationOTPSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordEmailSchema,
  resetPasswordWithOTPSchema,
  resendOTPSchema,
  verifyPasswordSchema,
  enable2FASchema,
  verifyLoginOTPSchema,
  resendLoginOTPSchema,
} = require('./auth.validation');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authLimiter, registerLimiter, forgotPasswordLimiter } = require('../../middlewares/rateLimit.middleware');

router.use(authLimiter);

router.post('/register', registerLimiter, validate(registerSchema), authController.register);
router.post('/verify-otp', validate(verifyOTPSchema), authController.verifyOTP);
router.post('/verify-registration-otp', validate(verifyRegistrationOTPSchema), authController.verifyRegistrationOTP);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);
router.post('/logout', authenticate, authController.logout);

router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordEmailSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordWithOTPSchema), authController.resetPasswordWithOTP);
router.post('/resend-otp', validate(resendOTPSchema), authController.resendOTP);

router.post('/verify-password', authenticate, validate(verifyPasswordSchema), authController.verifyPassword);
router.post('/send-2fa-otp', authenticate, authController.send2FAOtp);
router.post('/enable-2fa', authenticate, validate(enable2FASchema), authController.enable2FA);

router.post('/verify-login-otp', validate(verifyLoginOTPSchema), authController.verifyLoginOTP);
router.post('/resend-login-otp', validate(resendLoginOTPSchema), authController.resendLoginOTP);

module.exports = router;
