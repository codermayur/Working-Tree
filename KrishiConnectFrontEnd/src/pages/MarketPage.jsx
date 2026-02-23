import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, RefreshCw, TrendingUp, TrendingDown, Star, Filter,
  X, ChevronDown, BarChart2, Newspaper, ArrowUpRight, ArrowDownRight,
  Plus, Minus, CheckCircle, AlertCircle, Eye, SlidersHorizontal,
  Leaf, ShoppingCart, MapPin, Clock, Bookmark, Bell
} from 'lucide-react';

// ============================================================================
// ✅ API PLACEHOLDER FUNCTIONS
// Replace these with actual API calls to your backend
// ============================================================================
const API_BASE = 'http://localhost:5000/api';
const delay = (ms) => new Promise(r => setTimeout(r, ms));

const marketApi = {
  // TODO: GET ${API_BASE}/market/prices?crop=${crop}&state=${state}&type=${type}
  // Returns: { prices: CommodityPrice[] }
  fetchMarketPrices: async (filters = {}) => {
    await delay(800);
    return { prices: generateDemoPrices(filters) };
  },

  // TODO: GET ${API_BASE}/market/trends?crop=${crop}
  // Returns: { trends: TrendPoint[] }
  fetchCropTrends: async (crop) => {
    await delay(600);
    return { trends: generateTrendData(crop) };
  },

  // TODO: GET ${API_BASE}/market/news
  // Returns: { news: NewsItem[] }
  fetchMarketNews: async () => {
    await delay(500);
    return { news: DEMO_NEWS };
  },

  // TODO: GET ${API_BASE}/market/gainers-losers
  // Returns: { gainers: CommodityPrice[], losers: CommodityPrice[] }
  fetchGainersLosers: async () => {
    await delay(400);
    return { gainers: DEMO_GAINERS, losers: DEMO_LOSERS };
  },
};

// ============================================================================
// DEMO DATA — Remove when backend is connected
// ============================================================================
const ALL_CROPS = ['Wheat', 'Rice', 'Tomato', 'Potato', 'Onion', 'Soybean', 'Cotton', 'Sugarcane', 'Maize', 'Mustard'];
const ALL_STATES = ['Uttar Pradesh', 'Punjab', 'Maharashtra', 'Rajasthan', 'Madhya Pradesh', 'Haryana', 'Gujarat', 'Bihar'];
const MARKET_TYPES = ['APMC', 'Mandi', 'Wholesale', 'E-Nam'];

const CROP_EMOJIS = {
  Wheat: '🌾', Rice: '🍚', Tomato: '🍅', Potato: '🥔', Onion: '🧅',
  Soybean: '🫘', Cotton: '🤍', Sugarcane: '🎋', Maize: '🌽', Mustard: '🌼',
};

const BASE_PRICES = {
  Wheat: 2100, Rice: 2800, Tomato: 1800, Potato: 1200, Onion: 2200,
  Soybean: 4200, Cotton: 6500, Sugarcane: 350, Maize: 1900, Mustard: 5100,
};

function generateDemoPrices(filters) {
  const crops = filters.crop && filters.crop !== 'All' ? [filters.crop] : ALL_CROPS;
  const states = filters.state && filters.state !== 'All' ? [filters.state] : ALL_STATES.slice(0, 4);

  return crops.flatMap(crop =>
    states.slice(0, 2).map((state, idx) => {
      const base = BASE_PRICES[crop] || 2000;
      const variance = (Math.random() - 0.5) * base * 0.3;
      const min = Math.round(base * 0.85 + variance);
      const max = Math.round(base * 1.15 + variance);
      const avg = Math.round((min + max) / 2);
      const change = parseFloat(((Math.random() - 0.45) * 10).toFixed(1));
      return {
        id: `${crop}-${state}-${idx}`,
        crop, state,
        market: `${state.split(' ')[0]} Mandi`,
        marketType: MARKET_TYPES[idx % MARKET_TYPES.length],
        minPrice: min, maxPrice: max, avgPrice: avg,
        unit: crop === 'Sugarcane' ? '₹/quintal' : '₹/quintal',
        change, // percent
        trend: change >= 0 ? 'up' : 'down',
        volume: `${Math.round(Math.random() * 500 + 50)} MT`,
        lastUpdated: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      };
    })
  );
}

