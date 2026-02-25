import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Loader } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { chatService } from '../../services/chat.service';
import { authStore } from '../../store/authStore';

const DEFAULT_AVATAR =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23e5e7eb" width="100" height="100"/><text x="50" y="58" font-size="40" fill="%239ca3af" text-anchor="middle" dominant-baseline="middle">?</text></svg>'
  );

function getExpertAvatar(expert) {
  return expert?.profilePhoto?.url ?? expert?.avatar?.url ?? expert?.avatar ?? DEFAULT_AVATAR;
}

function normalizeMessage(msg, currentUserId) {
  const senderId = msg?.sender?._id ?? msg?.sender;
  const text = msg?.content?.text ?? msg?.text ?? (typeof msg?.content === 'string' ? msg.content : '');
  return {
    _id: msg._id,
    senderId,
    content: { text },
    type: msg.type || 'text',
    createdAt: msg.createdAt,
    isMine: String(senderId) === String(currentUserId),
  };
}

/**
 * Chat modal for "Ask an Expert" on CropDoctor.
 * expert: { _id, name, ... } or null
 * open: boolean
 * onClose: () => void
 */
export function ExpertChatModal({ expert, open, onClose }) {
  const { joinConversation, leaveConversation, sendMessage, subscribe } = useSocket();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startError, setStartError] = useState(null);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const currentUserId = authStore.getState().user?._id;
  const conversationIdRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Start conversation when modal opens with an expert
  useEffect(() => {
    if (!open || !expert?._id || !currentUserId) {
      setConversation(null);
      setMessages([]);
      setStartError(null);
      conversationIdRef.current = null;
      return;
    }
    setLoading(true);
    setStartError(null);
    let convId = null;
    chatService
      .startChat(expert._id)
      .then((conv) => {
        setConversation(conv);
        const id = conv?._id ?? conv?.id;
        convId = id;
        conversationIdRef.current = id;
        if (id) {
          joinConversation(id);
        }
        return id;
      })
      .then((conversationId) => {
        if (!conversationId) return;
        return chatService.getMessages(conversationId, { limit: 50 }).then((res) => {
          const list = res?.messages ?? res?.data ?? [];
          const normalized = list.map((m) => normalizeMessage(m, currentUserId));
          setMessages(normalized);
        });
      })
      .catch((err) => {
        setStartError(err?.response?.data?.message || err?.message || 'Failed to start chat');
      })
      .finally(() => {
        setLoading(false);
      });
    return () => {
      if (convId) leaveConversation(convId);
      conversationIdRef.current = null;
    };
  }, [open, expert?._id, currentUserId]);

  // Single socket listener for new messages (avoid duplicate by subscribing to one event only)
  useEffect(() => {
    if (!conversation?._id) return;
    const chatId = conversation._id.toString();

    const handler = (msg) => {
      const convMatch = !msg.conversation || String(msg.conversation) === chatId;
      if (!msg || !convMatch) return;
      const normalized = normalizeMessage(msg, currentUserId);
      setMessages((prev) => {
        if (prev.some((m) => m._id === normalized._id)) return prev;
        return [...prev, normalized];
      });
    };

    const unsub = subscribe('message:new', handler);
    return () => {
      unsub();
    };
  }, [conversation?._id, currentUserId, subscribe]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const handleSend = async () => {
    const text = (inputText || '').trim();
    if (!text || !conversation?._id || sending) return;
    setSending(true);
    setInputText('');
    try {
      sendMessage(conversation._id, 'text', { text });
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={getExpertAvatar(expert)}
              alt={expert?.name}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            <div className="min-w-0">
              <h2 className="font-bold text-gray-900 dark:text-gray-100 truncate">
                {expert?.name || 'Expert'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {expert?.expertDetails?.specialization || 'Agriculture'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <Loader size={28} className="animate-spin text-green-500" />
            </div>
          ) : startError ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <p className="text-sm text-red-600 dark:text-red-400">{startError}</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                        msg.isMine
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      {msg.content?.text}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!inputText.trim() || sending}
                  className="p-2 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExpertChatModal;
