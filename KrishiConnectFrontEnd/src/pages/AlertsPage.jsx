import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, BellOff, CheckCheck, Trash2, Loader, AlertCircle, RefreshCw,
  Heart, MessageSquare, UserPlus, Briefcase, TrendingUp, Droplet,
  AlertTriangle, CheckCircle, ChevronDown
} from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { getRelativeTime } from '../utils/relativeTime';
import { NotificationSkeleton } from '../components/notifications/NotificationSkeleton';
import { NotificationSettingsPanel } from '../components/notifications/NotificationSettingsPanel';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=96&h=96&fit=crop';

function getEntityLink(notification) {
  const { entityType, entityId } = notification;
  if (!entityId) return null;
  const id = typeof entityId === 'object' ? entityId._id || entityId : entityId;
  if (entityType === 'post') return `/post/${id}`;
  if (entityType === 'user') return `/profile/${id}`;
  if (entityType === 'conversation') return `/messages?conversation=${id}`;
  return null;
}

// ============================================================================
// NOTIFICATION TYPE CONFIG (matches backend: like | comment | share | follow | expert_verification | system)
// ============================================================================
const NOTIFICATION_CONFIG = {
  like: { icon: Heart, color: 'bg-red-50 text-red-500 dark:bg-red-900/30', label: 'Like' },
  comment: { icon: MessageSquare, color: 'bg-blue-50 text-blue-500 dark:bg-blue-900/30', label: 'Comment' },
  share: { icon: TrendingUp, color: 'bg-purple-50 text-purple-500 dark:bg-purple-900/30', label: 'Share' },
  follow: { icon: UserPlus, color: 'bg-green-50 text-green-500 dark:bg-green-900/30', label: 'Follow' },
  message: { icon: MessageSquare, color: 'bg-indigo-50 text-indigo-500 dark:bg-indigo-900/30', label: 'Message' },
  expert_verification: { icon: CheckCircle, color: 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/30', label: 'Verified' },
  system: { icon: Bell, color: 'bg-amber-50 text-amber-500 dark:bg-amber-900/30', label: 'System' },
  market_alert: { icon: TrendingUp, color: 'bg-orange-50 text-orange-500 dark:bg-orange-900/30', label: 'Market' },
  weather_alert: { icon: Droplet, color: 'bg-cyan-50 text-cyan-500 dark:bg-cyan-900/30', label: 'Weather' },
  pest_alert: { icon: AlertTriangle, color: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30', label: 'Alert' },
};

const FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'like', label: 'Likes' },
  { id: 'comment', label: 'Comments' },
  { id: 'message', label: 'Messages' },
  { id: 'follow', label: 'Follows' },
  { id: 'system', label: 'System' },
];

