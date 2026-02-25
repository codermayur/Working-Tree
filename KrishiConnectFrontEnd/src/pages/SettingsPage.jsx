import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Settings, User, Lock, Bell, Shield, Sliders, AlertTriangle,
  Camera, Eye, EyeOff, Check, X, Loader, AlertCircle, RefreshCw,
  CheckCircle, LogOut, Trash2, ChevronRight, Globe, MapPin,
  Moon, Sun, Smartphone, Mail, MessageSquare, UserX, Plus,
  Save, Key, ToggleLeft, ToggleRight, Info, Award
} from 'lucide-react';
import { authStore } from '../store/authStore';
import { userService } from '../services/user.service';
import { accountService } from '../services/account.service';
import { setStoredLanguage } from '../i18n';
import { useTheme } from '../hooks/useTheme';
import { useBlockedUsers, useUnblockUser } from '../hooks/usePrivacySecurity';
import BlockedUsersList from '../components/privacy-security/BlockedUsersList';
import { UnblockConfirmModal } from '../components/BlockModals';
import { expertApplicationService, expertApplicationConstants } from '../services/expertApplication.service';
import ExpertUpgradeSection from '../components/settings/ExpertUpgradeSection';

// ============================================================================
// ✅ API PLACEHOLDER FUNCTIONS
// Replace with real API calls (fetch/axios) when connecting backend
// ============================================================================
const API_BASE = 'http://localhost:5000/api';
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const settingsApi = {
  // TODO: GET ${API_BASE}/settings  — loads all user settings in one call
  fetchSettings: async () => {
    await delay(800);
    return { settings: DEMO_SETTINGS };
  },

  // TODO: PUT ${API_BASE}/settings/profile  body: { name, username, bio, email, phone, avatar }
  updateProfile: async (data) => {
    await delay(900);
    return { success: true, user: { ...DEMO_SETTINGS.profile, ...data } };
  },

  // TODO: PUT ${API_BASE}/settings/avatar  (multipart/form-data with image file)
  uploadAvatar: async (file) => {
    await delay(1200);
    return { avatarUrl: URL.createObjectURL(file) };
  },

  changePassword: async (data) => {
    return userService.updatePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  },

  // TODO: PUT ${API_BASE}/settings/account  body: { isPublic, emailNotifications }
  updateAccount: async (data) => {
    await delay(500);
    return { success: true };
  },

  // TODO: PUT ${API_BASE}/settings/notifications  body: { push, messages, marketing }
  updateNotifications: async (data) => {
    await delay(400);
    return { success: true };
  },

  // TODO: PUT ${API_BASE}/settings/privacy  body: { twoFactor, activityStatus }
  updatePrivacy: async (data) => {
    await delay(500);
    return { success: true };
  },

  // TODO: GET ${API_BASE}/settings/blocked  — list of blocked users
  fetchBlockedUsers: async () => {
    await delay(400);
    return { users: DEMO_BLOCKED_USERS };
  },

  // TODO: DELETE ${API_BASE}/settings/blocked/${userId}
  unblockUser: async (userId) => {
    await delay(400);
    return { success: true };
  },

  // TODO: PUT ${API_BASE}/settings/preferences  body: { theme, language, location }
  updatePreferences: async (data) => {
    await delay(500);
    return { success: true };
  },

  // TODO: POST ${API_BASE}/auth/logout
  logoutUser: async () => {
    await delay(600);
    return { success: true };
  },

  // Account deletion: OTP flow — request OTP then verify (real API)
  requestDeleteOtp: () => accountService.requestDeleteOtp(),
  verifyDeleteOtp: (otp) => accountService.verifyDeleteOtp(otp),
};

// ============================================================================
// DEMO DATA — Remove when connected to real API
// ============================================================================
// Placeholder avatar (data URL) to avoid external image load and certificate errors
const DEFAULT_AVATAR_DATA =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23e5e7eb" width="100" height="100"/><text x="50" y="58" font-size="40" fill="%239ca3af" text-anchor="middle" dominant-baseline="middle">?</text></svg>'
  );

const DEMO_SETTINGS = {
  profile: {
    name: 'Rajesh Kumar',
    username: 'rajesh.farmer',
    bio: 'Passionate about sustainable agriculture and helping fellow farmers grow better crops.',
    email: 'rajesh.kumar@gmail.com',
    phone: '+91 98765 43210',
    profilePhoto: DEFAULT_AVATAR_DATA,
  },
  account: {
    isPublic: true,
    emailNotifications: true,
  },
  notifications: {
    push: true,
    messages: true,
    marketing: false,
  },
  privacy: {
    twoFactor: false,
    activityStatus: true,
  },
  preferences: {
    theme: 'light',
    language: 'en',
    location: 'Bijnor, Uttar Pradesh',
  },
};

