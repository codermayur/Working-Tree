const express = require('express');
const router = express.Router();
const notificationController = require('./notification.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { notificationListLimiter } = require('../../middlewares/rateLimit.middleware');
const {
  listSchema,
  idParamSchema,
  settingsSchema,
  validateQuery,
  validateParams,
  validateBody,
} = require('./notification.validation');

router.use(authenticate);

router.get(
  '/',
  notificationListLimiter,
  validateQuery(listSchema),
  notificationController.getNotifications
);
router.get('/unread-count', notificationController.getUnreadCount);
router.get('/settings', notificationController.getSettings);
router.put('/settings', validateBody(settingsSchema), notificationController.updateSettings);
router.post('/test', notificationController.sendTestNotification);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', validateParams(idParamSchema), notificationController.markAsRead);
router.delete('/:id', validateParams(idParamSchema), notificationController.deleteNotification);

module.exports = router;
