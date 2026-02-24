import React, { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Heart, MessageCircle, Share2, Bookmark, Search, Home, Users, Briefcase,
  MessageSquare, Bell, User, Settings, MoreHorizontal, TrendingUp, Droplet,
  Wind, X, Upload, Loader, Edit3, Award, MapPin, LinkIcon, Eye,
  ChevronDown, ChevronUp, Menu, ArrowRight, Plus, Flag, CheckCircle,
  AlertCircle, RefreshCw, Send, Image, FileText, Sparkles, HelpCircle, Languages, Mic
} from 'lucide-react';
import { postService } from '../services/post.service';
import { userService } from '../services/user.service';
import { searchService } from '../services/search.service';
import { authStore } from '../store/authStore';
import { BlockConfirmModal } from '../components/BlockModals';
import toast from 'react-hot-toast';
import AIChatPanel from '../components/AIChatPanel';
import { useTranslatePost } from '../hooks/useTranslatePost';
import { useWeather, INDIAN_CITIES } from '../hooks/useWeather';
import { useSpeechToText, getSpeechRecognitionErrorMessage } from '../hooks/useSpeechToText';
import { useWeatherCoords } from '../context/WeatherContext';

// ============================================================================
// API: postService + userService; demo fallback for weather/market/news
// ============================================================================
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5005/api/v1';

const api = {
  fetchPosts: (page, limit, mode = 'recent') =>
    mode === 'trending' ? postService.getTrending(page, limit) : postService.getRecent(page, limit),
  likePost: (postId) => postService.toggleLike(postId),
  unlikePost: (postId) => postService.toggleLike(postId),
  savePost: (postId) => postService.toggleSave(postId),
  unsavePost: (postId) => postService.toggleSave(postId),
  sharePost: async (postId) => ({ shareUrl: postService.getShareUrl(postId) }),
  reportPost: async (postId, reason) => { await new Promise(r => setTimeout(r, 800)); return { success: true }; },
  fetchComments: (postId) => postService.getComments(postId),
  addComment: (postId, content) => postService.addComment(postId, content),
  fetchCurrentUser: async () => {
    const raw = await userService.getMe();
    return { user: raw };
  },
  fetchUserProfile: async (userId) => ({ user: await userService.getProfile(userId) }),
  followUser: (userId) => userService.followUser(userId),
  unfollowUser: (userId) => userService.unfollowUser(userId),
  updateProfile: async (userId, data) => ({ user: await userService.updateProfile(data) }),
  fetchMarketPrices: async () => { await delay(600); return { prices: DEMO_MARKET_PRICES }; },
  fetchNews: async () => { await delay(500); return { news: DEMO_NEWS }; },
};

