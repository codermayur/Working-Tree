const express = require('express');
const router = express.Router();
const multer = require('multer');
const authenticate = require('../../middlewares/auth.middleware').authenticate;
const { aiLimiter } = require('../../middlewares/rateLimit.middleware');
const { askSchema, chatSchema, validate } = require('./ai.validation');
const aiController = require('./ai.controller');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/ask', authenticate, aiLimiter, validate(askSchema), aiController.ask);
router.post('/ask/stream', authenticate, aiLimiter, validate(askSchema), aiController.askStream);
router.post('/chat', authenticate, aiLimiter, validate(chatSchema), aiController.chat);
router.post('/crop-doctor', authenticate, upload.single('image'), aiController.cropDoctorPredict);

module.exports = router;
