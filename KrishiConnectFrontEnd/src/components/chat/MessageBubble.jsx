import React, { useState, useRef, useEffect } from 'react';
import {
  Check,
  CheckCheck,
  Reply,
  Copy,
  Pencil,
  Trash2,
  Forward,
  Heart,
  Smile,
  Frown,
  ThumbsUp,
  AlertCircle,
  X,
  Download,
} from 'lucide-react';

const REACTION_EMOJIS = [
  { key: 'heart', emoji: '❤️', Icon: Heart },
  { key: 'laugh', emoji: '😂', Icon: Smile },
  { key: 'surprised', emoji: '😮' },
  { key: 'sad', emoji: '😢', Icon: Frown },
  { key: 'angry', emoji: '😠', Icon: AlertCircle },
  { key: 'thumbsup', emoji: '👍', Icon: ThumbsUp },
];

const EDIT_WINDOW_MS = 15 * 60 * 1000;

/**
 * Single message bubble with actions (react, reply, copy, edit, unsend, forward).
 * message: { _id, senderId, content, type, timestamp, status, replyTo?, reactions?, isEdited?, isUnsent? }
 */
export function MessageBubble({
  message,
  isMine,
  currentUserId,
  onReply,
  onReact,
  onEdit,
  onUnsend,
  onForward,
  formatTime,
}) {
  const [showActions, setShowActions] = useState(false);
  const [showReactionBar, setShowReactionBar] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const bubbleRef = useRef(null);
  const editInputRef = useRef(null);

  const canEdit =
    isMine &&
    message.type === 'text' &&
    !message.isUnsent &&
    message.createdAt &&
    Date.now() - new Date(message.createdAt).getTime() <= EDIT_WINDOW_MS;

  const textContent =
    message.type === 'text'
      ? typeof message.content === 'string'
        ? message.content
        : message.content?.text ?? ''
      : '';

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  const handleCopy = () => {
    if (textContent && navigator.clipboard) {
      navigator.clipboard.writeText(textContent);
      setShowActions(false);
    }
  };

  const handleEditSubmit = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== textContent && onEdit) {
      onEdit(message._id, trimmed);
      setIsEditing(false);
      setShowActions(false);
    } else {
      setIsEditing(false);
    }
  };

  const handleReact = (emoji) => {
    if (onReact) onReact(message._id, emoji);
    setShowReactionBar(false);
    setShowActions(false);
  };

  if (message.isUnsent) {
    return (
      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}>
        <div className="max-w-[75%] px-4 py-2 rounded-2xl text-sm italic text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700/50">
          This message was unsent
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={bubbleRef}
        className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2 group`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => {
          setShowActions(false);
          setShowReactionBar(false);
        }}
      >
        <div className="relative max-w-[75%]">
          {/* Action bar (hover / long-press) */}
          {(showActions || showReactionBar) && (
            <div
              className={`absolute z-10 flex items-center gap-0.5 rounded-full shadow-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-0.5 ${
                isMine ? 'right-0 bottom-full mb-1' : 'left-0 bottom-full mb-1'
              }`}
            >
              {showReactionBar ? (
                <>
                  {REACTION_EMOJIS.map(({ key, emoji }) => (
                    <button
                      key={key}
                      type="button"
                      className="w-8 h-8 text-lg hover:scale-110 transition rounded-full flex items-center justify-center"
                      onClick={() => handleReact(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="p-1 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowReactionBar(false)}
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full text-gray-600 dark:text-gray-300"
                    onClick={() => setShowReactionBar(true)}
                    title="React"
                  >
                    <Heart size={14} />
                  </button>
                  {onReply && (
                    <button
                      type="button"
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full text-gray-600 dark:text-gray-300"
                      onClick={() => { onReply(message); setShowActions(false); }}
                      title="Reply"
                    >
                      <Reply size={14} />
                    </button>
                  )}
                  {message.type === 'text' && textContent && (
                    <button
                      type="button"
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full text-gray-600 dark:text-gray-300"
                      onClick={handleCopy}
                      title="Copy"
                    >
                      <Copy size={14} />
                    </button>
                  )}
                  {canEdit && onEdit && (
                    <button
                      type="button"
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full text-gray-600 dark:text-gray-300"
                      onClick={() => { setIsEditing(true); setEditText(textContent); }}
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  {isMine && onUnsend && (
                    <button
                      type="button"
                      className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-full text-red-600 dark:text-red-400"
                      onClick={() => onUnsend(message._id)}
                      title="Unsend"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  {onForward && (
                    <button
                      type="button"
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full text-gray-600 dark:text-gray-300"
                      onClick={() => { onForward(message); setShowActions(false); }}
                      title="Forward"
                    >
                      <Forward size={14} />
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          <div
            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
              isMine
                ? 'bg-green-600 text-white rounded-br-sm'
                : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-600 rounded-bl-sm'
            }`}
          >
            {/* Reply preview */}
            {message.replyTo && (message.replyTo.text || message.replyTo.content?.text) && (
              <div className={`mb-1.5 pl-2 border-l-2 ${isMine ? 'border-green-400' : 'border-gray-300 dark:border-gray-500'}`}>
                <p className="text-xs font-semibold opacity-90">
                  {message.replyTo.sender?.name ?? 'User'}
                </p>
                <p className="text-xs opacity-75 truncate max-w-[200px]">
                  {message.replyTo.text || message.replyTo.content?.text || '[Message]'}
                </p>
              </div>
            )}

            {isEditing ? (
              <div className="space-y-2">
                <input
                  ref={editInputRef}
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEditSubmit();
                    if (e.key === 'Escape') { setIsEditing(false); setEditText(textContent); }
                  }}
                  className="w-full px-2 py-1 rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="text-xs underline opacity-80"
                    onClick={handleEditSubmit}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="text-xs underline opacity-80"
                    onClick={() => { setIsEditing(false); setEditText(textContent); }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {message.type === 'image' && (message.content?.url || message.attachment?.url) && (
                  <button
                    type="button"
                    className="block rounded-lg overflow-hidden text-left"
                    onClick={() => setShowLightbox(true)}
                  >
                    <img
                      src={message.content?.url || message.attachment?.url}
                      alt="Shared"
                      className="max-w-full max-h-64 object-contain rounded-lg"
                    />
                  </button>
                )}
                {message.type === 'video' && (message.content?.url || message.attachment?.url) && (
                  <div className="rounded-lg overflow-hidden bg-black">
                    <video
                      src={message.content?.url || message.attachment?.url}
                      controls
                      className="max-w-full max-h-64"
                    />
                  </div>
                )}
                {message.type === 'file' && (
                  <DocumentPreview message={message} isMine={isMine} />
                )}
                {message.type === 'text' && (
                  <p className="whitespace-pre-wrap break-words">{textContent}</p>
                )}
                {(message.reactions?.length > 0) && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {message.reactions.map((r, i) => (
                      <span key={i} className="text-base" title={r.user?.name}>
                        {r.emoji}
                      </span>
                    ))}
                  </div>
                )}
                <div className={`flex items-center gap-1 justify-end mt-1 flex-wrap ${isMine ? 'opacity-70' : 'opacity-50'}`}>
                  {message.isEdited && (
                    <span className="text-xs italic mr-1">Edited</span>
                  )}
                  <span className="text-xs">{formatTime ? formatTime(message.timestamp || message.createdAt) : message.timestamp}</span>
                  {isMine && (
                    message.status === 'read' ? (
                      <CheckCheck size={14} className="text-blue-200 dark:text-blue-300" />
                    ) : message.status === 'delivered' ? (
                      <CheckCheck size={14} />
                    ) : (
                      <Check size={14} />
                    )
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showLightbox && (message.content?.url || message.attachment?.url) && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowLightbox(false)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Escape' && setShowLightbox(false)}
          aria-label="Close lightbox"
        >
          <img
            src={message.content?.url || message.attachment?.url}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

function DocumentPreview({ message, isMine }) {
  const url = message.content?.url || message.attachment?.url;
  const filename = message.attachment?.filename || message.content?.filename || 'Document';
  const size = message.attachment?.size ?? message.content?.size;
  const sizeStr = size ? `${(size / 1024).toFixed(1)} KB` : '';

  return (
    <div className="flex items-center gap-2 py-1">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{filename}</p>
        {sizeStr && <p className="text-xs opacity-75">{sizeStr}</p>}
      </div>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          download={filename}
          className={`p-2 rounded-lg ${isMine ? 'bg-white/20 hover:bg-white/30' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'}`}
          title="Download"
        >
          <Download size={16} />
        </a>
      )}
    </div>
  );
}

export default MessageBubble;
