/**
 * Privacy & Security API service.
 * Uses shared request() from api.js. Falls back to mock when backend is unavailable.
 */
import { request } from './api';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_PRIVACY === 'true';

// ---------------------------------------------------------------------------
// Mock data (fallback when backend not available)
// ---------------------------------------------------------------------------
const MOCK_PRIVACY = {
  twoFactorEnabled: false,
  activityStatusEnabled: true,
};

const MOCK_BLOCKED = [
  { id: 'b1', name: 'Unknown Spammer', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop', blockedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'b2', name: 'Fake Account 02', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop', blockedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
];

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/** Normalize backend user to BlockedUser shape (id, name, avatar, blockedAt) */
function normalizeBlockedUser(raw) {
  if (!raw) return null;
  const id = raw.id ?? raw._id ?? '';
  const name = raw.name ?? 'Unknown';
  const avatar = raw.avatar ?? raw.profilePhoto?.url ?? raw.profilePhoto ?? '';
  const blockedAt = raw.blockedAt ?? raw.blockedSince ?? raw.createdAt ?? '';
  return { id, name, avatar, blockedAt };
}

/** Normalize backend privacy response to { twoFactorEnabled, activityStatusEnabled } */
function normalizePrivacySettings(raw) {
  if (!raw) return null;
  return {
    twoFactorEnabled: Boolean(raw.twoFactorEnabled ?? raw.twoFactor ?? false),
    activityStatusEnabled: Boolean(raw.activityStatusEnabled ?? raw.activityStatus ?? true),
  };
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/**
 * GET /api/settings/privacy (or /settings/privacy relative to baseURL)
 * @returns {Promise<{ twoFactorEnabled: boolean, activityStatusEnabled: boolean }>}
 */
export async function fetchPrivacySettings() {
  if (USE_MOCK) {
    await delay(600);
    return { ...MOCK_PRIVACY };
  }
  try {
    const { data } = await request('GET', 'settings/privacy');
    const raw = data?.data ?? data;
    return normalizePrivacySettings(raw) ?? { ...MOCK_PRIVACY };
  } catch (err) {
    if (err?.response?.status === 404 || err?.code === 'ERR_NETWORK') {
      await delay(400);
      return { ...MOCK_PRIVACY };
    }
    throw err;
  }
}

/**
 * PATCH /api/settings/privacy
 * @param {{ twoFactorEnabled?: boolean, activityStatusEnabled?: boolean }} payload
 * @returns {Promise<{ twoFactorEnabled: boolean, activityStatusEnabled: boolean }>}
 */
export async function updatePrivacySettings(payload) {
  if (USE_MOCK) {
    await delay(400);
    return { ...MOCK_PRIVACY, ...payload };
  }
  const { data } = await request('PATCH', 'settings/privacy', payload);
  const raw = data?.data ?? data;
  return normalizePrivacySettings(raw) ?? { ...MOCK_PRIVACY, ...payload };
}

/**
 * GET /users/blocked — list of users you have blocked (always uses real API).
 * @returns {Promise<Array<{ id: string, name: string, avatar: string, blockedAt: string }>>}
 */
export async function fetchBlockedUsers() {
  try {
    const { data } = await request('GET', 'users/blocked');
    const list = data?.data ?? data ?? [];
    const arr = Array.isArray(list) ? list : [];
    return arr.map(normalizeBlockedUser).filter(Boolean);
  } catch (err) {
    if (err?.response?.status === 404 || err?.code === 'ERR_NETWORK') {
      return [];
    }
    throw err;
  }
}

/**
 * DELETE /users/:userId/block — unblock a user (always uses real API).
 * @param {string} userId — must be string (id of the blocked user)
 * @returns {Promise<void>}
 */
export async function unblockUser(userId) {
  const id = userId != null ? String(userId) : '';
  if (!id) return;
  await request('DELETE', `users/${id}/block`);
}

export const privacySecurityApi = {
  fetchPrivacySettings,
  updatePrivacySettings,
  fetchBlockedUsers,
  unblockUser,
};
