const express = require('express');
const router = express.Router();
const accountController = require('./account.controller');
const { validate, verifyDeleteOtpSchema } = require('./account.validation');
const { authenticate } = require('../../middlewares/auth.middleware');
const { accountDeletionLimiter } = require('../../middlewares/rateLimit.middleware');

router.use(authenticate);

router.post('/delete/request-otp', accountDeletionLimiter, accountController.requestDeleteOtp);
router.post('/delete/verify-otp', validate(verifyDeleteOtpSchema), accountController.verifyDeleteOtp);

module.exports = router;
