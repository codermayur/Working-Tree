/**
 * Search routes: GET /search?q=...&page=1&limit=10
 * Auth required. Rate limited.
 */
const express = require('express');
const router = express.Router();
const searchController = require('./search.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const rateLimit = require('express-rate-limit');

const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many search requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const id = req.user?._id ?? req.user?.id;
    return id ? String(id) : (req.ip || 'anonymous');
  },
});

router.get('/', authenticate, searchLimiter, searchController.search);

module.exports = router;
