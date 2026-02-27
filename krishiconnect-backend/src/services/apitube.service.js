/**
 * APITube News API service.
 * All external API calls live here. No direct API calls in controllers or routes.
 * Uses env: APITUBE_BASE_URL, APITUBE_KEY, APITUBE_TIMEOUT.
 * Never exposes API key; never logs secrets.
 */

const axios = require('axios');
const logger = require('../config/logger');
const { getRedis } = require('../config/redis');
const ApiError = require('../utils/ApiError');

const DEFAULT_TIMEOUT_MS = 15000;
const CACHE_KEY_PREFIX = 'apitube:';
const CACHE_TTL_SECONDS = 5 * 60; // 5 minutes
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

/**
 * Get configured HTTP client (timeout, headers, no key in URL).
 * @returns {import('axios').AxiosInstance}
 */
function createClient() {
  const baseURL = (process.env.APITUBE_BASE_URL || '').trim().replace(/\/$/, '');
  const key = process.env.APITUBE_KEY || '';
  const timeout = Math.min(
    Math.max(1000, parseInt(process.env.APITUBE_TIMEOUT || String(DEFAULT_TIMEOUT_MS), 10) || DEFAULT_TIMEOUT_MS),
    60000
  );

  return axios.create({
    baseURL,
    timeout,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-API-Key': key,
    },
    params: {}, // never pass api_key in query string
    validateStatus: () => true, // we handle status in transformResponse
  });
}

/**
 * Normalize external API error into internal ApiError (no raw external message to client).
 */
function toApiError(ex) {
  if (ex instanceof ApiError) return ex;

  if (ex.code === 'ECONNABORTED' || ex.message?.includes('timeout')) {
    return new ApiError(504, 'News service request timed out. Please try again.');
  }
  if (ex.code === 'ENOTFOUND' || ex.code === 'ECONNREFUSED' || ex.code === 'ENETUNREACH') {
    return new ApiError(503, 'News service is temporarily unavailable.');
  }
  if (ex.response) {
    const status = ex.response.status;
    const body = ex.response.data;
    if (status === 401) {
      logger.warn('[apitube.service] Invalid or missing API key');
      return new ApiError(503, 'News service is not configured.');
    }
    if (status === 429) {
      logger.warn('[apitube.service] Rate limit exceeded');
      return new ApiError(429, 'Too many requests. Please try again later.');
    }
    if (status >= 500) {
      logger.warn('[apitube.service] Upstream error', status, typeof body === 'object' ? '' : String(body).slice(0, 100));
      return new ApiError(503, 'News service is temporarily unavailable.');
    }
    if (status >= 400) {
      logger.warn('[apitube.service] Client error', status);
      return new ApiError(502, 'News service request failed. Please try again.');
    }
  }

  logger.error('[apitube.service] Unexpected error', ex.message);
  return new ApiError(503, 'News service is temporarily unavailable.');
}

/**
 * Sleep helper for retry.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Call APITube with optional retry (exponential backoff for 5xx/timeouts).
 */
async function request(config, retries = MAX_RETRIES) {
  const client = createClient();
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await client.request(config);
      if (res.status >= 200 && res.status < 300) {
        return res.data;
      }
      if (res.status === 429 || res.status === 401) {
        throw toApiError({ response: res });
      }
      if (res.status >= 500 && attempt < retries) {
        lastError = res;
        await sleep(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }
      throw toApiError({ response: res });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status >= 500 && attempt < retries) {
          lastError = err;
          await sleep(RETRY_DELAY_MS * (attempt + 1));
          continue;
        }
        throw toApiError(err);
      }
      if (attempt < retries && (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT')) {
        lastError = err;
        await sleep(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }
      throw toApiError(err);
    }
  }

  throw toApiError(lastError || new Error('Request failed'));
}

/**
 * Normalize APITube article to internal shape (frontend never sees provider structure).
 * APITube fields: id, href, published_at, title, description, body, author, image, source.
 */
