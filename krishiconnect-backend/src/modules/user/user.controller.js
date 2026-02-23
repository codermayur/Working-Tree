const userService = require('./user.service');
const postService = require('../post/post.service');
const chatService = require('../chat/chat.service');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const asyncHandler = require('../../utils/asyncHandler');

const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user._id);
  res.status(200).json(new ApiResponse(200, user, 'Profile fetched successfully'));
});

/**
 * GET my saved posts only. Requires auth. Never exposes another user's saved posts.
 * Uses req.user identity only; no :userId param accepted.
 */
const getMySavedPosts = asyncHandler(async (req, res) => {
  const userId = req.user?._id ?? req.user?.id;
  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }
  const result = await postService.getSavedPosts(userId, req.query);
  res.status(200).json(
    new ApiResponse(200, result.data, 'Saved posts', { pagination: result.pagination })
  );
});

const updateMe = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);
  res.status(200).json(new ApiResponse(200, user, 'Profile updated successfully'));
});

const updateLanguage = asyncHandler(async (req, res) => {
  const { language } = req.body;
  if (!language || typeof language !== 'string') {
    throw new ApiError(400, 'Language is required');
  }
  const user = await userService.updateLanguagePreference(req.user._id, language.trim());
  res.status(200).json(new ApiResponse(200, user, 'Language preference updated'));
});

const updateTheme = asyncHandler(async (req, res) => {
  const { darkMode } = req.body;
  const user = await userService.updateThemePreference(req.user._id, darkMode);
  res.status(200).json(new ApiResponse(200, user, 'Theme preference updated'));
});

const uploadAvatar = asyncHandler(async (req, res) => {
  const avatarData = req.uploadResult;
  const user = await userService.updateAvatar(req.user._id, avatarData);
  res.status(200).json(new ApiResponse(200, user, 'Profile picture updated successfully'));
});

const removeAvatar = asyncHandler(async (req, res) => {
  const user = await userService.removeAvatar(req.user._id);
  res.status(200).json(new ApiResponse(200, user, 'Profile picture removed'));
});

const uploadProfilePhoto = asyncHandler(async (req, res) => {
  const photoData = req.uploadResult;
  const user = await userService.updateProfilePhoto(req.user._id, photoData);
  res.status(200).json(new ApiResponse(200, user, 'Profile photo updated successfully'));
});

const updateBio = asyncHandler(async (req, res) => {
  const { bio } = req.body;
  const user = await userService.updateBio(req.user._id, bio);
  res.status(200).json(new ApiResponse(200, user, 'Bio updated successfully'));
});

const clearBio = asyncHandler(async (req, res) => {
  const user = await userService.clearBio(req.user._id);
  res.status(200).json(new ApiResponse(200, user, 'Bio cleared'));
});

const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user?.id ?? req.user?._id;
  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }
  if (!currentPassword || typeof currentPassword !== 'string') {
    throw new ApiError(400, 'Current password is required');
  }
  if (!newPassword || typeof newPassword !== 'string') {
    throw new ApiError(400, 'New password is required');
  }
  await userService.updatePassword(userId, currentPassword, newPassword);
  res.status(200).json(new ApiResponse(200, { success: true }, 'Password updated successfully'));
});

const updateBackground = asyncHandler(async (req, res) => {
  const preset = req.body?.preset;
  const backgroundData = req.uploadResult;
  if (!preset && !backgroundData) {
    throw new ApiError(400, 'Either preset or background image is required');
  }
  const user = await userService.updateBackground(req.user._id, { preset, backgroundData });
  res.status(200).json(new ApiResponse(200, user, backgroundData ? 'Background updated successfully' : 'Background preset applied'));
});

const getBackgroundPresets = asyncHandler(async (req, res) => {
  const result = userService.getBackgroundPresets();
  res.status(200).json(new ApiResponse(200, { presets: result.presets }, 'Background presets fetched'));
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.params.userId, req.user?._id);
  res.status(200).json(new ApiResponse(200, user, 'User fetched successfully'));
});

