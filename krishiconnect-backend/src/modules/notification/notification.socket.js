/**
 * Real-time notification emissions. Use after DB write.
 * Room naming: user:${userId} for horizontal scaling (Redis adapter can broadcast to same room across instances).
 */
const logger = require('../../config/logger');

/**
 * Emit new notification and updated unread count to recipient.
 * Call this only after notification is persisted (do not emit without DB write).
 * @param {object} io - Socket.IO server instance
 * @param {string|ObjectId} recipientId - recipient user id
 * @param {object} notification - saved notification document (plain or lean)
 * @param {number} unreadCount - current unread count for recipient
 */
function emitNewNotification(io, recipientId, notification, unreadCount) {
  if (!io || !recipientId) return;
  try {
    const room = `user:${recipientId.toString()}`;
    io.to(room).emit('notification:new', notification);
    io.to(room).emit('notification:count', { count: unreadCount });
  } catch (err) {
    logger.warn('[notification.socket] emit failed', { err: err.message });
  }
}

/**
 * Emit only unread count update (e.g. after mark-as-read).
 */
function emitUnreadCount(io, recipientId, unreadCount) {
  if (!io || !recipientId) return;
  try {
    const room = `user:${recipientId.toString()}`;
    io.to(room).emit('notification:count', { count: unreadCount });
  } catch (err) {
    logger.warn('[notification.socket] emit count failed', { err: err.message });
  }
}

module.exports = {
  emitNewNotification,
  emitUnreadCount,
};
