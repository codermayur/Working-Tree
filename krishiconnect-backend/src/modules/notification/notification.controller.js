const notificationService = require('./notification.service');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const getNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getByUser(req.user._id, req.query);
  res.status(200).json(
    new ApiResponse(200, result.data, 'Notifications fetched successfully', {
      pagination: result.pagination,
    })
  );
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(
    req.params.notificationId,
    req.user._id
  );
  res.status(200).json(new ApiResponse(200, notification, 'Marked as read'));
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user._id);
  res.status(200).json(new ApiResponse(200, { success: true }, 'All marked as read'));
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user._id);
  res.status(200).json(new ApiResponse(200, { count }, 'Unread count fetched'));
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};