// ============================================================================
// DEMO DATA
// ============================================================================
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const CURRENT_USER = {
  _id: 'current-user',
  name: 'Rajesh Kumar',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
  coverPhoto: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&h=300&fit=crop',
  headline: 'Organic Farmer | Wheat & Rice Specialist',
  location: 'Bijnor, Uttar Pradesh',
  bio: 'Passionate about sustainable agriculture and helping fellow farmers grow better crops.',
  followersCount: 2450, followingCount: 1203, postsCount: 48, savedCount: 156,
  verified: true, profileViewers: 60, postImpressions: 27,
  education: 'Agricultural Science Degree, IARI New Delhi',
  experience: '12 years in organic farming',
  website: 'www.krishiconnect.farm',
  joinedDate: 'Joined February 2022',
  connections: [
    { _id: 'u2', name: 'Priya Singh', role: 'Vegetable Farmer', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop' },
    { _id: 'u3', name: 'Amit Patel', role: 'Sugarcane Farmer', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop' },
  ],
};

const DEMO_POSTS = [
  {
    _id: 'post-1',
    author: { _id: 'u2', name: 'Priya Singh', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop', headline: 'Vegetable Farmer | Tomato Expert', verified: true },
    content: 'Just harvested 50 quintals of tomatoes this season! 🍅 The new drip irrigation technique really made a difference. Yield increased by 35%.',
    mediaUrl: 'https://images.unsplash.com/photo-1464454709131-ffd692591ee5?w=600&h=400&fit=crop',
    tags: ['Tomato', 'Irrigation'],
    likesCount: 342, commentsCount: 28, savedCount: 45, sharesCount: 12,
    isLiked: false, isSaved: false,
    createdAt: new Date(Date.now() - 2 * 36e5).toISOString(),
  },
  {
    _id: 'post-2',
    author: { _id: 'u3', name: 'Amit Patel', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop', headline: 'Sugarcane Farmer | Consultant', verified: false },
    content: 'Attending the National Agricultural Conference in Delhi this week. Excited to network with farmers from across India! 🌾',
    mediaUrl: null, tags: ['Conference'],
    likesCount: 189, commentsCount: 16, savedCount: 32, sharesCount: 8,
    isLiked: true, isSaved: false,
    createdAt: new Date(Date.now() - 5 * 36e5).toISOString(),
  },
  {
    _id: 'post-3',
    author: { _id: 'u4', name: 'Neha Sharma', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop', headline: 'Rice Farmer | Women in Agriculture', verified: true },
    content: '🚨 New government subsidy scheme for micro-irrigation approved! Eligible farmers can now apply for 80% subsidy. Check your state agricultural department website for details.',
    mediaUrl: null, tags: ['Subsidy', 'Government'],
    likesCount: 523, commentsCount: 67, savedCount: 108, sharesCount: 34,
    isLiked: false, isSaved: true,
    createdAt: new Date(Date.now() - 8 * 36e5).toISOString(),
  },
];

const DEMO_COMMENTS = [
  { _id: 'c1', author: { _id: 'u5', name: 'Mohan Singh', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop' }, content: 'Amazing results! What irrigation system are you using?', createdAt: new Date(Date.now() - 30 * 60e3).toISOString() },
  { _id: 'c2', author: { _id: 'u6', name: 'Sunita Devi', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop' }, content: 'Congratulations! 🎉 Which variety of tomato gives best yield?', createdAt: new Date(Date.now() - 15 * 60e3).toISOString() },
];

const DEMO_MARKET_PRICES = [
  { crop: 'Wheat', price: 2150, unit: '₹/quintal', change: 2.3, trend: 'up' },
  { crop: 'Rice', price: 3420, unit: '₹/quintal', change: -1.2, trend: 'down' },
  { crop: 'Onion', price: 2890, unit: '₹/quintal', change: 5.8, trend: 'up' },
  { crop: 'Tomato', price: 1240, unit: '₹/quintal', change: -3.5, trend: 'down' },
  { crop: 'Soybean', price: 5120, unit: '₹/quintal', change: 1.5, trend: 'up' },
];
const DEMO_NEWS = [
  { _id: 'n1', title: 'Wheat Prices Rise 8% on Supply Concerns', source: 'AgriNews', publishedAt: new Date(Date.now() - 2 * 36e5).toISOString(), category: 'Market', url: '#' },
  { _id: 'n2', title: 'New Pest Control Guidelines for Monsoon Season', source: 'Ministry of Agriculture', publishedAt: new Date(Date.now() - 6 * 36e5).toISOString(), category: 'Advisory', url: '#' },
  { _id: 'n3', title: 'e-NAM Platform Expansion to 500 Markets', source: 'FarmingToday', publishedAt: new Date(Date.now() - 12 * 36e5).toISOString(), category: 'Technology', url: '#' },
  { _id: 'n4', title: 'Organic Farming Adoption Increased by 25%', source: 'GreenAg', publishedAt: new Date(Date.now() - 24 * 36e5).toISOString(), category: 'Sustainability', url: '#' },
  { _id: 'n5', title: 'Soil Health Card Reaches 10 Million Farmers', source: 'AgriNews', publishedAt: new Date(Date.now() - 36 * 36e5).toISOString(), category: 'Government', url: '#' },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const formatTimeAgo = (dateStr) => {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const formatNumber = (n) => {
  if (!n && n !== 0) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
};

const getNavigate = () => (path) => { window.location.href = path; };

// ============================================================================
// GLOBAL STYLES — injected once at top level
// ============================================================================
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Lora:ital,wght@0,500;0,600;1,400&display=swap');

    *, *::before, *::after { box-sizing: border-box; }

    :root {
      --green-50: #f0fdf4;
      --green-100: #dcfce7;
      --green-200: #bbf7d0;
      --green-500: #22c55e;
      --green-600: #16a34a;
      --green-700: #15803d;
      --green-800: #166534;
      --gray-50: #f8fafc;
      --gray-100: #f1f5f9;
      --gray-200: #e2e8f0;
      --gray-400: #94a3b8;
      --gray-500: #64748b;
      --gray-600: #475569;
      --gray-700: #334155;
      --gray-800: #1e293b;
      --gray-900: #0f172a;
      --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.04);
      --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04);
      --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.04);
      --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.06), 0 4px 6px -4px rgb(0 0 0 / 0.04);
      --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.04);
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 16px;
      --radius-xl: 20px;
      --radius-2xl: 24px;
    }

    body { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--gray-50); }
    .dark body { background: var(--gray-900); }

    /* Smooth scrollbar */
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--gray-200); border-radius: 99px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--gray-400); }
    .dark ::-webkit-scrollbar-thumb { background: var(--gray-600); }
    .dark ::-webkit-scrollbar-thumb:hover { background: var(--gray-500); }

    /* Animations */
    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes heartPop {
      0%   { transform: scale(1); }
      40%  { transform: scale(1.35); }
      70%  { transform: scale(0.9); }
      100% { transform: scale(1); }
    }
    @keyframes shimmer {
      0%   { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes spinOnce {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }

    .anim-fade-slide  { animation: fadeSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .anim-scale-in    { animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .anim-fade        { animation: fadeIn 0.25s ease both; }
    .heart-pop        { animation: heartPop 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }
    .spin             { animation: spin 0.8s linear infinite; }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* Shimmer skeleton */
    .skeleton {
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: shimmer 1.6s ease infinite;
      border-radius: 6px;
    }
    .dark .skeleton {
      background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
      background-size: 200% 100%;
    }

    /* Focus rings */
    .focus-ring:focus-visible {
      outline: 2px solid var(--green-500);
      outline-offset: 2px;
    }

    /* Line clamp */
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* Nav active indicator */
    .nav-active-bar {
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 60%;
      background: var(--green-600);
      border-radius: 0 3px 3px 0;
    }

    /* Post card hover */
    .post-card { transition: box-shadow 0.2s ease, transform 0.2s ease; }
    .post-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-1px); }

    /* Button base */
    .btn { transition: all 0.15s ease; cursor: pointer; border: none; font-family: inherit; }
    .btn:active { transform: scale(0.97); }

    /* Card */
    .card {
      background: #ffffff;
      border: 1px solid #e8edf2;
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-sm);
    }
    .dark .card {
      background: rgb(31 41 55);
      border-color: rgb(55 65 80);
      box-shadow: none;
    }

    /* Sidebar item */
    .sidebar-item { transition: background 0.15s ease, color 0.15s ease; }
    .sidebar-item:hover { background: var(--green-50); }
    .dark .sidebar-item:hover { background: rgb(22 101 52 / 0.2); }

    /* Input */
    .input-base {
      font-family: 'Plus Jakarta Sans', sans-serif;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .input-base:focus {
      outline: none;
      border-color: var(--green-500) !important;
      box-shadow: 0 0 0 3px rgb(34 197 94 / 0.12);
    }

    /* Tag pill */
    .tag-pill {
      transition: background 0.12s ease, color 0.12s ease;
    }
    .tag-pill:hover { background: var(--green-100); color: var(--green-700); }
    .dark .tag-pill:hover { background: rgb(22 101 52 / 0.3); color: #4ade80; }

    /* Stat item hover */
    .stat-hover { transition: background 0.12s ease; }
    .stat-hover:hover { background: white; border-radius: 10px; }
    .dark .stat-hover:hover { background: rgb(55 65 80); }

    /* Action button */
    .action-btn { transition: background 0.12s ease, color 0.12s ease, transform 0.1s ease; }
    .action-btn:hover { background: var(--gray-100); }
    .dark .action-btn:hover { background: rgb(55 65 80); }
    .action-btn:active { transform: scale(0.94); }

    /* Trend badge */
    .trend-up   { color: #16a34a; background: #dcfce7; }
    .trend-down { color: #dc2626; background: #fee2e2; }
    .dark .trend-up   { color: #4ade80; background: rgb(22 101 52 / 0.35); }
    .dark .trend-down { color: #f87171; background: rgb(220 38 38 / 0.25); }

    /* Weather card gradient */
    .weather-gradient {
      background: linear-gradient(135deg, #e0f7fa 0%, #f0fdf4 50%, #ecfdf5 100%);
    }
    .dark .weather-gradient {
      background: linear-gradient(135deg, rgb(30 58 138 / 0.3) 0%, rgb(22 101 52 / 0.25) 50%, rgb(6 95 70 / 0.3) 100%);
    }

    /* Composer bar prompt */
    .composer-prompt {
      transition: background 0.15s ease, box-shadow 0.15s ease;
    }
    .composer-prompt:hover {
      background: #f0fdf4;
      box-shadow: inset 0 0 0 1.5px var(--green-300);
    }
    .dark .composer-prompt:hover {
      background: rgb(22 101 52 / 0.2);
    }

    /* Profile cover overlay */
    .cover-overlay {
      background: linear-gradient(to bottom, transparent 40%, rgba(255,255,255,0.8) 100%);
    }
    .dark .cover-overlay {
      background: linear-gradient(to bottom, transparent 40%, rgba(15,23,42,0.85) 100%);
    }

    /* Mobile nav indicator dot */
    .mobile-nav-dot {
      position: absolute;
      top: 2px; right: 6px;
      width: 8px; height: 8px;
      background: #ef4444;
      border-radius: 50%;
      border: 2px solid white;
    }
    .dark .mobile-nav-dot { border-color: rgb(31 41 55); }

    /* Dropdown shadow */
    .dropdown-shadow {
      box-shadow: 0 8px 30px rgb(0 0 0 / 0.12), 0 2px 8px rgb(0 0 0 / 0.06);
    }
    .dark .dropdown-shadow {
      box-shadow: 0 8px 30px rgb(0 0 0 / 0.4), 0 2px 8px rgb(0 0 0 / 0.2);
    }
  `}</style>
);

// ============================================================================
// SKELETON LOADERS
// ============================================================================
const PostSkeleton = () => (
  <div className="card p-5 mb-3" style={{ animation: 'fadeIn 0.3s ease' }}>
    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
      <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 2 }}>
        <div className="skeleton" style={{ height: 13, width: '38%' }} />
        <div className="skeleton" style={{ height: 11, width: '55%' }} />
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 }}>
      <div className="skeleton" style={{ height: 11 }} />
      <div className="skeleton" style={{ height: 11, width: '88%' }} />
      <div className="skeleton" style={{ height: 11, width: '70%' }} />
    </div>
    <div className="skeleton" style={{ height: 200, borderRadius: 12, marginBottom: 14 }} />
    <div style={{ display: 'flex', gap: 8 }}>
      {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 36, flex: 1, borderRadius: 10 }} />)}
    </div>
  </div>
);

const CardSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
    <div className="skeleton" style={{ height: 13, width: '70%' }} />
    <div className="skeleton" style={{ height: 11 }} />
    <div className="skeleton" style={{ height: 11, width: '55%' }} />
  </div>
);

// ============================================================================
// TOAST
// ============================================================================
const Toast = ({ message, type = 'success', onDismiss }) => (
  <div className="anim-fade-slide" style={{
    position: 'fixed', bottom: 88, left: '50%', transform: 'translateX(-50%)',
    zIndex: 200, display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 18px', borderRadius: 14,
    background: type === 'success' ? '#15803d' : '#dc2626',
    color: 'white', fontSize: 13, fontWeight: 600,
    boxShadow: '0 8px 32px rgb(0 0 0 / 0.2)',
    whiteSpace: 'nowrap',
  }}>
    {type === 'success'
      ? <CheckCircle size={15} />
      : <AlertCircle size={15} />}
    {message}
    <button onClick={onDismiss} className="btn" style={{
      marginLeft: 6, opacity: 0.7, display: 'flex', alignItems: 'center',
      background: 'none', color: 'white', padding: 2,
    }}>
      <X size={13} />
    </button>
  </div>
);

// ============================================================================
// REPORT MODAL
// ============================================================================
const REPORT_REASONS = [
  'Spam or misleading', 'Inappropriate content', 'Harassment or bullying',
  'False information', 'Violates community guidelines', 'Other',
];

const ReportModal = ({ postId, onClose }) => {
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await api.reportPost(postId, selected);
      setDone(true);
      setTimeout(onClose, 1500);
    } catch { } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="anim-scale-in bg-white dark:bg-gray-800 rounded-[20px] max-w-[440px] w-full shadow-xl dark:shadow-none border border-transparent dark:border-gray-700">
        <div className="flex items-center justify-between py-[18px] px-[22px] border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-red-100 dark:bg-red-900/40 rounded-[10px]">
              <Flag size={16} className="text-red-600 dark:text-red-400" />
            </div>
            <span className="font-bold text-[15px] text-gray-900 dark:text-gray-100">Report Post</span>
          </div>
          <button onClick={onClose} className="btn p-2 bg-gray-50 dark:bg-gray-700 rounded-[10px] text-gray-500 dark:text-gray-400 flex items-center">
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div className="py-10 px-6 text-center">
            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-3.5">
              <CheckCircle size={28} className="text-green-600 dark:text-green-400" />
            </div>
            <p className="font-bold text-gray-900 dark:text-gray-100 text-[15px]">Report submitted</p>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1.5">We'll review this post shortly.</p>
          </div>
        ) : (
          <>
            <div className="p-[18px_22px] flex flex-col gap-1.5">
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-1.5">Why are you reporting this post?</p>
              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-3 py-2.5 px-3.5 rounded-xl cursor-pointer border transition-all ${
                    selected === reason
                      ? 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50'
                  }`}
                >
                  <input type="radio" name="reason" value={reason}
                    checked={selected === reason} onChange={() => setSelected(reason)}
                    className="accent-green-600 dark:accent-green-500" />
                  <span className="text-[13px] text-gray-700 dark:text-gray-300 font-medium">{reason}</span>
                </label>
              ))}
            </div>
            <div className="py-4 px-[22px] border-t border-gray-100 dark:border-gray-700 flex gap-2.5">
              <button onClick={onClose} className="btn flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-[13px] font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={!selected || loading} className="btn flex-1 py-2.5 bg-red-600 dark:bg-red-500 text-white rounded-xl text-[13px] font-semibold flex items-center justify-center gap-1.5 disabled:opacity-45">
                {loading ? <Loader size={14} className="spin" /> : <Flag size={14} />}
                Submit Report
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// POST COMPOSER MODAL
// ============================================================================
const AVAILABLE_TAGS = ['Wheat', 'Rice', 'Vegetables', 'Organic', 'Irrigation', 'Pesticides', 'Fertilizers', 'Weather', 'Subsidy'];

const PostComposerModal = ({ user, onClose, onPostCreated }) => {
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const toggleTag = (tag) => setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setMediaFiles(prev => [...prev, ...files].slice(0, 10));
    const readers = files.map(f => {
      const r = new FileReader();
      r.onload = (ev) => setSelectedImages(prev => [...prev, ev.target.result]);
      r.readAsDataURL(f);
      return r;
    });
  };

  const removeMedia = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && mediaFiles.length === 0) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('content', content.trim());
      if (tags.length) formData.append('tags', JSON.stringify(tags));
      mediaFiles.forEach((file) => formData.append('media', file));
      const { post, postsCount } = await postService.createPost(formData);
      onPostCreated(post, postsCount);
      onClose();
    } catch (err) {
      console.error('Create post failed', err);
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="anim-scale-in bg-white dark:bg-gray-800 rounded-[22px] max-w-[640px] w-full max-h-[90vh] overflow-y-auto shadow-xl dark:shadow-none border border-transparent dark:border-gray-700">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 flex items-center justify-between py-[18px] px-[22px] border-b border-gray-100 dark:border-gray-700 rounded-t-[22px] z-10">
          <div className="flex items-center gap-3">
            <img src={user?.profilePhoto?.url ?? user?.avatar?.url ?? user?.avatar} alt={user?.name} className="w-[42px] h-[42px] rounded-full object-cover border-2 border-green-200 dark:border-green-700" />
            <div>
              <p className="font-bold text-sm text-gray-900 dark:text-gray-100">{user.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user.headline}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn p-2 bg-gray-50 dark:bg-gray-700 rounded-[10px] text-gray-500 dark:text-gray-400 flex items-center">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 px-[22px]">
          <textarea
            autoFocus value={content} onChange={(e) => setContent(e.target.value)}
            placeholder="Share your farming insights, experiences, or tips with fellow farmers..."
            className="input-base w-full h-36 py-3.5 px-4 text-sm text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-[14px] resize-none font-[inherit] leading-relaxed bg-white dark:bg-gray-700 focus:border-green-500 dark:focus:border-green-500 placeholder-gray-500 dark:placeholder-gray-400"
          />

          {selectedImages.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedImages.map((src, i) => (
                <div key={i} className="relative rounded-[14px] overflow-hidden border border-gray-200 dark:border-gray-600 w-[120px] h-[120px]">
                  <img src={src} alt="preview" className="w-full h-full object-cover block" />
                  <button type="button" onClick={() => removeMedia(i)} className="btn absolute top-1 right-1 bg-black/65 text-white p-1 rounded-lg flex items-center">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          <div className="mt-[18px]">
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`btn tag-pill py-1.5 px-3 rounded-full text-xs font-semibold border transition-colors ${
                    tags.includes(tag)
                      ? 'border-transparent bg-green-600 dark:bg-green-500 text-white'
                      : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Media actions */}
          <div className="flex gap-2 mt-[18px] pt-[18px] border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn flex items-center gap-1.5 py-2 px-3.5 border border-gray-200 dark:border-gray-600 rounded-[10px] text-[13px] font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-600 hover:text-green-700 dark:hover:text-green-400 transition-all"
            >
              <Image size={15} /> Photo
            </button>
            <button className="btn flex items-center gap-1.5 py-2 px-3.5 border border-gray-200 dark:border-gray-600 rounded-[10px] text-[13px] font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-400 transition-all">
              <FileText size={15} /> Article
            </button>
            <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple hidden onChange={handleMediaChange} />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800/95 py-4 px-[22px] border-t border-gray-100 dark:border-gray-700 flex gap-2.5 rounded-b-[22px]">
          <button onClick={onClose} className="btn flex-1 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl text-[13px] font-semibold bg-white dark:bg-gray-700">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={(!content.trim() && mediaFiles.length === 0) || loading}
            className="btn flex-1 py-2.5 bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white rounded-xl text-[13px] font-bold flex items-center justify-center gap-1.5 disabled:opacity-45 shadow-[0_4px_12px_rgb(22_163_74/0.35)]"
          >
            {loading ? <Loader size={14} className="spin" /> : <Plus size={14} />}
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// EDIT PROFILE MODAL
// ============================================================================
const EditProfileModal = ({ user, onClose, onUpdated }) => {
  const [form, setForm] = useState({
    name: user.name, headline: user.headline, bio: user.bio || '',
    location: user.location || '', website: user.website || '',
    education: user.education || '', experience: user.experience || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { user: updated } = await api.updateProfile(user._id, form);
      onUpdated(updated); onClose();
    } catch { } finally { setLoading(false); }
  };

  const fields = [
    { label: 'Full Name', key: 'name', type: 'text' },
    { label: 'Headline', key: 'headline', type: 'text' },
    { label: 'Location', key: 'location', type: 'text' },
    { label: 'Website', key: 'website', type: 'url' },
    { label: 'Education', key: 'education', type: 'text' },
    { label: 'Experience', key: 'experience', type: 'text' },
  ];

  return (
    <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="anim-scale-in bg-white dark:bg-gray-800 rounded-[22px] max-w-[500px] w-full max-h-[90vh] overflow-y-auto shadow-xl dark:shadow-none border border-transparent dark:border-gray-700">
        <div className="sticky top-0 bg-white dark:bg-gray-800 flex items-center justify-between py-[18px] px-[22px] border-b border-gray-100 dark:border-gray-700 rounded-t-[22px]">
          <span className="font-bold text-[15px] text-gray-900 dark:text-gray-100">Edit Profile</span>
          <button onClick={onClose} className="btn p-2 bg-gray-50 dark:bg-gray-700 rounded-[10px] text-gray-500 dark:text-gray-400 flex items-center">
            <X size={18} />
          </button>
        </div>

        <div className="py-5 px-[22px] flex flex-col gap-4">
          {fields.map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                className="input-base w-full py-2.5 px-3.5 text-[13px] border border-gray-200 dark:border-gray-600 rounded-xl font-[inherit] text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700"
              />
            </div>
          ))}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Bio</label>
            <textarea
              value={form.bio}
              onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
              rows={3}
              className="input-base w-full py-2.5 px-3.5 text-[13px] border border-gray-200 dark:border-gray-600 rounded-xl resize-none font-[inherit] text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800/95 py-4 px-[22px] border-t border-gray-100 dark:border-gray-700 flex gap-2.5 rounded-b-[22px]">
          <button onClick={onClose} className="btn flex-1 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl text-[13px] font-semibold bg-white dark:bg-gray-700">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn flex-1 py-2.5 bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white rounded-xl text-[13px] font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-[0_4px_12px_rgb(22_163_74/0.3)]"
          >
            {loading ? <Loader size={14} className="spin" /> : null}
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMMENTS SECTION
// ============================================================================
const CommentsSection = ({ postId, currentUser, onAuthorBlocked }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [blockTarget, setBlockTarget] = useState(null);
  const [blockLoading, setBlockLoading] = useState(false);
  const [openMenuCommentId, setOpenMenuCommentId] = useState(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { comments: data } = await api.fetchComments(postId);
        setComments(Array.isArray(data) ? data : []);
      } catch { setComments([]); } finally { setLoading(false); }
    })();
  }, [postId]);

  useEffect(() => {
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuCommentId(null); };
    if (openMenuCommentId) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [openMenuCommentId]);

  const handleBlockFromComment = async () => {
    if (!blockTarget?.id) return;
    setBlockLoading(true);
    try {
      await userService.blockUser(blockTarget.id);
      setBlockTarget(null);
      setComments((prev) => prev.filter((c) => String(c.author?._id) !== String(blockTarget.id)));
      onAuthorBlocked?.(blockTarget.id);
      toast.success('User blocked');
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to block');
    } finally {
      setBlockLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    const optimistic = {
      _id: `c-opt-${Date.now()}`,
      author: { _id: currentUser._id, name: currentUser.name || 'You', avatar: currentUser?.profilePhoto?.url ?? currentUser?.avatar?.url ?? currentUser?.avatar },
      content: text, createdAt: new Date().toISOString(),
    };
    setComments(prev => [optimistic, ...prev]);
    setText('');
    try {
      const { comment } = await api.addComment(postId, text.trim());
      setComments(prev => prev.map(c => c._id === optimistic._id ? (comment || optimistic) : c));
    } catch { setComments(prev => prev.filter(c => c._id !== optimistic._id)); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-1">
      {/* Comment input */}
      <div className="flex gap-2.5 mb-4">
        <img src={currentUser.avatar} alt="you" className="w-[34px] h-[34px] rounded-full object-cover flex-shrink-0 border-2 border-green-200 dark:border-green-700" />
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
            placeholder="Write a comment..."
            className="input-base flex-1 py-2 px-4 rounded-full text-[13px] font-[inherit] bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || submitting}
            className="btn p-2 bg-green-600 dark:bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 w-9 h-9 disabled:opacity-40"
          >
            {submitting ? <Loader size={14} className="spin" /> : <Send size={14} />}
          </button>
        </div>
      </div>

      {/* Comment list */}
      {loading ? (
        <div className="flex flex-col gap-2.5">
          {[1, 2].map(i => <CardSkeleton key={i} />)}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-[13px] text-gray-400 dark:text-gray-500 text-center py-3">
          No comments yet. Be the first!
        </p>
      ) : (
        <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
          {comments.map(c => {
            const isOwnComment = currentUser && String(c.author?._id) === String(currentUser._id);
            return (
              <div key={c._id} className="flex gap-2.5 group/comment">
                <img
                  src={c.author?.avatar}
                  alt={c.author?.name}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0 cursor-pointer"
                  onClick={() => navigate(`/profile/${c.author._id}`)}
                />
                <div className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-700 rounded-[14px] py-2.5 px-3.5">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs font-bold text-gray-900 dark:text-gray-100 cursor-pointer truncate"
                      onClick={() => navigate(`/profile/${c.author._id}`)}
                    >
                      {c.author?.name}
                    </span>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0">{formatTimeAgo(c.createdAt)}</span>
                    {!isOwnComment && currentUser && (
                      <div className="relative ml-auto flex-shrink-0" ref={openMenuCommentId === c._id ? menuRef : null}>
                        <button
                          type="button"
                          onClick={() => setOpenMenuCommentId((id) => (id === c._id ? null : c._id))}
                          className="p-1 rounded-lg text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-600 dark:hover:text-gray-300"
                          aria-label="Comment options"
                        >
                          <MoreHorizontal size={14} />
                        </button>
                        {openMenuCommentId === c._id && (
                          <>
                            <div className="fixed inset-0 z-10" aria-hidden onClick={() => setOpenMenuCommentId(null)} />
                            <div className="absolute right-0 top-full mt-0.5 py-1 w-40 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-lg z-20">
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuCommentId(null);
                                  setBlockTarget({ id: c.author._id, name: c.author?.name || 'user' });
                                }}
                                className="w-full px-3 py-2 text-left text-[13px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                Block {c.author?.name?.split(' ')[0] || 'user'}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-[13px] text-gray-600 dark:text-gray-300 leading-snug">{c.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {blockTarget && (
        <BlockConfirmModal
          username={blockTarget.name}
          onConfirm={handleBlockFromComment}
          onCancel={() => setBlockTarget(null)}
          loading={blockLoading}
        />
      )}
    </div>
  );
};

// ============================================================================
// POST CARD
// ============================================================================
const PostCard = memo(({ post, currentUser, onPostUpdate, onPostDeleted, onAuthorBlocked }) => {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(post?.isLiked ?? false);
  const [likesCount, setLikesCount] = useState(post?.likesCount ?? 0);
  const [saved, setSaved] = useState(post?.isSaved ?? false);
  const [savedCount, setSavedCount] = useState(post?.savedCount ?? 0);
  const [sharesCount, setSharesCount] = useState(post?.sharesCount ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Defensive: do not render if post or author is missing (e.g. deleted user, API inconsistency)
  if (!post || !post.author) return null;

  const handleLike = async () => {
    if (!post?._id) return;
    const next = !liked;
    setLiked(next); setLikeAnim(next);
    setLikesCount(c => next ? c + 1 : c - 1);
    if (next) setTimeout(() => setLikeAnim(false), 400);
    try {
      const res = await api.likePost(post._id);
      if (res?.likesCount != null) setLikesCount(res.likesCount);
      if (typeof res?.liked === 'boolean') setLiked(res.liked);
    } catch { setLiked(!next); setLikesCount(c => next ? c - 1 : c + 1); }
  };

  const handleSave = async () => {
    if (!post?._id) return;
    const next = !saved; setSaved(next); setSavedCount(c => next ? c + 1 : c - 1);
    try {
      const res = await api.savePost(post._id);
      if (res?.savedCount != null) setSavedCount(res.savedCount);
      if (typeof res?.saved === 'boolean') setSaved(res.saved);
    } catch { setSaved(!next); setSavedCount(c => next ? c - 1 : c + 1); }
  };

  const handleShare = async () => {
    if (!post?._id) return;
    try {
      const { shareUrl } = await api.sharePost(post._id);
      setSharesCount(c => c + 1);
      if (navigator.clipboard) await navigator.clipboard.writeText(shareUrl);
      if (navigator.share) await navigator.share({ title: 'KrishiConnect Post', url: shareUrl });
    } catch { }
  };

  const handleFollow = async () => {
    if (!post?.author?._id) return;
    setFollowLoading(true);
    try {
      if (isFollowing) await api.unfollowUser(post.author._id);
      else await api.followUser(post.author._id);
      setIsFollowing(!isFollowing);
    } catch { } finally { setFollowLoading(false); }
    setShowDropdown(false);
  };

  const handleBlockConfirm = async () => {
    if (!post?.author?._id) return;
    setBlockLoading(true);
    try {
      await userService.blockUser(post.author._id);
      setShowBlockModal(false);
      setShowDropdown(false);
      onAuthorBlocked?.(post._id);
      toast.success('User blocked');
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to block');
    } finally {
      setBlockLoading(false);
    }
  };

  const content = post?.content ?? '';
  const isLong = content.length > 180;
  const displayContent = isLong && !showMore ? content.slice(0, 180) + '…' : content;
  const isOwn = post?.author?._id === currentUser?._id;

  const { t } = useTranslation();
  const {
    translatedText,
    loading: translateLoading,
    error: translateError,
    translate,
    showTranslated,
    setShowTranslated,
    toggleView,
  } = useTranslatePost(content);

  const isLongTranslated = translatedText && translatedText.length > 180;
  const displayTranslated =
    showTranslated && translatedText
      ? isLongTranslated && !showMore
        ? translatedText.slice(0, 180) + '…'
        : translatedText
      : '';
  const bodyToShow =
    showTranslated && translatedText ? displayTranslated : displayContent;

  return (
    <>
      {showReportModal && <ReportModal postId={post._id} onClose={() => setShowReportModal(false)} />}
      {showBlockModal && (
        <BlockConfirmModal
          username={post?.author?.name || post?.author?.username}
          onConfirm={handleBlockConfirm}
          onCancel={() => setShowBlockModal(false)}
          loading={blockLoading}
        />
      )}

      <article className="card post-card anim-fade-slide bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm dark:shadow-none transition-colors duration-200" style={{ marginBottom: 12, overflow: 'hidden' }}>
        {/* Post Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '18px 20px 12px' }}>
          <img
            src={post.author.avatar}
            alt={post.author.name}
            className="w-11 h-11 rounded-full object-cover flex-shrink-0 cursor-pointer border-2 border-green-200 dark:border-green-700 transition-transform hover:scale-[1.06]"
            onClick={() => navigate(`/profile/${post.author._id}`)}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => navigate(`/profile/${post.author._id}`)}
                className="btn font-bold text-gray-900 dark:text-gray-100 text-sm bg-transparent p-0 transition-colors hover:text-green-600 dark:hover:text-green-400"
              >
                {post.author.name}
              </button>
              {post.author.verified && (
                <span title={t('post.verified')} style={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle size={14} fill="#3b82f6" color="white" />
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">{post.author.headline}</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{formatTimeAgo(post.createdAt)}</p>
          </div>

          {/* Dropdown */}
          <div style={{ position: 'relative', flexShrink: 0 }} ref={dropRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className={`btn p-1.5 rounded-[10px] text-gray-400 dark:text-gray-500 flex items-center transition-colors ${showDropdown ? 'bg-gray-100 dark:bg-gray-700' : 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <MoreHorizontal size={18} />
            </button>
            {showDropdown && (
              <div className="anim-scale-in dropdown-shadow absolute right-0 top-[38px] bg-white dark:bg-gray-800 rounded-[14px] w-[196px] z-30 border border-gray-100 dark:border-gray-700 overflow-hidden">
                {!isOwn && (
                  <>
                    <button
                      onClick={handleFollow}
                      disabled={followLoading}
                      className="btn w-full flex items-center gap-2 py-3 px-4 text-[13px] font-medium text-gray-700 dark:text-gray-300 text-left hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-colors"
                    >
                      {followLoading ? <Loader size={14} className="spin" /> : <Users size={14} />}
                      {isFollowing ? t('post.unfollow') : t('post.follow')} {post.author.name.split(' ')[0]}
                    </button>
                    <button
                      onClick={() => { setShowDropdown(false); setShowBlockModal(true); }}
                      className="btn w-full flex items-center gap-2 py-3 px-4 text-[13px] font-medium text-red-600 dark:text-red-400 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      Block {post.author.name?.split(' ')[0] || 'user'}
                    </button>
                  </>
                )}
                {isOwn && onPostDeleted && (
                  <button
                    onClick={async () => {
                      setShowDropdown(false);
                      setDeleteLoading(true);
                      try {
                        const { postsCount } = await postService.deletePost(post._id);
                        onPostDeleted(post._id, postsCount);
                        const u = authStore.getState().user;
                        if (u) authStore.setUser({ ...u, stats: { ...(u.stats || {}), postsCount } });
                      } catch (err) { console.error(err); }
                      finally { setDeleteLoading(false); }
                    }}
                    disabled={deleteLoading}
                    className="btn w-full flex items-center gap-2 py-3 px-4 text-[13px] font-medium text-red-600 dark:text-red-400 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    {deleteLoading ? <Loader size={14} className="spin" /> : <X size={14} />}
                    {t('post.deletePost')}
                  </button>
                )}
                <button
                  onClick={() => { setShowDropdown(false); setShowReportModal(true); }}
                  className="btn w-full flex items-center gap-2 py-3 px-4 text-[13px] font-medium text-red-600 dark:text-red-400 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Flag size={14} /> {t('post.reportPost')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-5 pb-3.5">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {bodyToShow}
            {(isLong && !showTranslated) || (showTranslated && isLongTranslated) ? (
              <button onClick={() => setShowMore(!showMore)} className="btn text-green-600 dark:text-green-400 font-semibold text-[13px] bg-transparent ml-1.5 p-0">
                {showMore ? t('post.showLess') : t('post.more')}
              </button>
            ) : null}
          </p>
          {content.trim() && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {!translatedText ? (
                <button
                  type="button"
                  onClick={translate}
                  disabled={translateLoading}
                  className="btn inline-flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-900/20 py-1 px-2.5 rounded-lg border border-green-200 dark:border-green-700"
                >
                  {translateLoading ? <Loader size={12} className="animate-spin" /> : <Languages size={12} />}
                  {translateLoading ? t('post.translating') : t('post.translate')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={toggleView}
                  className="btn text-xs text-green-600 dark:text-green-400 font-semibold bg-transparent py-1 p-0 border-none"
                >
                  {showTranslated ? t('post.showOriginal') : t('post.showTranslated')}
                </button>
              )}
              {translateError && (
                <span className="text-[11px] text-red-600 dark:text-red-400">{t('post.translationFailed')}</span>
              )}
            </div>
          )}

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {post.tags.map(tag => (
                <span
                  key={tag}
                  className="tag-pill text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 py-0.5 px-2.5 rounded-full font-semibold cursor-pointer border border-green-200 dark:border-green-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Media */}
        {post.media?.length > 0 && (
          <div className="px-5 pb-3.5">
            {post.media[0].type === 'video' ? (
              <video src={post.media[0].url} controls className="w-full rounded-[14px] max-h-[380px] block border border-gray-100 dark:border-gray-700" />
            ) : (
              <img
                src={post.media[0].url}
                alt="Post media"
                className="w-full rounded-[14px] object-cover max-h-[380px] cursor-pointer block border border-gray-100 dark:border-gray-700 transition-opacity hover:opacity-90"
              />
            )}
          </div>
        )}

        {/* Stats bar */}
        <div className="px-5 py-2.5 flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
          <button className="btn flex items-center gap-1 bg-transparent p-0 text-xs text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 transition-colors">
            <Heart size={12} className={liked ? 'text-red-500 dark:text-red-400' : ''} fill={liked ? 'currentColor' : 'none'} style={likeAnim ? { animation: 'heartPop 0.4s ease' } : {}} />
            <span>{formatNumber(likesCount)}</span>
          </button>
          <button className="btn flex items-center gap-1 bg-transparent p-0 text-xs text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 transition-colors" onClick={() => setShowComments(!showComments)}>
            <MessageCircle size={12} />
            <span>{formatNumber(post.commentsCount)}</span>
          </button>
          <button className="btn flex items-center gap-1 bg-transparent p-0 text-xs text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 transition-colors">
            <Bookmark size={12} className={saved ? 'text-green-600 dark:text-green-400' : ''} fill={saved ? 'currentColor' : 'none'} />
            <span>{formatNumber(savedCount)}</span>
          </button>
          <span className="ml-auto flex items-center gap-1">
            <Share2 size={12} />
            {formatNumber(sharesCount)}
          </span>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-gray-100 dark:bg-gray-700" />

        {/* Action Buttons */}
        <div className="grid grid-cols-4 py-1 px-2">
          {[
            {
              label: 'Like', icon: Heart,
              active: liked,
              activeClass: 'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
              iconProps: { fill: liked ? 'currentColor' : 'none', style: likeAnim ? { animation: 'heartPop 0.4s ease' } : {}, className: liked ? 'text-red-500 dark:text-red-400' : '' },
              onClick: handleLike,
            },
            {
              label: 'Comment', icon: MessageCircle,
              active: showComments,
              activeClass: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
              onClick: () => setShowComments(!showComments),
            },
            {
              label: 'Share', icon: Share2,
              active: false,
              activeClass: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
              onClick: handleShare,
            },
            {
              label: 'Save', icon: Bookmark,
              active: saved,
              activeClass: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
              iconProps: { fill: saved ? 'currentColor' : 'none', className: saved ? 'text-green-600 dark:text-green-400' : '' },
              onClick: handleSave,
            },
          ].map(({ label, icon: Icon, active, activeClass, iconProps = {}, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className={`btn action-btn flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${active ? activeClass : 'text-gray-500 dark:text-gray-400 bg-transparent'}`}
            >
              <Icon size={16} {...iconProps} />
              <span className="hidden sm:inline text-xs">{label}</span>
            </button>
          ))}
        </div>

        {/* Comments */}
        {showComments && (
          <div style={{ padding: '0 20px 18px' }}>
            <CommentsSection postId={post._id} currentUser={currentUser} />
          </div>
        )}
      </article>
    </>
  );
});

// ============================================================================
// COMPACT PROFILE CARD (Left panel)
// ============================================================================
const CompactProfileCard = ({ user, onEditProfile }) => {
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);

  if (!user) return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="skeleton" style={{ height: 80 }} />
      <div style={{ padding: '48px 18px 18px', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
        <div className="skeleton" style={{ height: 14, width: '55%' }} />
        <div className="skeleton" style={{ height: 11, width: '70%' }} />
      </div>
    </div>
  );

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Cover */}
      <div style={{ position: 'relative', height: 80, overflow: 'hidden', cursor: 'pointer' }}
        onClick={() => navigate(`/profile/${user._id}`)}>
        <img src={user.coverPhoto} alt="cover" style={{
          width: '100%', height: '100%', objectFit: 'cover',
          transition: 'transform 0.5s ease',
        }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        />
        <div className="cover-overlay" style={{ position: 'absolute', inset: 0 }} />
      </div>

      {/* Avatar */}
      <div className="flex justify-center -mt-7 mb-2.5">
        <div className="relative cursor-pointer" onClick={() => navigate(`/profile/${user._id}`)}>
          <img
            src={user.avatar}
            alt={user.name}
            className="w-14 h-14 rounded-full border-[3px] border-white dark:border-gray-800 object-cover shadow-md"
          />
          {user.verified && (
            <div className="absolute bottom-0 -right-0.5 bg-blue-500 rounded-full p-0.5 border-2 border-white dark:border-gray-800 flex items-center">
              <CheckCircle size={10} fill="white" className="text-blue-500" />
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="px-4 pb-4 text-center">
        <button
          onClick={() => navigate(`/profile/${user._id}`)}
          className="btn bg-transparent p-0 font-bold text-sm text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400 transition-colors"
        >
          {user.name}
        </button>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">{user.headline}</p>
        {user.location && (
          <div className="flex items-center justify-center gap-1 mt-1.5">
            <MapPin size={11} className="text-gray-400 dark:text-gray-500" />
            <span className="text-[11px] text-gray-400 dark:text-gray-500">{user.location}</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-1.5 mt-3.5 p-2.5 bg-green-50 dark:bg-green-900/20 rounded-[14px]">
          {[
            { label: 'Followers', value: formatNumber(user.followersCount) },
            { label: 'Following', value: formatNumber(user.followingCount) },
            { label: 'Posts', value: user.postsCount },
            { label: 'Saved', value: formatNumber(user.savedCount) },
          ].map(({ label, value }) => (
            <div key={label} className="stat-hover text-center py-1.5 px-1 cursor-pointer">
              <p className="font-extrabold text-sm text-green-700 dark:text-green-400">{value}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Activity */}
        <div className="grid grid-cols-2 gap-1.5 py-3 border-t border-b border-gray-100 dark:border-gray-700 mt-3">
          {[
            { icon: Eye, value: user.profileViewers, label: 'Profile views' },
            { icon: TrendingUp, value: user.postImpressions, label: 'Impressions' },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex items-center gap-1.5 py-1.5 px-2 rounded-[10px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="p-1.5 bg-green-100 dark:bg-green-900/40 rounded-lg">
                <Icon size={12} className="text-green-600 dark:text-green-400" />
              </div>
              <div className="text-left">
                <p className="font-bold text-xs text-green-700 dark:text-green-400">{value}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-1.5 mt-3">
          <button
            onClick={onEditProfile}
            className="btn w-full py-2 bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white rounded-[11px] text-xs font-bold shadow-[0_3px_10px_rgb(22_163_74/0.3)] hover:-translate-y-px hover:shadow-[0_5px_16px_rgb(22_163_74/0.4)] transition-all"
          >
            Edit Profile
          </button>
          <button
            onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/profile/${user._id}`); }}
            className="btn w-full py-2 border border-green-300 dark:border-green-600 text-green-600 dark:text-green-400 rounded-[11px] text-xs font-bold bg-white dark:bg-gray-700 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
          >
            Share Profile
          </button>
        </div>

        {/* Expandable info */}
        <div
          className="mt-2.5 text-left overflow-hidden flex flex-col gap-1 transition-[max-height] duration-300"
          style={{ maxHeight: showMore ? 200 : 0 }}
        >
          {user.education && (
            <div className="flex items-start gap-2 py-1.5 px-2 rounded-[10px] hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <Award size={12} className="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-[11px] text-gray-600 dark:text-gray-400 leading-snug">{user.education}</span>
            </div>
          )}
          {user.experience && (
            <div className="flex items-start gap-2 py-1.5 px-2 rounded-[10px] hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <Briefcase size={12} className="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-[11px] text-gray-600 dark:text-gray-400 leading-snug">{user.experience}</span>
            </div>
          )}
          {user.website && (
            <div className="flex items-start gap-2 py-1.5 px-2 rounded-[10px] cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
              <LinkIcon size={12} className="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-[11px] text-green-600 dark:text-green-400 underline leading-snug">{user.website}</span>
            </div>
          )}
          <p className="text-[11px] text-gray-400 dark:text-gray-500 py-1 px-2">{user.joinedDate}</p>
        </div>

        <button
          onClick={() => setShowMore(!showMore)}
          className="btn w-full mt-2 text-green-600 dark:text-green-400 text-xs font-semibold flex items-center justify-center gap-1 py-2 border-t border-gray-100 dark:border-gray-700"
        >
          {showMore ? 'Less' : 'More'}
          {showMore ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {/* Connections */}
        {user.connections?.length > 0 && (
          <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-1">
            <p className="text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-2 text-left uppercase tracking-wider">Your network</p>
            <div className="flex -ml-1">
              {user.connections.slice(0, 4).map(c => (
                <img
                  key={c._id}
                  src={c.avatar}
                  alt={c.name}
                  title={c.name}
                  className="w-[30px] h-[30px] rounded-full border-2 border-white dark:border-gray-800 object-cover cursor-pointer -ml-1.5 hover:scale-110 hover:z-10 transition-transform"
                  onClick={() => navigate(`/profile/${c._id}`)}
                />
              ))}
            </div>
            <button onClick={() => navigate('/network')} className="btn bg-transparent p-0 text-green-600 dark:text-green-400 text-xs font-semibold mt-1.5 block text-left">
              View all connections →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// POST COMPOSER BAR
// ============================================================================
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop';
const PostComposerBar = ({ user, onOpenModal }) => {
  const avatarSrc = user?.profilePhoto?.url ?? user?.avatar?.url ?? user?.avatar ?? DEFAULT_AVATAR;
  return (
  <div className="card p-4 mb-3 transition-colors duration-200">
    <div className="flex gap-3 mb-3">
      <img
        src={avatarSrc}
        alt={user?.name ?? 'User'}
        className="w-10 h-10 rounded-full object-cover border-2 border-green-200 dark:border-green-800 flex-shrink-0"
      />
      <button
        type="button"
        onClick={onOpenModal}
        className="btn composer-prompt flex-1 rounded-full px-4 text-left text-[13px] text-gray-500 dark:text-gray-400 font-medium h-10 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
        style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
      >
        Share something with farmers...
      </button>
    </div>
    <div className="flex gap-0.5 pt-2.5 border-t border-gray-100 dark:border-gray-700">
      {[{ icon: '📹', label: 'Video' }, { icon: '📷', label: 'Photo' }, { icon: '✍️', label: 'Article' }].map(({ icon, label }) => (
        <button
          key={label}
          type="button"
          onClick={onOpenModal}
          className="btn flex items-center justify-center gap-2 flex-1 py-2 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 transition-colors"
        >
          <span className="text-[15px]">{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  </div>
  );
};

// ============================================================================
// RIGHT SIDEBAR
// ============================================================================
const WEATHER_EMOJI = { 0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️', 51: '🌦️', 53: '🌦️', 61: '🌧️', 63: '🌧️', 65: '🌧️', 71: '🌨️', 73: '🌨️', 75: '🌨️', 80: '🌦️', 81: '🌧️', 82: '🌧️', 95: '⛈️', 96: '⛈️', 99: '⛈️' };
function getWeatherTip(cw) {
  if (!cw) return 'Tap for full forecast';
  const code = cw.weatherCode;
  const temp = cw.temperature != null ? Number(cw.temperature) : null;
  if ([61, 63, 65, 80, 81, 82, 51, 53].includes(code)) return 'Rain expected. Avoid spraying pesticides today.';
  if ([95, 96, 99].includes(code)) return 'Thunderstorm possible. Secure sheds & stay safe.';
  if (temp != null && temp > 38) return 'Hot day. Water crops early morning. Stay hydrated.';
  if (temp != null && temp < 10) return 'Cold. Protect sensitive crops from frost.';
  if ([0, 1].includes(code) && temp != null && temp >= 18 && temp <= 35) return 'Good day for irrigation ✅';
  return 'Tap for full forecast & 7-day outlook';
}

const RightSidebar = () => {
  const navigate = useNavigate();
  const { coords } = useWeatherCoords();
  const { currentWeather, location, isLoading: weatherLoading } = useWeather(coords);
  const [prices, setPrices] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllNews, setShowAllNews] = useState(false);
  const [pricesRefreshing, setPricesRefreshing] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [p, n] = await Promise.all([api.fetchMarketPrices(), api.fetchNews()]);
        setPrices(p.prices); setNews(n.news);
      } catch { } finally { setLoading(false); }
    };
    load();
  }, []);

  const weatherCard = useMemo(() => {
    if (!currentWeather) return null;
    const temp = currentWeather.temperature != null ? Math.round(Number(currentWeather.temperature)) : null;
    const humidity = currentWeather.humidity != null ? Math.round(Number(currentWeather.humidity)) : null;
    const wind = currentWeather.windSpeed != null ? Math.round(Number(currentWeather.windSpeed)) : null;
    const city = location ? [location.city, location.area, location.country].filter(Boolean).join(', ') || '—' : '—';
    return {
      icon: WEATHER_EMOJI[currentWeather.weatherCode] ?? '⛅',
      temp: temp ?? '—',
      condition: currentWeather.condition || '—',
      city,
      humidity: humidity ?? '—',
      wind: wind ?? '—',
      tip: getWeatherTip(currentWeather),
    };
  }, [currentWeather, location]);

  const refreshPrices = async () => {
    setPricesRefreshing(true);
    try { const { prices: p } = await api.fetchMarketPrices(); setPrices(p); }
    catch { } finally { setPricesRefreshing(false); }
  };

  const displayedNews = showAllNews ? news : news.slice(0, 3);

  const categoryClasses = {
    Market: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300',
    Advisory: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300',
    Technology: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300',
    Sustainability: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300',
    Government: 'bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-300',
  };
  const getCategoryClass = (category) => categoryClasses[category] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';

  return (
    <aside style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 80 }}>

      {/* ── Weather Card ── */}
      <div
        onClick={() => navigate('/weather')}
        className="card weather-gradient"
        style={{ padding: '18px 18px', cursor: 'pointer' }}
      >
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="font-bold text-[13px] text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span className="text-base">🌤️</span> Today's Weather
          </h3>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 px-2 py-1 rounded-full font-semibold border border-gray-200 dark:border-gray-600">
            Live
          </span>
        </div>

        {weatherLoading ? <CardSkeleton /> : weatherCard ? (
          <>
            {/* Main temp block */}
            <div className="flex items-center gap-3.5 bg-white dark:bg-gray-700/50 rounded-xl p-3.5 mb-2.5 shadow-sm">
              <span className="text-4xl leading-none">{weatherCard.icon}</span>
              <div>
                <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 leading-none tracking-tight">
                  {weatherCard.temp}°<span className="text-base font-medium text-gray-500 dark:text-gray-400">C</span>
                </p>
                <p className="text-[13px] text-gray-600 dark:text-gray-300 mt-1 font-medium">{weatherCard.condition}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                  <MapPin size={10} /> {weatherCard.city}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mb-2.5">
              {[
                { icon: Droplet, label: 'Humidity', value: `${weatherCard.humidity}%`, iconBg: 'bg-blue-100 dark:bg-blue-900/40', iconColor: 'text-blue-600 dark:text-blue-400' },
                { icon: Wind, label: 'Wind', value: `${weatherCard.wind} km/h`, iconBg: 'bg-orange-100 dark:bg-orange-900/40', iconColor: 'text-orange-600 dark:text-orange-400' },
              ].map(({ icon: Icon, label, value, iconBg, iconColor }) => (
                <div key={label} className="flex items-center gap-2 bg-white dark:bg-gray-700/50 py-2.5 px-3 rounded-xl shadow-sm">
                  <div className={`p-1.5 rounded-lg ${iconBg}`}>
                    <Icon size={13} className={iconColor} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{label}</p>
                    <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mt-0.5">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Tip */}
            <div className="bg-gradient-to-br from-green-600 to-green-700 dark:from-green-700 dark:to-green-800 text-white rounded-xl py-2.5 px-3.5 text-xs font-semibold leading-snug">
              {weatherCard.tip}
            </div>
          </>
        ) : null}
      </div>

      {/* ── Mandi Prices ── */}
      <div
        onClick={() => navigate('/market')}
        className="card"
        style={{ padding: '18px 18px', cursor: 'pointer' }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-[13px] text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>📈</span> Mandi Prices
          </h3>
          <button
            type="button"
            onClick={refreshPrices}
            className={`btn p-1.5 rounded-lg flex items-center transition-colors ${pricesRefreshing ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <RefreshCw size={13} className={pricesRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {prices.map((item, idx) => (
              <div
                key={item.crop}
                className="flex items-center justify-between py-2 px-2.5 rounded-xl cursor-pointer transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30"
              >
                <div>
                  <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">{item.crop}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{item.unit}</p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100">
                    ₹{item.price.toLocaleString()}
                  </p>
                  <span className={item.trend === 'up' ? 'trend-up' : 'trend-down'} style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 7px',
                    borderRadius: 99, display: 'inline-block', marginTop: 2,
                  }}>
                    {item.trend === 'up' ? '▲' : '▼'} {Math.abs(item.change)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center mt-2.5 font-medium">
          Auto-updates every 5 min
        </p>
      </div>

      {/* ── Agri News ── */}
      <div className="card p-4">
        <h3 className="font-bold text-[13px] text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          <span>🌾</span> Agri News
        </h3>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {displayedNews.map(item => (
                <a
                  key={item._id}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block py-2.5 px-2.5 rounded-xl no-underline transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <p className="line-clamp-2 text-xs font-semibold text-gray-800 dark:text-gray-200 leading-snug mb-1.5 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold py-0.5 px-2 rounded-full ${getCategoryClass(item.category)}`}>
                      {item.category}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">{formatTimeAgo(item.publishedAt)}</span>
                  </div>
                </a>
            ))}
            <button
              type="button"
              onClick={() => setShowAllNews(!showAllNews)}
              className="btn w-full text-green-600 dark:text-green-400 text-xs font-semibold py-2 bg-transparent flex items-center justify-center gap-1.5 border-t border-gray-100 dark:border-gray-700 mt-1.5 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
            >
              {showAllNews ? 'Show less' : 'Show more'}
              <ArrowRight size={12} className={showAllNews ? 'rotate-180' : ''} style={{ transition: 'transform 0.2s ease' }} />
            </button>
          </div>
        )}
      </div>

      {/* ── Trending Tags ── */}
      <div className="card" style={{ padding: '18px 18px' }}>
        <h3 className="font-bold text-[13px] text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          <span>🔥</span> Trending
        </h3>
        <div className="flex flex-col gap-0.5">
          {['#OrganicFarming', '#SustainableAg', '#FarmToTable', '#AgriculturalTech', '#KrishiIndia'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => navigate(`/tag/${tag.slice(1)}`)}
              className="btn w-full flex items-center justify-between py-2 px-2.5 rounded-xl text-green-700 dark:text-green-400 font-semibold text-[13px] bg-transparent text-left transition-colors hover:bg-green-50 dark:hover:bg-green-900/20"
            >
              <span>{tag}</span>
              <ArrowRight size={13} className="text-green-200 dark:text-green-700 group-hover:text-green-600" />
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};

// ============================================================================
// HOME PAGE – Feed, create post, recent/trending (sidebar from AppLayout)
// ============================================================================
const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const outletContext = useOutletContext();
  const sidebarOpen = outletContext?.sidebarOpen ?? true;
  const setSidebarOpen = outletContext?.setSidebarOpen ?? (() => {});
  const isHomeActive = location.pathname === '/' || location.pathname === '/feed';

  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feedMode, setFeedMode] = useState('recent');
  const [showComposer, setShowComposer] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [notificationCount] = useState(5);
  const [toast, setToast] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showAIChat, setShowAIChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const searchWrapperRef = useRef(null);
  const searchDebounceRef = useRef(null);

  const {
    transcript: searchVoiceTranscript,
    listening: searchVoiceListening,
    error: searchVoiceError,
    isSupported: searchVoiceSupported,
    startListening: searchVoiceStart,
    stopListening: searchVoiceStop,
    resetTranscript: searchVoiceReset,
  } = useSpeechToText({ language: 'en-IN', continuous: false });

  const searchVoiceWasListeningRef = useRef(false);
  useEffect(() => {
    if (searchVoiceListening) {
      searchVoiceWasListeningRef.current = true;
      return;
    }
    if (searchVoiceWasListeningRef.current && searchVoiceTranscript.trim()) {
      setSearchQuery(searchVoiceTranscript.trim());
      setSearchDropdownOpen(true);
      searchVoiceReset();
    }
    searchVoiceWasListeningRef.current = false;
  }, [searchVoiceListening, searchVoiceTranscript, searchVoiceReset]);

  useEffect(() => {
    if (!searchVoiceError) return;
    const msg = getSpeechRecognitionErrorMessage(searchVoiceError);
    if (msg) toast.error(msg);
  }, [searchVoiceError]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { user } = await api.fetchCurrentUser();
        setCurrentUser(user);
        if (user) authStore.setUser(user);
      } catch { } finally { setUserLoading(false); }
    })();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const { data } = await searchService.searchUsers(searchQuery.trim(), { page: 1, limit: 5 });
        setSearchResults(Array.isArray(data) ? data : []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) {
        setSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    (async () => {
      setPostsLoading(true); setPostsError(null);
      try {
        const { posts: data, hasMore: more } = await api.fetchPosts(1, 20, feedMode);
        setPosts(data || []); setPage(1); setHasMore(!!more);
      } catch (e) {
        setPostsError('Failed to load posts. Please try again.');
      } finally { setPostsLoading(false); }
    })();
  }, [feedMode, retryCount]);

  const handleLoadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const { posts: more, hasMore: moreAvail } = await api.fetchPosts(nextPage, 20, feedMode);
      setPosts(prev => [...prev, ...(more || [])]);
      setPage(nextPage); setHasMore(!!moreAvail);
    } catch { } finally { setLoadingMore(false); }
  };

  const handlePostCreated = useCallback((newPost, postsCount) => {
    setPosts(prev => [newPost, ...prev]);
    const u = authStore.getState().user;
    if (u != null && typeof postsCount === 'number') {
      authStore.setUser({ ...u, stats: { ...(u.stats || {}), postsCount } });
    }
    setCurrentUser(prev => (prev && typeof postsCount === 'number' ? { ...prev, stats: { ...(prev.stats || {}), postsCount } } : prev));
    showToast('Post created successfully!');
  }, [showToast]);

  const handleProfileUpdated = useCallback((updatedUser) => {
    setCurrentUser(updatedUser);
    showToast('Profile updated!');
  }, [showToast]);

  const handleNavChange = (id) => {
    if (id === 'profile') navigate(`/profile/${currentUser?._id}`);
    else if (id === 'messages') navigate('/messages');
    else if (id === 'notifications') navigate('/notifications');
    else if (id === 'network') navigate('/network');
    else if (id === 'jobs') navigate('/jobs');
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      <GlobalStyles />
      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}

      {/* Modals */}
      {showComposer && currentUser && (
        <PostComposerModal user={currentUser} onClose={() => setShowComposer(false)} onPostCreated={handlePostCreated} />
      )}
      {showEditProfile && currentUser && (
        <EditProfileModal user={currentUser} onClose={() => setShowEditProfile(false)} onUpdated={handleProfileUpdated} />
      )}

      {/* Main content wrapper */}
      <div style={{ transition: 'margin-left 0.28s cubic-bezier(0.16, 1, 0.3, 1)' }} className="main-content overflow-x-hidden">

        {/* ── Top Bar ── */}
        <div className="sticky top-0 z-30 flex items-center gap-3 sm:gap-[14px] px-4 sm:px-6 h-16 min-w-0 backdrop-blur-[16px] border-b border-gray-200 dark:border-gray-700 bg-white/92 dark:bg-gray-800/92 shadow-[0_1px_0_rgb(0_0_0/0.04)] transition-colors duration-200 topbar-desktop">
          {/* Search */}
          <div ref={searchWrapperRef} className="flex-1 min-w-0 max-w-[400px] relative">
            <Search size={15} className="absolute left-[14px] top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <input
              type="search"
              placeholder="Search farmers, posts, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchDropdownOpen(true)}
              className="input-base w-full pl-10 pr-10 py-2 text-[13px] bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 transition-colors"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            />
            {searchVoiceSupported && (
              <button
                type="button"
                onClick={() => (searchVoiceListening ? searchVoiceStop() : searchVoiceStart())}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                title={searchVoiceListening ? 'Stop listening' : 'Voice search'}
                aria-label={searchVoiceListening ? 'Stop listening' : 'Voice search'}
              >
                <Mic size={16} className={searchVoiceListening ? 'text-green-600 dark:text-green-400' : ''} />
              </button>
            )}
            {searchDropdownOpen && (searchQuery.trim() || searchResults.length > 0 || searchLoading) && (
              <div className="absolute top-full left-0 right-0 mt-1 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg z-50 max-h-[280px] overflow-y-auto">
                {searchLoading ? (
                  <div className="px-4 py-3 text-[13px] text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Loader size={14} className="animate-spin" /> Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  <ul className="py-0">
                    {searchResults.map((user) => (
                      <li key={user._id}>
                        <button
                          type="button"
                          className="w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-colors"
                          onClick={() => {
                            setSearchDropdownOpen(false);
                            setSearchQuery('');
                            navigate(`/profile/${user._id}`);
                          }}
                        >
                          <img
                            src={user.profilePhoto?.url || user.avatar?.url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop'}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
                            <p className="text-[12px] text-gray-500 dark:text-gray-400 truncate">
                              {[user.username, user.expertDetails?.specialization, [user.location?.city, user.location?.state].filter(Boolean).join(', ')].filter(Boolean).join(' · ') || 'Farmer'}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : searchQuery.trim() ? (
                  <div className="px-4 py-3 text-[13px] text-gray-500 dark:text-gray-400">No results found</div>
                ) : null}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 ml-auto flex-shrink-0">
            {/* Notification bell */}
            <button
              type="button"
              className="btn relative p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex items-center"
              onClick={() => handleNavChange('notifications')}
            >
              <Bell size={19} />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-800" />
              )}
            </button>

            {/* Create Post */}
            <button
              type="button"
              onClick={() => setShowComposer(true)}
              className="btn flex items-center gap-2 py-2.5 px-4 rounded-xl text-[13px] font-bold text-white bg-green-600 hover:bg-green-700 shadow-[0_3px_10px_rgb(22_163_74/0.3)] hover:shadow-[0_5px_16px_rgb(22_163_74/0.4)] hover:-translate-y-px transition-all"
            >
              <Plus size={16} /> Create Post
            </button>
          </div>
        </div>

        {/* ── Page content (centered, wider for less compressed cards) ── */}
        <div className="max-w-[1320px] mx-auto px-4 sm:px-5 py-4 sm:py-6 w-full min-w-0">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', columnGap: 20, rowGap: 20, alignItems: 'start' }} className="content-grid">
            {/* AI Assistant (left) — guidance & doubt solving; hidden on mobile, shown from 768px */}
            <div className="profile-col hidden md:block" style={{ minWidth: 280 }}>
              <div style={{ position: 'sticky', top: 80 }}>
                <div className="card overflow-hidden border-0 shadow-md dark:shadow-none dark:ring-1 dark:ring-gray-700/50 transition-shadow hover:shadow-lg dark:hover:ring-green-500/20">
                  {/* Header banner with subtle overlay */}
                  <div className="relative h-20 overflow-hidden flex items-center justify-center bg-gradient-to-br from-emerald-800 via-green-700 to-emerald-600 dark:from-emerald-900 dark:via-green-800 dark:to-emerald-800">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent" aria-hidden />
                    <Sparkles size={40} className="relative text-white/95 drop-shadow-sm" strokeWidth={2.5} />
                  </div>
                  {/* Avatar / icon */}
                  <div className="flex justify-center -mt-7 mb-3">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/60 dark:to-emerald-800/60 border-[3px] border-white dark:border-gray-800 shadow-lg flex items-center justify-center ring-2 ring-green-500/20">
                      <HelpCircle size={26} className="text-green-700 dark:text-green-400" />
                    </div>
                  </div>
                  {/* Info */}
                  <div className="px-4 pb-5 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-0.5">
                      <span className="font-bold text-base text-gray-900 dark:text-gray-100">Krishi Assistant</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700/50">AI</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">
                      Guidance & doubt solving for farming, crops & weather
                    </p>
                    {/* Quick actions */}
                    <div className="grid grid-cols-2 gap-2 mt-4 p-3 bg-green-50/80 dark:bg-green-900/20 rounded-xl border border-green-100/80 dark:border-green-800/30">
                      {[
                        { label: 'Crops', hint: 'Tips & pests' },
                        { label: 'Weather', hint: 'Forecast' },
                        { label: 'Market', hint: 'Prices' },
                        { label: 'Soil', hint: 'Health' },
                      ].map(({ label, hint }) => (
                        <button
                          key={label}
                          type="button"
                          className="stat-hover text-center py-2.5 px-2 rounded-xl cursor-pointer transition-colors hover:bg-green-100/80 dark:hover:bg-green-800/30 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                        >
                          <p className="font-bold text-xs text-green-700 dark:text-green-400">{label}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{hint}</p>
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAIChat(prev => !prev)}
                      aria-label="Open Krishi Assistant chat"
                      className="w-full mt-4 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-[0_3px_12px_rgb(22_163_74/0.35)] hover:shadow-[0_6px_20px_rgb(22_163_74/0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                    >
                      <MessageSquare size={16} strokeWidth={2.5} /> Ask a question
                    </button>
                  </div>
                </div>
                {/* AI Chat expandable panel – same width as card, directly below */}
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${showAIChat ? 'max-h-[70vh] opacity-100 mt-0' : 'max-h-0 opacity-0'}`}
                >
                  <AIChatPanel onClose={() => setShowAIChat(false)} />
                </div>
              </div>
            </div>

            {/* Feed */}
            <div className="feed-col min-w-0 w-full">
              {/* Mobile header */}
              <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 mb-3 shadow-sm mobile-header transition-colors duration-200">
                <span className="font-semibold text-lg text-green-700 dark:text-green-400" style={{ fontFamily: 'Lora, Georgia, serif' }}>
                  🌾 KrishiConnect
                </span>
                <div className="flex gap-2">
                  <button type="button" className="btn p-2.5 rounded-xl text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center">
                    <Search size={18} />
                  </button>
                  <button type="button" onClick={() => setShowComposer(true)} className="btn p-2.5 bg-green-600 text-white rounded-xl flex items-center">
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              {/* Composer bar */}
              {currentUser && <PostComposerBar user={currentUser} onOpenModal={() => setShowComposer(true)} />}

              {/* Feed mode: Recent / Trending */}
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setFeedMode('recent')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-[13px] font-semibold transition-colors ${
                    feedMode === 'recent'
                      ? 'bg-green-600 text-white border-none'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  Recent
                </button>
                <button
                  type="button"
                  onClick={() => setFeedMode('trending')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-[13px] font-semibold transition-colors ${
                    feedMode === 'trending'
                      ? 'bg-green-600 text-white border-none'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  Trending
                </button>
              </div>

              {/* Loading skeletons */}
              {postsLoading && <>{[1, 2, 3].map(i => <PostSkeleton key={i} />)}</>}

              {/* Error state */}
              {postsError && (
                <div className="card py-9 px-6 text-center mb-3">
                  <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertCircle size={26} className="text-red-500" />
                  </div>
                  <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">{postsError}</p>
                  <button
                    type="button"
                    onClick={() => { setPostsError(null); setRetryCount(c => c + 1); }}
                    className="btn mt-2.5 py-2.5 px-6 bg-green-600 text-white rounded-xl text-[13px] font-semibold"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Empty state */}
              {!postsLoading && !postsError && posts.length === 0 && (
                <div className="card py-14 px-6 text-center mb-3">
                  <div className="text-5xl mb-4">🌱</div>
                  <p className="font-extrabold text-lg text-gray-900 dark:text-gray-100 mb-1.5">No posts yet</p>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400">Follow other farmers or create your first post!</p>
                  <button
                    type="button"
                    onClick={() => setShowComposer(true)}
                    className="btn mt-5 py-2.5 px-7 bg-green-600 hover:bg-green-700 text-white rounded-xl text-[13px] font-bold shadow-[0_4px_12px_rgb(22_163_74/0.3)] transition-colors"
                  >
                    Create First Post
                  </button>
                </div>
              )}

              {/* Post cards — skip posts with missing author to avoid runtime crashes */}
              {!postsLoading && posts.filter(p => p && p.author).map(post => (
                <PostCard key={post._id} post={post} currentUser={currentUser}
                  onPostUpdate={(updated) => setPosts(p => p.map(x => x._id === updated._id ? updated : x))}
                  onPostDeleted={(postId, postsCount) => {
                    setPosts(p => p.filter(x => x._id !== postId));
                    setCurrentUser(prev => prev && typeof postsCount === 'number' ? { ...prev, stats: { ...(prev.stats || {}), postsCount } } : prev);
                  }}
                  onAuthorBlocked={(postId) => setPosts(p => p.filter(x => x._id !== postId))} />
              ))}

              {/* Load more */}
              {!postsLoading && posts.length > 0 && (
                <div className="text-center pb-8 pt-2">
                  {hasMore ? (
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="btn py-2.5 px-8 border-2 border-green-600 text-green-600 dark:text-green-400 rounded-xl font-bold text-[13px] bg-white dark:bg-gray-800 inline-flex items-center gap-2 transition-all opacity-100 disabled:opacity-60 hover:bg-green-50 dark:hover:bg-green-900/20"
                    >
                      {loadingMore ? <><Loader size={15} className="animate-spin" /> Loading...</> : 'Load More Posts'}
                    </button>
                  ) : (
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
                      <CheckCircle size={15} className="text-green-500" /> You're all caught up!
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Right sidebar */}
            <div style={{ display: 'none' }} className="right-col">
              <RightSidebar />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 flex justify-around py-2 px-2 pb-3 backdrop-blur-[16px] border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 shadow-[0_-4px_20px_rgb(0_0_0/0.06)] z-40 mobile-nav transition-colors duration-200">
        {[
          { id: 'home', icon: Home, label: 'Home' },
          { id: 'network', icon: Users, label: 'Network' },
          { id: 'messages', icon: MessageSquare, label: 'Messages' },
          { id: 'notifications', icon: Bell, label: 'Alerts' },
          { id: 'profile', icon: User, label: 'Profile' },
        ].map(item => {
          const isActive = item.id === 'home' ? isHomeActive : (item.id === 'profile' && location.pathname.startsWith('/profile')) || (item.id === 'network' && location.pathname.startsWith('/network')) || (item.id === 'messages' && location.pathname.startsWith('/messages')) || (item.id === 'notifications' && location.pathname.startsWith('/alerts'));
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavChange(item.id)}
              className={`btn flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl relative min-w-[56px] transition-colors ${
                isActive ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {item.id === 'notifications' && notificationCount > 0 && (
                <span className="mobile-nav-dot" />
              )}
              <item.icon size={21} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium" style={{ fontWeight: isActive ? 700 : 500 }}>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div style={{ height: 72 }} className="mobile-spacer" />

      {/* Responsive layout injection */}
      <style>{`
        /* Topbar desktop: hidden on mobile */
        .topbar-desktop { display: none !important; }
        @media (min-width: 1024px) { .topbar-desktop { display: flex !important; } }

        /* Mobile header: shown only on mobile */
        .mobile-header { display: flex !important; }
        @media (min-width: 768px) { .mobile-header { display: none !important; } }

        /* Mobile nav: hidden on md+ */
        .mobile-nav { display: flex !important; }
        @media (min-width: 768px) { .mobile-nav { display: none !important; } }

        /* Mobile spacer */
        .mobile-spacer { display: block !important; }
        @media (min-width: 768px) { .mobile-spacer { display: none !important; } }

        /* Main content: no extra margin; AppLayout already reserves space for sidebar */
        .main-content {
          margin-left: 0;
        }

        /* Content grid: 1-col on mobile → 2-col at 768px → 3-col at 1280px */
        .content-grid {
          grid-template-columns: 1fr !important;
          align-items: start !important;
          row-gap: 20px !important;
        }
        @media (min-width: 768px) {
          .content-grid {
            grid-template-columns: 280px 1fr !important;
            column-gap: 24px !important;
          }
          .profile-col { display: block !important; }
        }
        @media (min-width: 1280px) {
          .content-grid {
            grid-template-columns: 280px 1fr 320px !important;
            column-gap: 24px !important;
          }
          .right-col { display: block !important; }
        }

        /* Column order: feed first on mobile; left sidebar then feed on tablet+ */
        .profile-col { order: 2; }
        .feed-col    { order: 1; min-width: 0; }
        .right-col   { order: 3; }
        @media (min-width: 768px) {
          .profile-col { order: 1; }
          .feed-col    { order: 2; }
        }
      `}</style>
    </div>
  );
};

export default HomePage;
