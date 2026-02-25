const User = require('./user.model');
const Follow = require('./follow.model');
const Block = require('./block.model');
const ApiError = require('../../utils/ApiError');
const Pagination = require('../../utils/pagination');
const { deleteFromCloudinary } = require('../../utils/uploadToCloudinary');

const userPagination = new Pagination(User);
const followPagination = new Pagination(Follow);

/** Get array of user IDs that blockerId has blocked (for filtering queries). */
const getBlockedIds = async (blockerId) => {
  const docs = await Block.find({ blocker: blockerId }).select('blocked').lean();
  return docs.map((d) => d.blocked);
};

/** IDs to exclude from viewer's content: users they blocked + users who blocked them. */
const getBlockExcludeIds = async (viewerId) => {
  if (!viewerId) return [];
  const [blockedByViewer, blockViewerDocs] = await Promise.all([
    getBlockedIds(viewerId),
    Block.find({ blocked: viewerId }).select('blocker').lean(),
  ]);
  const blockViewerIds = blockViewerDocs.map((d) => d.blocker);
  const set = new Set([
    ...blockedByViewer.map((id) => id.toString()),
    ...blockViewerIds.map((id) => id.toString()),
  ]);
  return [...set];
};

/** Get block relationship between viewer and profile user. */
const getBlockRelationship = async (viewerId, profileUserId) => {
  if (!viewerId || !profileUserId || viewerId.toString() === profileUserId.toString()) {
    return { iBlockThem: false, theyBlockMe: false };
  }
  const [iBlockThem, theyBlockMe] = await Promise.all([
    Block.findOne({ blocker: viewerId, blocked: profileUserId }).lean(),
    Block.findOne({ blocker: profileUserId, blocked: viewerId }).lean(),
  ]);
  return { iBlockThem: !!iBlockThem, theyBlockMe: !!theyBlockMe };
};

/** Check if blocker has blocked blockedId. */
const isBlocked = async (blockerId, blockedId) => {
  const doc = await Block.findOne({ blocker: blockerId, blocked: blockedId }).lean();
  return !!doc;
};

const getProfile = async (userId, viewerId = null) => {
  const user = await User.findById(userId)
    .select('-password -refreshTokens -fcmTokens')
    .lean();

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (viewerId && viewerId.toString() !== userId.toString()) {
    const blockRel = await getBlockRelationship(viewerId, userId);
    if (blockRel.theyBlockMe) {
      throw new ApiError(404, 'User not found');
    }
    if (blockRel.iBlockThem) {
      user.isBlockedByMe = true;
      user.isFollowing = false;
      return user;
    }
    await User.findByIdAndUpdate(userId, { $inc: { 'stats.profileViewers': 1 } });
    const follow = await Follow.findOne({
      follower: viewerId,
      following: userId,
    });
    user.isFollowing = !!follow;
  }

  return user;
};

/**
 * Update password: verify current with bcrypt, hash and save new one, clear all refresh tokens.
 */
const updatePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  if (!user.password) {
    throw new ApiError(400, 'Current password is incorrect');
  }
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new ApiError(400, 'Current password is incorrect');
  }
  user.password = newPassword;
  user.lastPasswordChangeAt = new Date();
  await user.save();

  await User.findByIdAndUpdate(userId, { $set: { refreshTokens: [] } });
  return { success: true };
};

const updateProfile = async (userId, updateData) => {
  // RBAC: role is never writable via profile update. Only admin-only endpoint may change role.
  const allowedFields = [
    'name',
    'email',
    'bio',
    'location',
    'farmSize',
    'crops',
    'languages',
    'preferences',
  ];

  const filteredData = {};
  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      filteredData[field] = updateData[field];
    }
  });

  delete filteredData.role; // RBAC: never persist role from profile update

  if (Object.keys(filteredData).length > 0) {
    filteredData.lastProfileUpdate = new Date();
  }

  const user = await User.findByIdAndUpdate(userId, filteredData, {
    new: true,
    runValidators: true,
  })
    .select('-password -refreshTokens -fcmTokens')
    .lean();

  return user;
};

const updateLanguagePreference = async (userId, language) => {
  const allowed = ['en', 'hi', 'mr'];
  if (!allowed.includes(language)) {
    throw new ApiError(400, `Language must be one of: ${allowed.join(', ')}`);
  }
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { 'preferences.language': language } },
    { new: true, runValidators: true }
  ).select('-password -refreshTokens -fcmTokens');
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};

const updateThemePreference = async (userId, darkMode) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { 'preferences.darkMode': !!darkMode } },
    { new: true, runValidators: true }
  ).select('-password -refreshTokens -fcmTokens');
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};

const updateAvatar = async (userId, avatarData) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (user.avatar?.publicId) {
    await deleteFromCloudinary(user.avatar.publicId);
  }

  user.avatar = avatarData;
  user.lastProfileUpdate = new Date();
  user.computeProfileCompleteness();
  await user.save();

  return user;
};