function generateTrendData(crop) {
  const base = BASE_PRICES[crop] || 2000;
  return Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    price: Math.round(base + (Math.random() - 0.5) * base * 0.2 + i * 5),
  }));
}

const DEMO_GAINERS = [
  { id: 'g1', crop: 'Tomato', change: 12.4, avgPrice: 2100, icon: '🍅', market: 'Pune Mandi' },
  { id: 'g2', crop: 'Soybean', change: 8.7, avgPrice: 4580, icon: '🫘', market: 'Indore APMC' },
  { id: 'g3', crop: 'Mustard', change: 6.2, avgPrice: 5340, icon: '🌼', market: 'Jaipur Mandi' },
];

const DEMO_LOSERS = [
  { id: 'l1', crop: 'Onion', change: -9.8, avgPrice: 1850, icon: '🧅', market: 'Nashik APMC' },
  { id: 'l2', crop: 'Potato', change: -7.3, avgPrice: 980, icon: '🥔', market: 'Agra Mandi' },
  { id: 'l3', crop: 'Maize', change: -4.1, avgPrice: 1760, icon: '🌽', market: 'Ludhiana Mandi' },
];

const DEMO_NEWS = [
  {
    id: 'n1', category: 'Policy',
    title: 'Government raises MSP for Kharif crops by 8% for 2024-25 season',
    summary: 'Cabinet Committee on Economic Affairs approves increase in Minimum Support Price to benefit 14 crore farmers.',
    source: 'AgriNews', time: '2 hours ago', urgent: true,
  },
  {
    id: 'n2', category: 'Market',
    title: 'Onion prices crash 40% in Nashik due to bumper harvest',
    summary: 'Surplus arrivals at APMC markets push prices to lowest level in three years. Farmers seek government intervention.',
    source: 'Krishak Jagat', time: '5 hours ago', urgent: false,
  },
  {
    id: 'n3', category: 'Export',
    title: 'India\'s basmati rice exports surge 22% in Q1 amid global demand',
    summary: 'Strong demand from Middle East and Europe drives record export earnings for basmati rice farmers.',
    source: 'Economic Times Agri', time: '1 day ago', urgent: false,
  },
  {
    id: 'n4', category: 'Technology',
    title: 'e-NAM platform records highest-ever daily trading volume of ₹1,200 crore',
    summary: 'Digital integration of mandis across 22 states helps farmers access better prices and reduce intermediary costs.',
    source: 'Digital Agri', time: '2 days ago', urgent: false,
  },
];

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

const SkeletonBlock = ({ w = '100%', h = '1rem', rounded = '0.5rem' }) => (
  <div style={{
    width: w, height: h, borderRadius: rounded,
    background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  }} />
);

const TrendBadge = ({ change }) => {
  const isUp = change >= 0;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
      padding: '3px 8px', borderRadius: '999px',
      background: isUp ? '#f0fdf4' : '#fef2f2',
      color: isUp ? '#16a34a' : '#dc2626',
      fontSize: '0.75rem', fontWeight: '700',
    }}>
      {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {isUp ? '+' : ''}{change}%
    </span>
  );
};

