const express = require('express');
const router = express.Router();
const newsController = require('./news.controller');

router.get('/agriculture', newsController.getAgricultureNews);

module.exports = router;
