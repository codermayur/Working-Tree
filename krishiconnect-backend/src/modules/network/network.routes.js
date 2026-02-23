const express = require('express');
const router = express.Router();
const networkController = require('./network.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

router.use(authenticate);

router.get('/recommendations', networkController.getRecommendations);

module.exports = router;