const removeAvatar = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  if (user.avatar?.publicId) {
    await deleteFromCloudinary(user.avatar.publicId);
  }
  user.avatar = undefined;
  user.lastProfileUpdate = new Date();
  user.computeProfileCompleteness();
  await user.save();
  return user;
};

const updateProfilePhoto = async (userId, photoData) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  if (user.profilePhoto?.publicId) {
    await deleteFromCloudinary(user.profilePhoto.publicId);
  }
  user.profilePhoto = { url: photoData.url, publicId: photoData.publicId };
  user.lastProfileUpdate = new Date();
  user.computeProfileCompleteness();
  await user.save();
  return user;
};

const updateBio = async (userId, bio) => {
  if (typeof bio !== 'string') {
    throw new ApiError(400, 'Bio is required');
  }
  if (bio.length > 500) {
    throw new ApiError(400, 'Bio cannot exceed 500 characters');
  }
  const user = await User.findByIdAndUpdate(
    userId,
    { bio: bio.trim() || null, lastProfileUpdate: new Date() },
    { new: true, runValidators: true }
  ).select('-password -refreshTokens -fcmTokens');
  if (!user) throw new ApiError(404, 'User not found');
  user.computeProfileCompleteness();
  await user.save();
  return user;
};

const clearBio = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { bio: null, lastProfileUpdate: new Date() },
    { new: true }
  ).select('-password -refreshTokens -fcmTokens');
  if (!user) throw new ApiError(404, 'User not found');
  user.computeProfileCompleteness();
  await user.save();
  return user;
};

const BACKGROUND_PRESETS = [
  { id: 'default', name: 'Default Green', color: '#16a34a', type: 'solid' },
  { id: 'gradient_teal', name: 'Teal Gradient', colors: ['#16a34a', '#6ee7b7'], type: 'gradient' },
  { id: 'gradient_blue', name: 'Blue Gradient', colors: ['#0ea5e9', '#06b6d4'], type: 'gradient' },
  { id: 'gradient_purple', name: 'Purple Gradient', colors: ['#9333ea', '#db2777'], type: 'gradient' },
  { id: 'gradient_orange', name: 'Orange Gradient', colors: ['#ea580c', '#f97316'], type: 'gradient' },
  { id: 'gradient_dark', name: 'Dark Gradient', colors: ['#1f2937', '#374151'], type: 'gradient' },
  { id: 'solid_green', name: 'Solid Green', color: '#16a34a', type: 'solid' },
  { id: 'custom', name: 'Custom', type: 'custom' },
];

const getBackgroundPresets = () => ({
  success: true,
  presets: BACKGROUND_PRESETS,
});

const updateBackground = async (userId, options = {}) => {
  const { preset, backgroundData } = options;
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  if (backgroundData) {
    if (user.background?.publicId) {
      await deleteFromCloudinary(user.background.publicId);
    }
    user.background = backgroundData;
    user.backgroundPreset = 'custom';
  } else if (preset) {
    const validPreset = BACKGROUND_PRESETS.some((p) => p.id === preset);
    if (!validPreset) {
      throw new ApiError(400, 'Invalid preset name');
    }
    if (user.background?.publicId) {
      await deleteFromCloudinary(user.background.publicId);
    }
    user.background = undefined;
    user.backgroundPreset = preset;
  } else {
    throw new ApiError(400, 'Either preset or file is required');
  }

  user.lastProfileUpdate = new Date();
  user.computeProfileCompleteness();
  await user.save();
  return user;
};

const searchUsers = async (query, options = {}) => {
  const { q, filter = 'all', page = 1, limit = 20 } = query;
  const { viewerId } = options;

  let searchQuery = { isActive: true, isBanned: false };

  if (viewerId) {
    const blockedByViewer = await getBlockedIds(viewerId);
    const blockViewer = await Block.find({ blocked: viewerId }).select('blocker').lean();
    const blockViewerIds = blockViewer.map((d) => d.blocker);
    const exclude = [...blockedByViewer, ...blockViewerIds, viewerId];
    searchQuery._id = { $nin: exclude };
  }

  if (q) {
    searchQuery.$or = [
      { name: { $regex: q, $options: 'i' } },
      { phoneNumber: { $regex: q, $options: 'i' } },
    ];
  }

  if (filter === 'experts') {
    searchQuery.isExpert = true;
  }

  return userPagination.paginate(searchQuery, {
    page,
    limit,
    sort: { createdAt: -1 },
    select: '-password -refreshTokens -fcmTokens',
  });
};

const getBlockedUsers = async (blockerId, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const BlockPagination = new Pagination(Block);
  return BlockPagination.paginate(
    { blocker: blockerId },
    {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: [{ path: 'blocked', select: 'name username avatar profilePhoto createdAt' }],
    }
  );
};

