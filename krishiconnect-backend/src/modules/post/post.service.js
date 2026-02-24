const Post = require('./models/post.model');
const Comment = require('./models/comment.model');
const User = require('../user/user.model');
const userService = require('../user/user.service');
const ApiError = require('../../utils/ApiError');
const { uploadToCloudinary } = require('../../utils/uploadToCloudinary');
const Pagination = require('../../utils/pagination');

const postPagination = new Pagination(Post);
const commentPagination = new Pagination(Comment);

const AUTHOR_SELECT = 'name profilePhoto _id';

/**
 * Upload multiple files (req.files) to Cloudinary with resource_type auto.
 * Field name from frontend must be "media".
 */
const uploadMediaFiles = async (files) => {
  if (!files || !Array.isArray(files) || files.length === 0) return [];
  const results = await Promise.all(
    files.map(async (file) => {
      const result = await uploadToCloudinary(file.buffer, { resourceType: 'auto' });
      const type = (file.mimetype || '').startsWith('video/') ? 'video' : 'image';
      return { url: result.url, publicId: result.publicId, type };
    })
  );
  return results;
};

const createPost = async (authorId, body, files = []) => {
  const media = await uploadMediaFiles(files);
  const content = typeof body.content === 'string' ? body.content : (body.content || '').trim();
  const tags = Array.isArray(body.tags) ? body.tags : [];

  const post = await Post.create({
    author: authorId,
    content,
    media,
    tags,
    likes: [],
    savedBy: [],
    likesCount: 0,
    commentsCount: 0,
    savedCount: 0,
  });

  const updated = await User.findByIdAndUpdate(
    authorId,
    { $inc: { 'stats.postsCount': 1 } },
    { new: true }
  ).select('stats.postsCount');

  const postsCount = updated?.stats?.postsCount ?? 0;
  await post.populate('author', AUTHOR_SELECT);
  return { post: post.toObject(), postsCount };
};

const deletePost = async (postId, userId) => {
  const post = await Post.findOne({ _id: postId, author: userId });
  if (!post) throw new ApiError(404, 'Post not found or unauthorized');

  await post.deleteOne();
  const updated = await User.findByIdAndUpdate(
    userId,
    { $inc: { 'stats.postsCount': -1 } },
    { new: true }
  ).select('stats.postsCount');

  const postsCount = Math.max(0, updated?.stats?.postsCount ?? 0);
  return { postsCount };
};

const getRecent = async (options = {}) => {
  const { page = 1, limit = 20, viewerId } = options;
  const query = {};
  if (viewerId) {
    const excludeIds = await userService.getBlockExcludeIds(viewerId);
    if (excludeIds.length) query.author = { $nin: excludeIds };
  }
  return postPagination.paginate(query, {
    page,
    limit,
    sort: { createdAt: -1 },
    populate: [{ path: 'author', select: AUTHOR_SELECT }],
  });
};

const getTrending = async (options = {}) => {
  const { page = 1, limit = 20, viewerId } = options;
  const query = {};
  if (viewerId) {
    const excludeIds = await userService.getBlockExcludeIds(viewerId);
    if (excludeIds.length) query.author = { $nin: excludeIds };
  }
  return postPagination.paginate(query, {
    page,
    limit,
    sort: { likesCount: -1, createdAt: -1 },
    populate: [{ path: 'author', select: AUTHOR_SELECT }],
  });
};

const getPostById = async (postId, userId = null) => {
  const post = await Post.findById(postId)
    .populate('author', AUTHOR_SELECT)
    .lean();
  if (!post) throw new ApiError(404, 'Post not found');

  const authorId = post.author?._id || post.author;
  if (userId && authorId) {
    const excludeIds = await userService.getBlockExcludeIds(userId);
    if (excludeIds.includes(authorId.toString())) {
      throw new ApiError(404, 'Post not found');
    }
  }

  if (userId) {
    post.isLiked = post.likes && post.likes.some((id) => id.toString() === userId.toString());
    post.isSaved = post.savedBy && post.savedBy.some((id) => id.toString() === userId.toString());
  }

  // Record view and update author's post impressions (don't count when author views own post)
  if (authorId && (!userId || userId.toString() !== authorId.toString())) {
    await Post.findByIdAndUpdate(postId, { $inc: { views: 1 } });
    await User.findByIdAndUpdate(authorId, { $inc: { 'stats.postImpressions': 1 } });
  }

  return post;
};

