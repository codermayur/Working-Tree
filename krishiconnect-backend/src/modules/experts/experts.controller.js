const asyncHandler = require('../../utils/asyncHandler');
const User = require('../user/user.model');
const ApiResponse = require('../../utils/ApiResponse');

const DEFAULT_SIZE = 6;
const MAX_SIZE = 12;

/** GET /experts — return random experts (role: expert). Auth optional for CropDoctor. */
const getExperts = asyncHandler(async (req, res) => {
  const size = Math.min(MAX_SIZE, Math.max(1, parseInt(req.query.size, 10) || DEFAULT_SIZE));
  const experts = await User.aggregate([
    { $match: { role: 'expert', isActive: { $ne: false } } },
    { $sample: { size } },
    {
      $project: {
        name: 1,
        avatar: 1,
        profilePhoto: 1,
        'expertDetails.specialization': 1,
        'expertDetails.experience': 1,
        'expertDetails.isVerifiedExpert': 1,
        role: 1,
      },
    },
  ]);
  res.status(200).json(new ApiResponse(200, experts, 'Experts fetched'));
});

module.exports = { getExperts };
