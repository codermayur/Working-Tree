import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { authService } from '../services/auth.service';

const step1Schema = z.object({
  email: z.string().email('Invalid email'),
});

const step2Schema = z
  .object({
    otp: z.string().length(6, 'OTP must be 6 digits'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function maskEmail(value) {
  const email = value || '';
  const at = email.indexOf('@');
  if (at <= 1) return email;
  const name = email.slice(0, at);
  const domain = email.slice(at);
  return `${name.slice(0, 2)}${'*'.repeat(Math.max(2, name.length - 2))}${domain}`;
}

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otpId, setOtpId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [expirySeconds, setExpirySeconds] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);

  const navigate = useNavigate();

  const step1Form = useForm({
    resolver: zodResolver(step1Schema),
    defaultValues: { email: '' },
    mode: 'onChange',
  });

  const step2Form = useForm({
    resolver: zodResolver(step2Schema),
    defaultValues: { otp: '', newPassword: '', confirmPassword: '' },
    mode: 'onChange',
  });

  useEffect(() => {
    if (step !== 2 || expirySeconds <= 0) return undefined;
    const timer = setTimeout(() => setExpirySeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(timer);
  }, [step, expirySeconds]);

  useEffect(() => {
    if (step !== 2 || resendCooldown <= 0) return undefined;
    const timer = setTimeout(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(timer);
  }, [step, resendCooldown]);

  const expiryLabel = useMemo(() => formatTime(expirySeconds), [expirySeconds]);

  const onStep1 = async (data) => {
    setLoading(true);
    try {
      const res = await authService.forgotPassword({ email: data.email.trim().toLowerCase() });
      const result = res.data?.data ?? res.data;
      setEmail(data.email.trim().toLowerCase());
      setOtpId(result.otpId);
      setExpirySeconds(result.expiresIn || 600);
      setResendCooldown(30);
      setStep(2);
      toast.success('✉️ OTP sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.message || '❌ Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (!otpId || resendCooldown > 0) return;
    try {
      setLoading(true);
      const res = await authService.resendOTP({ otpId });
      const result = res.data?.data ?? res.data;
      setExpirySeconds(result.expiresIn || 600);
      setResendCooldown(30);
      step2Form.reset({ otp: '', newPassword: step2Form.getValues('newPassword'), confirmPassword: step2Form.getValues('confirmPassword') });
      toast.success('✉️ OTP resent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const onStep2 = async (data) => {
    setLoading(true);
    try {
      const res = await authService.resetPassword({
        otpId,
        otp: data.otp,
        newPassword: data.newPassword,
      });
      const result = res.data?.data ?? res.data;
      toast.success(result.message || '✅ Password reset successful!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || '❌ Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-white to-slate-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-green-200/20 rounded-full blur-3xl animate-pulse animation-delay-2000" />
      </div>

      {/* Main content */}
      <div className="w-full max-w-md relative z-10 animate-fadeIn">
        {/* Card Container */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header Section with Gradient */}
          <div className="relative h-32 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <svg viewBox="0 0 1200 120" className="absolute w-full h-full">
                <path
                  d="M0,30 Q300,0 600,30 T1200,30 L1200,120 L0,120 Z"
                  fill="currentColor"
                  className="text-white animate-wave"
                />
              </svg>
            </div>

            <div className="relative h-full flex flex-col items-center justify-center text-white">
              <div className="text-5xl mb-2 animate-bounce">🔑</div>
              <h1 className="text-2xl font-bold">Reset Password</h1>
              <p className="text-sm text-emerald-100 mt-1">
                {step === 1 ? 'Get an OTP on email' : 'Verify OTP & set new password'}
              </p>
            </div>
          </div>

          {/* Form Section */}
          <div className="p-8 sm:p-10">
            {step === 1 ? (
              <form onSubmit={step1Form.handleSubmit(onStep1)} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2 animate-slideInUp animation-delay-100">
                  <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <span className="text-lg">📧</span>
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 rounded-xl blur-sm opacity-0 group-hover:opacity-75 transition-all duration-300 group-focus-within:opacity-100" />
                    <input
                      {...step1Form.register('email')}
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      className={`relative w-full px-4 py-3 bg-white border-2 rounded-xl font-medium transition-all duration-300 outline-none ${
                        step1Form.formState.errors.email
                          ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                          : focusedField === 'email'
                          ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-200'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    />
                  </div>
                  {step1Form.formState.errors.email && (
                    <p className="text-red-500 text-sm font-medium flex items-center gap-1 animate-slideIn">
                      <span>⚠️</span>
                      {step1Form.formState.errors.email.message}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    We’ll send a 6-digit code to verify your identity.
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`relative w-full py-3 px-4 rounded-xl font-bold text-lg transition-all duration-300 overflow-hidden group transform hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-75 ${
                    loading
                      ? 'bg-slate-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-xl hover:shadow-2xl active:shadow-lg'
                  } animate-slideInUp animation-delay-200`}
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Sending OTP...</span>
                      </>
                    ) : (
                      <>
                        <span>✉️</span>
                        <span>Send OTP</span>
                      </>
                    )}
                  </div>
                </button>

                {/* Back to login */}
                <div className="pt-4 text-center animate-slideInUp animation-delay-300">
                  <p className="text-slate-600">
                    Remembered your password?{' '}
                    <Link
                      to="/login"
                      className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors duration-200 hover:underline"
                    >
                      Back to Login
                    </Link>
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={step2Form.handleSubmit(onStep2)} className="space-y-6">
                {/* Email display */}
                <div className="text-center space-y-2 animate-slideInUp animation-delay-100">
                  <p className="text-slate-700">
                    Code sent to <span className="font-bold text-emerald-600">{maskEmail(email)}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setOtpId(null);
                      setExpirySeconds(0);
                      setResendCooldown(0);
                      step2Form.reset();
                    }}
                    className="text-sm text-slate-600 hover:text-emerald-600 transition-colors duration-200 hover:underline"
                  >
                    Use a different email
                  </button>
                </div>

                {/* OTP */}
                <div className="space-y-2 animate-slideInUp animation-delay-150">
                  <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <span className="text-lg">🔑</span>
                    Verification Code
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 rounded-xl blur-sm opacity-0 group-hover:opacity-75 transition-all duration-300 group-focus-within:opacity-100" />
                    <input
                      {...step2Form.register('otp')}
                      type="text"
                      placeholder="000000"
                      maxLength={6}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      onFocus={() => setFocusedField('otp')}
                      onBlur={() => setFocusedField(null)}
                      className={`relative w-full px-4 py-4 bg-white border-2 rounded-xl font-bold text-4xl text-center tracking-widest transition-all duration-300 outline-none ${
                        step2Form.formState.errors.otp
                          ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                          : focusedField === 'otp'
                          ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-200'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    />
                  </div>
                  {step2Form.formState.errors.otp && (
                    <p className="text-red-500 text-sm font-medium flex items-center gap-1 animate-slideIn">
                      <span>⚠️</span>
                      {step2Form.formState.errors.otp.message}
                    </p>
                  )}
                </div>

                {/* Expiry + resend */}
                <div className="text-center space-y-2 animate-slideInUp animation-delay-200">
                  <p
                    className={`text-sm ${
                      expirySeconds > 0 && expirySeconds < 60 ? 'text-red-600 font-semibold' : 'text-slate-600'
                    }`}
                  >
                    {expirySeconds > 0 ? `Code expires in ${expiryLabel}` : 'Code expired — request a new one'}
                  </p>
                  <button
                    type="button"
                    onClick={onResend}
                    disabled={loading || resendCooldown > 0}
                    className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors duration-200 hover:underline disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                  </button>
                </div>

                {/* New password */}
                <div className="space-y-2 animate-slideInUp animation-delay-250">
                  <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <span className="text-lg">🔐</span>
                    New Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 rounded-xl blur-sm opacity-0 group-hover:opacity-75 transition-all duration-300 group-focus-within:opacity-100" />
                    <input
                      {...step2Form.register('newPassword')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      onFocus={() => setFocusedField('newPassword')}
                      onBlur={() => setFocusedField(null)}
                      className={`relative w-full px-4 py-3 bg-white border-2 rounded-xl font-medium transition-all duration-300 outline-none pr-12 ${
                        step2Form.formState.errors.newPassword
                          ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                          : focusedField === 'newPassword'
                          ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-200'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors duration-200"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-14-14zM10 4.5a7 7 0 016.068 10.606l-1.429-1.43A5 5 0 108.5 8.929l-1.43-1.43A7 7 0 0110 4.5zm0 11a2 2 0 100-4 2 2 0 000 4z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {step2Form.formState.errors.newPassword && (
                    <p className="text-red-500 text-sm font-medium flex items-center gap-1 animate-slideIn">
                      <span>⚠️</span>
                      {step2Form.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                {/* Confirm new password */}
                <div className="space-y-2 animate-slideInUp animation-delay-300">
                  <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <span className="text-lg">🔒</span>
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 rounded-xl blur-sm opacity-0 group-hover:opacity-75 transition-all duration-300 group-focus-within:opacity-100" />
                    <input
                      {...step2Form.register('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField(null)}
                      className={`relative w-full px-4 py-3 bg-white border-2 rounded-xl font-medium transition-all duration-300 outline-none pr-12 ${
                        step2Form.formState.errors.confirmPassword
                          ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                          : focusedField === 'confirmPassword'
                          ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-200'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors duration-200"
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirmPassword ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-14-14zM10 4.5a7 7 0 016.068 10.606l-1.429-1.43A5 5 0 108.5 8.929l-1.43-1.43A7 7 0 0110 4.5zm0 11a2 2 0 100-4 2 2 0 000 4z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {step2Form.formState.errors.confirmPassword && (
                    <p className="text-red-500 text-sm font-medium flex items-center gap-1 animate-slideIn">
                      <span>⚠️</span>
                      {step2Form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {/* Reset button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`relative w-full py-3 px-4 rounded-xl font-bold text-lg transition-all duration-300 overflow-hidden group transform hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-75 ${
                    loading
                      ? 'bg-slate-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-xl hover:shadow-2xl active:shadow-lg'
                  } animate-slideInUp animation-delay-400`}
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Resetting...</span>
                      </>
                    ) : (
                      <>
                        <span>✅</span>
                        <span>Reset Password</span>
                      </>
                    )}
                  </div>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Global animations (same as Login/Register) */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes wave {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(100px); }
        }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out; }
        .animate-slideInUp { animation: slideInUp 0.6s ease-out forwards; opacity: 0; }
        .animate-slideIn { animation: slideIn 0.3s ease-out; }
        .animate-wave { animation: wave 3s ease-in-out infinite; }
        .animation-delay-100 { animation-delay: 0.1s; }
        .animation-delay-150 { animation-delay: 0.15s; }
        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-250 { animation-delay: 0.25s; }
        .animation-delay-300 { animation-delay: 0.3s; }
        .animation-delay-400 { animation-delay: 0.4s; }
        .animation-delay-2000 { animation-delay: 2s; }
      `}</style>
    </div>
  );
}
