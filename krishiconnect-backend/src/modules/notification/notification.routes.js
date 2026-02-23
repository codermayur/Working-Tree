const express = require('express');
const router = express.Router();
const notificationController = require('./notification.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

router.use(authenticate);

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:notificationId/read', notificationController.markAsRead);

module.exports = router;
