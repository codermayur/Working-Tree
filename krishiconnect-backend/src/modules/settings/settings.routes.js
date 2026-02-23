const express = require('express');
const router = express.Router();
const settingsController = require('./settings.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

router.get('/privacy', authenticate, settingsController.getPrivacy);
router.patch('/privacy', authenticate, settingsController.updatePrivacy);

module.exports = router;
