const postService = require('./post.service');
const notificationService = require('../notification/notification.service');
const notificationSocket = require('../notification/notification.socket');
const { getIO } = require('../../socket');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const asyncHandler = require('../../utils/asyncHandler');

const createPost = asyncHandler(async (req, res) => {
  const files = req.files && req.files.length ? req.files : [];
  const body = req.body || {};
  if (typeof body.tags === 'string') {
    try {
      body.tags = JSON.parse(body.tags);
    } catch {
      body.tags = [];
    }
  }
  const { post, postsCount } = await postService.createPost(req.user._id, body, files);
  res.status(201).json(new ApiResponse(201, { post, postsCount }, 'Post created successfully'));
});

const deletePost = asyncHandler(async (req, res) => {
  const { postsCount } = await postService.deletePost(req.params.postId, req.user._id);
  res.status(200).json(new ApiResponse(200, { postsCount }, 'Post deleted successfully'));
});

const getRecent = asyncHandler(async (req, res) => {
  const result = await postService.getRecent({ ...req.query, viewerId: req.user?._id });
  res.status(200).json(
    new ApiResponse(200, result.data, 'Recent posts', { pagination: result.pagination })
  );
});

const getTrending = asyncHandler(async (req, res) => {
  const result = await postService.getTrending({ ...req.query, viewerId: req.user?._id });
  res.status(200).json(
    new ApiResponse(200, result.data, 'Trending posts', { pagination: result.pagination })
  );
});

const getPostById = asyncHandler(async (req, res) => {
  const post = await postService.getPostById(req.params.postId, req.user?._id);
  res.status(200).json(new ApiResponse(200, post, 'Post fetched'));
});

const toggleLike = asyncHandler(async (req, res) => {
  const result = await postService.toggleLike(req.params.postId, req.user._id);
  res.status(200).json(new ApiResponse(200, result, result.liked ? 'Post liked' : 'Post unliked'));
  if (result.liked && result.authorId && result.authorId.toString() !== req.user._id.toString()) {
    setImmediate(() => {
      notificationService
        .create({
          recipient: result.authorId,
          sender: req.user._id,
          type: 'like',
          entityId: req.params.postId,
          entityType: 'post',
          message: 'liked your post',
        })
        .then((created) => {
          if (created) {
            try {
              const io = getIO();
              notificationSocket.emitNewNotification(
                io,
                created.notification.recipient,
                created.notification,
                created.unreadCount
              );
            } catch (_) {}
          }
        })
        .catch(() => {});
    });
  }
});

const addComment = asyncHandler(async (req, res) => {
  const { comment, authorId } = await postService.addComment(req.params.postId, req.user._id, req.body);
  res.status(201).json(new ApiResponse(201, comment, 'Comment added'));
  if (authorId && authorId.toString() !== req.user._id.toString()) {
    setImmediate(() => {
      notificationService
        .create({
          recipient: authorId,
          sender: req.user._id,
          type: 'comment',
          entityId: req.params.postId,
          entityType: 'post',
          message: 'commented on your post',
          metadata: { commentId: comment._id },
        })
        .then((created) => {
          if (created) {
            try {
              const io = getIO();
              notificationSocket.emitNewNotification(
                io,
                created.notification.recipient,
                created.notification,
                created.unreadCount
              );
            } catch (_) {}
          }
        })
        .catch(() => {});
    });
  }
});

const getComments = asyncHandler(async (req, res) => {
  const result = await postService.getComments(req.params.postId, { ...req.query, viewerId: req.user?._id });
  res.status(200).json(
    new ApiResponse(200, result.data, 'Comments', { pagination: result.pagination })
  );
});

const toggleSave = asyncHandler(async (req, res) => {
  const result = await postService.toggleSave(req.params.postId, req.user._id);
  res.status(200).json(
    new ApiResponse(200, result, result.saved ? 'Post saved' : 'Post unsaved')
  );
});

/**
 * Saved posts: only for the authenticated user. Uses req.user identity only.
 * Never use params/query for userId — prevents leaking another user's saved posts.
 */
const getSavedPosts = asyncHandler(async (req, res) => {
  const userId = req.user?._id ?? req.user?.id;
  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }
  const result = await postService.getSavedPosts(userId, req.query);
  res.status(200).json(
    new ApiResponse(200, result.data, 'Saved posts', { pagination: result.pagination })
  );
});

/**
 * Public posts by a user (author: userId). Does NOT include saved posts.
 * Use GET /users/me/saved for the logged-in user's saved posts only.
 */
const getUserPosts = asyncHandler(async (req, res) => {
  const result = await postService.getUserPosts(req.params.userId, { ...req.query, viewerId: req.user?._id });
  res.status(200).json(
    new ApiResponse(200, result.data, 'User posts', { pagination: result.pagination })
  );
});

module.exports = {
  createPost,
  deletePost,
  getRecent,
  getTrending,
  getPostById,
  toggleLike,
  addComment,
  getComments,
  toggleSave,
  getSavedPosts,
  getUserPosts,
};
