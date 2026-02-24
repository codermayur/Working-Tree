/**
 * Notification service: DB writes + abstraction for future queue (Redis).
 * Create never throws: fails silently so main request (like/comment/follow) is not blocked.
 */
const mongoose = require('mongoose');
const Notification = require('./notification.model');
const NotificationSettings = require('./notification-settings.model');
const userService = require('../user/user.service');
const logger = require('../../config/logger');

const DEFAULT_SETTINGS = {
  social: { likes: true, comments: true, connections: true, messages: true },
  alerts: { market: true, weather: true, pestDisease: true, jobs: true },
  delivery: { push: false, emailDigest: true },
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const DEDUP_WINDOW_MS = 10 * 1000;

/**
 * Create a notification. Prevents self-notifications; never throws.
 * Use this from controllers/workers so main action is not blocked.
 * @param {Object} data - { recipient, sender?, type, entityId?, entityType?, message?, metadata? }
 * @returns {Promise<{ notification: object, unreadCount: number } | null>}
 */
async function create(data) {
  try {
    const recipient = data.recipient && mongoose.Types.ObjectId.isValid(data.recipient)
      ? new mongoose.Types.ObjectId(data.recipient)
      : null;
    const sender = data.sender && mongoose.Types.ObjectId.isValid(data.sender)
      ? new mongoose.Types.ObjectId(data.sender)
      : null;

    if (!recipient) return null;
    if (sender && recipient.equals(sender)) return null;

    const type = data.type || 'system';
    const entityId = data.entityId && mongoose.Types.ObjectId.isValid(data.entityId)
      ? new mongoose.Types.ObjectId(data.entityId)
      : null;
    const entityType = data.entityType || 'post';
    const message = typeof data.message === 'string' ? data.message : '';
    const metadata = data.metadata && typeof data.metadata === 'object' ? data.metadata : {};

    const recent = await Notification.findOne({
      recipient,
      type,
      ...(entityId && { entityId }),
      ...(sender && { sender: sender }),
      createdAt: { $gte: new Date(Date.now() - DEDUP_WINDOW_MS) },
      deletedAt: null,
    }).lean();

    if (recent) return null;

    const expiresAt = type === 'system' && metadata.ttlDays
      ? new Date(Date.now() + (metadata.ttlDays * 24 * 60 * 60 * 1000))
      : null;

    const doc = await Notification.create({
      recipient,
      sender: sender || undefined,
      type,
      entityId: entityId || undefined,
      entityType,
      message,
      metadata,
      expiresAt,
    });

    const unreadCount = await Notification.countDocuments({
      recipient,
      isRead: false,
      deletedAt: null,
    });

    const populated = await Notification.findById(doc._id)
      .populate('sender', 'name avatar profilePhoto')
      .lean();

    return {
      notification: populated,
      unreadCount,
    };
  } catch (err) {
    logger.warn('[notification.service] create failed', { err: err.message, data: { type: data?.type } });
    return null;
  }
}

/**
 * Get notifications for a user (cursor-based). Only recipient can access.
 */
async function getByUser(userId, options = {}) {
  const limit = Math.min(Math.max(1, options.limit || DEFAULT_LIMIT), MAX_LIMIT);
  const cursor = options.cursor;
  const unreadOnly = options.unreadOnly === true || options.unreadOnly === 'true';

  const query = { recipient: userId, deletedAt: null };
  if (unreadOnly) query.isRead = false;

  const blockedIds = await userService.getBlockedIds(userId);
  if (blockedIds.length) query.sender = { $nin: blockedIds };

  if (cursor) {
    const cursorDate = new Date(cursor);
    if (!Number.isNaN(cursorDate.getTime())) {
      query.createdAt = { $lt: cursorDate };
    }
  }

  const list = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .populate('sender', 'name avatar profilePhoto')
    .lean();
  const hasMore = list.length > limit;
  const data = hasMore ? list.slice(0, limit) : list;
  const nextCursor = hasMore && data.length
    ? data[data.length - 1].createdAt
    : null;

  return {
    data,
    pagination: {
      limit,
      nextCursor: nextCursor ? nextCursor.toISOString() : null,
      hasMore: !!hasMore,
    },
  };
}

async function markAsRead(notificationId, userId) {
  const doc = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId, deletedAt: null },
    { isRead: true },
    { new: true }
  )
    .populate('sender', 'name avatar profilePhoto')
    .lean();
  return doc;
}

async function markAllAsRead(userId) {
  await Notification.updateMany(
    { recipient: userId, isRead: false, deletedAt: null },
    { isRead: true }
  );
  return { success: true };
}

async function remove(notificationId, userId) {
  const doc = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId, deletedAt: null },
    { deletedAt: new Date() },
    { new: true }
  ).lean();
  return doc;
}

async function getUnreadCount(userId) {
  const blockedIds = await userService.getBlockedIds(userId);
  const query = { recipient: userId, isRead: false, deletedAt: null };
  if (blockedIds.length) query.sender = { $nin: blockedIds };
  return Notification.countDocuments(query);
}

async function getSettings(userId) {
  const doc = await NotificationSettings.findOne({ user: userId }).lean();
  if (!doc) return DEFAULT_SETTINGS;
  return {
    social: { ...DEFAULT_SETTINGS.social, ...doc.social },
    alerts: { ...DEFAULT_SETTINGS.alerts, ...doc.alerts },
    delivery: { ...DEFAULT_SETTINGS.delivery, ...doc.delivery },
  };
}

async function updateSettings(userId, body) {
  const social = body.social && typeof body.social === 'object' ? body.social : undefined;
  const alerts = body.alerts && typeof body.alerts === 'object' ? body.alerts : undefined;
  const delivery = body.delivery && typeof body.delivery === 'object' ? body.delivery : undefined;
  const doc = await NotificationSettings.findOneAndUpdate(
    { user: userId },
    {
      ...(social && { social }),
      ...(alerts && { alerts }),
      ...(delivery && { delivery }),
    },
    { new: true, upsert: true, runValidators: true }
  ).lean();
  return {
    social: { ...DEFAULT_SETTINGS.social, ...doc.social },
    alerts: { ...DEFAULT_SETTINGS.alerts, ...doc.alerts },
    delivery: { ...DEFAULT_SETTINGS.delivery, ...doc.delivery },
  };
}

module.exports = {
  create,
  getByUser,
  markAsRead,
  markAllAsRead,
  remove,
  getUnreadCount,
  getSettings,
  updateSettings,
};