const DEMO_BLOCKED_USERS = [
  { _id: 'b1', name: 'Unknown Spammer', avatar: DEFAULT_AVATAR_DATA, blockedSince: '2 weeks ago' },
  { _id: 'b2', name: 'Fake Account 02', avatar: DEFAULT_AVATAR_DATA, blockedSince: '1 month ago' },
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'mr', label: 'मराठी' },
];

const NAV_SECTIONS = [
  { id: 'profile',       icon: User,          labelKey: 'settings.profile' },
  { id: 'account',       icon: Key,           labelKey: 'settings.account' },
  { id: 'notifications', icon: Bell,          labelKey: 'settings.notifications' },
  { id: 'privacy',       icon: Shield,        labelKey: 'settings.privacy' },
  { id: 'preferences',   icon: Sliders,       labelKey: 'settings.preferences' },
  { id: 'expertUpgrade', icon: Award,         labelKey: 'settings.expertUpgrade' },
  { id: 'danger',        icon: AlertTriangle, labelKey: 'settings.dangerZone' },
];

// ============================================================================
// SHARED MICRO-COMPONENTS
// ============================================================================

/** Animated toggle switch matching the green/white KrishiConnect palette */
const Toggle = ({ checked, onChange, disabled = false }) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-green-300 dark:focus:ring-green-600 ${
      checked ? 'bg-green-500 dark:bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <span
      className="inline-block w-5 h-5 bg-white dark:bg-gray-200 rounded-full shadow-sm transition-transform duration-200 mt-0.5"
      style={{ transform: checked ? 'translateX(22px)' : 'translateX(2px)' }}
    />
  </button>
);

/** Reusable section card wrapper */
const SectionCard = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-colors duration-200 ${className}`}>
    {children}
  </div>
);

/** Section header inside a card */
const SectionHeader = ({ icon: Icon, title, subtitle }) => (
  <div className="px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/80 flex items-center gap-3 transition-colors duration-200">
    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
      <Icon size={16} className="text-green-700 dark:text-green-400" />
    </div>
    <div>
      <h2 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{title}</h2>
      {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

/** Row inside a section: label + toggle or children */
const SettingRow = ({ label, description, children }) => (
  <div className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
    <div className="min-w-0">
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</p>
      {description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-relaxed">{description}</p>}
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
);

/** Inline toast / feedback banner */
const Toast = ({ message, type, onDismiss }) => {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold transition-all ${
      type === 'success' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'
    }`}>
      {type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
      {message}
      <button onClick={onDismiss} className="ml-2 opacity-70 hover:opacity-100"><X size={13} /></button>
    </div>
  );
};

/** Section skeleton loader */
const SectionSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm dark:shadow-none animate-pulse overflow-hidden transition-colors duration-200">
    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex items-center gap-3">
      <div className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-gray-600" />
      <div className="space-y-1.5">
        <div className="h-3.5 w-28 bg-gray-200 dark:bg-gray-600 rounded" />
        <div className="h-2.5 w-44 bg-gray-100 dark:bg-gray-700 rounded" />
      </div>
    </div>
    {[1, 2, 3].map(i => (
      <div key={i} className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-gray-700">
        <div className="space-y-1.5">
          <div className="h-3.5 w-36 bg-gray-200 dark:bg-gray-600 rounded" />
          <div className="h-2.5 w-52 bg-gray-100 dark:bg-gray-700 rounded" />
        </div>
        <div className="h-6 w-11 bg-gray-200 dark:bg-gray-600 rounded-full" />
      </div>
    ))}
  </div>
);

