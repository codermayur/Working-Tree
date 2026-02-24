/**
 * Notification API: list, unread count, mark read, delete.
 * Uses shared api instance (Bearer token + 401 handling).
 */
import { request } from './api';

const BASE = '/notifications';

export async function getNotifications(params = {}) {
  const { cursor, limit = 20, unreadOnly } = params;
  const search = new URLSearchParams();
  if (cursor) search.set('cursor', cursor);
  if (limit != null) search.set('limit', String(limit));
  if (unreadOnly === true) search.set('unreadOnly', 'true');
  const path = search.toString() ? `${BASE}?${search.toString()}` : BASE;
  const { data } = await request('GET', path);
  return {
    list: data?.data ?? [],
    pagination: data?.meta?.pagination ?? data?.pagination ?? { nextCursor: null, hasMore: false, limit: 20 },
  };
}

export async function getUnreadCount() {
  const { data } = await request('GET', `${BASE}/unread-count`);
  return data?.data?.count ?? 0;
}

export async function markAsRead(notificationId) {
  const { data } = await request('PATCH', `${BASE}/${notificationId}/read`);
  return data?.data ?? null;
}

export async function markAllAsRead() {
  await request('PATCH', `${BASE}/read-all`);
}

export async function deleteNotification(notificationId) {
  await request('DELETE', `${BASE}/${notificationId}`);
}

const DEFAULT_SETTINGS = {
  social: { likes: true, comments: true, connections: true, messages: true },
  alerts: { market: true, weather: true, pestDisease: true, jobs: true },
  delivery: { push: false, emailDigest: true },
};

export async function getSettings() {
  const { data } = await request('GET', `${BASE}/settings`);
  const raw = data?.data;
  if (!raw) return DEFAULT_SETTINGS;
  return {
    social: { ...DEFAULT_SETTINGS.social, ...raw.social },
    alerts: { ...DEFAULT_SETTINGS.alerts, ...raw.alerts },
    delivery: { ...DEFAULT_SETTINGS.delivery, ...raw.delivery },
  };
}

export async function updateSettings(settings) {
  const { data } = await request('PUT', `${BASE}/settings`, settings);
  return data?.data || data;
}

export async function sendTestNotification() {
  const { data } = await request('POST', `${BASE}/test`);
  return data?.data ?? data;
}
