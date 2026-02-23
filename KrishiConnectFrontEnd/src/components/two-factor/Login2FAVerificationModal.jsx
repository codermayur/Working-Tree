import React, { useState, useCallback } from 'react';
import { X, Shield, Loader, AlertCircle } from 'lucide-react';
import OTPInput from './OTPInput';
import ResendOTPButton from './ResendOTPButton';
import { useVerifyLoginOTP } from '../../hooks/useTwoFactor';
import { authService } from '../../services/auth.service';

const GENERIC_ERROR = 'Something went wrong. Please try again.';

/**
 * Modal shown when login returns requires2FA. User enters OTP; on success we get token and complete login.
 * @param {{ open: boolean, userId: string, onClose: () => void, onSuccess: (user, tokens) => void }} props
 */
export default function Login2FAVerificationModal({ open, userId, onClose, onSuccess }) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const verifyLoginOTP = useVerifyLoginOTP({
    onSuccess: (res) => {
      const data = res?.data?.data ?? res?.data ?? res;
      const user = data?.user;
      const tokens = data?.tokens ?? data?.token;
      const accessToken = tokens?.accessToken ?? tokens?.access_token;
      const refreshToken = tokens?.refreshToken ?? tokens?.refresh_token;
      setError('');
      setOtp('');
      if (user && accessToken) {
        onSuccess?.(user, { accessToken, refreshToken });
      }
      onClose?.();
    },
    onError: (err) => {
      const msg = err.response?.data?.message;
      if (msg && /expired|invalid|wrong/i.test(msg)) {
        setError(msg);
      } else {
        setError(GENERIC_ERROR);
      }
    },
  });

  const [resendPending, setResendPending] = useState(false);

  const handleResendOtp = useCallback(async () => {
    if (!userId) return;
    setError('');
    setResendPending(true);
    try {
      await authService.resendLoginOTP({ userId });
    } catch (_) {
      setError(GENERIC_ERROR);
    } finally {
      setResendPending(false);
    }
  }, [userId]);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      setError('');
      const code = otp.replace(/\D/g, '');
      if (code.length !== 6) {
        setError('Enter the 6-digit code.');
        return;
      }
      if (!userId) {
        setError('Session expired. Please log in again.');
        return;
      }
      verifyLoginOTP.mutate({ userId, otp: code });
    },
    [otp, userId, verifyLoginOTP]
  );

  const handleClose = useCallback(() => {
    setOtp('');
    setError('');
    onClose?.();
  }, [onClose]);

  if (!open) return null;

  const loading = verifyLoginOTP.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="login-2fa-title">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 id="login-2fa-title" className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Shield className="text-green-600 dark:text-green-400" size={22} />
            Two-Factor Verification
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enter the 6-digit code sent to your email to complete login.
            </p>
            <OTPInput
              value={otp}
              onChange={setOtp}
              disabled={loading}
              aria-label="OTP code"
            />
            <div className="flex justify-center">
              <ResendOTPButton
                onResend={handleResendOtp}
                isPending={resendPending}
                cooldownSeconds={30}
                className="text-green-600 dark:text-green-400 hover:underline"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <AlertCircle size={16} />
                {error}
              </p>
            )}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || otp.replace(/\D/g, '').length !== 6}
                className="flex-1 py-2.5 rounded-xl bg-green-600 dark:bg-green-500 text-white font-medium hover:bg-green-700 dark:hover:bg-green-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Verifying…
                  </>
                ) : (
                  'Verify & Login'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