// ============================================================================
// NOTIFICATION CARD (API shape: sender, message, isRead, type, createdAt)
// ============================================================================
function NotificationCard({ notification, onMarkAsRead, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const config = NOTIFICATION_CONFIG[notification.type] || NOTIFICATION_CONFIG.system;
  const IconComponent = config.icon;
  const isUnread = !notification.isRead;
  const senderName = notification.sender?.name || 'Someone';
  const avatarUrl = notification.sender?.profilePhoto?.url ?? notification.sender?.avatar?.url ?? notification.sender?.avatar;
  const avatar = typeof avatarUrl === 'string' ? avatarUrl : avatarUrl?.url || DEFAULT_AVATAR;
  const link = getEntityLink(notification);

  const handleClick = () => {
    if (isUnread) onMarkAsRead(notification._id);
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleting(true);
    try {
      await onDelete(notification._id);
    } finally {
      setDeleting(false);
    }
  };

  const content = (
    <>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden ${config.color.split(' ')[0]}`}>
        {avatar ? (
          <img src={avatar} alt={senderName} className="w-10 h-10 rounded-xl object-cover" />
        ) : (
          <IconComponent size={18} className={config.color.split(' ')[1]} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-relaxed ${isUnread ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-600 dark:text-gray-300'}`}>
          <span className="font-bold text-gray-900 dark:text-gray-100">{senderName}</span>
          {' '}
          <span>{notification.message || 'sent you a notification'}</span>
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs font-semibold ${config.color.split(' ')[1]}`}>{config.label}</span>
          <span className="text-gray-300 dark:text-gray-500 text-xs">·</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">{getRelativeTime(notification.createdAt)}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {isUnread && <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />}
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-gray-400 hover:text-red-500 transition"
          aria-label="Delete"
        >
          {deleting ? <Loader size={13} className="animate-spin" /> : <Trash2 size={13} />}
        </button>
      </div>
    </>
  );

  const cardClass = `group flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-sm ${
    isUnread
      ? 'bg-green-50/30 dark:bg-green-900/20 border-green-100 dark:border-green-800'
      : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
  }`;

  if (link) {
    return (
      <Link to={link} className="block" onClick={handleClick}>
        <div className={cardClass}>{content}</div>
      </Link>
    );
  }

  return (
    <div className={cardClass} onClick={handleClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleClick()}>
      {content}
    </div>
  );
}

// ============================================================================
// ALERTS PAGE – dynamic fetch from API, pagination, filters, settings
// ============================================================================
const AlertsPage = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('notifications');

  const {
    list,
    unreadCount,
    loading,
    loadingMore,
    error,
    pagination,
    loadMore,
    markAsRead,
    markAllAsRead,
    removeNotification,
    refresh,
  } = useNotifications({ initialLimit: 20 });

  const filteredList = useMemo(() => {
    if (activeFilter === 'all') return list;
    if (activeFilter === 'unread') return list.filter((n) => !n.isRead);
    return list.filter((n) => n.type === activeFilter);
  }, [list, activeFilter]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-20 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <Bell size={22} className="text-green-600 dark:text-green-400" />
              <h1 className="text-xl font-black text-gray-900 dark:text-gray-100">Alerts</h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full font-bold">{unreadCount} new</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-xl transition border border-green-200 dark:border-green-700"
                >
                  <CheckCheck size={12} />
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-3">
            {[
              { id: 'notifications', label: 'Notifications' },
              { id: 'settings', label: 'Settings' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-semibold rounded-xl transition ${
                  activeTab === tab.id ? 'bg-green-500/20 text-[#00c853]' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'notifications' && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {FILTER_OPTIONS.map((ft) => (
                <button
                  key={ft.id}
                  type="button"
                  onClick={() => setActiveFilter(ft.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition border ${
                    activeFilter === ft.id
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600'
                  }`}
                >
                  {ft.label}
                  {ft.id === 'unread' && unreadCount > 0 && (
                    <span className={`ml-1 px-1 rounded-full text-xs font-bold ${activeFilter === 'unread' ? 'bg-white/30' : 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'}`}>
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={`max-w-3xl mx-auto px-4 py-6 ${activeTab === 'settings' ? 'min-h-screen bg-[#1a2332]' : ''}`}>
        {activeTab === 'notifications' && (
          <>
            {error && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-red-100 dark:border-red-900/50 p-8 text-center shadow-sm mb-4">
                <AlertCircle size={36} className="text-red-400 mx-auto mb-2" />
                <p className="text-gray-700 dark:text-gray-200 font-semibold text-sm">{error}</p>
                <button
                  type="button"
                  onClick={refresh}
                  className="mt-3 px-5 py-2 bg-green-600 text-white rounded-xl text-xs font-semibold hover:bg-green-700 transition flex items-center gap-1.5 mx-auto"
                >
                  <RefreshCw size={13} /> Retry
                </button>
              </div>
            )}

            {loading && list.length === 0 ? (
              <div className="space-y-2">
                <NotificationSkeleton count={8} />
              </div>
            ) : filteredList.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-16 text-center shadow-sm">
                <BellOff size={48} className="text-gray-200 dark:text-gray-500 mx-auto mb-4" />
                <p className="font-bold text-gray-700 dark:text-gray-200 text-lg">
                  {activeFilter !== 'all' ? 'No notifications in this category' : 'All caught up!'}
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                  {activeFilter !== 'all' ? 'Try a different filter' : "You have no notifications yet. We'll notify you when something happens."}
                </p>
                {activeFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setActiveFilter('all')}
                    className="mt-4 px-5 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition"
                  >
                    View all
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {filteredList.map((n) => (
                    <NotificationCard
                      key={n._id}
                      notification={n}
                      onMarkAsRead={markAsRead}
                      onDelete={removeNotification}
                    />
                  ))}
                </div>
                {pagination.hasMore && (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
                    >
                      {loadingMore ? <Loader size={18} className="animate-spin" /> : <ChevronDown size={18} />}
                      {loadingMore ? 'Loading...' : 'Load more'}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeTab === 'settings' && <NotificationSettingsPanel />}
      </div>
    </div>
  );
};

export default AlertsPage;
