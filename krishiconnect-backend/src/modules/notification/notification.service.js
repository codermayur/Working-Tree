const Notification = require('./notification.model');
const userService = require('../user/user.service');
const Pagination = require('../../utils/pagination');

const notificationPagination = new Pagination(Notification);

const create = async (data) => {
  return Notification.create(data);
};

const getByUser = async (userId, options = {}) => {
  const { page = 1, limit = 50, read } = options;
  const query = { recipient: userId };
  if (read !== undefined) query.isRead = read === 'true';

  const blockedIds = await userService.getBlockedIds(userId);
  if (blockedIds.length) query.actor = { $nin: blockedIds };

  return notificationPagination.paginate(query, {
    page,
    limit,
    sort: { createdAt: -1 },
    populate: [{ path: 'actor', select: 'name avatar' }],
  });
};

const markAsRead = async (notificationId, userId) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
};

const markAllAsRead = async (userId) => {
  await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  return { success: true };
};

const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ recipient: userId, isRead: false });
};

module.exports = {
  create,
  getByUser,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};
