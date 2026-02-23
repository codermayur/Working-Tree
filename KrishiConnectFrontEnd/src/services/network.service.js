/**
 * Network (My Network) API: recommendations and follow.
 * Uses shared api (Bearer token). Base: VITE_API_URL.
 */
import { api } from './api';

const networkBase = 'network';
const usersBase = 'users';

export const networkService = {
  /**
   * GET /network/recommendations
   * @param {object} params - { page, limit }
   * @returns {Promise<{ recommendations: array, pagination: object }>}
   */
  async getRecommendations(params = {}) {
    const { data } = await api.get(`${networkBase}/recommendations`, { params });
    const list = data?.data ?? data ?? [];
    const pagination = data?.meta?.pagination ?? data?.pagination ?? {};
    return {
      recommendations: Array.isArray(list) ? list : [],
      pagination,
    };
  },

  /**
   * POST /users/:userId/follow
   */
  async followUser(userId) {
    const { data } = await api.post(`${usersBase}/${userId}/follow`);
    return data?.data ?? data;
  },

  /**
   * DELETE /users/:userId/follow
   */
  async unfollowUser(userId) {
    const { data } = await api.delete(`${usersBase}/${userId}/follow`);
    return data?.data ?? data;
  },
};
