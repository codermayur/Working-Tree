import React from 'react';
import { Link } from 'react-router-dom';
import { getRelativeTime } from '../../utils/relativeTime';

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

function getSenderName(sender) {
  if (!sender) return 'Someone';
  return sender.name || 'Someone';
}

function getAvatar(sender) {
  if (!sender) return DEFAULT_AVATAR;
  const url = sender.profilePhoto?.url ?? sender.avatar?.url ?? sender.avatar;
  return typeof url === 'string' ? url : DEFAULT_AVATAR;
}

export function NotificationItem({ notification, onMarkAsRead, onDelete, compact }) {
  const sender = notification.sender;
  const link = getEntityLink(notification);
  const isUnread = !notification.isRead;

  const handleClick = () => {
    if (isUnread && onMarkAsRead) onMarkAsRead(notification._id);
  };

  const content = (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      className={`
        flex gap-3 p-3 rounded-xl transition text-left w-full
        ${isUnread ? 'bg-green-50/80 dark:bg-green-900/20' : 'bg-gray-50/50 dark:bg-gray-800/50'}
        hover:bg-green-50 dark:hover:bg-green-900/30
        ${compact ? 'py-2' : ''}
      `}
    >
      <img
        src={getAvatar(sender)}
        alt={getSenderName(sender)}
        className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-gray-200 dark:border-gray-600"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-800 dark:text-gray-200">
          <span className="font-semibold">{getSenderName(sender)}</span>
          {' '}
          <span className="text-gray-600 dark:text-gray-400">{notification.message || 'sent you a notification'}</span>
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
          {getRelativeTime(notification.createdAt)}
        </p>
      </div>
      {isUnread && (
        <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-2" title="Unread" />
      )}
    </div>
  );

  if (link) {
    return (
      <Link to={link} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded-xl">
        {content}
      </Link>
    );
  }

  return content;
}

export default NotificationItem;
