/**
 * APITube News API routes.
 * Protected by rate limiter; optional auth (can use optionalAuth if needed).
 */

const express = require('express');
const router = express.Router();
const apitubeController = require('./apitube.controller');
const { querySchema, validate } = require('./apitube.validation');
const rateLimit = require('express-rate-limit');

const isTesting = process.env.NODE_ENV === 'development';

const apitubeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTesting ? 1000 : 60,
  message: { success: false, message: 'Too many news API requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const id = req.user?._id ?? req.user?.id;
    return id ? String(id) : (req.ip || 'anonymous');
  },
});

router.get('/news', apitubeLimiter, validate(querySchema), apitubeController.getNews);
router.get('/health', apitubeLimiter, apitubeController.health);

module.exports = router;
