import React from 'react';
import { Search, RefreshCw, AlertCircle } from 'lucide-react';

/**
 * Left panel: conversation list with search, last message preview, unread badge, online dot.
 * convo shape: { _id, participant: { _id, name, avatar, specialty, online }, lastMessage, lastMessageTime, unreadCount, lastMessageSenderId }
 */
export function ConversationList({
  conversations,
  loading,
  error,
  searchQuery,
  onSearchChange,
  activeConvoId,
  onSelectConversation,
  onRetry,
  currentUserId,
  searchPlaceholder = 'Search conversations',
  emptyMessage = 'No conversations yet',
  emptyHint = 'Start a chat from a profile',
}) {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700">
      <div className="p-3 border-b border-gray-50 dark:border-gray-700 flex-shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 dark:focus:ring-green-600 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {loading ? (
          <ConversationListSkeleton count={5} />
        ) : error ? (
          <div className="p-6 text-center">
            <AlertCircle size={32} className="text-red-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
            <button
              onClick={onRetry}
              className="mt-3 text-xs text-green-600 dark:text-green-400 font-semibold hover:underline flex items-center gap-1 mx-auto"
            >
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-3">💬</div>
            <p className="font-semibold text-gray-700 dark:text-gray-300 text-sm">{emptyMessage}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{emptyHint}</p>
          </div>
        ) : (
          conversations.map((convo) => (
            <ConversationItem
              key={convo._id}
              convo={convo}
              isActive={activeConvoId === convo._id}
              onClick={() => onSelectConversation(convo)}
              currentUserId={currentUserId}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ConversationItem({ convo, isActive, onClick, currentUserId }) {
  const isLastFromMe = convo.lastMessageSenderId && String(convo.lastMessageSenderId) === String(currentUserId);
  const preview = isLastFromMe ? `You: ${convo.lastMessage || ''}` : (convo.lastMessage || '');
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left hover:bg-gray-50 dark:hover:bg-gray-700 ${
        isActive ? 'bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800' : ''
      }`}
    >
      <div className="relative flex-shrink-0">
        <img
          src={convo.participant?.avatar || ''}
          alt={convo.participant?.name || 'User'}
          className={`w-12 h-12 rounded-full object-cover border-2 ${
            isActive ? 'border-green-400 dark:border-green-500' : 'border-gray-100 dark:border-gray-600'
          }`}
        />
        {convo.participant?.online && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p
            className={`text-sm font-bold truncate ${
              isActive ? 'text-green-800 dark:text-green-300' : 'text-gray-900 dark:text-gray-100'
            }`}
          >
            {convo.participant?.name || 'User'}
          </p>
          <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 ml-1">
            {convo.lastMessageTime || ''}
          </span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p
            className={`text-xs truncate max-w-[140px] ${
              convo.unreadCount > 0 ? 'font-semibold text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            {preview}
          </p>
          {convo.unreadCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-green-600 text-white text-xs rounded-full font-bold flex-shrink-0 min-w-[18px] text-center">
              {convo.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export function ConversationListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-gray-200 dark:bg-gray-600 rounded w-3/4" />
            <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default ConversationList;