// ============================================================================
// SECTION: PROFILE SETTINGS
// ============================================================================
const ProfileSection = ({ data, onSave, onToast }) => {
  const [form, setForm]       = useState(data);
  const [loading, setLoading] = useState(false);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(data.profilePhoto);
  const [profilePhotoFile, setProfilePhotoFile]       = useState(null);
  const [errors, setErrors]   = useState({});
  const fileRef = useRef(null);

  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())     e.name = 'Name is required';
    if (!form.username.trim()) e.username = 'Username is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email address';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setProfilePhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      let profilePhotoUrl = form.profilePhoto;
      if (profilePhotoFile) {
        const uploaded = await userService.uploadProfilePhoto(profilePhotoFile);
        profilePhotoUrl = uploaded?.profilePhoto?.url ?? (typeof uploaded?.profilePhoto === 'string' ? uploaded.profilePhoto : form.profilePhoto);
      }
      const raw = await userService.updateProfile({
        name: form.name,
        bio: form.bio,
      });
      const profileData = { ...form, profilePhoto: profilePhotoUrl };
      onSave(profileData);
      if (raw && typeof authStore.setUser === 'function') {
        const g = authStore.getState();
        authStore.setUser({ ...g?.user, ...raw, profilePhoto: raw?.profilePhoto?.url ?? raw?.profilePhoto ?? profilePhotoUrl });
      }
      onToast('Profile updated successfully!', 'success');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update profile';
      onToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard>
      <SectionHeader icon={User} title="Profile Settings" subtitle="Update your public farmer profile" />

      {/* Avatar */}
      <div className="px-5 sm:px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-4">
        <div className="relative group flex-shrink-0">
          <img src={profilePhotoPreview} alt="Profile"
            className="w-20 h-20 rounded-full object-cover border-4 border-green-100 dark:border-green-800 shadow-sm" />
          <button onClick={() => fileRef.current?.click()}
            className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
            <Camera size={18} className="text-white" />
          </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleProfilePhotoChange} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Profile Photo</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">JPG, PNG or WebP · Max 5MB</p>
          <button onClick={() => fileRef.current?.click()}
            className="mt-2 text-xs font-bold text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-700 transition flex items-center gap-1.5">
            <Camera size={12} /> Change Photo
          </button>
        </div>
      </div>

      {/* Fields */}
      <div className="px-5 sm:px-6 py-5 space-y-4">
        {[
          { field: 'name',     label: 'Full Name',      type: 'text',  placeholder: 'Your name' },
          { field: 'username', label: 'Username',        type: 'text',  placeholder: 'your.username' },
          { field: 'email',    label: 'Email Address',   type: 'email', placeholder: 'you@email.com' },
          { field: 'phone',    label: 'Phone Number',    type: 'tel',   placeholder: '+91 XXXXX XXXXX' },
        ].map(({ field, label, type, placeholder }) => (
          <div key={field}>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1.5">{label}</label>
            <input
              type={type}
              value={form[field] || ''}
              onChange={(e) => set(field, e.target.value)}
              placeholder={placeholder}
              className={`w-full px-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
                errors[field]
                  ? 'border border-red-300 dark:border-red-600 focus:ring-red-100 dark:focus:ring-red-900/40 bg-red-50 dark:bg-red-900/20'
                  : 'border border-gray-200 dark:border-gray-600 focus:ring-green-200 dark:focus:ring-green-600 focus:border-green-400 dark:focus:border-green-500 bg-white dark:bg-gray-700'
              }`}
            />
            {errors[field] && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors[field]}</p>
            )}
          </div>
        ))}

        <div>
          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1.5">Bio</label>
          <textarea
            value={form.bio || ''}
            onChange={(e) => set('bio', e.target.value)}
            rows={3}
            maxLength={200}
            placeholder="Tell other farmers about yourself..."
            className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 dark:focus:ring-green-600 bg-white dark:bg-gray-700 resize-none transition"
          />
          <p className="text-xs text-gray-400 dark:text-gray-500 text-right mt-1">{(form.bio || '').length}/200</p>
        </div>
      </div>

      <div className="px-5 sm:px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/50 flex justify-end transition-colors duration-200">
        <button onClick={handleSave} disabled={loading}
          className="px-6 py-2.5 bg-green-600 dark:bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 transition flex items-center gap-2 shadow-sm hover:shadow-md">
          {loading ? <Loader size={15} className="animate-spin" /> : <Save size={15} />}
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </SectionCard>
  );
};

