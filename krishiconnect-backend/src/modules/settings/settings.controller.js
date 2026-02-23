const User = require('../user/user.model');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const getPrivacy = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('twoFactorEnabled')
    .lean();
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  const data = {
    twoFactorEnabled: Boolean(user.twoFactorEnabled),
    activityStatusEnabled: true,
  };
  res.status(200).json(new ApiResponse(200, data, 'Privacy settings'));
});

const updatePrivacy = asyncHandler(async (req, res) => {
  const { twoFactorEnabled, activityStatusEnabled } = req.body || {};
  const update = {};
  if (typeof twoFactorEnabled === 'boolean') {
    update.twoFactorEnabled = twoFactorEnabled;
  }
  if (Object.keys(update).length === 0) {
    const user = await User.findById(req.user._id).select('twoFactorEnabled').lean();
    const data = {
      twoFactorEnabled: Boolean(user?.twoFactorEnabled),
      activityStatusEnabled: true,
    };
    return res.status(200).json(new ApiResponse(200, data, 'Privacy settings'));
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    update,
    { new: true, runValidators: false }
  ).select('twoFactorEnabled');
  const data = {
    twoFactorEnabled: Boolean(user.twoFactorEnabled),
    activityStatusEnabled: true,
  };
  res.status(200).json(new ApiResponse(200, data, 'Privacy settings updated'));
});

module.exports = {
  getPrivacy,
  updatePrivacy,
};
