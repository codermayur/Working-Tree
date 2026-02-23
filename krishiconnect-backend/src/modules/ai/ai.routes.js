const express = require('express');
const router = express.Router();
const authenticate = require('../../middlewares/auth.middleware').authenticate;
const { aiLimiter } = require('../../middlewares/rateLimit.middleware');
const { askSchema, chatSchema, validate } = require('./ai.validation');
const aiController = require('./ai.controller');

router.post('/ask', authenticate, aiLimiter, validate(askSchema), aiController.ask);
router.post('/ask/stream', authenticate, aiLimiter, validate(askSchema), aiController.askStream);
router.post('/chat', authenticate, aiLimiter, validate(chatSchema), aiController.chat);

module.exports = router;
