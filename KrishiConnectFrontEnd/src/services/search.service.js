/**
 * Search API: GET /search?q=...&page=1&limit=10
 * Returns user search results (public-safe) with pagination.
 */
import { api } from './api';

/**
 * Search users by name, username, location, headline/specialization.
 * @param {string} q - Search query
 * @param {object} options - { page, limit }
 * @returns {{ data: array, meta: { pagination } }}
 */
export async function searchUsers(q, options = {}) {
  const params = { page: options.page || 1, limit: options.limit ?? 10 };
  if (q != null && String(q).trim()) params.q = String(q).trim();
  const { data } = await api.get('/search', { params });
  return {
    data: data?.data ?? [],
    pagination: data?.meta?.pagination ?? { page: 1, limit: 10, totalCount: 0, hasNextPage: false },
  };
}

export const searchService = {
  searchUsers,
};
