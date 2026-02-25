/**
 * Agriculture news from backend (NewsData.io proxy). No auth required.
 * Backend: GET /news/agriculture — returns { data: [{ title, description, url, image, source, publishedAt }] }
 */
import { request } from './api';

export const newsService = {
  /** GET agriculture news (cached on backend). Returns array or empty on error. */
  async getAgricultureNews() {
    try {
      const { data } = await request('GET', '/news/agriculture');
      const list = data?.data ?? data ?? [];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  },
};
