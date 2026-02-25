/**
 * User & profile API. Backend: GET/PATCH /users/me, GET /users/:userId, follow, avatar, background.
 */
import { request } from './api';

const BACKGROUND_PRESET_COLORS = {
  default: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
  gradient_teal: 'linear-gradient(135deg, #16a34a 0%, #6ee7b7 100%)',
  gradient_blue: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
  gradient_purple: 'linear-gradient(135deg, #9333ea 0%, #db2777 100%)',
  gradient_orange: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
  gradient_dark: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
  solid_green: '#16a34a',
  custom: null,
};

// Inline placeholder to avoid external image request and ERR_CERT_AUTHORITY_INVALID (e.g. Unsplash)
const DEFAULT_PROFILE_PHOTO =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23e5e7eb" width="100" height="100"/><text x="50" y="58" font-size="40" fill="%239ca3af" text-anchor="middle" dominant-baseline="middle">?</text></svg>'
  );

/**
 * Map backend user to profile page shape.
 * @param {object} raw - Backend user (profilePhoto: { url }, avatar: { url }, background: { url }, stats, etc.)
 * @param {string|null} currentUserId - Logged-in user id for isOwnProfile
 */
export function mapUserToProfile(raw, currentUserId) {
  if (!raw) return null;
  // Display as "State, City" (state first, then city). Backend stores location.state, location.city.
  // Note: Existing records stored as "City, City" or in wrong order may need a one-time migration.
  const locationParts = [raw.location?.state, raw.location?.city].filter(Boolean);
  const locationStr = locationParts.length ? locationParts.join(', ') : null;
  const joinedDate = raw.createdAt
    ? new Date(raw.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;
  const coverPhoto =
    raw.background?.url ||
    (raw.backgroundPreset && BACKGROUND_PRESET_COLORS[raw.backgroundPreset]) ||
    'linear-gradient(135deg, #16a34a 0%, #15803d 100%)';
  const profilePhotoUrl =
    raw.profilePhoto?.url || raw.avatar?.url || DEFAULT_PROFILE_PHOTO;
  const stats = raw.stats || {};
  const crops = Array.isArray(raw.crops) ? raw.crops.map((c) => c.charAt(0).toUpperCase() + c.slice(1)) : [];

  return {
    _id: raw._id,
    name: raw.name || 'User',
    email: raw.email || '',
    profilePhoto: profilePhotoUrl,
    coverPhoto: typeof coverPhoto === 'string' && coverPhoto.startsWith('linear-gradient') ? undefined : coverPhoto,
    coverPreset: typeof coverPhoto === 'string' && coverPhoto.startsWith('linear') ? coverPhoto : null,
    headline: raw.bio ? raw.bio.split('\n')[0].slice(0, 80) : '',
    location: locationStr,
    locationObject: raw.location || null,
    bio: raw.bio || '',
    followersCount: stats.followersCount ?? 0,
    followingCount: stats.followingCount ?? 0,
    postsCount: stats.postsCount ?? 0,
    savedCount: stats.savedCount ?? 0,
    verified: raw.verificationStatus === 'verified' || raw.isExpert === true,
    profileViewers: stats.profileViewers ?? 0,
    postImpressions: stats.postImpressions ?? 0,
    education: '',
    experience: '',
    website: '',
    phone: raw.phoneNumber ? `+91 ${raw.phoneNumber}` : '',
    joinedDate,
    crops,
    certifications: raw.expertDetails?.qualifications || [],
    languages: Array.isArray(raw.languages) ? raw.languages.map((l) => l.charAt(0).toUpperCase() + l.slice(1)) : [],
    isOwnProfile: currentUserId ? String(raw._id) === String(currentUserId) : false,
    isFollowing: !!raw.isFollowing,
    isBlockedByMe: !!raw.isBlockedByMe,
    role: raw.role,
    badges: raw.badges || {},
  };
}

export const userService = {
  /** GET current user profile (requires auth) */
  async getMe() {
    const { data } = await request('GET', '/users/me');
    return data.data;
  },

  /** GET user by id (optional auth for isFollowing) */
  async getProfile(userId) {
    const { data } = await request('GET', `/users/${userId}`);
    return data.data;
  },

  /**
   * Fetch profile for profile page. Use 'me' or current user id for own profile.
   * @param {string} userId - 'me', 'current-user', or actual id
   * @param {string|null} currentUserId - logged-in user id
   */
  async fetchProfileForPage(userId, currentUserId) {
    const isOwn = !userId || userId === 'current-user' || userId === 'me' || (currentUserId && String(userId) === String(currentUserId));
    const raw = isOwn
      ? await this.getMe()
      : await this.getProfile(userId);
    return mapUserToProfile(raw, currentUserId);
  },

  /** PATCH update profile (allowed: name, bio, location, farmSize, crops, languages, preferences) */
  async updateProfile(payload) {
    const { data } = await request('PATCH', '/users/me', payload);
    return data.data;
  },

  /** POST profile photo. FormData field must be "profilePhoto" to match backend multer .single('profilePhoto'). */
  async uploadProfilePhoto(file) {
    const form = new FormData();
    form.append('profilePhoto', file);
    const { data } = await request('POST', '/users/profile-photo', form, { body: form });
    return data.data;
  },

  /** POST cover/background: either preset or image. Preset: { preset: 'gradient_teal' }. Image: FormData with 'background' */
  async updateBackground(presetOrFormData) {
    const isForm = presetOrFormData instanceof FormData;
    const { data } = await request('POST', '/users/me/background', isForm ? undefined : presetOrFormData, isForm ? { body: presetOrFormData } : {});
    return data.data;
  },

  async followUser(userId) {
    await request('POST', `/users/${userId}/follow`);
    return { success: true };
  },

  async unfollowUser(userId) {
    await request('DELETE', `/users/${userId}/follow`);
    return { success: true };
  },

  /** POST /users/:userId/block — block a user (requires auth). */
  async blockUser(userId) {
    const { data } = await request('POST', `users/${userId}/block`);
    return data?.data ?? data ?? { success: true };
  },

  /** DELETE /users/:userId/block — unblock a user (requires auth). */
  async unblockUser(userId) {
    await request('DELETE', `users/${userId}/block`);
    return { success: true };
  },

  /** GET /users/blocked — list of users I have blocked (requires auth). */
  async getBlockedUsers(page = 1, limit = 50) {
    const { data } = await request('GET', `users/blocked?page=${page}&limit=${limit}`);
    const list = data?.data ?? data ?? [];
    return Array.isArray(list) ? list : [];
  },

  /** GET /users/:userId/is-blocked — { isBlocked, hasBlockedMe } (requires auth). */
  async getBlockStatus(userId) {
    const { data } = await request('GET', `users/${userId}/is-blocked`);
    return data?.data ?? data ?? { isBlocked: false, hasBlockedMe: false };
  },

  /** GET /users/:userId/followers — paginated list. */
  async getFollowers(userId, page = 1, limit = 30) {
    const res = await request('GET', `users/${userId}/followers?page=${page}&limit=${limit}`);
    const data = res?.data;
    const list = data?.data ?? data ?? [];
    const pagination = data?.pagination ?? data?.meta?.pagination;
    return { data: Array.isArray(list) ? list : [], pagination };
  },

  /** GET /users/:userId/following — paginated list. */
  async getFollowing(userId, page = 1, limit = 30) {
    const res = await request('GET', `users/${userId}/following?page=${page}&limit=${limit}`);
    const data = res?.data;
    const list = data?.data ?? data ?? [];
    const pagination = data?.pagination ?? data?.meta?.pagination;
    return { data: Array.isArray(list) ? list : [], pagination };
  },

  /** PUT /users/me/update-password (requires auth). Body: { currentPassword, newPassword } */
  updatePassword(data) {
    return request('PUT', '/users/me/update-password', data);
  },

  /** PUT /users/me/preferences/language (requires auth). Body: { language: "en"|"hi"|"mr" }. Returns updated user. */
  async updateLanguage(language) {
    const { data } = await request('PUT', '/users/me/preferences/language', { language });
    return data?.data ?? data;
  },

  /** PUT /users/me/preferences/theme (requires auth). Body: { darkMode: boolean }. Returns updated user. */
  async updateTheme(darkMode) {
    const { data } = await request('PUT', '/users/me/preferences/theme', { darkMode });
    return data?.data ?? data;
  },

  /**
   * GET /users/me/saved — only the logged-in user's saved posts (requires auth).
   * Never use for another user's profile; backend returns 401 if not authenticated.
   */
  async getMySavedPosts(page = 1, limit = 20) {
    const { data } = await request('GET', `/users/me/saved?page=${page}&limit=${limit}`);
    return data;
  },
};
