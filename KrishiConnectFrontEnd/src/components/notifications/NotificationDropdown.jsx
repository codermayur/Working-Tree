import React, { useState, useRef, useEffect } from 'react';
import { Bell, Loader2, Check, Trash2, ChevronDown } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { NotificationSkeleton } from './NotificationSkeleton';

export function NotificationDropdown({ className = '', notifications: notificationsProp }) {
  const hook = useNotifications();
  const notifications = notificationsProp || hook;
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

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
  } = notifications;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-xs font-bold bg-red-500 text-white rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[360px] max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[420px]">
          <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <span className="font-semibold text-gray-800 dark:text-gray-200">Notifications</span>
            {list.some((n) => !n.isRead) && (
              <button
                type="button"
                onClick={() => markAllAsRead()}
                className="text-xs text-green-600 dark:text-green-400 hover:underline flex items-center gap-1"
              >
                <Check size={14} />
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1 min-h-0">
            {loading && list.length === 0 && (
              <div className="p-3">
                <NotificationSkeleton count={5} />
              </div>
            )}

            {error && list.length === 0 && (
              <div className="p-4 text-center">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                <button
                  type="button"
                  onClick={refresh}
                  className="mt-2 text-sm text-green-600 dark:text-green-400 hover:underline"
                >
                  Retry
                </button>
              </div>
            )}

            {!loading && list.length === 0 && !error && (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                No notifications yet
              </div>
            )}

            {list.length > 0 && (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {list.map((n) => (
                  <li key={n._id} className="relative group">
                    <NotificationItem
                      notification={n}
                      onMarkAsRead={markAsRead}
                      compact
                    />
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); removeNotification(n._id); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 transition"
                      aria-label="Remove notification"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {pagination.hasMore && (
              <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="w-full py-2 text-sm text-green-600 dark:text-green-400 hover:underline disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {loadingMore ? <Loader2 size={16} className="animate-spin" /> : <ChevronDown size={16} />}
                  Load more
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
