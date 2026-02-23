import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  MapPin, LinkIcon, Award, Briefcase, Users, Heart, MessageSquare,
  Share2, Bookmark, Edit3, Camera, Check, X, Loader, AlertCircle,
  RefreshCw, Eye, TrendingUp, Plus, ChevronDown, ChevronUp,
  CheckCircle, Star, Calendar, BookOpen, Phone, Image as ImageIcon,
  MoreVertical
} from 'lucide-react';
import { BlockConfirmModal, UnblockConfirmModal } from '../components/BlockModals';
import { useQueryClient } from '@tanstack/react-query';
import { privacyKeys } from '../hooks/usePrivacySecurity';
import { useAuthStore } from '../store/authStore';
import { authStore } from '../store/authStore';
import { userService, mapUserToProfile } from '../services/user.service';
import { postService } from '../services/post.service';
import { chatService } from '../services/chat.service';

// ============================================================================
// UTILITY
// ============================================================================
const formatNumber = (n) => {
  if (!n && n !== 0) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
};

const formatTimeAgo = (dateStr) => {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

// ============================================================================
// EDIT PROFILE MODAL
// ============================================================================
/** Pre-fill State and City from existing location (string "State, City" or locationObject). */
function getStateAndCityFromUser(user) {
  const loc = user?.locationObject;
  if (loc && (loc.state != null || loc.city != null)) {
    return { state: loc.state ?? '', city: loc.city ?? '' };
  }
  const str = user?.location;
  if (typeof str === 'string' && str.trim()) {
    const parts = str.split(',').map((s) => s.trim());
    const state = parts[0] ?? '';
    const city = parts[1] ?? '';
    return { state, city };
  }
  return { state: '', city: '' };
}

const EditProfileModal = ({ user, currentUserId, onClose, onSaved }) => {
  const getInitialForm = () => {
    const { state, city } = getStateAndCityFromUser(user);
    return {
      name: user?.name ?? '',
      email: user?.email ?? '',
      bio: user?.bio ?? '',
      state,
      city,
    };
  };

  const [form, setForm] = useState(getInitialForm);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  React.useEffect(() => {
    setForm(getInitialForm());
    setSubmitError(null);
  }, [user?.name, user?.email, user?.bio, user?.location, user?.locationObject]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSubmitError(null);
  };

  const handleSave = async () => {
    setSubmitError(null);
    setLoading(true);
    try {
      const stateVal = (form.state ?? '').trim();
      const cityVal = (form.city ?? '').trim();
      const locationObj =
        stateVal || cityVal
          ? { state: stateVal || undefined, city: cityVal || undefined, country: 'India' }
          : undefined;

      const payload = {
        name: (form.name ?? '').trim() || undefined,
        bio: (form.bio ?? '').trim() || undefined,
        ...(form.email !== undefined && { email: (form.email ?? '').trim() || undefined }),
        ...(locationObj && { location: locationObj }),
      };

      const raw = await userService.updateProfile(payload);
      const mapped = mapUserToProfile(raw, currentUserId);
      onSaved(mapped);
      if (typeof authStore.setUser === 'function') {
        authStore.setUser(mapped);
      }
      toast.success('Profile updated successfully');
      onClose();
    } catch (err) {
      const message = err?.response?.data?.message ?? err?.message ?? 'Failed to update profile';
      setSubmitError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-profile-title">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl dark:shadow-none border border-transparent dark:border-gray-700">
        <div className="sticky top-0 bg-white dark:bg-gray-800 flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 rounded-t-2xl z-10">
          <h2 id="edit-profile-title" className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Edit3 size={18} className="text-green-600 dark:text-green-400" /> Edit Profile
          </h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-500 dark:text-gray-400" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {submitError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 text-red-700 dark:text-red-300 text-sm">
              <AlertCircle size={18} className="flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1.5">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 dark:focus:ring-green-600 transition"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 dark:focus:ring-green-600 transition"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1.5">State</label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => handleChange('state', e.target.value)}
                placeholder="e.g. Maharashtra"
                className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 dark:focus:ring-green-600 transition"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1.5">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="e.g. Mumbai"
                className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 dark:focus:ring-green-600 transition"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1.5">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Tell others about yourself..."
              className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 dark:focus:ring-green-600 resize-none transition"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{form.bio.length}/500</p>
          </div>
        </div>
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 p-5 border-t border-gray-100 dark:border-gray-700 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={loading} className="flex-1 py-2.5 bg-green-600 dark:bg-green-500 text-white rounded-xl font-semibold text-sm hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-40 transition flex items-center justify-center gap-2">
            {loading ? <Loader size={15} className="animate-spin" /> : <Check size={15} />}
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// POST MINI CARD
// ============================================================================
const PostMiniCard = ({ post }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md dark:shadow-none transition-all overflow-hidden">
    {post.mediaUrl && (
      <img src={post.mediaUrl} alt="post" className="w-full h-40 object-cover" />
    )}
    <div className="p-4">
      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 leading-relaxed">{post.content}</p>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {post.tags?.map(tag => (
          <span key={tag} className="px-2 py-0.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full border border-green-100 dark:border-green-800">#{tag}</span>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500">
        <span className="flex items-center gap-1"><Heart size={11} />{formatNumber(post.likesCount)}</span>
        <span className="flex items-center gap-1"><MessageSquare size={11} />{post.commentsCount}</span>
        <span className="flex items-center gap-1"><Bookmark size={11} />{post.savedCount}</span>
        <span className="ml-auto">{formatTimeAgo(post.createdAt)}</span>
      </div>
    </div>
  </div>
);

const SavedPostCard = ({ post }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md dark:shadow-none transition-all overflow-hidden">
    {post.mediaUrl && (
      <img src={post.mediaUrl} alt="post" className="w-full h-36 object-cover" />
    )}
    <div className="p-4">
      <div className="flex items-center gap-2 mb-2">
        {post.author?.avatar && <img src={post.author.avatar} alt={post.author.name} className="w-6 h-6 rounded-full object-cover" />}
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{post.author?.name || 'User'}</span>
        {post.savedAt && <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">Saved {post.savedAt}</span>}
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 leading-relaxed">{post.content}</p>
    </div>
  </div>
);

// ============================================================================
// MAIN PROFILE PAGE
// ============================================================================
const ProfilePage = () => {
  const { t } = useTranslation();
  const { userId } = useParams();
  const navigate = useNavigate();
  // Select only primitive id to avoid re-renders from object reference changes
  const currentUserId = useAuthStore((s) => s.user?._id ?? null);
  const resolvedUserId = userId || 'current-user';
  const idForApi = !resolvedUserId || resolvedUserId === 'current-user' ? (currentUserId || 'me') : resolvedUserId;

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [showEditModal, setShowEditModal] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [canChat, setCanChat] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showUnblockModal, setShowUnblockModal] = useState(false);
  const [blockUnblockLoading, setBlockUnblockLoading] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [listModal, setListModal] = useState(null);
  const [listLoading, setListLoading] = useState(false);
  const [listUsers, setListUsers] = useState([]);
  const [listMenuUserId, setListMenuUserId] = useState(null);
  const [blockTargetFromList, setBlockTargetFromList] = useState(null);
  const listMenuRef = useRef(null);
  const profilePhotoInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const queryClient = useQueryClient();

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    const isOwnProfile = idForApi === 'me' || (currentUserId != null && String(idForApi) === String(currentUserId));
    try {
      const profile = await userService.fetchProfileForPage(idForApi, currentUserId);
      setUser(profile);
      setFollowing(profile?.isFollowing ?? false);
      const isOtherUser = profile?._id && currentUserId && String(profile._id) !== String(currentUserId);
      if (isOtherUser) {
        try {
          const res = await chatService.getCanChat(profile._id);
          setCanChat(!!res?.canChat);
        } catch {
          setCanChat(false);
        }
      } else {
        setCanChat(false);
      }
    } catch (err) {
      const isUnauthorized = err?.response?.status === 401;
      const isNotFound = err?.response?.status === 404;
      if (isUnauthorized && isOwnProfile) {
        setError(currentUserId
          ? 'Session expired. Please log in again.'
          : 'Please log in to view your profile.');
      } else if (isNotFound && !isOwnProfile) {
        setError('User not found');
      } else {
        setError(err?.message || 'Failed to load profile.');
      }
    } finally {
      setLoading(false);
    }
  }, [idForApi, currentUserId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const isOwnProfile = Boolean(currentUserId && user && String(user._id) === String(currentUserId));
  const userIdForPosts = user?._id;

  // When viewing another user's profile, only show public posts — never fetch or show saved tab
  useEffect(() => {
    if (!isOwnProfile) {
      if (activeTab === 'saved') setActiveTab('posts');
      setSavedPosts([]);
    }
  }, [isOwnProfile, activeTab]);

  useEffect(() => {
    if (!userIdForPosts) return;
    let cancelled = false;
    (async () => {
      setPostsLoading(true);
      try {
        if (activeTab === 'posts') {
          const { posts: data } = await postService.getUserPosts(userIdForPosts);
          if (!cancelled) setPosts(data || []);
        } else if (activeTab === 'saved' && isOwnProfile) {
          const { posts: data } = await postService.getSavedPosts();
          if (!cancelled) setSavedPosts(data || []);
        }
      } catch (err) {
        if (!cancelled) {
          setPosts([]);
          setSavedPosts([]);
          if (err?.response?.status !== 401) toast.error(err?.message || 'Failed to load posts');
        }
      } finally {
        if (!cancelled) setPostsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeTab, userIdForPosts, isOwnProfile]);

  const handleChat = async () => {
    if (!user || !currentUserId) return;
    setChatLoading(true);
    try {
      const conversation = await chatService.startConversation(user._id);
      const convId = conversation?._id;
      if (convId) {
        navigate('/messages', { state: { openConversationId: convId, openConversation: conversation } });
      } else {
        toast.error('Could not start conversation');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Could not start chat');
    } finally {
      setChatLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) return;
    setFollowLoading(true);
    try {
      if (following) await userService.unfollowUser(user._id);
      else await userService.followUser(user._id);
      setFollowing(!following);
      setUser(prev => ({
        ...prev,
        followersCount: following ? (prev.followersCount || 0) - 1 : (prev.followersCount || 0) + 1,
      }));
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update follow');
    } finally { setFollowLoading(false); }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/profile/${user?._id || idForApi}`;
    navigator.clipboard?.writeText(url);
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2500);
  };

  const handleBlock = async () => {
    if (!user || !currentUserId) return;
    setBlockUnblockLoading(true);
    try {
      await userService.blockUser(user._id);
      setShowBlockModal(false);
      setProfileMenuOpen(false);
      setUser((prev) => (prev ? { ...prev, isBlockedByMe: true, isFollowing: false } : prev));
      setFollowing(false);
      queryClient.invalidateQueries({ queryKey: privacyKeys.blocked() });
      queryClient.invalidateQueries({ queryKey: ['posts', 'recent'] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'trending'] });
      toast.success('User blocked');
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to block');
    } finally {
      setBlockUnblockLoading(false);
    }
  };

  const handleUnblock = async () => {
    if (!user || !currentUserId) return;
    setBlockUnblockLoading(true);
    try {
      await userService.unblockUser(user._id);
      setShowUnblockModal(false);
      setUser((prev) => (prev ? { ...prev, isBlockedByMe: false } : prev));
      queryClient.invalidateQueries({ queryKey: privacyKeys.blocked() });
      queryClient.invalidateQueries({ queryKey: ['posts', 'recent'] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'trending'] });
      toast.success('User unblocked');
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to unblock');
    } finally {
      setBlockUnblockLoading(false);
    }
  };

  const openListModal = useCallback(async (type) => {
    if (!user?._id) return;
    setListModal(type);
    setListLoading(true);
    setListUsers([]);
    try {
      const res = type === 'followers'
        ? await userService.getFollowers(user._id, 1, 50)
        : await userService.getFollowing(user._id, 1, 50);
      const raw = res?.data ?? [];
      const normalized = (type === 'followers'
        ? raw.map((d) => d.follower || d).filter(Boolean)
        : raw.map((d) => d.following || d).filter(Boolean)
      ).map((u) => ({
        _id: u._id ?? u.id,
        name: u.name ?? 'User',
        avatar: u.profilePhoto?.url ?? u.avatar?.url ?? u.avatar ?? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop',
      }));
      setListUsers(normalized);
    } catch {
      toast.error('Failed to load list');
      setListModal(null);
    } finally {
      setListLoading(false);
    }
  }, [user?._id]);

  const handleBlockFromList = async () => {
    if (!blockTargetFromList?.userId) return;
    setBlockUnblockLoading(true);
    try {
      await userService.blockUser(blockTargetFromList.userId);
      setBlockTargetFromList(null);
      setListUsers((prev) => prev.filter((u) => String(u._id) !== String(blockTargetFromList.userId)));
      setListMenuUserId(null);
      queryClient.invalidateQueries({ queryKey: privacyKeys.blocked() });
      queryClient.invalidateQueries({ queryKey: ['posts', 'recent'] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'trending'] });
      toast.success('User blocked');
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to block');
    } finally {
      setBlockUnblockLoading(false);
    }
  };

  useEffect(() => {
    const close = (e) => { if (listMenuRef.current && !listMenuRef.current.contains(e.target)) setListMenuUserId(null); };
    if (listMenuUserId) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [listMenuUserId]);

  const handleProfilePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      const updated = await userService.uploadProfilePhoto(file);
      const photoUrl = updated?.profilePhoto?.url ?? (typeof updated?.profilePhoto === 'string' ? updated.profilePhoto : null);
      if (photoUrl) {
        setUser(prev => ({ ...prev, profilePhoto: photoUrl }));
        const g = authStore.getState();
        if (g?.user && typeof authStore.setUser === 'function') {
          authStore.setUser({ ...g.user, profilePhoto: photoUrl });
        }
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Profile photo upload failed');
    }
    e.target.value = '';
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      const form = new FormData();
      form.append('background', file);
      const updated = await userService.updateBackground(form);
      const coverUrl = updated?.background?.url ?? (typeof updated?.background === 'string' ? updated.background : null);
      if (coverUrl) setUser(prev => ({ ...prev, coverPhoto: coverUrl, coverPreset: null }));
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Cover photo upload failed');
    }
    e.target.value = '';
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-3xl mx-auto">
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 dark:bg-gray-700" />
          <div className="bg-white dark:bg-gray-800 px-6 pb-5 transition-colors duration-200">
            <div className="flex items-end gap-4 -mt-12 mb-4">
              <div className="w-24 h-24 rounded-full bg-gray-300 dark:bg-gray-600 border-4 border-white dark:border-gray-800" />
              <div className="flex-1 pt-16 space-y-2">
                <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-1/3" />
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded" />
              <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-5/6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-red-100 dark:border-red-900/50 p-10 text-center shadow-sm dark:shadow-none transition-colors duration-200">
        <AlertCircle size={40} className="text-red-400 dark:text-red-500 mx-auto mb-3" />
        <p className="font-semibold text-gray-700 dark:text-gray-300">{error}</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button onClick={loadProfile} className="px-6 py-2 bg-green-600 dark:bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-700 dark:hover:bg-green-600 transition flex items-center gap-2">
            <RefreshCw size={14} /> Retry
          </button>
          {error.includes('log in') && (
            <button onClick={() => navigate('/login')} className="px-6 py-2 border border-green-600 dark:border-green-500 text-green-700 dark:text-green-400 rounded-xl text-sm font-semibold hover:bg-green-50 dark:hover:bg-green-900/20 transition">
              Log in
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Edit Modal */}
      {showEditModal && (
        <EditProfileModal user={user} currentUserId={currentUserId} onClose={() => setShowEditModal(false)} onSaved={(updated) => { setUser(updated); }} />
      )}
      {showBlockModal && (
        <BlockConfirmModal
          username={user?.name || user?.username}
          onConfirm={handleBlock}
          onCancel={() => setShowBlockModal(false)}
          loading={blockUnblockLoading}
        />
      )}
      {showUnblockModal && (
        <UnblockConfirmModal
          username={user?.name || user?.username}
          onConfirm={handleUnblock}
          onCancel={() => setShowUnblockModal(false)}
          loading={blockUnblockLoading}
        />
      )}
      {blockTargetFromList && (
        <BlockConfirmModal
          username={blockTargetFromList.name}
          onConfirm={handleBlockFromList}
          onCancel={() => setBlockTargetFromList(null)}
          loading={blockUnblockLoading}
        />
      )}
      {listModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4" role="dialog" aria-modal="true" aria-labelledby="list-modal-title">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[80vh] flex flex-col shadow-2xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
              <h2 id="list-modal-title" className="font-bold text-gray-900 dark:text-gray-100">
                {listModal === 'followers' ? t('profile.followers') : t('profile.following')}
              </h2>
              <button type="button" onClick={() => { setListModal(null); setListUsers([]); setListMenuUserId(null); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-500" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 min-h-0 p-2">
              {listLoading ? (
                <div className="flex justify-center py-8"><Loader size={24} className="animate-spin text-green-600" /></div>
              ) : listUsers.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No one yet</p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {listUsers.map((u) => (
                    <div key={u._id} className="flex items-center gap-3 py-3 px-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl">
                      <img src={u.avatar} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0 cursor-pointer border border-gray-100 dark:border-gray-600" onClick={() => { setListModal(null); navigate(`/profile/${u._id}`); }} />
                      <button type="button" className="flex-1 text-left min-w-0 truncate font-semibold text-gray-900 dark:text-gray-100 text-sm" onClick={() => { setListModal(null); navigate(`/profile/${u._id}`); }}>
                        {u.name}
                      </button>
                      {currentUserId && String(u._id) !== String(currentUserId) && (
                        <div className="relative flex-shrink-0" ref={listMenuUserId === u._id ? listMenuRef : null}>
                          <button type="button" onClick={() => setListMenuUserId((id) => (id === u._id ? null : u._id))} className="p-2 rounded-lg text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600" aria-label="Options">
                            <MoreVertical size={16} />
                          </button>
                          {listMenuUserId === u._id && (
                            <>
                              <div className="fixed inset-0 z-10" aria-hidden onClick={() => setListMenuUserId(null)} />
                              <div className="absolute right-0 top-full mt-1 py-1 w-40 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-lg z-20">
                                <button type="button" onClick={() => { setListMenuUserId(null); setBlockTargetFromList({ userId: u._id, name: u.name }); }} className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                                  Block
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Toast */}
      {shareToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-4 py-2.5 rounded-xl shadow-xl text-sm font-semibold flex items-center gap-2">
          <CheckCircle size={15} /> Profile link copied!
        </div>
      )}

      {/* Hidden file inputs */}
      <input ref={profilePhotoInputRef} type="file" accept="image/*" hidden onChange={handleProfilePhotoUpload} />
      <input ref={coverInputRef} type="file" accept="image/*" hidden onChange={handleCoverUpload} />

      <div className="max-w-3xl mx-auto">
        {/* Cover Photo */}
        <div className="relative h-52 sm:h-64 bg-gradient-to-br from-green-600 to-green-400 group overflow-hidden" style={user.coverPreset ? { background: user.coverPreset } : undefined}>
          {user.coverPhoto && !user.coverPreset && <img src={user.coverPhoto} alt="cover" className="w-full h-full object-cover" />}
          {user.isOwnProfile && (
            <button onClick={() => coverInputRef.current?.click()}
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 bg-black/50 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition hover:bg-black/70">
              <Camera size={13} /> Change Cover
            </button>
          )}
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-none border-b border-gray-100 dark:border-gray-700 transition-colors duration-200">
          <div className="px-5 sm:px-8">
            {/* Avatar + Actions Row */}
            <div className="flex items-end justify-between -mt-14 sm:-mt-16 pb-4">
              <div className="relative group">
                <img src={user.profilePhoto} alt={user.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-md" />
                {user.isOwnProfile && (
                  <button onClick={() => profilePhotoInputRef.current?.click()}
                    className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                    <Camera size={20} className="text-white" />
                  </button>
                )}
                {user.verified && (
                  <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                    <CheckCircle size={13} className="text-white" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 pb-1">
                <button onClick={handleShare}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-1.5">
                  <Share2 size={13} /> {t('profile.share')}
                </button>
                {user.isOwnProfile ? (
                  <button onClick={() => setShowEditModal(true)}
                    className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-xl text-xs font-bold hover:bg-green-700 dark:hover:bg-green-600 transition flex items-center gap-1.5 shadow-sm">
                    <Edit3 size={13} /> {t('profile.editProfile')}
                  </button>
                ) : (
                  <>
                    {!user.isBlockedByMe && (
                      <>
                        <button onClick={handleFollow} disabled={followLoading}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${following ? 'border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700' : 'bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600 shadow-sm'}`}>
                          {followLoading ? <Loader size={13} className="animate-spin" /> : following ? <Check size={13} /> : <Plus size={13} />}
                          {following ? t('profile.followingBtn') : t('profile.follow')}
                        </button>
                        {canChat && (
                          <button onClick={handleChat} disabled={chatLoading}
                            className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-xl text-xs font-bold hover:bg-green-700 dark:hover:bg-green-600 shadow-sm transition flex items-center gap-1.5">
                            {chatLoading ? <Loader size={13} className="animate-spin" /> : <MessageSquare size={13} />}
                            {t('profile.chat')}
                          </button>
                        )}
                      </>
                    )}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setProfileMenuOpen((o) => !o)}
                        className="p-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        aria-label="More options"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {profileMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-10" aria-hidden onClick={() => setProfileMenuOpen(false)} />
                          <div className="absolute right-0 top-full mt-1 py-1 w-48 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-lg z-20">
                            {user.isBlockedByMe ? (
                              <button
                                type="button"
                                onClick={() => { setProfileMenuOpen(false); setShowUnblockModal(true); }}
                                className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                Unblock {user.name || 'user'}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => { setProfileMenuOpen(false); setShowBlockModal(true); }}
                                className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                Block {user.name || 'user'}
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Name & Info */}
            <div className="pb-5">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100">{user.name}</h1>
                {user.verified && <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/40 px-2 py-0.5 rounded-full border border-green-100 dark:border-green-800">✓ Verified</span>}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 font-medium">{user.headline}</p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2">
                {user.location && (
                  <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"><MapPin size={11} className="text-green-600 dark:text-green-400" />{user.location}</span>
                )}
                {user.website && (
                  <a href={`https://${user.website}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 hover:underline font-medium">
                    <LinkIcon size={11} />{user.website}
                  </a>
                )}
                {user.joinedDate && (
                  <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500"><Calendar size={11} />Joined {user.joinedDate}</span>
                )}
              </div>

              {user.bio && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 leading-relaxed">{user.bio}</p>
              )}

              {/* Crops */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {user.crops?.map(crop => (
                  <span key={crop} className="px-2.5 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full border border-green-100 dark:border-green-800">🌱 {crop}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="border-t border-gray-100 dark:border-gray-700 px-5 sm:px-8 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: t('profile.followers'), value: formatNumber(user.followersCount), icon: Users, color: 'text-green-600 dark:text-green-400', onClick: () => openListModal('followers') },
                { label: t('profile.following'), value: formatNumber(user.followingCount), icon: Users, color: 'text-blue-600 dark:text-blue-400', onClick: () => openListModal('following') },
                { label: t('profile.posts'), value: user.postsCount, icon: BookOpen, color: 'text-purple-600 dark:text-purple-400', onClick: null },
                { label: t('profile.profileViews'), value: user.profileViewers, icon: Eye, color: 'text-orange-600 dark:text-orange-400', onClick: null },
              ].map(({ label, value, icon: Icon, color, onClick }) => (
                <div
                  key={label}
                  role={onClick ? 'button' : undefined}
                  onClick={onClick ?? undefined}
                  className="text-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl cursor-pointer transition group"
                >
                  <Icon size={16} className={`${color} mx-auto mb-1 group-hover:scale-110 transition-transform`} />
                  <p className="text-lg font-black text-gray-900 dark:text-gray-100">{value}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Expandable Details */}
          <div className={`overflow-hidden transition-all duration-300 ${showMoreInfo ? 'max-h-96' : 'max-h-0'}`}>
            <div className="px-5 sm:px-8 pb-5 pt-1 border-t border-gray-100 dark:border-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {user.education && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <Award size={15} className="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <div><p className="text-xs font-bold text-gray-500 dark:text-gray-400">Education</p><p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{user.education}</p></div>
                  </div>
                )}
                {user.experience && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <Briefcase size={15} className="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <div><p className="text-xs font-bold text-gray-500 dark:text-gray-400">Experience</p><p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{user.experience}</p></div>
                  </div>
                )}
                {user.phone && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <Phone size={15} className="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <div><p className="text-xs font-bold text-gray-500 dark:text-gray-400">Contact</p><p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{user.phone}</p></div>
                  </div>
                )}
                {user.certifications?.length > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <Star size={15} className="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Certifications</p>
                      {user.certifications.map(cert => <p key={cert} className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{cert}</p>)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {!user.isOwnProfile && user.isBlockedByMe && (
            <div className="mx-5 sm:mx-8 mb-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center gap-3">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200 flex-1">You've blocked this user.</p>
              <button type="button" onClick={() => setShowUnblockModal(true)} className="px-4 py-2 rounded-xl text-sm font-bold text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition">Unblock</button>
            </div>
          )}
          <button onClick={() => setShowMoreInfo(!showMoreInfo)}
            className="w-full py-3 text-sm text-green-700 dark:text-green-400 font-bold hover:bg-green-50 dark:hover:bg-green-900/20 transition flex items-center justify-center gap-1.5 border-t border-gray-100 dark:border-gray-700">
            {showMoreInfo ? <><ChevronUp size={15} /> Show Less</> : <><ChevronDown size={15} /> Show More Details</>}
          </button>
        </div>

        {/* Impact Stats (from MongoDB: profileViewers, postImpressions, savedCount) */}
        {user.isOwnProfile && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm dark:shadow-none mt-4 mx-4 sm:mx-0 p-5 transition-colors duration-200">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2"><TrendingUp size={15} className="text-green-600 dark:text-green-400" /> Your Impact This Week</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Profile Views', value: user.profileViewers ?? 0, change: user.profileViewersChange ?? null },
                { label: 'Post Impressions', value: user.postImpressions ?? 0, change: user.postImpressionsChange ?? null },
                { label: 'Saved Posts', value: user.savedCount ?? 0, change: user.savedCountChange ?? null },
              ].map(({ label, value, change }) => (
                <div key={label} className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                  <p className="text-xl font-black text-green-700 dark:text-green-400">{formatNumber(value)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
                  <p className={`text-xs font-bold mt-1 ${change != null && String(change).startsWith('-') ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {change != null ? (typeof change === 'number' ? (change >= 0 ? `+${change}` : String(change)) : change) : '—'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs + Content (hide posts grid when viewing someone we blocked) */}
        <div className="bg-white dark:bg-gray-800 rounded-t-none mt-4 shadow-sm dark:shadow-none transition-colors duration-200">
          {!user.isBlockedByMe && (
            <div className="flex border-b border-gray-100 dark:border-gray-700 px-4 sticky top-0 bg-white dark:bg-gray-800 z-10">
              {[
                { id: 'posts', label: `Posts (${user.postsCount ?? 0})` },
                ...(isOwnProfile ? [{ id: 'saved', label: `Saved (${user.savedCount ?? 0})` }] : []),
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-3.5 text-sm font-bold border-b-2 transition mr-1 ${activeTab === tab.id ? 'border-green-600 dark:border-green-500 text-green-700 dark:text-green-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          <div className="p-4">
            {user.isBlockedByMe ? (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                Posts from this user are hidden because you blocked them.
              </div>
            ) : postsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl animate-pulse h-48 border border-gray-100 dark:border-gray-700" />
                ))}
              </div>
            ) : activeTab === 'posts' && posts.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-4xl mb-3">🌱</div>
                <p className="font-bold text-gray-700 dark:text-gray-300">No posts yet</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Share your farming experiences!</p>
              </div>
            ) : activeTab === 'saved' && savedPosts.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-4xl mb-3">🔖</div>
                <p className="font-bold text-gray-700 dark:text-gray-300">No saved posts</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Bookmark posts to see them here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeTab === 'posts' && posts.map(post => <PostMiniCard key={post._id} post={post} />)}
                {activeTab === 'saved' && savedPosts.map(post => <SavedPostCard key={post._id} post={post} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
