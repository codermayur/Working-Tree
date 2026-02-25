const accountService = require('./account.service');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const requestDeleteOtp = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const result = await accountService.requestDeleteOtp(userId);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

const verifyDeleteOtp = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { otp } = req.body;
  const result = await accountService.verifyDeleteOtp(userId, otp);

  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.substring(7)
    : null;
  await accountService.blacklistAccessToken(token);

  res.status(200).json(new ApiResponse(200, result, result.message));
});

module.exports = {
  requestDeleteOtp,
  verifyDeleteOtp,
};
