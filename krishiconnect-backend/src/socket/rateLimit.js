/**
 * In-memory rate limit for socket message:send. Per-user, per-window.
 * For horizontal scaling, replace with Redis.
 */
const WINDOW_MS = 60 * 1000;
const MAX_MESSAGES_PER_WINDOW = 60;

const store = new Map();

function check(userId) {
  const now = Date.now();
  let entry = store.get(userId);
  if (!entry) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    store.set(userId, entry);
  }
  if (now >= entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + WINDOW_MS;
  }
  entry.count += 1;
  if (entry.count > MAX_MESSAGES_PER_WINDOW) {
    return false;
  }
  return true;
}

module.exports = { check, messageRateLimit: { check } };
