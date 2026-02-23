import React from 'react';
import { Check, Loader } from 'lucide-react';
import { getRelativeTime } from '../../utils/relativeTime';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop';

/**
 * Single blocked user row: avatar, name, relative time, Unblock button.
 * @param {Object} props
 * @param {{ id: string, name: string, avatar?: string, blockedAt: string }} props.user
 * @param {(userId: string) => void} props.onUnblock
 * @param {boolean} [props.unblocking] - Unblock in progress
 */
export default function BlockedUserItem({ user, onUnblock, unblocking = false }) {
  const userId = user.id ?? user._id;
  const idStr = userId != null ? String(userId) : '';
  const name = user.name ?? 'Unknown';
  const avatar = user.avatar || user.profilePhoto?.url || user.profilePhoto || DEFAULT_AVATAR;
  const blockedLabel = user.blockedAt
    ? (user.blockedAt.includes('ago') || user.blockedAt.includes('week') || user.blockedAt.includes('month')
        ? user.blockedAt
        : `Blocked ${getRelativeTime(user.blockedAt)}`)
    : 'Blocked';

  return (
    <div
      className="flex items-center gap-3 px-5 sm:px-6 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      data-testid="blocked-user-item"
    >
      <img
        src={avatar}
        alt=""
        className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-gray-600 flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{name}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">{blockedLabel}</p>
      </div>
      <button
        type="button"
        onClick={() => onUnblock(idStr)}
        disabled={unblocking}
        className="px-3 py-1.5 text-xs font-bold border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition flex items-center gap-1.5 flex-shrink-0 disabled:opacity-50"
        aria-label={`Unblock ${name}`}
      >
        {unblocking ? (
          <Loader size={11} className="animate-spin" aria-hidden />
        ) : (
          <Check size={11} aria-hidden />
        )}
        Unblock
      </button>
    </div>
  );
}
