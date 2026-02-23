import React, { useState, useCallback } from 'react';
import { X, Shield, Loader, AlertCircle } from 'lucide-react';
import OTPInput from './OTPInput';
import ResendOTPButton from './ResendOTPButton';
import {
  useVerifyPassword,
  useSend2FAOtp,
  useEnable2FA,
} from '../../hooks/useTwoFactor';

const STEP_VERIFY = 1;
const STEP_OTP = 2;

const GENERIC_ERROR = 'Something went wrong. Please try again.';

/**
 * Modal to enable 2FA: Step 1 = verify password, Step 2 = enter OTP (with resend).
 * On success: onSuccess() is called (e.g. close modal, refetch, toast).
 */
export default function Enable2FAModal({ open, onClose, onSuccess }) {
  const [step, setStep] = useState(STEP_VERIFY);
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const sendOtp = useSend2FAOtp({
    onError: (err) => {
      setError(err.response?.data?.message || GENERIC_ERROR);
    },
  });

  const verifyPassword = useVerifyPassword({
    onSuccess: () => {
      setError('');
      setPassword('');
      setStep(STEP_OTP);
      sendOtp.mutate();
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Invalid password.');
    },
  });

  const enable2FA = useEnable2FA({
    onSuccess: () => {
      setError('');
      setOtp('');
      setStep(STEP_VERIFY);
      onSuccess?.();
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

  const handleVerify = useCallback(
    (e) => {
      e.preventDefault();
      setError('');
      if (!password.trim()) {
        setError('Password is required.');
        return;
      }
      verifyPassword.mutate({ password: password.trim() });
    },
    [password, verifyPassword]
  );

  const handleResendOtp = useCallback(async () => {
    setError('');
    await sendOtp.mutateAsync();
  }, [sendOtp]);

  const handleConfirmEnable = useCallback(
    (e) => {
      e.preventDefault();
      setError('');
      const code = otp.replace(/\D/g, '');
      if (code.length !== 6) {
        setError('Enter the 6-digit code.');
        return;
      }
      enable2FA.mutate({ otp: code });
    },
    [otp, enable2FA]
  );

  const handleClose = useCallback(() => {
    setStep(STEP_VERIFY);
    setPassword('');
    setOtp('');
    setError('');
    onClose?.();
  }, [onClose]);

  if (!open) return null;

  const verifying = verifyPassword.isPending;
  const sendingOtp = sendOtp.isPending;
  const enabling = enable2FA.isPending;
  const loading = verifying || sendingOtp || enabling;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="enable-2fa-title">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 id="enable-2fa-title" className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Shield className="text-green-600 dark:text-green-400" size={22} />
            Enable Two-Factor Authentication
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
          {step === STEP_VERIFY && (
            <form onSubmit={handleVerify} className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enter your password to continue.
              </p>
              <div>
                <label htmlFor="enable-2fa-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <input
                  id="enable-2fa-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={verifying}
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-900/40 outline-none disabled:opacity-50"
                  placeholder="Your password"
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
                  disabled={verifying}
                  className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifying || !password.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-green-600 dark:bg-green-500 text-white font-medium hover:bg-green-700 dark:hover:bg-green-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {verifying ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Verify
                    </>
                  ) : (
                    'Verify'
                  )}
                </button>
              </div>
            </form>
          )}

          {step === STEP_OTP && (
            <form onSubmit={handleConfirmEnable} className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {sendOtp.isPending
                  ? 'Sending code to your email…'
                  : 'We sent a 6-digit code to your registered email. Enter it below.'}
              </p>
              <OTPInput
                value={otp}
                onChange={setOtp}
                disabled={enabling}
                aria-label="OTP code"
              />
              <div className="flex justify-center">
                <ResendOTPButton
                  onResend={handleResendOtp}
                  isPending={sendOtp.isPending}
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
                  onClick={() => { setStep(STEP_VERIFY); setError(''); setOtp(''); }}
                  disabled={enabling}
                  className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={enabling || otp.replace(/\D/g, '').length !== 6}
                  className="flex-1 py-2.5 rounded-xl bg-green-600 dark:bg-green-500 text-white font-medium hover:bg-green-700 dark:hover:bg-green-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {enabling ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Confirm
                    </>
                  ) : (
                    'Confirm & Enable'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
