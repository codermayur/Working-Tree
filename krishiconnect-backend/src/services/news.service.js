const { getRedis } = require('../config/redis');
const logger = require('../config/logger');

const CACHE_KEY_AGRICULTURE = 'news:agriculture';
const CACHE_TTL_SECONDS = 10 * 60; // 10 minutes

const inMemoryCache = { data: null, expiresAt: 0 };

/**
 * Fetch agriculture news from NewsData.io API.
 * Filters by agriculture-related keywords; India-focused when possible.
 * API key must be set in NEWS_API_KEY; base URL in NEWS_API_URL (default: NewsData.io latest).
 */
async function fetchFromApi() {
  const apiKey = process.env.NEWS_API_KEY;
  const baseUrl = (process.env.NEWS_API_URL || 'https://newsdata.io/api/1/latest').replace(/\/$/, '');

  if (!apiKey) {
    logger.warn('[news.service] NEWS_API_KEY not set');
    return { success: false, error: 'API key not configured' };
  }

  const params = new URLSearchParams({
    apikey: apiKey,
    q: 'agriculture farming crops irrigation rural development',
    country: 'in',
    language: 'en',
    size: '20',
  });

  const url = `${baseUrl}?${params.toString()}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 401) {
        logger.warn('[news.service] Invalid or missing News API key');
        return { success: false, error: 'Invalid API key' };
      }
      if (res.status === 429) {
        logger.warn('[news.service] News API rate limit exceeded');
        return { success: false, error: 'Rate limit exceeded' };
      }
      logger.warn('[news.service] News API error', res.status, text?.slice(0, 200));
      return { success: false, error: 'News service temporarily unavailable' };
    }

    const json = await res.json();

    if (json.status === 'error') {
      logger.warn('[news.service] News API returned error', json.results?.message || json);
      return { success: false, error: json.results?.message || 'API error' };
    }

    const results = json.results || [];
    const normalized = normalizeResults(results);
    return { success: true, data: normalized };
  } catch (err) {
    if (err.name === 'AbortError') {
      logger.warn('[news.service] News API timeout');
      return { success: false, error: 'Request timeout' };
    }
    logger.error('[news.service] Fetch error', err.message);
    return { success: false, error: 'News service temporarily unavailable' };
  }
}

/**
 * Normalize API response to { title, description, url, image, source, publishedAt }.
 */
function normalizeResults(results) {
  if (!Array.isArray(results)) return [];

  return results.map((item) => ({
    title: item.title || 'No title',
    description: item.description || item.content || null,
    url: item.link || item.url || null,
    image: item.image_url || item.image || null,
    source: item.source_id || item.source?.name || item.source || null,
    publishedAt: item.pubDate || item.publishedAt || item.published_at || null,
  })).filter((n) => n.title && n.url);
}

/**
 * Get agriculture news. Uses Redis cache (then in-memory fallback) for 10 minutes.
 * Never throws; returns { success: false, error } on failure.
 */
async function getAgricultureNews() {
  try {
    const redis = getRedis();

    if (redis) {
      try {
        const cached = await redis.get(CACHE_KEY_AGRICULTURE);
        if (cached) {
          const parsed = JSON.parse(cached);
          return { success: true, data: parsed };
        }
      } catch (err) {
        logger.warn('[news.service] Redis get failed', err.message);
      }
    }

    if (inMemoryCache.data && Date.now() < inMemoryCache.expiresAt) {
      return { success: true, data: inMemoryCache.data };
    }

    const result = await fetchFromApi();

    if (result.success && result.data && result.data.length > 0) {
      const toCache = JSON.stringify(result.data);
      if (redis) {
        try {
          await redis.setEx(CACHE_KEY_AGRICULTURE, CACHE_TTL_SECONDS, toCache);
        } catch (err) {
          logger.warn('[news.service] Redis set failed', err.message);
        }
      }
      inMemoryCache.data = result.data;
      inMemoryCache.expiresAt = Date.now() + CACHE_TTL_SECONDS * 1000;
    }

    return result;
  } catch (err) {
    logger.error('[news.service] getAgricultureNews error:', err.message);
    return { success: false, error: 'News service temporarily unavailable' };
  }
}

module.exports = {
  getAgricultureNews,
  fetchFromApi,
  normalizeResults,
};
