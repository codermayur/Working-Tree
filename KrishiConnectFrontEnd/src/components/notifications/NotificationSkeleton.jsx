import React from 'react';

export function NotificationSkeleton({ count = 3 }) {
  return (
    <ul className="divide-y divide-gray-100 dark:divide-gray-700 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="flex gap-3 p-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default NotificationSkeleton;
