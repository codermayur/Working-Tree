const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { validate, updatePasswordSchema, updateLanguageSchema, updateThemeSchema } = require('./user.validation');
const { authenticate } = require('../../middlewares/auth.middleware');
const { uploadSingleProfilePic, uploadSingleBackground } = require('../../middlewares/upload.middleware');
const { uploadToCloudinary } = require('../../utils/uploadToCloudinary');
const ApiError = require('../../utils/ApiError');

// Public route: background presets (no auth required)
router.get('/profile/backgrounds', userController.getBackgroundPresets);

router.use(authenticate);

router.get('/me', userController.getMe);
router.patch('/me', userController.updateMe);
router.get('/me/saved', userController.getMySavedPosts);
router.put('/me/update-password', validate(updatePasswordSchema), userController.updatePassword);
router.put('/me/preferences/language', validate(updateLanguageSchema), userController.updateLanguage);
router.put('/me/preferences/theme', validate(updateThemeSchema), userController.updateTheme);

router.post(
  '/me/avatar',
  uploadSingleProfilePic('avatar'),
  async (req, res, next) => {
    if (req.file) {
      try {
        req.uploadResult = await uploadToCloudinary(req.file.buffer, {
          folder: 'khetibari/avatars',
        });
      } catch (err) {
        return next(err);
      }
    } else {
      return next(new ApiError(400, 'No file uploaded'));
    }
    next();
  },
  userController.uploadAvatar
);
router.delete('/me/avatar', userController.removeAvatar);

router.post(
  '/profile-photo',
  uploadSingleProfilePic('profilePhoto'),
  async (req, res, next) => {
    if (!req.file) {
      if (process.env.NODE_ENV !== 'test') {
        console.log('[profile-photo] No file in request. req.file:', req.file, 'req.body:', Object.keys(req.body || {}));
      }
      return next(new ApiError(400, 'No file uploaded'));
    }
    try {
      req.uploadResult = await uploadToCloudinary(req.file.buffer, {
        folder: 'khetibari/profile-photos',
      });
    } catch (err) {
      return next(err);
    }
    next();
  },
  userController.uploadProfilePhoto
);

router.put('/me/bio', userController.updateBio);
router.delete('/me/bio', userController.clearBio);

router.post(
  '/me/background',
  (req, res, next) => {
    if (req.is('multipart/form-data')) {
      return uploadSingleBackground('background')(req, res, (err) => {
        if (err) return next(err);
        if (req.file) {
          uploadToCloudinary(req.file.buffer, { folder: 'khetibari/backgrounds' })
            .then((result) => {
              req.uploadResult = result;
              next();
            })
            .catch(next);
        } else {
          next();
        }
      });
    }
    next();
  },
  userController.updateBackground
);

router.get('/search', userController.searchUsers);
router.get('/blocked', userController.getBlocked);
router.get('/:userId/is-blocked', userController.getIsBlocked);
router.get('/:userId/posts', userController.getPublicUserPosts);
router.get('/:userId/can-chat', userController.getCanChat);
router.get('/:userId', userController.getUserById);
router.post('/:userId/follow', userController.followUser);
router.delete('/:userId/follow', userController.unfollowUser);
router.get('/:userId/followers', userController.getFollowers);
router.get('/:userId/following', userController.getFollowing);
router.post('/:userId/block', userController.blockUser);
router.delete('/:userId/block', userController.unblockUser);

module.exports = router;
