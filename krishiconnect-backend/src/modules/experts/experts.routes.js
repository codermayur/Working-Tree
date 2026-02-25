const express = require('express');
const router = express.Router();
const expertsController = require('./experts.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

/** GET / — random experts. Authenticated so we can show online status later. */
router.get('/', authenticate, expertsController.getExperts);

module.exports = router;
