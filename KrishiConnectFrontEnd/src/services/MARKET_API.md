# Market Prices API Integration

## Overview

- **Frontend** calls the backend at `VITE_API_URL` (e.g. `http://localhost:5005/api/v1`). No API keys are stored in the frontend.
- **Backend** exposes `GET /market/prices`, `GET /market/commodities`, `GET /market/states`. Data comes from the database (MarketPrice model). Optionally an external market API can be proxied via env.

## API Contract

### GET /market/prices

**Query params (all optional):**

| Param     | Type   | Description                    |
|----------|--------|--------------------------------|
| `q`      | string | Search (commodity, market, state) |
| `commodity` | string | Filter by category           |
| `state`  | string | Filter by state               |
| `district` | string | Filter by district          |
| `date`   | string | Filter by date (YYYY-MM-DD)   |
| `page`   | number | Page (default 1)              |
| `limit`  | number | Page size (default 20, max 100) |
| `sort`   | string | `price_asc` \| `price_desc` \| `recent` |

**Response:** `{ data: { data: Product[], meta: { pagination } } }`

**Product shape:** `id`, `name`, `currentPrice`, `currency`, `minPrice`, `maxPrice`, `priceChange`, `lastUpdated`, `category`, `state`, `market`, `district`, `unit`.

### GET /market/commodities

**Response:** `{ data: string[] }` — list of distinct commodity names for filters.

### GET /market/states

**Response:** `{ data: string[] }` — list of distinct states for filters.

## How to Test

1. **Backend running** (e.g. `npm run dev` in `khetibari-backend`) with MongoDB and at least one `MarketPrice` document (or run a seed script).
2. **Frontend** `VITE_API_URL` must point to that backend (e.g. `http://localhost:5005/api/v1`).
3. Open **Market** page → **Price Table** tab. You should see:
   - Loading skeleton, then product cards, or
   - Empty state if the backend has no market data.
4. Use **Search** (debounced), **Filters** (Category, State), **Sort** (price low/high, recent), and **Pagination**.

## Caching & Debounce

- **Cache:** Product list is cached for 7 minutes (see `useMarketPrices.js`). Use **Refresh** or `refetch()` to bypass.
- **Search:** Debounced by 350 ms to avoid excessive requests.

## Adding Seed Data (Backend)

If MongoDB has no `MarketPrice` documents, the list will be empty. You can insert sample documents that match the schema in `market.model.js` (state, district, market, commodity, minPrice, maxPrice, modalPrice, priceDate, etc.).