const searchUsers = asyncHandler(async (req, res) => {
  const result = await userService.searchUsers(req.query, { viewerId: req.user?._id });
  res.status(200).json(
    new ApiResponse(200, result.data, 'Users fetched successfully', {
      pagination: result.pagination,
    })
  );
});

const followUser = asyncHandler(async (req, res) => {
  await userService.followUser(req.user._id, req.params.userId);
  res.status(200).json(new ApiResponse(200, { success: true }, 'User followed successfully'));
});

const unfollowUser = asyncHandler(async (req, res) => {
  await userService.unfollowUser(req.user._id, req.params.userId);
  res.status(200).json(new ApiResponse(200, { success: true }, 'User unfollowed successfully'));
});

/**
 * Public posts by user (author: userId). Does NOT include saved posts.
 */
const getPublicUserPosts = asyncHandler(async (req, res) => {
  const result = await postService.getUserPosts(req.params.userId, req.query);
  res.status(200).json(
    new ApiResponse(200, result.data, 'User posts', { pagination: result.pagination })
  );
});

/** GET /users/:userId/can-chat — true if current user can start chat with userId (follow relation). */
const getCanChat = asyncHandler(async (req, res) => {
  const canChat = await chatService.canChatWith(req.user._id, req.params.userId);
  res.status(200).json(new ApiResponse(200, { canChat }, 'OK'));
});

const getFollowers = asyncHandler(async (req, res) => {
  const result = await userService.getFollowers(req.params.userId, {
    ...req.query,
    viewerId: req.user?._id,
  });
  res.status(200).json(
    new ApiResponse(200, result.data, 'Followers fetched successfully', {
      pagination: result.pagination,
    })
  );
});

const getFollowing = asyncHandler(async (req, res) => {
  const result = await userService.getFollowing(req.params.userId, {
    ...req.query,
    viewerId: req.user?._id,
  });
  res.status(200).json(
    new ApiResponse(200, result.data, 'Following fetched successfully', {
      pagination: result.pagination,
    })
  );
});

const getBlocked = asyncHandler(async (req, res) => {
  const result = await userService.getBlockedUsers(req.user._id, req.query);
  const list = (result.data || []).map((doc) => {
    const u = doc.blocked;
    if (!u) return null;
    const id = u._id;
    const name = u.name || 'Unknown';
    const avatar = u.profilePhoto?.url ?? u.avatar?.url ?? u.avatar ?? '';
    return { _id: id, id, name, username: u.username, avatar, profilePhoto: u.profilePhoto, blockedAt: doc.createdAt };
  }).filter(Boolean);
  res.status(200).json(
    new ApiResponse(200, list, 'Blocked users', { pagination: result.pagination })
  );
});

const blockUser = asyncHandler(async (req, res) => {
  await userService.blockUser(req.user._id, req.params.userId);
  res.status(200).json(new ApiResponse(200, { success: true }, 'User blocked'));
});

const unblockUser = asyncHandler(async (req, res) => {
  await userService.unblockUser(req.user._id, req.params.userId);
  res.status(200).json(new ApiResponse(200, { success: true }, 'User unblocked'));
});

const getIsBlocked = asyncHandler(async (req, res) => {
  const [iBlockThem, theyBlockMe] = await Promise.all([
    userService.isBlocked(req.user._id, req.params.userId),
    userService.isBlocked(req.params.userId, req.user._id),
  ]);
  res.status(200).json(
    new ApiResponse(200, { isBlocked: iBlockThem, hasBlockedMe: theyBlockMe }, 'OK')
  );
});

module.exports = {
  getMe,
  updateMe,
  getMySavedPosts,
  updateLanguage,
  uploadAvatar,
  removeAvatar,
  uploadProfilePhoto,
  updateBio,
  clearBio,
  updatePassword,
  updateBackground,
  getBackgroundPresets,
  getUserById,
  getPublicUserPosts,
  getCanChat,
  updateTheme,
  searchUsers,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getBlocked,
  blockUser,
  unblockUser,
  getIsBlocked,
};
