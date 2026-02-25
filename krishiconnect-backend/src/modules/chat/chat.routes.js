const express = require('express');
const router = express.Router();
const chatController = require('./chat.controller');
const { validate, createConversationSchema, startConversationSchema, startExpertConversationSchema } = require('./chat.validation');
const { authenticate } = require('../../middlewares/auth.middleware');
const { uploadSingleChatFile } = require('../../middlewares/upload.middleware');

router.use(authenticate);

router.post('/conversations', validate(createConversationSchema), chatController.createConversation);
router.post('/conversations/start', validate(startConversationSchema), chatController.startConversation);
router.post('/conversations/start-expert', validate(startExpertConversationSchema), chatController.startExpertConversation);
router.get('/conversations', chatController.getConversations);
router.get('/conversations/:conversationId/messages', chatController.getMessages);

router.post('/upload', uploadSingleChatFile('file'), chatController.uploadChatMedia);

module.exports = router;
