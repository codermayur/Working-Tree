/**
 * Auth API service for Login, Register, Forgot Password, OTP verification.
 * Uses shared API base (VITE_API_URL, e.g. http://localhost:5000/api/v1).
 */
import { request } from './api';

export const authService = {
  login(payload) {
    return request('POST', '/auth/login', payload);
  },

  register(payload) {
    return request('POST', '/auth/register', payload);
  },

  forgotPassword(payload) {
    return request('POST', '/auth/forgot-password', payload);
  },

  resendOTP(payload) {
    return request('POST', '/auth/resend-otp', payload);
  },

  resetPassword(payload) {
    return request('POST', '/auth/reset-password', payload);
  },

  verifyOTP(payload) {
    return request('POST', '/auth/verify-otp', payload);
  },

  verifyRegistrationOTP(payload) {
    return request('POST', '/auth/verify-registration-otp', payload);
  },

  // Two-Factor Authentication (requires auth except verifyLoginOTP)
  verifyPassword(payload) {
    return request('POST', '/auth/verify-password', payload);
  },
  send2FAOtp() {
    return request('POST', '/auth/send-2fa-otp');
  },
  enable2FA(payload) {
    return request('POST', '/auth/enable-2fa', payload);
  },
  verifyLoginOTP(payload) {
    return request('POST', '/auth/verify-login-otp', payload);
  },
  resendLoginOTP(payload) {
    return request('POST', '/auth/resend-login-otp', payload);
  },
};
