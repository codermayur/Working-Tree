// 
const rateLimit = require('express-rate-limit');

const isTesting = process.env.NODE_ENV === 'development';

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTesting ? 10000 : 100,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTesting ? 1000 : 5,
  message: { success: false, message: 'Too many authentication attempts' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isTesting ? 1000 : 5,
  message: { success: false, message: 'Too many registration attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isTesting ? 1000 : 3,
  message: { success: false, message: 'Too many password reset requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isTesting ? 500 : 10,
  message: { success: false, message: 'Upload limit exceeded' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Per-user AI limit (use after authenticate so req.user is set). Prevents one user from burning global limit.
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTesting ? 1000 : 30,
  message: { success: false, message: 'Too many AI requests. Please try again in a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const id = req.user?._id ?? req.user?.id;
    return id ? String(id) : (req.ip || 'anonymous');
  },
});

// Notification list: rate-limit fetch to avoid abuse.
const notificationListLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTesting ? 1000 : 60,
  message: { success: false, message: 'Too many notification requests.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const id = req.user?._id ?? req.user?.id;
    return id ? String(id) : (req.ip || 'anonymous');
  },
});

// Account deletion OTP: limit requests per user to prevent abuse.
const accountDeletionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isTesting ? 100 : 3,
  message: { success: false, message: 'Too many account deletion requests. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const id = req.user?._id ?? req.user?.id;
    return id ? String(id) : (req.ip || 'anonymous');
  },
});

module.exports = {
  generalLimiter,
  authLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  uploadLimiter,
  aiLimiter,
  notificationListLimiter,
  accountDeletionLimiter,
};
