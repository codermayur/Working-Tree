const express = require('express');
const router = express.Router();
const weatherController = require('./weather.controller');

router.get('/current', weatherController.getCurrentWeather);

module.exports = router;
