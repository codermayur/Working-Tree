const express = require('express');
const router = express.Router();
const translateController = require('./translate.controller');

// Public endpoint for on-demand translation (e.g. post content). No auth required.
router.post('/', translateController.translate);

module.exports = router;
