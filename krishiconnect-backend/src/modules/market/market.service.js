const axios = require('axios');
const ApiError = require('../../utils/ApiError');

const MARKET_PRICES_API_URL = process.env.MARKET_PRICES_API_URL || '';
const MARKET_PRICES_API_KEY = process.env.MARKET_PRICES_API_KEY || '';

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const memoryCache = new Map();

/** Map data.gov.in record to our product shape (defensive). */
function toProductShape(record, index) {
  if (!record || typeof record !== 'object') return null;
  const commodity = record.commodity ?? record.name ?? '—';
  const modalPrice = record.modal_price ?? record.modalPrice ?? record.currentPrice ?? record.min_price ?? record.minPrice ?? 0;
  const minPrice = record.min_price ?? record.minPrice ?? modalPrice;
  const maxPrice = record.max_price ?? record.maxPrice ?? modalPrice;
  const priceDate = record.arrival_date ?? record.priceDate ?? record.lastUpdated;
  const id = record.id ?? `ext-${index}-${commodity}-${record.market || ''}`.replace(/\s+/g, '-');
  return {
    id,
    name: commodity,
    currentPrice: Number(modalPrice),
    currency: 'INR',
    minPrice: Number(minPrice),
    maxPrice: Number(maxPrice),
    priceChange: record.priceChange != null ? Number(record.priceChange) : null,
    lastUpdated: priceDate ? new Date(priceDate).toISOString() : null,
    category: commodity,
    state: record.state ?? null,
    market: record.market ?? null,
    district: record.district ?? null,
    unit: record.unit ?? '₹/quintal',
  };
}

/** Normalize raw API records (snake_case) to a consistent shape for toProductShape. */
function normalizeRecord(raw) {
  if (!raw || typeof raw !== 'object') return null;
  return {
    ...raw,
    commodity: raw.commodity ?? raw.Commodity,
    state: raw.state ?? raw.State,
    district: raw.district ?? raw.District,
    market: raw.market ?? raw.Market,
    min_price: raw.min_price ?? raw.Min_Price,
    max_price: raw.max_price ?? raw.Max_Price,
    modal_price: raw.modal_price ?? raw.Modal_Price,
    arrival_date: raw.arrival_date ?? raw.Arrival_Date,
  };
}

/** Fetch raw records from data.gov.in (no pagination; use limit/offset for initial fetch). */
async function fetchFromGovApi(params = {}) {
  const url = MARKET_PRICES_API_URL;
  if (!url || !MARKET_PRICES_API_KEY) {
    throw new ApiError(502, 'Market prices API is not configured (MARKET_PRICES_API_URL / MARKET_PRICES_API_KEY).');
  }
  const { limit = 1000, offset = 0 } = params;
  try {
    const response = await axios.get(url, {
      params: {
        'api-key': MARKET_PRICES_API_KEY,
        format: 'json',
        limit,
        offset,
      },
      timeout: 15000,
    });
    const data = response.data;
    // data.gov.in often returns { records: [...] }; some resources use different keys
    const records = Array.isArray(data)
      ? data
      : (data.records || data.data || data.result || []);
    return Array.isArray(records) ? records : [];
  } catch (err) {
    const message = err.response?.data?.message || err.message || 'External market API request failed';
    const status = err.response?.status;
    // Log server-side for debugging
    if (typeof process !== 'undefined' && process.emit) {
      console.error('[market.service] data.gov.in API error:', {
        message,
        status,
        url,
        err: err.message,
      });
    }
    throw new ApiError(502, `Market prices service unavailable: ${message}`);
  }
}

/** Get cache key from query (exclude page/limit for caching full result set). */
function cacheKey(query) {
  const { page, limit, ...rest } = query || {};
  return JSON.stringify(rest);
}

/** Get filtered and sorted records; use cache when possible. */
async function getFilteredRecords(query = {}) {
  const key = cacheKey(query);
  const cached = memoryCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }
  const { state, district, commodity, q } = query;
  const rawRecords = await fetchFromGovApi({ limit: 1000, offset: 0 });
  const normalized = rawRecords.map(normalizeRecord).filter(Boolean);
  let list = normalized
    .map((r, i) => toProductShape(r, i))
    .filter(Boolean);

  if (state && state.trim()) {
    const re = new RegExp(state.trim(), 'i');
    list = list.filter((p) => p.state && re.test(p.state));
  }
  if (district && district.trim()) {
    const re = new RegExp(district.trim(), 'i');
    list = list.filter((p) => p.district && re.test(p.district));
  }
  if (commodity && commodity.trim()) {
    const re = new RegExp(commodity.trim(), 'i');
    list = list.filter((p) => p.name && re.test(p.name));
  }
  if (q && q.trim()) {
    const re = new RegExp(q.trim(), 'i');
    list = list.filter(
      (p) =>
        (p.name && re.test(p.name)) ||
        (p.market && re.test(p.market)) ||
        (p.state && re.test(p.state)) ||
        (p.district && re.test(p.district))
    );
  }

  const sortParam = query.sort;
  if (sortParam === 'price_asc') {
    list.sort((a, b) => (a.currentPrice ?? 0) - (b.currentPrice ?? 0));
  } else if (sortParam === 'price_desc') {
    list.sort((a, b) => (b.currentPrice ?? 0) - (a.currentPrice ?? 0));
  } else {
    list.sort((a, b) => {
      const da = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
      const db = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
      return db - da;
    });
  }

  memoryCache.set(key, { data: list, fetchedAt: Date.now() });
  return list;
}

const getPrices = async (query = {}) => {
  const { page = 1, limit = 50 } = query;
  const list = await getFilteredRecords(query);
  const totalItems = list.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const skip = (page - 1) * limit;
  const data = list.slice(skip, skip + limit);

  const pagination = {
    page,
    limit,
    totalCount: totalItems,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
  };

  return { data, pagination };
};

/** Get distinct commodities from the external API (cached via getFilteredRecords). */
const getCommodities = async () => {
  const list = await getFilteredRecords({});
  const set = new Set();
  list.forEach((p) => {
    if (p.name && p.name !== '—') set.add(p.name);
  });
  return Array.from(set).sort();
};

/** Get distinct states from the external API (cached via getFilteredRecords). */
const getStates = async () => {
  const list = await getFilteredRecords({});
  const set = new Set();
  list.forEach((p) => {
    if (p.state) set.add(p.state);
  });
  return Array.from(set).sort();
};

module.exports = {
  getPrices,
  getCommodities,
  getStates,
};
