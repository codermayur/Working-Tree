const authService = require('./auth.service');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body || {});
  const message = result.email ? 'OTP sent to your email' : 'OTP sent to your phone';
  res.status(201).json({
    success: true,
    message,
    data: result,
  });
});

const verifyOTP = asyncHandler(async (req, res) => {
  const { phoneNumber, otp } = req.body;
  const result = await authService.completeRegistration(phoneNumber, otp);
  res.status(200).json(new ApiResponse(200, result, 'Registration successful'));
});

const verifyRegistrationOTP = asyncHandler(async (req, res) => {
  const { otpId, otp } = req.body;
  const result = await authService.completeRegistrationWithEmail(otpId, otp);
  res.status(200).json(new ApiResponse(200, result, 'Registration successful'));
});

const login = asyncHandler(async (req, res) => {
  const { phoneNumber, email, password } = req.body;
  const result = await authService.login(phoneNumber, email, password);
  res.status(200).json(new ApiResponse(200, result, 'Login successful'));
});

const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const result = await authService.refreshAccessToken(refreshToken);
  res.status(200).json(new ApiResponse(200, result, 'Token refreshed'));
});

const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.body.refreshToken || req.headers['x-refresh-token'];
  await authService.logout(req.user._id, refreshToken);
  res.status(200).json(new ApiResponse(200, { success: true }, 'Logged out successfully'));
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await authService.forgotPasswordEmail(email);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

const resetPasswordWithOTP = asyncHandler(async (req, res) => {
  const { otpId, otp, newPassword } = req.body;
  const result = await authService.resetPasswordWithOTP(otpId, otp, newPassword);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

const resendOTP = asyncHandler(async (req, res) => {
  const { otpId } = req.body;
  const result = await authService.resendEmailOTP(otpId);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

const verifyPassword = asyncHandler(async (req, res) => {
  await authService.verifyPassword(req.user._id, req.body.password);
  res.status(200).json(new ApiResponse(200, { verified: true }, 'Password verified'));
});

const send2FAOtp = asyncHandler(async (req, res) => {
  const result = await authService.send2FAOtp(req.user._id);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

const enable2FA = asyncHandler(async (req, res) => {
  const result = await authService.enable2FA(req.user._id, req.body.otp);
  res.status(200).json(new ApiResponse(200, result, 'Two-factor authentication enabled'));
});

const verifyLoginOTP = asyncHandler(async (req, res) => {
  const { userId, otp } = req.body;
  const result = await authService.verifyLoginOTP(userId, otp);
  res.status(200).json(new ApiResponse(200, result, 'Login successful'));
});

const resendLoginOTP = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const result = await authService.resendLoginOTP(userId);
  res.status(200).json(new ApiResponse(200, result, 'Code resent'));
});

module.exports = {
  register,
  verifyOTP,
  verifyRegistrationOTP,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPasswordWithOTP,
  resendOTP,
  verifyPassword,
  send2FAOtp,
  enable2FA,
  verifyLoginOTP,
  resendLoginOTP,
};
