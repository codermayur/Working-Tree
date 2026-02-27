/**
 * Agriculture news from backend (NewsData.io proxy). No auth required.
 * APITube-backed news: GET /apitube/news — returns normalized { data, meta }.
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

  /**
   * GET news from APITube via backend (no API key on frontend).
   * @param {{ q?: string, page?: number, limit?: number, language?: string, category?: string }} params
   * @returns {{ data: Array, meta: { totalItems, page, limit } } | null } — null on error
   */
  async getApitubeNews(params = {}) {
    try {
      const sp = new URLSearchParams();
      if (params.q) sp.set('q', String(params.q).trim().slice(0, 200));
      if (params.page != null) sp.set('page', String(params.page));
      if (params.limit != null) sp.set('limit', String(params.limit));
      if (params.language) sp.set('language', params.language);
      if (params.category) sp.set('category', params.category);
      const query = sp.toString();
      const path = query ? `/apitube/news?${query}` : '/apitube/news';
      const { data } = await request('GET', path);
      const list = data?.data ?? [];
      const meta = data?.meta ?? { totalItems: list.length, page: 1, limit: 20 };
      return {
        data: Array.isArray(list) ? list : [],
        meta,
      };
    } catch {
      return null;
    }
  },
};
