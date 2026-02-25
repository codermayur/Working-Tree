/**
 * Account deletion with OTP verification.
 * Backend: POST /account/delete/request-otp, POST /account/delete/verify-otp
 */
import { request } from './api';

export const accountService = {
  /** Request OTP for account deletion (sends to email or mobile). Requires auth. */
  async requestDeleteOtp() {
    const { data } = await request('POST', '/account/delete/request-otp');
    return data?.data ?? data ?? { success: true, message: data?.message };
  },

  /** Verify OTP and delete account. Requires auth. Clears tokens on success. */
  async verifyDeleteOtp(otp) {
    const { data } = await request('POST', '/account/delete/verify-otp', { otp: String(otp).trim() });
    return data?.data ?? data ?? { success: true, message: data?.message };
  },
};
