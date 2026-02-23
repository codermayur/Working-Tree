/**
 * On-demand translation for user content (posts, etc.). Calls backend POST /translate.
 * Does not store in DB; frontend caches in memory via useTranslatePost.
 */
import { api } from './api';

const translateBase = 'translate';

export const translationService = {
  /**
   * @param {string} text - Content to translate
   * @param {string} targetLanguage - 'en' | 'hi' | 'mr'
   * @returns {Promise<string>} translated text
   */
  async translate(text, targetLanguage = 'en') {
    if (!text || typeof text !== 'string') return '';
    const trimmed = text.trim();
    if (!trimmed) return '';
    const { data } = await api.post(translateBase, { text: trimmed, targetLanguage });
    const out = data?.data ?? data;
    return out?.translatedText ?? out ?? '';
  },
};
