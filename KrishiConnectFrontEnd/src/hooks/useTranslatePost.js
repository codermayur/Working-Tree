/**
 * Hook for translating post (or any) content on demand. Caches result in memory.
 * Does not modify DB. Use for "Translate" button and "Show original" / "Show translated" toggle.
 */
import { useState, useCallback } from 'react';
import { translationService } from '../services/translation.service';
import i18n from '../i18n';

const cache = new Map();

function cacheKey(text, targetLang) {
  const t = (text || '').slice(0, 200);
  return `${targetLang}:${t}`;
}

/**
 * @param {string} content - Original post/content text
 * @returns {{
 *   translatedText: string | null,
 *   loading: boolean,
 *   error: string | null,
 *   translate: () => Promise<void>,
 *   showTranslated: boolean,
 *   setShowTranslated: (v: boolean) => void,
 *   toggleView: () => void
 * }}
 */
export function useTranslatePost(content) {
  const currentLang = i18n.language || 'en';
  const [translatedText, setTranslatedText] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showTranslated, setShowTranslated] = useState(false);

  const translate = useCallback(async () => {
    const text = (content || '').trim();
    if (!text) return;
    const key = cacheKey(text, currentLang);
    if (cache.has(key)) {
      setTranslatedText(cache.get(key));
      setShowTranslated(true);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await translationService.translate(text, currentLang);
      setTranslatedText(result || null);
      if (result) cache.set(key, result);
      setShowTranslated(!!result);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Translation failed');
      setTranslatedText(null);
    } finally {
      setLoading(false);
    }
  }, [content, currentLang]);

  const toggleView = useCallback(() => {
    setShowTranslated((prev) => !prev);
  }, []);

  return {
    translatedText,
    loading,
    error,
    translate,
    showTranslated,
    setShowTranslated,
    toggleView,
  };
}

export default useTranslatePost;
