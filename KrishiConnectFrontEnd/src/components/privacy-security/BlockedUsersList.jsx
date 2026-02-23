import React from 'react';
import { UserX } from 'lucide-react';
import BlockedUserItem from './BlockedUserItem';

/**
 * Skeleton placeholder for one blocked user row.
 */
function BlockedUserSkeleton() {
  return (
    <div className="flex items-center gap-3 px-5 sm:px-6 py-3.5 animate-pulse" data-testid="blocked-user-skeleton">
      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex-shrink-0" />
      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="h-3.5 bg-gray-200 dark:bg-gray-600 rounded w-1/3" />
        <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded w-1/4" />
      </div>
      <div className="h-8 w-20 bg-gray-200 dark:bg-gray-600 rounded-xl flex-shrink-0" />
    </div>
  );
}

/**
 * Blocked users list: skeleton when loading, empty state when none, list of BlockedUserItem otherwise.
 * @param {Object} props
 * @param {Array<{ id: string, name: string, avatar?: string, blockedAt: string }>} [props.users] - Blocked users
 * @param {boolean} [props.loading] - Fetch in progress
 * @param {(userId: string) => void} props.onUnblock
 * @param {Record<string, boolean>} [props.unblockingById] - Map userId -> unblock in progress
 */
export default function BlockedUsersList({
  users = [],
  loading = false,
  onUnblock,
  unblockingById = {},
}) {
  if (loading) {
    return (
      <div className="divide-y divide-gray-50 dark:divide-gray-700">
        {[1, 2, 3].map((i) => (
          <BlockedUserSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!users.length) {
    return (
      <div className="px-6 py-8 text-center" data-testid="blocked-users-empty">
        <UserX
          size={32}
          className="text-gray-200 dark:text-gray-600 mx-auto mb-2"
          aria-hidden
        />
        <p className="text-sm text-gray-400 dark:text-gray-500">You haven't blocked anyone</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-50 dark:divide-gray-700" data-testid="blocked-users-list">
      {users.map((user, index) => {
        const uid = user.id ?? user._id;
        const idStr = uid != null ? String(uid) : `user-${index}`;
        return (
          <BlockedUserItem
            key={idStr}
            user={user}
            onUnblock={onUnblock}
            unblocking={unblockingById[idStr]}
          />
        );
      })}
    </div>
  );
}