// ============================================================================
// SECTION: ACCOUNT SETTINGS (password + toggles)
// ============================================================================
const AccountSection = ({ data, onToast }) => {
  const [account, setAccount] = useState(data);
  const [pwForm, setPwForm]   = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw]   = useState({ current: false, newPw: false, confirm: false });
  const [pwErrors, setPwErrors] = useState({});
  const [pwLoading, setPwLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState({});

  const togglePw = (field) => setShowPw(prev => ({ ...prev, [field]: !prev[field] }));
  const setPw = (field, val) => {
    setPwForm(prev => ({ ...prev, [field]: val }));
    if (pwErrors[field]) setPwErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validatePw = () => {
    const e = {};
    if (!pwForm.current)          e.current = 'Enter your current password';
    if (pwForm.newPw.length < 8)  e.newPw  = 'Minimum 8 characters';
    if (pwForm.newPw !== pwForm.confirm) e.confirm = 'Passwords do not match';
    setPwErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePasswordChange = async () => {
    if (!validatePw()) return;
    setPwLoading(true);
    setPwErrors({});
    try {
      await settingsApi.changePassword({ currentPassword: pwForm.current, newPassword: pwForm.newPw });
      setPwForm({ current: '', newPw: '', confirm: '' });
      onToast('Password changed successfully!', 'success');
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to change password';
      onToast(message, 'error');
    } finally {
      setPwLoading(false);
    }
  };

  const handleToggle = async (field, value) => {
    setToggleLoading(prev => ({ ...prev, [field]: true }));
    try {
      await settingsApi.updateAccount({ [field]: value });
      setAccount(prev => ({ ...prev, [field]: value }));
      onToast('Account settings updated', 'success');
    } catch {
      onToast('Failed to update setting', 'error');
    } finally {
      setToggleLoading(prev => ({ ...prev, [field]: false }));
    }
  };

  const pwFields = [
    { field: 'current', label: 'Current Password', key: 'current' },
    { field: 'newPw',   label: 'New Password',     key: 'newPw' },
    { field: 'confirm', label: 'Confirm Password',  key: 'confirm' },
  ];

  return (
    <SectionCard>
      <SectionHeader icon={Key} title="Account Settings" subtitle="Manage password and account visibility" />

      {/* Change Password */}
      <div className="px-5 sm:px-6 py-5 border-b border-gray-100 dark:border-gray-700 space-y-4">
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Change Password</p>
        {pwFields.map(({ field, label, key }) => (
          <div key={field}>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1.5">{label}</label>
            <div className="relative">
              <input
                type={showPw[key] ? 'text' : 'password'}
                value={pwForm[key]}
                onChange={(e) => setPw(key, e.target.value)}
                placeholder="••••••••"
                className={`w-full px-4 py-2.5 pr-10 text-sm rounded-xl focus:outline-none focus:ring-2 transition text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
                  pwErrors[key] ? 'border border-red-300 dark:border-red-600 focus:ring-red-100 dark:focus:ring-red-900/40 bg-red-50 dark:bg-red-900/20' : 'border border-gray-200 dark:border-gray-600 focus:ring-green-200 dark:focus:ring-green-600 bg-white dark:bg-gray-700'
                }`}
              />
              <button onClick={() => togglePw(key)} type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition">
                {showPw[key] ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {pwErrors[key] && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{pwErrors[key]}</p>
            )}
          </div>
        ))}
        <button onClick={handlePasswordChange} disabled={pwLoading}
          className="px-5 py-2.5 bg-green-600 dark:bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 transition flex items-center gap-2 shadow-sm">
          {pwLoading ? <Loader size={14} className="animate-spin" /> : <Lock size={14} />}
          {pwLoading ? 'Updating...' : 'Update Password'}
        </button>
      </div>

      {/* Account Toggles */}
      <div className="divide-y divide-gray-50 dark:divide-gray-700">
        <SettingRow label="Public Account" description="Anyone can view your profile and posts">
          {toggleLoading.isPublic
            ? <Loader size={16} className="text-green-600 animate-spin" />
            : <Toggle checked={account.isPublic} onChange={(v) => handleToggle('isPublic', v)} />}
        </SettingRow>
        <SettingRow label="Email Notifications" description="Receive important updates via email">
          {toggleLoading.emailNotifications
            ? <Loader size={16} className="text-green-600 animate-spin" />
            : <Toggle checked={account.emailNotifications} onChange={(v) => handleToggle('emailNotifications', v)} />}
        </SettingRow>
      </div>
    </SectionCard>
  );
};

// ============================================================================
// SECTION: NOTIFICATIONS
// ============================================================================
const NotificationsSection = ({ data, onToast }) => {
  const [notifs, setNotifs] = useState(data);
  const [loading, setLoading] = useState({});

  const handleToggle = async (field, value) => {
    setLoading(prev => ({ ...prev, [field]: true }));
    try {
      await settingsApi.updateNotifications({ [field]: value });
      setNotifs(prev => ({ ...prev, [field]: value }));
      onToast('Notification preference saved', 'success');
    } catch {
      onToast('Failed to update notification', 'error');
    } finally {
      setLoading(prev => ({ ...prev, [field]: false }));
    }
  };

  const rows = [
    { field: 'push',      icon: Smartphone,    label: 'Push Notifications',  desc: 'Real-time alerts on your device' },
    { field: 'messages',  icon: MessageSquare, label: 'Message Notifications', desc: 'When you receive a new message' },
    { field: 'marketing', icon: Mail,          label: 'Marketing Emails',     desc: 'Product updates, tips & offers' },
  ];

  return (
    <SectionCard>
      <SectionHeader icon={Bell} title="Notifications" subtitle="Control how and when we reach you" />
      <div className="divide-y divide-gray-50 dark:divide-gray-700">
        {rows.map(({ field, icon: Icon, label, desc }) => (
          <div key={field} className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${notifs[field] ? 'bg-green-50 dark:bg-green-900/40' : 'bg-gray-100 dark:bg-gray-700'}`}>
                <Icon size={15} className={notifs[field] ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{desc}</p>
              </div>
            </div>
            {loading[field]
              ? <Loader size={16} className="text-green-600 dark:text-green-400 animate-spin flex-shrink-0" />
              : <Toggle checked={notifs[field]} onChange={(v) => handleToggle(field, v)} />}
          </div>
        ))}
      </div>
    </SectionCard>
  );
};

// ============================================================================
// SECTION: PRIVACY & SECURITY
// ============================================================================
const PrivacySection = ({ data, onToast }) => {
  const [privacy, setPrivacy] = useState(data);
  const [loading, setLoading] = useState({});
  const [unblockConfirm, setUnblockConfirm] = useState(null);

  const { data: blockedUsers = [], isLoading: blockedLoading } = useBlockedUsers();
  const unblockUser = useUnblockUser({
    onSuccess: () => {
      onToast('User unblocked', 'success');
      setUnblockConfirm(null);
    },
    onError: () => onToast('Failed to unblock user', 'error'),
  });

  const handleToggle = async (field, value) => {
    setLoading(prev => ({ ...prev, [field]: true }));
    try {
      await settingsApi.updatePrivacy({ [field]: value });
      setPrivacy(prev => ({ ...prev, [field]: value }));
      onToast(
        field === 'twoFactor'
          ? value ? '2FA enabled successfully' : '2FA disabled'
          : 'Privacy setting updated',
        'success'
      );
    } catch {
      onToast('Failed to update privacy setting', 'error');
    } finally {
      setLoading(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleUnblockClick = useCallback((userId) => {
    const idStr = userId != null ? String(userId) : '';
    const user = blockedUsers.find((u) => String(u.id ?? u._id) === idStr);
    setUnblockConfirm({ userId: idStr, username: user?.name ?? 'this user' });
  }, [blockedUsers]);

  const handleUnblockConfirm = useCallback(() => {
    if (unblockConfirm?.userId != null) {
      unblockUser.mutate(String(unblockConfirm.userId));
    }
  }, [unblockConfirm, unblockUser]);

  return (
    <SectionCard>
      {unblockConfirm && (
        <UnblockConfirmModal
          username={unblockConfirm.username}
          onConfirm={handleUnblockConfirm}
          onCancel={() => setUnblockConfirm(null)}
          loading={unblockUser.isPending}
        />
      )}
      <SectionHeader icon={Shield} title="Privacy & Security" subtitle="Protect your account and control your data" />

      <div className="divide-y divide-gray-50 dark:divide-gray-700">
        {/* 2FA */}
        <div className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${privacy.twoFactor ? 'bg-green-50 dark:bg-green-900/40' : 'bg-gray-100 dark:bg-gray-700'}`}>
              <Shield size={15} className={privacy.twoFactor ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Two-Factor Authentication</p>
                {privacy.twoFactor && <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/40 px-1.5 py-0.5 rounded-full border border-green-100 dark:border-green-800">ON</span>}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Add an extra security layer to your account</p>
            </div>
          </div>
          {loading.twoFactor
            ? <Loader size={16} className="text-green-600 dark:text-green-400 animate-spin flex-shrink-0" />
            : <Toggle checked={privacy.twoFactor} onChange={(v) => handleToggle('twoFactor', v)} />}
        </div>

        {/* Activity Status */}
        <SettingRow label="Activity Status" description="Show when you were last active to your connections">
          {loading.activityStatus
            ? <Loader size={16} className="text-green-600 animate-spin" />
            : <Toggle checked={privacy.activityStatus} onChange={(v) => handleToggle('activityStatus', v)} />}
        </SettingRow>
      </div>

      {/* Blocked Users — dynamic list from API, unblock with confirmation */}
      <div className="border-t border-gray-100 dark:border-gray-700">
        <div className="px-5 sm:px-6 py-3 bg-gray-50/40 dark:bg-gray-800/50">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <UserX size={12} /> Blocked Users ({blockedUsers.length})
          </p>
        </div>
        <BlockedUsersList
          users={blockedUsers}
          loading={blockedLoading}
          onUnblock={handleUnblockClick}
          unblockingById={
            unblockUser.isPending && unblockUser.variables != null
              ? { [String(unblockUser.variables)]: true }
              : {}
          }
        />
      </div>
    </SectionCard>
  );
};

// ============================================================================
// SECTION: PREFERENCES
// ============================================================================
const PreferencesSection = ({ data, onToast }) => {
  const { t, i18n } = useTranslation();
  const { isDark, toggleDarkMode } = useTheme();
  const setLanguage = authStore.getState().setLanguage;
  const hasAuth = !!authStore.getState().accessToken;
  const [prefs, setPrefs] = useState(data);
  const [loading, setLoading] = useState(false);
  const [languageSaving, setLanguageSaving] = useState(false);
  const [themeSaving, setThemeSaving] = useState(false);

  const set = (field, value) => setPrefs(prev => ({ ...prev, [field]: value }));

  const handleDarkModeToggle = async () => {
    const next = toggleDarkMode();
    set('theme', next ? 'dark' : 'light');
    if (hasAuth) {
      setThemeSaving(true);
      try {
        const updated = await userService.updateTheme(next);
        if (updated?.preferences) authStore.setUser(updated);
        onToast(t('settings.preferencesSaved'), 'success');
      } catch {
        onToast(t('settings.preferencesSaveFailed'), 'error');
      } finally {
        setThemeSaving(false);
      }
    }
  };

  const handleLanguageChange = async (newLang) => {
    set('language', newLang);
    i18n.changeLanguage(newLang);
    setStoredLanguage(newLang);
    setLanguage(newLang);
    if (hasAuth) {
      setLanguageSaving(true);
      try {
        const updated = await userService.updateLanguage(newLang);
        if (updated?.preferences) authStore.setUser(updated);
        onToast(t('settings.preferencesSaved'), 'success');
      } catch {
        onToast(t('settings.preferencesSaveFailed'), 'error');
      } finally {
        setLanguageSaving(false);
      }
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await settingsApi.updatePreferences(prefs);
      onToast(t('settings.preferencesSaved'), 'success');
    } catch {
      onToast(t('settings.preferencesSaveFailed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard>
      <SectionHeader icon={Sliders} title={t('settings.preferences')} subtitle={t('settings.preferencesSubtitle')} />

      <div className="px-5 sm:px-6 py-5 space-y-5">
        {/* Dark Mode */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
              <Moon size={18} className="text-green-700 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{t('settings.theme')} / Dark Mode</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('settings.themeDark')} — {t('settings.themeLight')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {themeSaving && <Loader size={14} className="animate-spin text-green-600 dark:text-green-400" />}
            <Toggle checked={isDark} onChange={handleDarkModeToggle} disabled={themeSaving} />
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1.5">{t('settings.language')}</label>
          <div className="relative">
            <Globe size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={['en', 'hi', 'mr'].includes(prefs.language) ? prefs.language : 'en'}
              onChange={(e) => handleLanguageChange(e.target.value)}
              disabled={languageSaving}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 dark:focus:ring-green-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 appearance-none cursor-pointer disabled:opacity-70 transition-colors duration-200"
            >
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
            {languageSaving && (
              <span className="absolute right-10 top-1/2 -translate-y-1/2">
                <Loader size={14} className="animate-spin text-green-600 dark:text-green-400" />
              </span>
            )}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1.5">{t('settings.location')}</label>
          <div className="relative">
            <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <input type="text" value={prefs.location}
              onChange={(e) => set('location', e.target.value)}
              placeholder={t('settings.locationPlaceholder')}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 dark:focus:ring-green-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-200" />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('settings.locationHint')}</p>
        </div>
      </div>

      <div className="px-5 sm:px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/50 flex justify-end transition-colors duration-200">
        <button onClick={handleSave} disabled={loading}
          className="px-6 py-2.5 bg-green-600 dark:bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 transition flex items-center gap-2 shadow-sm hover:shadow-md">
          {loading ? <Loader size={15} className="animate-spin" /> : <Save size={15} />}
          {loading ? t('settings.saving') : t('settings.savePreferences')}
        </button>
      </div>
    </SectionCard>
  );
};

// ============================================================================
// SECTION: DANGER ZONE
// ============================================================================
const DangerSection = ({ onToast }) => {
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [deleteOtp, setDeleteOtp] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      if (typeof authStore.logout === 'function') {
        authStore.logout();
      }
      onToast('Logged out successfully', 'success');
      navigate('/login', { replace: true });
    } catch {
      onToast('Logout failed. Try again.', 'error');
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleRequestDeleteOtp = async () => {
    setDeleteLoading(true);
    try {
      await settingsApi.requestDeleteOtp();
      onToast('Verification code sent to your email or phone', 'success');
      setDeleteStep(2);
      setDeleteOtp('');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to send code';
      onToast(msg, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleVerifyDeleteOtp = async () => {
    const otp = deleteOtp.trim();
    if (!/^\d{6}$/.test(otp)) {
      onToast('Enter the 6-digit code', 'error');
      return;
    }
    setDeleteLoading(true);
    try {
      await settingsApi.verifyDeleteOtp(otp);
      onToast('Account deleted successfully', 'success');
      if (typeof authStore.logout === 'function') authStore.logout();
      setShowDeleteModal(false);
      setDeleteStep(1);
      setDeleteOtp('');
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Invalid or expired code';
      onToast(msg, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteStep(1);
    setDeleteOtp('');
  };

  return (
    <>
      {/* Delete Account — OTP verification modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl dark:shadow-none border border-transparent dark:border-gray-700">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 dark:bg-red-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-red-500 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100">Delete Account</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {deleteStep === 1 ? 'We will send a verification code to your email or phone' : 'Enter the 6-digit code we sent you'}
                </p>
              </div>
              <button onClick={closeDeleteModal} className="ml-auto p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-400 dark:text-gray-500">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {deleteStep === 1 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-4 space-y-1">
                  <p className="text-sm font-bold text-red-700 dark:text-red-300">This action cannot be undone:</p>
                  {['Your profile and all personal information', 'All your posts, comments & media', 'Your connections and messages', 'Access to all KrishiConnect features'].map(item => (
                    <div key={item} className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
                      <X size={11} className="mt-0.5 flex-shrink-0" />{item}
                    </div>
                  ))}
                </div>
              )}
              {deleteStep === 1 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">Click below to receive a verification code. Then enter it in the next step to confirm deletion.</p>
              ) : (
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1.5">Verification code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={deleteOtp}
                    onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full px-4 py-2.5 text-center text-lg tracking-widest text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800 bg-white dark:bg-gray-700"
                  />
                </div>
              )}
            </div>
            <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex gap-3">
              <button onClick={closeDeleteModal}
                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                Cancel
              </button>
              {deleteStep === 1 ? (
                <button onClick={handleRequestDeleteOtp} disabled={deleteLoading}
                  className="flex-1 py-2.5 bg-red-500 dark:bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-600 dark:hover:bg-red-700 disabled:opacity-40 transition flex items-center justify-center gap-2">
                  {deleteLoading ? <Loader size={14} className="animate-spin" /> : <Mail size={14} />}
                  {deleteLoading ? 'Sending...' : 'Send verification code'}
                </button>
              ) : (
                <button onClick={handleVerifyDeleteOtp} disabled={!deleteOtp.trim() || deleteOtp.length !== 6 || deleteLoading}
                  className="flex-1 py-2.5 bg-red-500 dark:bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-600 dark:hover:bg-red-700 disabled:opacity-40 transition flex items-center justify-center gap-2">
                  {deleteLoading ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  {deleteLoading ? 'Deleting...' : 'Delete my account'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <SectionCard>
        <SectionHeader icon={AlertTriangle} title="Danger Zone" subtitle="Irreversible actions — proceed with caution" />
        <div className="divide-y divide-gray-50 dark:divide-gray-700">
          {/* Logout */}
          <div className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4">
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Sign Out</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Log out from your current session</p>
            </div>
            <button onClick={handleLogout} disabled={logoutLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50">
              {logoutLoading ? <Loader size={13} className="animate-spin" /> : <LogOut size={13} />}
              {logoutLoading ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>

          {/* Delete Account */}
          <div className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4">
            <div>
              <p className="text-sm font-bold text-red-600 dark:text-red-400">Delete Account</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Permanently erase all your data from KrishiConnect</p>
            </div>
            <button onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700 rounded-xl text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/50 transition">
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </div>
      </SectionCard>
    </>
  );
};

// ============================================================================
// MAIN SETTINGS PAGE
// ============================================================================
const SettingsPage = () => {
  const { t } = useTranslation();
  const [settings, setSettings]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [activeSection, setActiveSection] = useState('profile');
  const [toast, setToast]         = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userForExpert, setUserForExpert] = useState(null);
  const [myApplication, setMyApplication] = useState(null);
  const contentRef = useRef(null);

  // Load settings: real profile from API when authenticated, rest from stub
  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const hasAuth = authStore.getState().accessToken;
      let profile = DEMO_SETTINGS.profile;
      let raw = null;
      if (hasAuth) {
        try {
          raw = await userService.getMe();
          profile = {
            name: raw?.name ?? '',
            username: raw?.username ?? raw?.name ?? '',
            email: raw?.email ?? '',
            phone: raw?.phoneNumber ? `+91 ${raw.phoneNumber}` : (raw?.phone ?? ''),
            bio: raw?.bio ?? '',
            profilePhoto: raw?.profilePhoto?.url ?? (typeof raw?.profilePhoto === 'string' ? raw.profilePhoto : DEMO_SETTINGS.profile.profilePhoto),
          };
          setUserForExpert({ ...raw, role: raw?.role, roleUpgradeStatus: raw?.roleUpgradeStatus, name: raw?.name, email: raw?.email, phoneNumber: raw?.phoneNumber });
          try {
            const app = await expertApplicationService.getMyApplication();
            setMyApplication(app || null);
          } catch (_) {
            setMyApplication(null);
          }
        } catch (err) {
          if (err?.response?.status === 401) setError('Please log in to view settings.');
          else setError(err?.response?.data?.message || err?.message || 'Failed to load profile.');
          setLoading(false);
          return;
        }
      }
      const { settings: rest } = await settingsApi.fetchSettings();
      if (hasAuth && raw?.preferences) {
        rest.preferences = { ...rest.preferences, ...raw.preferences };
        if (raw.preferences.language) rest.preferences.language = raw.preferences.language;
      }
      setSettings({ ...rest, profile });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  const handleNavClick = (id) => {
    setActiveSection(id);
    setMobileSidebarOpen(false);
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeSectionMeta = NAV_SECTIONS.find(s => s.id === activeSection);
  const activeLabel = activeSectionMeta ? t(activeSectionMeta.labelKey) : t('settings.title');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Global Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}

      {/* Top Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-30 shadow-sm transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center gap-3">
          {/* Mobile menu toggle */}
          <button onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-500 dark:text-gray-400 transition">
            <Settings size={18} />
          </button>
          <Settings size={20} className="text-green-600 dark:text-green-400 hidden lg:block flex-shrink-0" />
          <div className="flex-1">
            <h1 className="font-black text-gray-900 dark:text-gray-100 text-lg leading-none">{t('settings.title')}</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 lg:hidden">{activeLabel}</p>
          </div>
          <span className="text-xs bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-lg font-bold border border-green-100 dark:border-green-800">
            🌾 KrishiConnect
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-6 relative">

          {/* ── SIDEBAR NAV ── */}
          <aside className={`${mobileSidebarOpen ? 'flex' : 'hidden'} lg:flex flex-col w-56 flex-shrink-0
            fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:static lg:bg-transparent lg:backdrop-blur-none lg:z-auto
            ${mobileSidebarOpen ? 'items-start pt-20 px-4' : ''}`}
            onClick={(e) => { if (e.target === e.currentTarget) setMobileSidebarOpen(false); }}>

            <nav className="w-56 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-2 sticky top-24 overflow-hidden transition-colors duration-200">
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 py-2">{t('settings.title')}</p>
              {NAV_SECTIONS.map(({ id, icon: Icon, labelKey }) => (
                <button key={id} onClick={() => handleNavClick(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all mb-0.5 ${
                    activeSection === id
                      ? id === 'danger'
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                        : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}>
                  <Icon size={16} className={activeSection === id && id === 'danger' ? 'text-red-500 dark:text-red-400' : activeSection === id ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'} />
                  {t(labelKey)}
                  {activeSection === id && (
                    <ChevronRight size={13} className="ml-auto opacity-50" />
                  )}
                </button>
              ))}
            </nav>
          </aside>

          {/* ── MAIN CONTENT ── */}
          <main ref={contentRef} className="flex-1 min-w-0 space-y-5">
            {/* Error State */}
            {error && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-red-100 dark:border-red-900/50 p-8 text-center shadow-sm dark:shadow-none transition-colors duration-200">
                <AlertCircle size={40} className="text-red-400 dark:text-red-500 mx-auto mb-3" />
                <p className="font-semibold text-gray-700 dark:text-gray-300">{error}</p>
                <button onClick={loadSettings}
                  className="mt-4 px-6 py-2 bg-green-600 dark:bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-700 dark:hover:bg-green-600 transition flex items-center gap-2 mx-auto">
                  <RefreshCw size={14} /> Retry
                </button>
              </div>
            )}

            {/* Loading State */}
            {loading && !error && (
              <>
                <SectionSkeleton />
                <SectionSkeleton />
              </>
            )}

            {/* Content */}
            {!loading && !error && settings && (
              <>
                {activeSection === 'profile' && (
                  <ProfileSection
                    data={settings.profile}
                    onSave={(updated) => setSettings(prev => ({ ...prev, profile: updated }))}
                    onToast={showToast}
                  />
                )}

                {activeSection === 'account' && (
                  <AccountSection
                    data={settings.account}
                    onToast={showToast}
                  />
                )}

                {activeSection === 'notifications' && (
                  <NotificationsSection
                    data={settings.notifications}
                    onToast={showToast}
                  />
                )}

                {activeSection === 'privacy' && (
                  <PrivacySection
                    data={settings.privacy}
                    onToast={showToast}
                  />
                )}

                {activeSection === 'preferences' && (
                  <PreferencesSection
                    data={settings.preferences}
                    onToast={showToast}
                  />
                )}

                {activeSection === 'expertUpgrade' && (
                  <ExpertUpgradeSection
                    user={userForExpert}
                    myApplication={myApplication}
                    onRefresh={loadSettings}
                    onToast={showToast}
                  />
                )}

                {activeSection === 'danger' && (
                  <DangerSection onToast={showToast} />
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