const toggleLike = async (postId, userId) => {
  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, 'Post not found');

  const likeIds = post.likes || [];
  const idx = likeIds.findIndex((id) => id.toString() === userId.toString());
  let liked;
  if (idx >= 0) {
    likeIds.splice(idx, 1);
    post.likesCount = Math.max(0, (post.likesCount || 0) - 1);
    liked = false;
  } else {
    likeIds.push(userId);
    post.likesCount = (post.likesCount || 0) + 1;
    liked = true;
  }
  post.likes = likeIds;
  await post.save();

  return {
    liked,
    likesCount: post.likesCount,
    authorId: post.author,
  };
};

const addComment = async (postId, userId, { content }) => {
  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, 'Post not found');

  const text = (content || '').trim();
  if (!text) throw new ApiError(400, 'Comment content is required');

  const comment = await Comment.create({
    post: postId,
    author: userId,
    content: text,
    text: text,
  });

  await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

  await comment.populate('author', AUTHOR_SELECT);
  return { comment, authorId: post.author };
};

const getComments = async (postId, options = {}) => {
  const { page = 1, limit = 50, viewerId } = options;
  const query = { post: postId, parentComment: null };
  if (viewerId) {
    const excludeIds = await userService.getBlockExcludeIds(viewerId);
    if (excludeIds.length) query.author = { $nin: excludeIds };
  }
  return commentPagination.paginate(query, {
    page,
    limit,
    sort: { createdAt: -1 },
    populate: [{ path: 'author', select: AUTHOR_SELECT }],
  });
};

const toggleSave = async (postId, userId) => {
  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, 'Post not found');

  const savedIds = post.savedBy || [];
  const idx = savedIds.findIndex((id) => id.toString() === userId.toString());
  let saved;
  if (idx >= 0) {
    savedIds.splice(idx, 1);
    post.savedCount = Math.max(0, (post.savedCount || 0) - 1);
    saved = false;
  } else {
    savedIds.push(userId);
    post.savedCount = (post.savedCount || 0) + 1;
    saved = true;
  }
  post.savedBy = savedIds;
  await post.save();

  // Keep user's savedCount in sync (userId = the user who is saving/unsaving)
  await User.findByIdAndUpdate(userId, { $inc: { 'stats.savedCount': saved ? 1 : -1 } });

  return { saved, savedCount: post.savedCount };
};

const getSavedPosts = async (userId, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const query = { savedBy: userId };
  const excludeIds = await userService.getBlockExcludeIds(userId);
  if (excludeIds.length) query.author = { $nin: excludeIds };
  return postPagination.paginate(query, {
    page,
    limit,
    sort: { createdAt: -1 },
    populate: [{ path: 'author', select: AUTHOR_SELECT }],
  });
};

const getUserPosts = async (userId, options = {}) => {
  const { page = 1, limit = 20, viewerId } = options;
  if (viewerId && viewerId.toString() !== userId.toString()) {
    const blockRel = await userService.getBlockRelationship(viewerId, userId);
    if (blockRel.iBlockThem || blockRel.theyBlockMe) {
      return postPagination.paginate(
        { _id: { $in: [] } },
        { page: 1, limit, sort: { createdAt: -1 }, populate: [{ path: 'author', select: AUTHOR_SELECT }] }
      );
    }
  }
  return postPagination.paginate(
    { author: userId },
    {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: [{ path: 'author', select: AUTHOR_SELECT }],
    }
  );
};

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
  uploadMediaFiles,
};