function normalizeArticle(item) {
  if (!item || typeof item !== 'object') return null;
  const author = item.author && typeof item.author === 'object' ? item.author.name : item.author;
  const sourceName = item.source && typeof item.source === 'object'
    ? (item.source.name || item.source.domain || item.source.id)
    : item.source;
  return {
    title: item.title || 'No title',
    description: item.description || (item.body && item.body.slice(0, 300)) || null,
    url: item.href || item.url || item.link || null,
    image: item.image || item.image_url || item.thumbnail || null,
    source: sourceName || null,
    publishedAt: item.published_at || item.publishedAt || item.pub_date || null,
    author: author || null,
    language: item.language || null,
  };
}

/**
 * Normalize external response to internal format: { data, meta }.
 * APITube returns: { status, results, limit, page, has_next_pages, ... }.
 */
function normalizeResponse(external, page, limit) {
  const articles = external.results ?? external.articles ?? external.data ?? [];
  const arr = Array.isArray(articles) ? articles : [];
  const data = arr.map(normalizeArticle).filter(Boolean);
  const totalItems = external.total_count ?? external.totalResults ?? external.total;
  const total = typeof totalItems === 'number' ? totalItems : data.length;

  return {
    data,
    meta: {
      totalItems: total,
      page: page ?? external.page ?? 1,
      limit: limit ?? external.limit ?? 20,
    },
  };
}

/**
 * Build cache key from validated query (avoid SSRF: only allow safe params).
 */
function cacheKey(params) {
  const safe = {
    q: params.q,
    page: params.page,
    limit: params.limit,
    language: params.language,
    category: params.category,
  };
  return CACHE_KEY_PREFIX + JSON.stringify(safe);
}

/**
 * Fetch news from APITube /news/everything with validated params.
 * @param {Object} params - Validated: q (optional), page, limit, language (optional), category (optional)
 * @returns {Promise<{ data: Array, meta: { totalItems, page, limit } }>}
 */
async function getNews(params) {
  if (!process.env.APITUBE_KEY || !process.env.APITUBE_BASE_URL) {
    throw new ApiError(503, 'News service is not configured.');
  }

  const { q, page = 1, limit = 20, language, category } = params;

  const redis = getRedis();
  const key = cacheKey(params);
  if (redis) {
    try {
      const cached = await redis.get(key);
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed;
      }
    } catch (e) {
      logger.warn('[apitube.service] Redis get failed', e.message);
    }
  }

  const query = {
    per_page: Math.min(Math.max(1, limit), 50),
    page: Math.max(1, parseInt(page, 10) || 1),
  };
  if (q && typeof q === 'string' && q.trim()) {
    query.title = q.trim().slice(0, 200); // restrict length
  }
  if (language && typeof language === 'string' && /^[a-z]{2}(-[A-Z]{2})?$/.test(language)) {
    query.language = language;
  }
  if (category && typeof category === 'string' && category.length <= 50) {
    query.category = category;
  }

  const data = await request({
    method: 'get',
    url: '/news/everything',
    params: query,
  });

  const normalized = normalizeResponse(data, query.page, query.per_page);

  if (redis && normalized.data.length > 0) {
    try {
      await redis.setEx(key, CACHE_TTL_SECONDS, JSON.stringify(normalized));
    } catch (e) {
      logger.warn('[apitube.service] Redis set failed', e.message);
    }
  }

  return normalized;
}

/**
 * Health check: verify config and optionally hit a minimal endpoint.
 * Does not throw; returns { ok: boolean, message?: string }.
 */
async function healthCheck() {
  const baseUrl = process.env.APITUBE_BASE_URL;
  const key = process.env.APITUBE_KEY;
  if (!key || !baseUrl) {
    return { ok: false, message: 'APITube not configured' };
  }
  try {
    await request({
      method: 'get',
      url: '/news/everything',
      params: { per_page: 1, page: 1 },
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e.message || 'Health check failed' };
  }
}

module.exports = {
  getNews,
  healthCheck,
  normalizeArticle,
  normalizeResponse,
};
