const express = require('express');
const router = express.Router();
const qaController = require('./qa.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

router.post('/questions', authenticate, qaController.createQuestion);
router.get('/questions', qaController.getQuestions);
router.get('/questions/:questionId', qaController.getQuestionById);
router.post('/questions/:questionId/answers', authenticate, qaController.addAnswer);
router.get('/questions/:questionId/answers', qaController.getAnswers);

module.exports = router;
