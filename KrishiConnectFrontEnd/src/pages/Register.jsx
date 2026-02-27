import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/authStore';

const step1Schema = z.object({
  phoneNumber: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),
  email: z.union([z.string().email('Invalid email'), z.literal('')]).optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password required'),
  location: z.object({
    state: z.string().optional(),
    district: z.string().optional(),
  }).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const step2Schema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

export default function Register() {
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [otpId, setOtpId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  // OTP Timer
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (otpTimer === 0 && step === 2) {
      setCanResendOtp(true);
    }
  }, [otpTimer, step]);

  const step1Form = useForm({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      phoneNumber: '',
      email: '',
      name: '',
      password: '',
      confirmPassword: '',
      location: { state: '', district: '' }
    },
    mode: 'onChange',
  });

  const step2Form = useForm({
    resolver: zodResolver(step2Schema),
    defaultValues: { otp: '' },
    mode: 'onChange',
  });

  // Calculate password strength
  const calculatePasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 6) strength += 25;
    if (pwd.length >= 8) strength += 25;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength += 25;
    if (/[0-9]/.test(pwd)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength += 10;
    return Math.min(strength, 100);
  };

  const handlePasswordChange = (e) => {
    const pwd = e.target.value;
    setPasswordStrength(calculatePasswordStrength(pwd));

    // Check if passwords match
    const confirmPwd = step1Form.watch('confirmPassword');
    setPasswordsMatch(pwd === confirmPwd || confirmPwd === '');
  };

  const handleConfirmPasswordChange = (e) => {
    const confirmPwd = e.target.value;
    const pwd = step1Form.watch('password');
    setPasswordsMatch(pwd === confirmPwd);
  };

  const onStep1 = async (data) => {
    setLoading(true);
    try {
      const { confirmPassword, ...registrationData } = data;
      const res = await authService.register(registrationData);
      const result = res.data?.data ?? res.data;
      setPhoneNumber(data.phoneNumber);
      setOtpTimer(60);
      setCanResendOtp(false);
      setOtpId(result.otpId || null);
      if (result.email) {
        setEmail(result.email);
        toast.success('✉️ OTP sent to your email!');
      } else {
        setEmail('');
        setOtpId(null);
        toast.success('✉️ OTP sent to your phone!');
      }
      setStep(2);
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.message || err.message || '❌ Registration failed';
      const details = data?.errors;
      toast.error(details?.length ? `${msg}: ${details.map((e) => e.message).join(', ')}` : msg);
    } finally {
      setLoading(false);
    }
  };

  const onStep2 = async (data) => {
    setLoading(true);
    try {
      // Backend expects otp as exactly 6-digit string; otpId as string
      const otp = String(data.otp || '').replace(/\D/g, '').slice(0, 6);
      if (otp.length !== 6) {
        toast.error('OTP must be 6 digits');
        setLoading(false);
        return;
      }
      let res;
      if (otpId) {
        res = await authService.verifyRegistrationOTP({
          otpId: String(otpId),
          otp,
        });
      } else {
        res = await authService.verifyOTP({ phoneNumber, otp });
      }
      const payload = res.data?.data ?? res.data;
      if (!payload) {
        toast.error('Invalid response from server');
        return;
      }
      // Registration does NOT auto-login; only set auth if backend returns tokens
      const user = payload.user;
      const tokens = payload.tokens ?? payload.token;
      const accessToken = tokens?.accessToken ?? tokens?.access_token;
      const refreshToken = tokens?.refreshToken ?? tokens?.refresh_token;
      if (user && accessToken && typeof setAuth === 'function') {
        setAuth(user, accessToken, refreshToken ?? null);
      }
      toast.success('🎉 Registration successful! Please log in.');
      navigate('/login', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || '❌ Verification failed';
      const details = err.response?.data?.errors;
      toast.error(details?.length ? `${msg}: ${details.map((e) => e.message).join(', ')}` : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      if (otpId) {
        await authService.resendOTP({ otpId });
        setOtpTimer(60);
        setCanResendOtp(false);
        toast.success('✉️ OTP resent to your email!');
      } else {
        const { confirmPassword, ...registrationData } = step1Form.getValues();
        await authService.register(registrationData);
        setOtpTimer(60);
        setCanResendOtp(false);
        toast.success('✉️ OTP resent successfully!');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to resend OTP';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-white to-slate-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-green-200/20 rounded-full blur-3xl animate-pulse animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-200/10 rounded-full blur-3xl animate-pulse animation-delay-4000" />
      </div>

      {/* Main content */}
      <div className="w-full max-w-xl relative z-10 animate-fadeIn">
        {/* Card Container */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">

          {/* Header Section with Gradient */}
          <div className="relative h-40 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 overflow-hidden">
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
              <h1 className="text-2xl sm:text-3xl font-bold">Join Khetibari</h1>
              <p className="text-sm text-emerald-100 mt-2">Start your farming journey today</p>
            </div>

            {/* Progress indicator */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
              <div
                className={`h-full bg-gradient-to-r from-emerald-400 to-green-400 transition-all duration-500 ${
                  step === 1 ? 'w-1/2' : 'w-full'
                }`}
              />
            </div>
          </div>

          {/* Form Section */}
          <div className="p-8 sm:p-10">
            {/* Step Indicator */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                  step >= 1
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {step > 1 ? '✓' : '1'}
                </div>
                <span className={`text-sm font-medium transition-colors duration-300 ${
                  step >= 1 ? 'text-emerald-600' : 'text-slate-600'
                }`}>
                  Account
                </span>
              </div>

              <div className={`flex-1 h-1 mx-4 rounded-full transition-all duration-300 ${
                step === 2 ? 'bg-emerald-600' : 'bg-slate-200'
              }`} />

              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                  step >= 2
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {step > 2 ? '✓' : '2'}
                </div>
                <span className={`text-sm font-medium transition-colors duration-300 ${
                  step >= 2 ? 'text-emerald-600' : 'text-slate-600'
                }`}>
                  Verify
                </span>
              </div>
            </div>

            {/* Step 1: Account Details */}
            {step === 1 ? (
              <form onSubmit={step1Form.handleSubmit(onStep1)} className="space-y-5">
                {/* Phone Number */}
                <div className="space-y-2 animate-slideInUp animation-delay-100">
                  <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <span className="text-lg">📱</span>
                    Phone Number
                  </label>
                  <div className="relative group">
                    <div className={`absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 rounded-xl blur-sm opacity-0 group-hover:opacity-75 transition-all duration-300 group-focus-within:opacity-100`} />
                    <input
                      {...step1Form.register('phoneNumber')}
                      type="tel"
                      placeholder="9876543210"
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField(null)}
                      className={`relative w-full px-4 py-3 bg-white border-2 rounded-xl font-medium transition-all duration-300 outline-none ${
                        step1Form.formState.errors.phoneNumber
                          ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                          : focusedField === 'phone'
                          ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-200'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    />
                  </div>
                  {step1Form.formState.errors.phoneNumber && (
                    <p className="text-red-500 text-sm font-medium flex items-center gap-1 animate-slideIn">
                      <span>⚠️</span>
                      {step1Form.formState.errors.phoneNumber.message}
                    </p>
                  )}
                </div>

                {/* Email (optional – OTP sent by email when provided) */}
                <div className="space-y-2 animate-slideInUp animation-delay-150">
                  <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <span className="text-lg">📧</span>
                    Email <span className="text-slate-500 font-normal">(optional – get OTP by email)</span>
                  </label>
                  <div className="relative group">
                    <div className={`absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 rounded-xl blur-sm opacity-0 group-hover:opacity-75 transition-all duration-300 group-focus-within:opacity-100`} />
                    <input
                      {...step1Form.register('email')}
                      type="email"
                      placeholder="you@example.com"
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
                </div>

                {/* Name */}
                <div className="space-y-2 animate-slideInUp animation-delay-200">
                  <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <span className="text-lg">👤</span>
                    Full Name
                  </label>
                  <div className="relative group">
                    <div className={`absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 rounded-xl blur-sm opacity-0 group-hover:opacity-75 transition-all duration-300 group-focus-within:opacity-100`} />
                    <input
                      {...step1Form.register('name')}
                      placeholder="Ramesh Kumar"
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      className={`relative w-full px-4 py-3 bg-white border-2 rounded-xl font-medium transition-all duration-300 outline-none ${
                        step1Form.formState.errors.name
                          ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                          : focusedField === 'name'
                          ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-200'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    />
                  </div>
                  {step1Form.formState.errors.name && (
                    <p className="text-red-500 text-sm font-medium flex items-center gap-1 animate-slideIn">
                      <span>⚠️</span>
                      {step1Form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2 animate-slideInUp animation-delay-300">
                  <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <span className="text-lg">🔐</span>
                    Password
                  </label>
                  <div className="relative group">
                    <div className={`absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 rounded-xl blur-sm opacity-0 group-hover:opacity-75 transition-all duration-300 group-focus-within:opacity-100`} />
                    <input
                      {...step1Form.register('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => {
                        step1Form.register('password').onChange(e);
                        handlePasswordChange(e);
                      }}
                      className={`relative w-full px-4 py-3 bg-white border-2 rounded-xl font-medium transition-all duration-300 outline-none pr-12 ${
                        step1Form.formState.errors.password
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

                  {/* Password Strength Indicator */}
                  {step1Form.watch('password') && (
                    <div className="space-y-2 animate-slideIn">
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            passwordStrength < 25
                              ? 'w-1/4 bg-red-500'
                              : passwordStrength < 50
                              ? 'w-2/4 bg-yellow-500'
                              : passwordStrength < 75
                              ? 'w-3/4 bg-blue-500'
                              : 'w-full bg-emerald-500'
                          }`}
                        />
                      </div>
                      <p className="text-xs text-slate-600">
                        Strength:{' '}
                        <span className={`font-semibold ${
                          passwordStrength < 25
                            ? 'text-red-500'
                            : passwordStrength < 50
                            ? 'text-yellow-500'
                            : passwordStrength < 75
                            ? 'text-blue-500'
                            : 'text-emerald-500'
                        }`}>
                          {passwordStrength < 25
                            ? 'Weak'
                            : passwordStrength < 50
                            ? 'Fair'
                            : passwordStrength < 75
                            ? 'Good'
                            : 'Strong'}
                        </span>
                      </p>
                    </div>
                  )}

                  {step1Form.formState.errors.password && (
                    <p className="text-red-500 text-sm font-medium flex items-center gap-1 animate-slideIn">
                      <span>⚠️</span>
                      {step1Form.formState.errors.password.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2 animate-slideInUp animation-delay-300">
                  <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <span className="text-lg">🔒</span>
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <div className={`absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 rounded-xl blur-sm opacity-0 group-hover:opacity-75 transition-all duration-300 group-focus-within:opacity-100`} />
                    <input
                      {...step1Form.register('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => {
                        step1Form.register('confirmPassword').onChange(e);
                        handleConfirmPasswordChange(e);
                      }}
                      className={`relative w-full px-4 py-3 bg-white border-2 rounded-xl font-medium transition-all duration-300 outline-none pr-12 ${
                        step1Form.formState.errors.confirmPassword
                          ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                          : focusedField === 'confirmPassword'
                          ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-200'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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

                  {/* Password Match Indicator */}
                  {step1Form.watch('confirmPassword') && (
                    <div className="flex items-center gap-2 animate-slideIn">
                      {passwordsMatch ? (
                        <>
                          <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                          </svg>
                          <p className="text-sm font-medium text-emerald-600">Passwords match</p>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
                          </svg>
                          <p className="text-sm font-medium text-red-600">Passwords don't match</p>
                        </>
                      )}
                    </div>
                  )}

                  {step1Form.formState.errors.confirmPassword && (
                    <p className="text-red-500 text-sm font-medium flex items-center gap-1 animate-slideIn">
                      <span>⚠️</span>
                      {step1Form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {/* Location */}
                <div className="grid grid-cols-2 gap-4 animate-slideInUp animation-delay-400">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <span className="text-lg">🗺️</span>
                      State
                    </label>
                    <select
                      {...step1Form.register('location.state')}
                      onFocus={() => setFocusedField('state')}
                      onBlur={() => setFocusedField(null)}
                      className={`w-full px-4 py-3 bg-white border-2 rounded-xl font-medium transition-all duration-300 outline-none ${
                        focusedField === 'state'
                          ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-200'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <option value="">Select State</option>
                      {indianStates.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <span className="text-lg">📍</span>
                      District
                    </label>
                    <input
                      {...step1Form.register('location.district')}
                      placeholder="Your District"
                      onFocus={() => setFocusedField('district')}
                      onBlur={() => setFocusedField(null)}
                      className={`w-full px-4 py-3 bg-white border-2 rounded-xl font-medium transition-all duration-300 outline-none ${
                        focusedField === 'district'
                          ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-200'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !passwordsMatch}
                  className={`relative w-full py-3 px-4 rounded-xl font-bold text-lg transition-all duration-300 overflow-hidden group transform hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-75 mt-6 animate-slideInUp animation-delay-500 ${
                    loading || !passwordsMatch
                      ? 'bg-slate-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-xl hover:shadow-2xl active:shadow-lg'
                  }`}
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
                        <span>📧</span>
                        <span>Send OTP</span>
                      </>
                    )}
                  </div>
                </button>
              </form>
            ) : (
              /* Step 2: OTP Verification */
              <form onSubmit={step2Form.handleSubmit(onStep2)} className="space-y-6">
                {/* OTP sent display */}
                <div className="text-center space-y-2 animate-slideInUp animation-delay-100">
                  <p className="text-slate-700">
                    OTP sent to <span className="font-bold text-emerald-600">{email || phoneNumber}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => { setStep(1); setOtpId(null); setEmail(''); }}
                    className="text-sm text-slate-600 hover:text-emerald-600 transition-colors duration-200 hover:underline"
                  >
                    Change {email ? 'email or phone' : 'phone number'}
                  </button>
                </div>

                {/* OTP Input */}
                <div className="space-y-2 animate-slideInUp animation-delay-200">
                  <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <span className="text-lg">🔑</span>
                    Enter 6-Digit OTP
                  </label>
                  <div className="relative group">
                    <div className={`absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 rounded-xl blur-sm opacity-0 group-hover:opacity-75 transition-all duration-300 group-focus-within:opacity-100`} />
                    <input
                      {...step2Form.register('otp')}
                      type="text"
                      placeholder="000000"
                      maxLength={6}
                      inputMode="numeric"
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

                {/* Resend OTP */}
                <div className="text-center space-y-2 animate-slideInUp animation-delay-300">
                  {otpTimer > 0 ? (
                    <p className="text-sm text-slate-600">
                      Resend OTP in{' '}
                      <span className="font-bold text-emerald-600">
                        {otpTimer}s
                      </span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={!canResendOtp}
                      className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors duration-200 hover:underline disabled:text-slate-400 disabled:cursor-not-allowed"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                {/* Verify Button */}
                <button
                  type="submit"
                  disabled={loading || step2Form.formState.errors.otp || !step2Form.watch('otp')}
                  className={`relative w-full py-3 px-4 rounded-xl font-bold text-lg transition-all duration-300 overflow-hidden group transform hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-75 animate-slideInUp animation-delay-400 ${
                    loading || step2Form.formState.errors.otp || !step2Form.watch('otp')
                      ? 'bg-slate-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-xl hover:shadow-2xl active:shadow-lg'
                  }`}
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>✓</span>
                        <span>Verify & Register</span>
                      </>
                    )}
                  </div>
                </button>
              </form>
            )}

            {/* Login Link */}
            <div className="mt-8 pt-8 border-t border-slate-200 text-center animate-slideInUp animation-delay-700">
              <p className="text-slate-600">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors duration-200 hover:underline"
                >
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-8 grid grid-cols-3 gap-4 animate-slideInUp animation-delay-800">
          <div className="text-center p-4 bg-white/50 backdrop-blur border border-white/20 rounded-2xl">
            <div className="text-2xl mb-2">🔒</div>
            <p className="text-xs font-semibold text-slate-700">Secure</p>
          </div>
          <div className="text-center p-4 bg-white/50 backdrop-blur border border-white/20 rounded-2xl">
            <div className="text-2xl mb-2">⚡</div>
            <p className="text-xs font-semibold text-slate-700">Fast</p>
          </div>
          <div className="text-center p-4 bg-white/50 backdrop-blur border border-white/20 rounded-2xl">
            <div className="text-2xl mb-2">🤝</div>
            <p className="text-xs font-semibold text-slate-700">Trusted</p>
          </div>
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

        .animation-delay-800 {
          animation-delay: 0.8s;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}