const blockUser = async (blockerId, blockedId) => {
  if (blockerId.toString() === blockedId.toString()) {
    throw new ApiError(400, 'Cannot block yourself');
  }
  const targetUser = await User.findById(blockedId);
  if (!targetUser) {
    throw new ApiError(404, 'User not found');
  }
  const existing = await Block.findOne({ blocker: blockerId, blocked: blockedId });
  if (existing) {
    return { success: true, alreadyBlocked: true };
  }
  await Block.create({ blocker: blockerId, blocked: blockedId });
  const [followAB, followBA] = await Promise.all([
    Follow.findOne({ follower: blockerId, following: blockedId }),
    Follow.findOne({ follower: blockedId, following: blockerId }),
  ]);
  if (followAB) {
    await Follow.findOneAndDelete({ follower: blockerId, following: blockedId });
    await User.findByIdAndUpdate(blockerId, { $inc: { 'stats.followingCount': -1 } });
    await User.findByIdAndUpdate(blockedId, { $inc: { 'stats.followersCount': -1 } });
  }
  if (followBA) {
    await Follow.findOneAndDelete({ follower: blockedId, following: blockerId });
    await User.findByIdAndUpdate(blockedId, { $inc: { 'stats.followingCount': -1 } });
    await User.findByIdAndUpdate(blockerId, { $inc: { 'stats.followersCount': -1 } });
  }
  return { success: true };
};

const unblockUser = async (blockerId, blockedId) => {
  await Block.findOneAndDelete({ blocker: blockerId, blocked: blockedId });
  return { success: true };
};

const followUser = async (followerId, followingId) => {
  if (followerId.toString() === followingId.toString()) {
    throw new ApiError(400, 'Cannot follow yourself');
  }

  const targetUser = await User.findById(followingId);
  if (!targetUser) {
    throw new ApiError(404, 'User not found');
  }

  const blocked = await isBlocked(followerId, followingId) || await isBlocked(followingId, followerId);
  if (blocked) {
    throw new ApiError(403, 'Cannot follow this user');
  }

  const existingFollow = await Follow.findOne({
    follower: followerId,
    following: followingId,
  });

  if (existingFollow) {
    throw new ApiError(400, 'Already following this user');
  }

  await Follow.create({ follower: followerId, following: followingId });

  await User.findByIdAndUpdate(followerId, { $inc: { 'stats.followingCount': 1 } });
  await User.findByIdAndUpdate(followingId, { $inc: { 'stats.followersCount': 1 } });

  return { success: true };
};

const unfollowUser = async (followerId, followingId) => {
  const result = await Follow.findOneAndDelete({
    follower: followerId,
    following: followingId,
  });

  if (result) {
    await User.findByIdAndUpdate(followerId, { $inc: { 'stats.followingCount': -1 } });
    await User.findByIdAndUpdate(followingId, { $inc: { 'stats.followersCount': -1 } });
  }

  return { success: true };
};

const getFollowers = async (userId, options = {}) => {
  const { page = 1, limit = 20, viewerId = null } = options;
  let query = { following: userId };
  if (viewerId) {
    const blockedByViewer = await getBlockedIds(viewerId);
    const blockViewer = await Block.find({ blocked: viewerId }).select('blocker').lean();
    const blockViewerIds = blockViewer.map((d) => d.blocker);
    const exclude = [...blockedByViewer, ...blockViewerIds];
    if (exclude.length) {
      query.follower = { $nin: exclude };
    }
  }
  return followPagination.paginate(query, {
    page,
    limit,
    sort: { createdAt: -1 },
    populate: [{ path: 'follower', select: 'name avatar bio isExpert stats profilePhoto' }],
  });
};

const getFollowing = async (userId, options = {}) => {
  const { page = 1, limit = 20, viewerId = null } = options;
  let query = { follower: userId };
  if (viewerId) {
    const blockedByViewer = await getBlockedIds(viewerId);
    const blockViewer = await Block.find({ blocked: viewerId }).select('blocker').lean();
    const blockViewerIds = blockViewer.map((d) => d.blocker);
    const exclude = [...blockedByViewer, ...blockViewerIds];
    if (exclude.length) {
      query.following = { $nin: exclude };
    }
  }
  return followPagination.paginate(query, {
    page,
    limit,
    sort: { createdAt: -1 },
    populate: [{ path: 'following', select: 'name avatar bio isExpert stats profilePhoto' }],
  });
};

module.exports = {
  getProfile,
  updateProfile,
  updateLanguagePreference,
  updateThemePreference,
  updateAvatar,
  removeAvatar,
  updateProfilePhoto,
  updateBio,
  clearBio,
  updatePassword,
  updateBackground,
  getBackgroundPresets,
  searchUsers,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getBlockedIds,
  getBlockExcludeIds,
  getBlockRelationship,
  isBlocked,
  getBlockedUsers,
  blockUser,
  unblockUser,
};
