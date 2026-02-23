import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/authStore';

const schema = z
  .object({
    phoneNumber: z.string().optional(),
    email: z.union([z.string().email('Invalid email'), z.literal('')]).optional(),
    password: z.string().min(1, 'Password required'),
  })
  .refine(
    (data) => {
      const phone = data.phoneNumber?.trim();
      const emailVal = data.email?.trim();
      const validPhone = phone && /^[6-9]\d{9}$/.test(phone);
      const validEmail = emailVal && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
      return validPhone || validEmail;
    },
    { message: 'Enter phone number or email', path: ['phoneNumber'] }
  );

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { phoneNumber: '', email: '', password: '' },
  });

  const phoneNumber = watch('phoneNumber');
  const email = watch('email');
  const password = watch('password');

  const onSubmit = async (data) => {
    const payload = { password: data.password };
    if (data.phoneNumber?.trim() && /^[6-9]\d{9}$/.test(data.phoneNumber.trim())) {
      payload.phoneNumber = data.phoneNumber.trim();
    }
    if (data.email?.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      payload.email = data.email.trim();
    }
    setLoading(true);
    try {
      const res = await authService.login(payload);
      const data = res.data?.data ?? res.data;
      const user = data?.user;
      const tokens = data?.tokens ?? data?.token;
      const accessToken = tokens?.accessToken ?? tokens?.access_token;
      const refreshToken = tokens?.refreshToken ?? tokens?.refresh_token;
      if (!user || !accessToken) {
        toast.error('Invalid login response. Please try again.');
        return;
      }
      if (typeof setAuth !== 'function') {
        toast.error('Auth state unavailable. Please refresh and try again.');
        return;
      }
      setAuth(user, accessToken, refreshToken ?? null);
      toast.success('🎉 Login successful!');
      navigate('/profile', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || '❌ Login failed');
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
            {/* Animated waves background */}
            <div className="absolute inset-0 opacity-20">
              <svg viewBox="0 0 1200 120" className="absolute w-full h-full">
                <path
                  d="M0,30 Q300,0 600,30 T1200,30 L1200,120 L0,120 Z"
                  fill="currentColor"
                  className="text-white animate-wave"
                />
              </svg>
            </div>

            {/* Logo and Title */}
            <div className="relative h-full flex flex-col items-center justify-center text-white">
              <div className="text-5xl mb-2 animate-bounce">🌾</div>
              <h1 className="text-2xl font-bold">KrishiConnect</h1>
              <p className="text-sm text-emerald-100 mt-1">Welcome back, Farmer!</p>
            </div>
          </div>

          {/* Form Section */}
          <div className="p-8 sm:p-10">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Phone Number Field */}
              <div className="space-y-2 animate-slideInUp animation-delay-100">
                <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <span className="text-lg">📱</span>
                  Phone Number <span className="text-slate-500 font-normal">(or use email below)</span>
                </label>
                <div className="relative group">
                  <div className={`absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 rounded-xl blur-sm opacity-0 group-hover:opacity-75 transition-all duration-300 group-focus-within:opacity-100`} />
                  <input
                    {...register('phoneNumber')}
                    type="tel"
                    placeholder="9876543210"
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField(null)}
                    className={`relative w-full px-4 py-3 bg-white border-2 rounded-xl font-medium transition-all duration-300 outline-none ${
                      errors.phoneNumber
                        ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : focusedField === 'phone'
                        ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-200'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  />
                  {phoneNumber && !errors.phoneNumber && /^[6-9]\d{9}$/.test(phoneNumber) && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                      <svg className="w-5 h-5 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                      </svg>
                    </div>
                  )}
                </div>
                {errors.phoneNumber && (
                  <p className="text-red-500 text-sm font-medium flex items-center gap-1 animate-slideIn">
                    <span>⚠️</span>
                    {errors.phoneNumber.message}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2 animate-slideInUp animation-delay-150">
                <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <span className="text-lg">📧</span>
                  Email <span className="text-slate-500 font-normal">(or use phone above)</span>
                </label>
                <div className="relative group">
                  <div className={`absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 rounded-xl blur-sm opacity-0 group-hover:opacity-75 transition-all duration-300 group-focus-within:opacity-100`} />
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="you@example.com"
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className={`relative w-full px-4 py-3 bg-white border-2 rounded-xl font-medium transition-all duration-300 outline-none ${
                      errors.email
                        ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : focusedField === 'email'
                        ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-200'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  />
                  {email && !errors.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                      <svg className="w-5 h-5 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                      </svg>
                    </div>
                  )}
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm font-medium flex items-center gap-1 animate-slideIn">
                    <span>⚠️</span>
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2 animate-slideInUp animation-delay-200">
                <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <span className="text-lg">🔐</span>
                  Password
                </label>
                <div className="relative group">
                  <div className={`absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 rounded-xl blur-sm opacity-0 group-hover:opacity-75 transition-all duration-300 group-focus-within:opacity-100`} />
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className={`relative w-full px-4 py-3 bg-white border-2 rounded-xl font-medium transition-all duration-300 outline-none pr-12 ${
                      errors.password
                        ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : focusedField === 'password'
                        ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-200'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
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
                {errors.password && (
                  <p className="text-red-500 text-sm font-medium flex items-center gap-1 animate-slideIn">
                    <span>⚠️</span>
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-2 animate-slideInUp animation-delay-300">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-lg bg-white border-2 border-slate-300 checked:bg-emerald-600 checked:border-emerald-600 cursor-pointer transition-all duration-200 accent-emerald-600"
                  />
                  <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                    Remember me
                  </span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors duration-200 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`relative w-full py-3 px-4 rounded-xl font-bold text-lg transition-all duration-300 overflow-hidden group transform hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-75 ${
                  loading
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-xl hover:shadow-2xl active:shadow-lg'
                } animate-slideInUp animation-delay-400`}
              >
                {/* Button glow effect */}
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Button content */}
                <div className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Logging in...</span>
                    </>
                  ) : (
                    <>
                      <span>🔓</span>
                      <span>Login to Account</span>
                    </>
                  )}
                </div>
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
              <span className="text-sm text-slate-500">or</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
            </div>

            {/* Social Login Options */}
            <div className="grid grid-cols-2 gap-4 animate-slideInUp animation-delay-500">
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-300 group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">👨‍🌾</span>
                <span className="hidden sm:block text-sm font-medium text-slate-700">Google</span>
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-300 group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">📱</span>
                <span className="hidden sm:block text-sm font-medium text-slate-700">Phone</span>
              </button>
            </div>

            {/* Register Link */}
            <div className="mt-8 pt-8 border-t border-slate-200 text-center space-y-4 animate-slideInUp animation-delay-600">
              <p className="text-slate-600">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors duration-200 hover:underline"
                >
                  Register here
                </Link>
              </p>
              <p className="text-xs text-slate-500">
                By logging in, you agree to our{' '}
                <a href="#terms" className="text-emerald-600 hover:underline">
                  Terms of Service
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Demo Credentials Hint */}
        <div className="mt-6 p-4 bg-blue-50/80 backdrop-blur border border-blue-200 rounded-2xl animate-slideInUp animation-delay-700">
          <p className="text-sm text-blue-900 flex items-start gap-2">
            <span className="text-lg mt-0.5">💡</span>
            <span>
              Demo: Use <strong>9876543210</strong> or your <strong>email</strong> with password to login
            </span>
          </p>
        </div>
      </div>

      {/* Global animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes wave {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(100px);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }

        .animate-slideInUp {
          animation: slideInUp 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }

        .animate-wave {
          animation: wave 3s ease-in-out infinite;
        }

        .animation-delay-100 {
          animation-delay: 0.1s;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
        }

        .animation-delay-300 {
          animation-delay: 0.3s;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
        }

        .animation-delay-500 {
          animation-delay: 0.5s;
        }

        .animation-delay-600 {
          animation-delay: 0.6s;
        }

        .animation-delay-700 {
          animation-delay: 0.7s;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}