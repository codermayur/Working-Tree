const express = require('express');
const router = express.Router();
const postController = require('./post.controller');
const { authenticate, optionalAuth } = require('../../middlewares/auth.middleware');
const { uploadMultiple } = require('../../middlewares/upload.middleware');
const { validate, createPostSchema, commentSchema } = require('./post.validation');

// Create post (multipart: field "media" for files; body: content, tags)
router.post(
  '/',
  authenticate,
  uploadMultiple('media', 10),
  postController.createPost
);

// List endpoints (must be before /:postId)
router.get('/recent', optionalAuth, postController.getRecent);
router.get('/trending', optionalAuth, postController.getTrending);
router.get('/saved', authenticate, postController.getSavedPosts);
router.get('/user/:userId', optionalAuth, postController.getUserPosts);

// Single post
router.get('/:postId', optionalAuth, postController.getPostById);
router.delete('/:postId', authenticate, postController.deletePost);

// Engagement
router.post('/:postId/like', authenticate, postController.toggleLike);
router.post('/:postId/comments', authenticate, validate(commentSchema), postController.addComment);
router.get('/:postId/comments', postController.getComments);
router.post('/:postId/save', authenticate, postController.toggleSave);

module.exports = router;
