const notificationService = require('./notification.service');
const notificationSocket = require('./notification.socket');
const { getIO } = require('../../socket');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const asyncHandler = require('../../utils/asyncHandler');

const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { cursor, limit, unreadOnly } = req.query;
  const result = await notificationService.getByUser(userId, {
    cursor,
    limit,
    unreadOnly,
  });
  res.status(200).json(
    new ApiResponse(200, result.data, 'Notifications fetched successfully', {
      pagination: result.pagination,
    })
  );
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(
    req.params.id,
    req.user._id
  );
  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }
  const count = await notificationService.getUnreadCount(req.user._id);
  try {
    const io = getIO();
    notificationSocket.emitUnreadCount(io, req.user._id, count);
  } catch (_) {}
  res.status(200).json(new ApiResponse(200, notification, 'Marked as read'));
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user._id);
  try {
    const io = getIO();
    notificationSocket.emitUnreadCount(io, req.user._id, 0);
  } catch (_) {}
  res.status(200).json(new ApiResponse(200, { success: true }, 'All marked as read'));
});

const deleteNotification = asyncHandler(async (req, res) => {
  const doc = await notificationService.remove(req.params.id, req.user._id);
  if (!doc) {
    throw new ApiError(404, 'Notification not found');
  }
  res.status(200).json(new ApiResponse(200, { success: true }, 'Notification removed'));
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user._id);
  res.status(200).json(new ApiResponse(200, { count }, 'Unread count fetched'));
});

const getSettings = asyncHandler(async (req, res) => {
  const settings = await notificationService.getSettings(req.user._id);
  res.status(200).json(new ApiResponse(200, settings, 'Settings fetched'));
});

const updateSettings = asyncHandler(async (req, res) => {
  const settings = await notificationService.updateSettings(req.user._id, req.body);
  res.status(200).json(new ApiResponse(200, settings, 'Settings updated'));
});

const sendTestNotification = asyncHandler(async (req, res) => {
  const result = await notificationService.create({
    recipient: req.user._id,
    type: 'system',
    entityType: 'user',
    message: 'This is a test notification from your alert settings.',
    metadata: { test: true },
  });
  if (result) {
    try {
      const io = getIO();
      notificationSocket.emitNewNotification(
        io,
        result.notification.recipient,
        result.notification,
        result.unreadCount
      );
    } catch (_) {}
  }
  res.status(200).json(new ApiResponse(200, { sent: !!result }, 'Test notification sent'));
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  getSettings,
  updateSettings,
  sendTestNotification,
};
