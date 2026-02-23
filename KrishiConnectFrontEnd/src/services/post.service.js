/**
 * Post API: create, feed (recent/trending), like, comment, save, saved, user posts.
 * Backend: POST /posts (FormData), GET /posts/recent, /posts/trending, /posts/saved, etc.
 */
import { request } from './api';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop';

function mapAuthor(author) {
  if (!author) return null;
  const url = author.profilePhoto?.url ?? author.profilePhoto ?? author.avatar?.url ?? author.avatar ?? DEFAULT_AVATAR;
  return {
    _id: author._id,
    name: author.name || 'User',
    avatar: typeof url === 'string' ? url : DEFAULT_AVATAR,
    headline: author.headline || author.bio?.split('\n')[0]?.slice(0, 80) || '',
    verified: author.verified === true || author.verificationStatus === 'verified' || author.isExpert === true,
  };
}

/**
 * Map backend post to feed/post card shape (content string, media, author.avatar, counts, isLiked, isSaved).
 */
export function mapPostToFeedCard(post) {
  if (!post) return null;
  const author = mapAuthor(post.author);
  const mediaUrl = post.media?.[0]?.url ?? null;
  const media = post.media || [];
  return {
    _id: post._id,
    content: typeof post.content === 'string' ? post.content : (post.content?.text || ''),
    media,
    mediaUrl,
    tags: post.tags || [],
    likesCount: post.likesCount ?? 0,
    commentsCount: post.commentsCount ?? 0,
    savedCount: post.savedCount ?? 0,
    sharesCount: 0,
    isLiked: !!post.isLiked,
    isSaved: !!post.isSaved,
    createdAt: post.createdAt,
    author,
  };
}

/**
 * Map backend post to profile page post card shape.
 */
export function mapPostToCard(post) {
  if (!post) return null;
  const author = mapAuthor(post.author);
  const mediaUrl = post.media?.[0]?.url ?? null;
  return {
    _id: post._id,
    content: typeof post.content === 'string' ? post.content : (post.content?.text || ''),
    mediaUrl,
    tags: post.tags || [],
    likesCount: post.likesCount ?? 0,
    commentsCount: post.commentsCount ?? 0,
    savedCount: post.savedCount ?? 0,
    sharesCount: post.savedCount ?? 0,
    createdAt: post.createdAt,
    author,
  };
}

export const postService = {
  /**
   * Create post. FormData must include: content (string), optional tags (JSON string array), media (files).
   * Returns { post, postsCount }. Post is already in feed shape (mapPostToFeedCard applied on backend response).
   */
  async createPost(formData) {
    const { data } = await request('POST', '/posts', null, { body: formData });
    const payload = data.data || data;
    const post = mapPostToFeedCard(payload.post || payload);
    return { post, postsCount: payload.postsCount ?? 0 };
  },

  async deletePost(postId) {
    const { data } = await request('DELETE', `/posts/${postId}`);
    const payload = data.data || data;
    return { postsCount: payload.postsCount ?? 0 };
  },

  async getRecent(page = 1, limit = 20) {
    const { data } = await request('GET', `/posts/recent?page=${page}&limit=${limit}`);
    const list = (data.data || data || []).map(mapPostToFeedCard);
    const pagination = data.meta?.pagination || data.pagination || {};
    return { posts: list, hasMore: pagination.hasNextPage !== false && pagination.totalPages > page, pagination };
  },

  async getTrending(page = 1, limit = 20) {
    const { data } = await request('GET', `/posts/trending?page=${page}&limit=${limit}`);
    const list = (data.data || data || []).map(mapPostToFeedCard);
    const pagination = data.meta?.pagination || data.pagination || {};
    return { posts: list, hasMore: pagination.hasNextPage !== false && pagination.totalPages > page, pagination };
  },

  async getPostById(postId) {
    const { data } = await request('GET', `/posts/${postId}`);
    const raw = data.data || data;
    return mapPostToFeedCard(raw);
  },

  /** Toggle like. Returns { liked, likesCount }. */
  async toggleLike(postId) {
    const { data } = await request('POST', `/posts/${postId}/like`);
    const payload = data.data || data;
    return { liked: payload.liked, likesCount: payload.likesCount ?? 0 };
  },

  async addComment(postId, content) {
    const { data } = await request('POST', `/posts/${postId}/comments`, { content });
    const raw = data.data || data;
    const author = mapAuthor(raw.author);
    return {
      comment: {
        _id: raw._id,
        author,
        content: raw.content || raw.text,
        createdAt: raw.createdAt,
      },
    };
  },

  async getComments(postId, page = 1, limit = 50) {
    const { data } = await request('GET', `/posts/${postId}/comments?page=${page}&limit=${limit}`);
    const list = (data.data || data || []).map((c) => ({
      _id: c._id,
      author: mapAuthor(c.author),
      content: c.content || c.text,
      createdAt: c.createdAt,
    }));
    return { comments: list, pagination: data.meta?.pagination || data.pagination || {} };
  },

  /** Toggle save. Returns { saved, savedCount }. */
  async toggleSave(postId) {
    const { data } = await request('POST', `/posts/${postId}/save`);
    const payload = data.data || data;
    return { saved: payload.saved, savedCount: payload.savedCount ?? 0 };
  },

  /** Share: return URL for copy. */
  getShareUrl(postId) {
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/post/${postId}`;
  },

  /**
   * Logged-in user's saved posts only. Uses GET /users/me/saved (auth required).
   * Do not use for another user's profile — saved posts are private to the account owner.
   */
  async getSavedPosts(page = 1, limit = 20) {
    const { data } = await request('GET', `/users/me/saved?page=${page}&limit=${limit}`);
    const list = (data.data || data || []).map(mapPostToCard);
    const pagination = data.meta?.pagination || data.pagination || {};
    return { posts: list, hasMore: pagination.hasNextPage !== false && pagination.totalPages > page, pagination };
  },

  async getUserPosts(userId, page = 1, limit = 20) {
    const { data } = await request('GET', `/posts/user/${userId}?page=${page}&limit=${limit}`);
    const list = (data.data || data || []).map(mapPostToCard);
    const pagination = data.meta?.pagination || data.pagination || {};
    return { posts: list, hasMore: pagination.totalPages > page, pagination };
  },
};