// Mini sparkline using SVG
const Sparkline = ({ data, color }) => {
  if (!data || data.length < 2) return null;
  const prices = data.map(d => d.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const w = 120, h = 40, pad = 4;

  const points = prices.map((p, i) => {
    const x = pad + (i / (prices.length - 1)) * (w - pad * 2);
    const y = pad + ((max - p) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(' ');

  const fillPoints = `${pad},${h - pad} ${points} ${w - pad},${h - pad}`;

  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill={`url(#grad-${color})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const NewsCard = ({ item }) => (
  <div style={{
    padding: '1rem', border: '1.5px solid #e5e7eb', borderRadius: '0.875rem',
    background: '#fff', transition: 'all 0.2s', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', gap: '0.4rem',
  }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = '#bbf7d0'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.07)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{
        fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em',
        padding: '2px 8px', borderRadius: '999px',
        background: item.urgent ? '#fef2f2' : '#f0fdf4',
        color: item.urgent ? '#dc2626' : '#16a34a',
      }}>{item.category}</span>
      <span style={{ fontSize: '0.68rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <Clock size={10} /> {item.time}
      </span>
    </div>
    <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#111827', lineHeight: '1.4', fontFamily: "'Lora', Georgia, serif" }}>{item.title}</h4>
    <p style={{ fontSize: '0.77rem', color: '#6b7280', lineHeight: '1.5' }}>{item.summary}</p>
    <span style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: '500' }}>— {item.source}</span>
  </div>
);

const GainerLoserCard = ({ item, type }) => {
  const isGainer = type === 'gainer';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0.75rem 0.875rem', borderRadius: '0.75rem',
      background: isGainer ? '#f0fdf4' : '#fef2f2',
      border: `1.5px solid ${isGainer ? '#bbf7d0' : '#fecaca'}`,
      transition: 'transform 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
        <div>
          <p style={{ fontWeight: '700', fontSize: '0.85rem', color: '#111827' }}>{item.crop}</p>
          <p style={{ fontSize: '0.7rem', color: '#6b7280' }}>{item.market}</p>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ fontWeight: '800', fontSize: '0.9rem', color: '#111827' }}>₹{item.avgPrice.toLocaleString('en-IN')}</p>
        <TrendBadge change={item.change} />
      </div>
    </div>
  );
};

// ============================================================================
// MAIN MARKET PAGE
// ============================================================================
const MarketPage = () => {
  const [prices, setPrices] = useState([]);
  const [news, setNews] = useState([]);
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [trends, setTrends] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('All');
  const [selectedState, setSelectedState] = useState('All');
  const [selectedMarketType, setSelectedMarketType] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  // Watchlist
  const [watchlist, setWatchlist] = useState(['Wheat', 'Rice', 'Tomato']);

  // Compare Tool
  const [compareList, setCompareList] = useState([]);
  const [showCompare, setShowCompare] = useState(false);

  // Active section
  const [activeTab, setActiveTab] = useState('prices'); // prices | trends | news | watchlist

  // Selected crop for trend
  const [trendCrop, setTrendCrop] = useState('Wheat');

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const filters = { crop: selectedCrop, state: selectedState, type: selectedMarketType };
      const [priceData, newsData, glData] = await Promise.all([
        marketApi.fetchMarketPrices(filters),
        marketApi.fetchMarketNews(),
        marketApi.fetchGainersLosers(),
      ]);
      setPrices(priceData.prices);
      setNews(newsData.news);
      setGainers(glData.gainers);
      setLosers(glData.losers);
      if (isRefresh) showToast('Market data refreshed!');
    } catch {
      setError('Failed to load market data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCrop, selectedState, selectedMarketType]);

  useEffect(() => {
    loadData();
  }, [selectedCrop, selectedState, selectedMarketType]);

  const loadTrend = useCallback(async (crop) => {
    try {
      const { trends: trendData } = await marketApi.fetchCropTrends(crop);
      setTrends(prev => ({ ...prev, [crop]: trendData }));
    } catch {}
  }, []);

  useEffect(() => {
    loadTrend(trendCrop);
  }, [trendCrop]);

  const toggleWatchlist = (crop) => {
    if (watchlist.includes(crop)) {
      setWatchlist(prev => prev.filter(c => c !== crop));
      showToast(`${crop} removed from watchlist`);
    } else {
      setWatchlist(prev => [...prev, crop]);
      showToast(`${crop} added to watchlist! ⭐`);
    }
  };

  const toggleCompare = (id) => {
    if (compareList.includes(id)) {
      setCompareList(prev => prev.filter(c => c !== id));
    } else if (compareList.length < 3) {
      setCompareList(prev => [...prev, id]);
      if (compareList.length === 1) showToast('Select one more to compare');
    } else {
      showToast('Maximum 3 items can be compared', 'error');
    }
  };

  const filteredPrices = prices.filter(p => {
    const q = searchQuery.toLowerCase();
    return (!q || p.crop.toLowerCase().includes(q) || p.market.toLowerCase().includes(q) || p.state.toLowerCase().includes(q));
  });

  const comparePrices = prices.filter(p => compareList.includes(p.id));
  const watchlistPrices = prices.filter(p => watchlist.includes(p.crop));

  const applyFilters = () => {
    setShowFilters(false);
    loadData();
  };

  const clearFilters = () => {
    setSelectedCrop('All');
    setSelectedState('All');
    setSelectedMarketType('All');
    setSearchQuery('');
    setShowFilters(false);
  };

  const activeFilterCount = [selectedCrop, selectedState, selectedMarketType].filter(v => v !== 'All').length;

  // Trend chart renderer
  const renderTrendChart = () => {
    const data = trends[trendCrop];
    if (!data || data.length < 2) return <SkeletonBlock h="160px" rounded="0.75rem" />;
    const prices_vals = data.map(d => d.price);
    const min = Math.min(...prices_vals);
    const max = Math.max(...prices_vals);
    const range = max - min || 1;
    const w = 600, h = 140, pad = 20;
    const isUp = prices_vals[prices_vals.length - 1] > prices_vals[0];
    const color = isUp ? '#10b981' : '#ef4444';

    const pts = prices_vals.map((p, i) => {
      const x = pad + (i / (prices_vals.length - 1)) * (w - pad * 2);
      const y = pad + ((max - p) / range) * (h - pad * 2);
      return `${x},${y}`;
    });
    const polyPoints = pts.join(' ');
    const fillPoints = `${pad},${h - pad} ${polyPoints} ${w - pad},${h - pad}`;

    return (
      <div style={{ overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', minWidth: '300px', height: 'auto' }}>
          <defs>
            <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.2" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
            <line key={i}
              x1={pad} y1={pad + t * (h - pad * 2)}
              x2={w - pad} y2={pad + t * (h - pad * 2)}
              stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4,4"
            />
          ))}
          <polygon points={fillPoints} fill="url(#trendGrad)" />
          <polyline points={polyPoints} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Last point dot */}
          <circle cx={w - pad} cy={pad + ((max - prices_vals[prices_vals.length - 1]) / range) * (h - pad * 2)} r="5" fill={color} />
          {/* Labels */}
          <text x={pad} y={h - 4} fontSize="10" fill="#9ca3af">Day 1</text>
          <text x={w - pad - 30} y={h - 4} fontSize="10" fill="#9ca3af">Day {data.length}</text>
          <text x={pad + 4} y={pad + ((max - prices_vals[0]) / range) * (h - pad * 2) - 6} fontSize="10" fill={color} fontWeight="700">₹{prices_vals[0].toLocaleString('en-IN')}</text>
          <text x={w - pad - 60} y={pad + ((max - prices_vals[prices_vals.length - 1]) / range) * (h - pad * 2) - 6} fontSize="10" fill={color} fontWeight="700">₹{prices_vals[prices_vals.length - 1].toLocaleString('en-IN')}</text>
        </svg>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #f3f4f6; }
        ::-webkit-scrollbar-thumb { background: #d1fae5; border-radius: 2px; }
        select { appearance: none; background-image: none; }
        th { font-weight: 700; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
          background: toast.type === 'error' ? '#dc2626' : '#065f46',
          color: '#fff', padding: '0.75rem 1.25rem', borderRadius: '0.75rem',
          fontSize: '0.85rem', fontWeight: '600', boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          animation: 'fadeIn 0.3s ease',
        }}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Compare Panel */}
      {compareList.length >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-green-700 dark:bg-green-800 text-white px-6 py-3 rounded-full shadow-lg z-[1000]">
          <span className="text-sm font-semibold">{compareList.length} items selected</span>
          <button onClick={() => setShowCompare(true)} className="bg-white text-green-700 dark:bg-gray-100 dark:text-green-800 px-4 py-2 rounded-xl font-bold text-sm hover:opacity-90 transition">
            Compare Now
          </button>
          <button onClick={() => setCompareList([])} className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Compare Modal */}
      {showCompare && comparePrices.length >= 2 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-4" onClick={() => setShowCompare(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-[700px] w-full max-h-[80vh] overflow-y-auto border border-gray-200 dark:border-gray-700 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                📊 Price Comparison
              </h3>
              <button onClick={() => setShowCompare(false)} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                <X size={16} />
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                <thead>
                  <tr>
                    {['Crop', 'Market', 'Min Price', 'Max Price', 'Avg Price', 'Trend', 'Volume'].map(h => (
                      <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparePrices.map(p => (
                    <tr key={p.id} style={{ background: '#f9fafb' }}>
                      <td style={{ padding: '0.75rem', borderRadius: '0.5rem 0 0 0.5rem', fontWeight: '700', color: '#111827', fontSize: '0.875rem' }}>
                        {CROP_EMOJIS[p.crop]} {p.crop}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#4b5563' }}>{p.market}</td>
                      <td style={{ padding: '0.75rem', fontWeight: '600', fontSize: '0.875rem', color: '#111827' }}>₹{p.minPrice.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '0.75rem', fontWeight: '600', fontSize: '0.875rem', color: '#111827' }}>₹{p.maxPrice.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '0.75rem', fontWeight: '800', fontSize: '0.95rem', color: '#065f46' }}>₹{p.avgPrice.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '0.75rem' }}><TrendBadge change={p.change} /></td>
                      <td style={{ padding: '0.75rem', borderRadius: '0 0.5rem 0.5rem 0', fontSize: '0.8rem', color: '#6b7280' }}>{p.volume}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Header - same pattern as NetworkPage, AlertsPage */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-20 shadow-sm transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <TrendingUp size={22} className="text-green-600 dark:text-green-400" /> Market
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Live mandi prices, trends & news</p>
            </div>
            <button
              onClick={() => loadData(true)}
              disabled={refreshing || loading}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-70 transition shadow-sm"
            >
              <RefreshCw size={16} className={refreshing || loading ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <input
              type="search"
              placeholder="Search crops, markets, states..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 dark:focus:ring-green-600 focus:bg-white dark:focus:bg-gray-600 transition placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* Filters toggle */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border transition ${showFilters ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              <SlidersHorizontal size={15} /> Filters
              {activeFilterCount > 0 && (
                <span className="px-1.5 py-0.5 text-xs font-bold bg-green-600 text-white rounded-full">{activeFilterCount}</span>
              )}
            </button>
            {(searchQuery || activeFilterCount > 0) && (
              <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800 transition">
                <X size={14} /> Clear
              </button>
            )}
          </div>

          {/* Filter dropdowns (in header when expanded) */}
          {showFilters && (
            <div className="mt-3 flex flex-wrap gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              {[
                { label: 'Crop', value: selectedCrop, setter: setSelectedCrop, options: ['All', ...ALL_CROPS] },
                { label: 'State', value: selectedState, setter: setSelectedState, options: ['All', ...ALL_STATES] },
                { label: 'Market Type', value: selectedMarketType, setter: setSelectedMarketType, options: ['All', ...MARKET_TYPES] },
              ].map(({ label, value, setter, options }) => (
                <div key={label} className="flex-1 min-w-[140px]">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">{label}</label>
                  <select
                    value={value}
                    onChange={e => setter(e.target.value)}
                    className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-200 dark:focus:ring-green-600"
                  >
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div className="flex items-end">
                <button onClick={applyFilters} className="px-4 py-2 rounded-xl text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition">
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 pb-24">

        {/* Gainers & Losers - same card style as other pages */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm transition-colors duration-200">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={18} className="text-green-600 dark:text-green-400" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Top Gainers</h3>
            </div>
            {loading ? [...Array(3)].map((_, i) => <SkeletonBlock key={i} h="52px" rounded="0.75rem" />) : (
              <div className="flex flex-col gap-2">
                {gainers.map(g => <GainerLoserCard key={g.id} item={g} type="gainer" />)}
              </div>
            )}
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm transition-colors duration-200">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown size={18} className="text-red-500 dark:text-red-400" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Top Losers</h3>
            </div>
            {loading ? [...Array(3)].map((_, i) => <SkeletonBlock key={i} h="52px" rounded="0.75rem" />) : (
              <div className="flex flex-col gap-2">
                {losers.map(l => <GainerLoserCard key={l.id} item={l} type="loser" />)}
              </div>
            )}
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {[
            { id: 'prices', label: '💰 Price Table' },
            { id: 'trends', label: '📈 Price Trends' },
            { id: 'news', label: '📰 Market News' },
            { id: 'watchlist', label: `⭐ Watchlist (${watchlist.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition ${activeTab === tab.id ? 'bg-green-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-2xl p-6 text-center mb-6">
            <AlertCircle size={28} className="text-red-500 mx-auto mb-2" />
            <p className="text-red-700 dark:text-red-300 font-semibold">{error}</p>
            <button onClick={() => loadData()} className="mt-3 px-5 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition">
              Retry
            </button>
          </div>
        )}

        {/* Price Table Tab */}
        {activeTab === 'prices' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm transition-colors duration-200">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex flex-wrap justify-between items-center gap-2">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                Commodity Price Board
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {filteredPrices.length} records · Click ⊕ to compare (max 3)
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              {loading ? (
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[...Array(8)].map((_, i) => <SkeletonBlock key={i} h="48px" rounded="0.5rem" />)}
                </div>
              ) : filteredPrices.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                  <ShoppingCart size={36} style={{ margin: '0 auto 0.75rem', color: '#d1d5db' }} />
                  <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>No results found</p>
                  <p style={{ fontSize: '0.8rem' }}>Try adjusting your search or filters</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      {['', 'Crop', 'Market', 'State', 'Min Price', 'Avg Price', 'Max Price', 'Change', 'Volume', 'Updated', 'Watch'].map(h => (
                        <th key={h} style={{
                          padding: '0.65rem 0.875rem', textAlign: 'left',
                          fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em',
                          color: '#6b7280', fontWeight: '700', whiteSpace: 'nowrap',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPrices.map((p, i) => {
                      const isSelected = compareList.includes(p.id);
                      return (
                        <tr key={p.id} style={{
                          borderTop: '1px solid #f3f4f6',
                          background: isSelected ? '#f0fdf4' : (i % 2 === 0 ? '#fff' : '#fafafa'),
                          transition: 'background 0.15s',
                        }}
                          onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f9fafb'; }}
                          onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafafa'; }}
                        >
                          {/* Compare checkbox */}
                          <td style={{ padding: '0.65rem 0.5rem 0.65rem 1rem' }}>
                            <button
                              onClick={() => toggleCompare(p.id)}
                              title="Add to compare"
                              style={{
                                width: '22px', height: '22px', borderRadius: '0.35rem',
                                border: `2px solid ${isSelected ? '#10b981' : '#d1d5db'}`,
                                background: isSelected ? '#10b981' : '#fff',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s',
                              }}
                            >
                              {isSelected && <CheckCircle size={12} style={{ color: '#fff' }} />}
                            </button>
                          </td>
                          <td style={{ padding: '0.65rem 0.875rem', fontWeight: '700', fontSize: '0.875rem', color: '#111827', whiteSpace: 'nowrap' }}>
                            {CROP_EMOJIS[p.crop] || '🌱'} {p.crop}
                          </td>
                          <td style={{ padding: '0.65rem 0.875rem', fontSize: '0.8rem', color: '#374151', whiteSpace: 'nowrap' }}>
                            <div>{p.market}</div>
                            <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>{p.marketType}</div>
                          </td>
                          <td style={{ padding: '0.65rem 0.875rem', fontSize: '0.8rem', color: '#6b7280', whiteSpace: 'nowrap' }}>{p.state}</td>
                          <td style={{ padding: '0.65rem 0.875rem', fontSize: '0.82rem', color: '#374151', whiteSpace: 'nowrap' }}>
                            ₹{p.minPrice.toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '0.65rem 0.875rem', fontWeight: '800', fontSize: '0.95rem', color: '#065f46', whiteSpace: 'nowrap' }}>
                            ₹{p.avgPrice.toLocaleString('en-IN')}
                            <div style={{ fontSize: '0.65rem', color: '#9ca3af', fontWeight: '400' }}>/quintal</div>
                          </td>
                          <td style={{ padding: '0.65rem 0.875rem', fontSize: '0.82rem', color: '#374151', whiteSpace: 'nowrap' }}>
                            ₹{p.maxPrice.toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '0.65rem 0.875rem' }}>
                            <TrendBadge change={p.change} />
                          </td>
                          <td style={{ padding: '0.65rem 0.875rem', fontSize: '0.78rem', color: '#6b7280', whiteSpace: 'nowrap' }}>{p.volume}</td>
                          <td style={{ padding: '0.65rem 0.875rem', fontSize: '0.72rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                            {new Date(p.lastUpdated).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td style={{ padding: '0.65rem 1rem 0.65rem 0.5rem' }}>
                            <button
                              onClick={() => toggleWatchlist(p.crop)}
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                padding: '0.25rem',
                              }}
                            >
                              <Star size={15} style={{
                                color: watchlist.includes(p.crop) ? '#f59e0b' : '#d1d5db',
                                fill: watchlist.includes(p.crop) ? '#f59e0b' : 'none',
                                transition: 'all 0.2s',
                              }} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── TRENDS TAB ── */}
        {activeTab === 'trends' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.4s ease' }}>
            {/* Crop Selector */}
            <div style={{
              background: '#fff', borderRadius: '1.25rem', padding: '1.25rem',
              border: '1.5px solid #e5e7eb',
            }}>
              <h3 style={{ fontFamily: "'Lora', Georgia, serif", fontSize: '0.95rem', fontWeight: '700', color: '#111827', marginBottom: '0.875rem' }}>
                30-Day Price Trend
              </h3>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                {ALL_CROPS.map(crop => (
                  <button key={crop} onClick={() => setTrendCrop(crop)} style={{
                    padding: '0.35rem 0.875rem', borderRadius: '999px', border: 'none', cursor: 'pointer',
                    background: trendCrop === crop ? '#065f46' : '#f3f4f6',
                    color: trendCrop === crop ? '#fff' : '#374151',
                    fontSize: '0.78rem', fontWeight: '600', transition: 'all 0.2s',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    {CROP_EMOJIS[crop]} {crop}
                  </button>
                ))}
              </div>

              <div style={{ background: '#f9fafb', borderRadius: '0.75rem', padding: '1rem' }}>
                {/* Chart Title */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.875rem', fontWeight: '700', color: '#111827' }}>{trendCrop} — ₹/quintal</span>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: '0.5rem' }}>Last 30 days</span>
                  </div>
                  {trends[trendCrop] && (
                    <TrendBadge change={parseFloat(((trends[trendCrop].slice(-1)[0].price - trends[trendCrop][0].price) / trends[trendCrop][0].price * 100).toFixed(1))} />
                  )}
                </div>
                {renderTrendChart()}
              </div>
            </div>

            {/* Sparkline Grid */}
            <div style={{
              background: '#fff', borderRadius: '1.25rem', padding: '1.25rem',
              border: '1.5px solid #e5e7eb',
            }}>
              <h3 style={{ fontFamily: "'Lora', Georgia, serif", fontSize: '0.95rem', fontWeight: '700', color: '#111827', marginBottom: '1rem' }}>
                Quick Overview — All Crops
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {ALL_CROPS.map(crop => {
                  const basePrice = BASE_PRICES[crop];
                  const change = parseFloat(((Math.random() - 0.45) * 12).toFixed(1));
                  const isUp = change >= 0;
                  const sparkData = Array.from({ length: 15 }, (_, i) => ({
                    price: basePrice + (Math.random() - 0.5) * basePrice * 0.15 + i * 3
                  }));
                  return (
                    <div key={crop} style={{
                      padding: '0.875rem', border: '1.5px solid #e5e7eb', borderRadius: '0.875rem',
                      cursor: 'pointer', transition: 'all 0.2s',
                      background: trendCrop === crop ? '#f0fdf4' : '#fff',
                      borderColor: trendCrop === crop ? '#bbf7d0' : '#e5e7eb',
                    }}
                      onClick={() => { setTrendCrop(crop); loadTrend(crop); }}
                      onMouseEnter={e => { if (trendCrop !== crop) e.currentTarget.style.background = '#f9fafb'; }}
                      onMouseLeave={e => { if (trendCrop !== crop) e.currentTarget.style.background = '#fff'; }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#111827' }}>{CROP_EMOJIS[crop]} {crop}</span>
                          <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#065f46', marginTop: '0.1rem' }}>
                            ₹{basePrice.toLocaleString('en-IN')}
                          </div>
                        </div>
                        <TrendBadge change={change} />
                      </div>
                      <Sparkline data={sparkData} color={isUp ? '#10b981' : '#ef4444'} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── NEWS TAB ── */}
        {activeTab === 'news' && (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <div style={{
              background: '#fff', borderRadius: '1.25rem', padding: '1.25rem',
              border: '1.5px solid #e5e7eb', marginBottom: '1rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontFamily: "'Lora', Georgia, serif", fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>
                  Market News & Updates
                </h3>
                <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{news.length} articles</span>
              </div>

              {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                  {[...Array(4)].map((_, i) => <SkeletonBlock key={i} h="120px" rounded="0.875rem" />)}
                </div>
              ) : news.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: '#6b7280' }}>
                  <Newspaper size={32} style={{ margin: '0 auto 0.5rem', color: '#d1d5db' }} />
                  <p style={{ fontWeight: '600' }}>No news available</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                  {news.map(item => <NewsCard key={item.id} item={item} />)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── WATCHLIST TAB ── */}
        {activeTab === 'watchlist' && (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <div style={{
              background: '#fff', borderRadius: '1.25rem', padding: '1.25rem',
              border: '1.5px solid #e5e7eb',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontFamily: "'Lora', Georgia, serif", fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>
                  ⭐ My Crop Watchlist
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  Click ★ on price table to add crops
                </span>
              </div>

              {watchlist.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                  <Star size={36} style={{ margin: '0 auto 0.75rem', color: '#fde68a' }} />
                  <p style={{ fontWeight: '700', marginBottom: '0.25rem' }}>Watchlist is empty</p>
                  <p style={{ fontSize: '0.8rem' }}>Go to Price Table and click ★ next to crops you want to track</p>
                </div>
              ) : (
                <div>
                  {/* Watchlist Crop Chips */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                    {watchlist.map(crop => (
                      <div key={crop} style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.35rem 0.75rem', background: '#fef3c7', border: '1.5px solid #fde68a',
                        borderRadius: '999px', fontSize: '0.82rem', fontWeight: '600', color: '#92400e',
                      }}>
                        {CROP_EMOJIS[crop]} {crop}
                        <button onClick={() => toggleWatchlist(crop)} style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: '0 0.1rem',
                          color: '#92400e', display: 'flex',
                        }}>
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Watchlist Price Cards */}
                  {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                      {[...Array(watchlist.length)].map((_, i) => <SkeletonBlock key={i} h="100px" rounded="0.875rem" />)}
                    </div>
                  ) : watchlistPrices.length === 0 ? (
                    <p style={{ fontSize: '0.82rem', color: '#6b7280', textAlign: 'center' }}>No price data for watchlist crops with current filters.</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                      {watchlistPrices.map(p => (
                        <div key={p.id} style={{
                          padding: '1rem', border: '1.5px solid #e5e7eb', borderRadius: '1rem',
                          background: '#fff', transition: 'all 0.2s',
                        }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#fde68a'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.08)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.625rem' }}>
                            <span style={{ fontSize: '1.25rem' }}>{CROP_EMOJIS[p.crop]}</span>
                            <TrendBadge change={p.change} />
                          </div>
                          <h4 style={{ fontWeight: '800', fontSize: '0.9rem', color: '#111827', marginBottom: '0.2rem' }}>{p.crop}</h4>
                          <p style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: '0.625rem' }}>{p.market}</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                              <p style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Avg Price</p>
                              <p style={{ fontWeight: '800', fontSize: '1.05rem', color: '#065f46' }}>₹{p.avgPrice.toLocaleString('en-IN')}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Range</p>
                              <p style={{ fontSize: '0.75rem', color: '#374151', fontWeight: '600' }}>
                                {p.minPrice.toLocaleString('en-IN')}–{p.maxPrice.toLocaleString('en-IN')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MarketPage;
