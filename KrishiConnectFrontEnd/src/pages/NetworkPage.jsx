import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  MapPin,
  UserPlus,
  UserCheck,
  Loader,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { networkService } from '../services/network.service';
import { chatService } from '../services/chat.service';

const DEFAULT_LIMIT = 20;

// Format location for display: city, state or state, country
function formatLocation(user) {
  const loc = user?.location;
  if (!loc) return null;
  const city = loc.city || loc.district || '';
  const state = loc.state || '';
  const country = loc.country || 'India';
  const parts = [city, state, country].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

// Format follower count
function formatCount(n) {
  if (n == null) return '0';
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return String(n);
}

const ELLIPSIS = '\u2026'; // "…" - single Unicode ellipsis

/**
 * Get headline for a user: specialization, or truncated bio, or null.
 * Safe for undefined user or missing nested fields. No nested ternaries.
 */
function getHeadline(user) {
  if (user == null) return null;

  const specialization = user.expertDetails?.specialization;
  if (specialization != null && String(specialization).trim() !== '') {
    return String(specialization).trim();
  }

  const bio = user.bio;
  if (bio == null || typeof bio !== 'string') return null;

  const trimmed = bio.trim();
  if (trimmed.length === 0) return null;

  const maxLen = 80;
  if (trimmed.length <= maxLen) return trimmed;
  return trimmed.slice(0, maxLen) + ELLIPSIS;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function RecommendationCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 animate-pulse shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-600 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4" />
          <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-1/2" />
          <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-2/3" />
        </div>
      </div>
      <div className="flex gap-2 mb-3">
        <div className="h-6 bg-gray-100 dark:bg-gray-600 rounded-full w-20" />
        <div className="h-6 bg-gray-100 dark:bg-gray-600 rounded-full w-16" />
      </div>
      <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-xl" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recommendation profile card
// ---------------------------------------------------------------------------
function RecommendationCard({ user, onFollow, onMessage }) {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const avatar = user?.profilePhoto?.url ?? user?.avatar?.url ?? '';
  const name = user?.name ?? 'User';
  const headline = getHeadline(user);
  const locationStr = formatLocation(user);
  const followers = user?.stats?.followersCount ?? 0;
  const mutual = user?.mutualFollowersCount ?? 0;
  const isExpert = user?.isExpert === true;

  const handleFollow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (following || loading) return;
    setLoading(true);
    try {
      await networkService.followUser(user._id);
      setFollowing(true);
      onFollow?.(user._id);
      toast.success(`Following ${name}`);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to follow';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = () => {
    navigate(`/profile/${user._id}`);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <button
          type="button"
          onClick={handleCardClick}
          className="flex items-center gap-3 text-left flex-1 min-w-0"
        >
          <div className="relative flex-shrink-0">
            <img
              src={avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + (user?._id || '')}
              alt={name}
              className="w-14 h-14 rounded-full object-cover border-2 border-gray-100 dark:border-gray-700 group-hover:border-green-300 dark:group-hover:border-green-600 transition-colors"
            />
            {isExpert && (
              <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                <UserCheck size={10} className="text-white" />
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-tight truncate">
              {name}
            </p>
            {headline && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                {headline}
              </p>
            )}
            {locationStr && (
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-400 dark:text-gray-500">
                <MapPin size={10} className="flex-shrink-0" />
                <span className="truncate">{locationStr}</span>
              </div>
            )}
          </div>
        </button>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-black text-green-600 dark:text-green-400">
            {formatCount(followers)}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">followers</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        {mutual > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs font-semibold rounded-full border border-green-100 dark:border-green-800">
            <Users size={10} />
            {mutual} mutual
          </span>
        )}
        {locationStr && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
            <MapPin size={10} />
            {locationStr.split(',')[0] || locationStr}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleFollow}
          disabled={following || loading}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
            following
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 cursor-default'
              : 'bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-md disabled:opacity-60'
          }`}
        >
          {loading ? (
            <Loader size={14} className="animate-spin" />
          ) : following ? (
            <>
              <UserCheck size={14} /> Following
            </>
          ) : (
            <>
              <UserPlus size={14} /> Follow
            </>
          )}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMessage?.(user);
          }}
          className="p-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          title="Message"
        >
          <MessageSquare size={16} />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function NetworkPage() {
  const currentUserId = useAuthStore((s) => s.user?._id ?? null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_LIMIT,
    hasNextPage: false,
    hasPrevPage: false,
    totalItems: 0,
  });

  const loadRecommendations = useCallback(
    async (page = 1, append = false) => {
      if (!currentUserId) return;
      if (page === 1) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        const { recommendations: list, pagination: pag } = await networkService.getRecommendations({
          page,
          limit: DEFAULT_LIMIT,
        });
        setPagination((prev) => ({
          ...prev,
          page: pag.page ?? page,
          limit: pag.limit ?? DEFAULT_LIMIT,
          hasNextPage: pag.hasNextPage ?? false,
          hasPrevPage: pag.hasPrevPage ?? false,
          totalItems: pag.totalItems ?? 0,
        }));
        if (append) {
          setRecommendations((prev) => {
            const ids = new Set(prev.map((u) => String(u._id)));
            const newOnes = (list || []).filter((u) => !ids.has(String(u._id)));
            return [...prev, ...newOnes];
          });
        } else {
          setRecommendations(list || []);
        }
      } catch (err) {
        const msg =
          err?.response?.data?.message || err?.message || 'Failed to load recommendations.';
        setError(msg);
        if (page === 1) setRecommendations([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [currentUserId]
  );

  useEffect(() => {
    loadRecommendations(1, false);
  }, [currentUserId]);

  const handleLoadMore = () => {
    const next = (pagination.page || 1) + 1;
    if (pagination.hasNextPage && !loadingMore) loadRecommendations(next, true);
  };

  const handleRetry = () => {
    loadRecommendations(1, false);
  };

  const handleFollow = (userId) => {
    setRecommendations((prev) => prev.filter((u) => String(u._id) !== String(userId)));
  };

  const navigate = useNavigate();
  const handleMessage = async (user) => {
    try {
      const conv = await chatService.startConversation(user._id);
      navigate('/messages', { state: { openConversation: conv } });
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Could not start conversation');
    }
  };

  if (!currentUserId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Please log in to see your network.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-20 shadow-sm transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Users size={22} className="text-green-600 dark:text-green-400" />
            My Network
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            People you may know, based on your location and connections
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle size={24} className="text-red-500 flex-shrink-0" />
              <p className="text-gray-800 dark:text-gray-200 font-medium">{error}</p>
            </div>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition flex items-center gap-2"
            >
              <RefreshCw size={16} /> Retry
            </button>
          </div>
        )}

        <section>
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
            Recommended for you
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <RecommendationCardSkeleton key={i} />
              ))}
            </div>
          ) : recommendations.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center shadow-sm">
              <div className="text-5xl mb-4">🌾</div>
              <p className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                No recommendations right now
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                Add your location in profile settings to see people near you, or check back later.
              </p>
              <button
                onClick={handleRetry}
                className="mt-4 px-6 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition inline-flex items-center gap-2"
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.map((user) => (
                  <RecommendationCard
                    key={user._id}
                    user={user}
                    onFollow={handleFollow}
                    onMessage={handleMessage}
                  />
                ))}
              </div>
              {pagination.hasNextPage && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="px-6 py-3 border-2 border-green-600 dark:border-green-500 text-green-600 dark:text-green-400 font-bold rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {loadingMore ? (
                      <Loader size={18} className="animate-spin" />
                    ) : (
                      <ChevronDown size={18} />
                    )}
                    Load more
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
