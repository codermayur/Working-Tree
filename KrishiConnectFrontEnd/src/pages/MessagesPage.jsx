import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MessageSquare, Phone, Video, MoreHorizontal, ArrowLeft, Loader,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { chatService } from '../services/chat.service';
import { userService } from '../services/user.service';
import { useSocket } from '../context/SocketContext';
import { ConversationList, MessageBubble as MessageBubbleComponent, MessageInput } from '../components/chat';
import { BlockConfirmModal } from '../components/BlockModals';

const EMOJI_LIST = ['😀','😊','😂','❤️','👍','🙏','🌾','👋','😅','🔥','✅','💬','🎉','🙂','😎','🤝','💪','🌱','🍅','🥕'];
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop';
const getAvatarSrc = (user) => (user?.profilePhoto?.url ?? user?.avatar?.url ?? user?.avatar ?? user?.profilePhoto ?? DEFAULT_AVATAR);

const CHAT_FILE_MAX_BYTES = 100 * 1024 * 1024; // 100MB

const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString('en-IN', { weekday: 'long' }); // Monday, Tuesday...
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// Map backend conversation to list item shape (other participant, lastMessage text/time).
function mapConversation(conv, currentUserId, onlineUserIds = new Set()) {
  const other = conv.participants?.find((p) => String(p.user?._id ?? p.user) !== String(currentUserId));
  const user = other?.user ?? other;
  const participantId = user?._id ?? user;
  const lastSenderId = conv.lastMessage?.sender ? (conv.lastMessage.sender._id ?? conv.lastMessage.sender) : null;
  return {
    _id: conv._id,
    participant: {
      _id: participantId,
      name: user?.name ?? 'User',
      avatar: getAvatarSrc(user),
      specialty: user?.headline ?? '',
      online: onlineUserIds.has(String(participantId)),
    },
    lastMessage: conv.lastMessage?.text ?? '',
    lastMessageTime: conv.lastMessage?.sentAt ? formatTime(conv.lastMessage.sentAt) : '',
    unreadCount: conv.unreadCount ?? 0,
    lastMessageSenderId: lastSenderId ?? null,
  };
}

// Map backend message to bubble shape (senderId, content, timestamp, status).
function mapMessage(msg, currentUserId) {
  const senderId = msg.sender?._id ?? msg.sender ?? msg.senderId;
  const isImage = msg.type === 'image';
  const content = isImage
    ? (msg.content ?? msg.attachment ?? {})
    : (typeof msg.content === 'object' && msg.content?.text != null ? msg.content : (msg.content ?? ''));
  const isReceived = String(senderId) !== String(currentUserId);
  let status = msg.status ?? 'sent';
  if (isReceived && msg.readBy?.some((r) => String(r.user ?? r) === String(currentUserId))) status = 'read';
  else if (isReceived && msg.deliveredTo?.some((id) => String(id) === String(currentUserId))) status = 'delivered';
  return {
    _id: msg._id,
    senderId: String(senderId),
    content,
    type: msg.type || 'text',
    timestamp: msg.createdAt ?? msg.timestamp,
    status,
    replyTo: msg.replyTo,
    reactions: msg.reactions ?? [],
    isEdited: msg.isEdited,
    editedAt: msg.editedAt,
    isUnsent: msg.isUnsent,
    attachment: msg.attachment,
    readBy: msg.readBy,
    deliveredTo: msg.deliveredTo,
  };
}

// ============================================================================
// UTILITY
// ============================================================================
const groupMessagesByDate = (messages) => {
  const groups = {};
  messages.forEach((msg) => {
    const date = new Date(msg.timestamp || msg.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
  });
  return groups;
};

const TypingIndicator = () => (
  <div className="flex justify-start mb-2">
    <div className="bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
      <div className="flex items-center gap-1">
        {[0, 150, 300].map((delay) => (
          <div key={delay} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
        ))}
      </div>
    </div>
  </div>
);

// ============================================================================
// MAIN MESSAGES PAGE
// ============================================================================
const TYPING_DEBOUNCE_MS = 1500;

const MessagesPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const currentUserId = useAuthStore((s) => s.user?._id ?? null);
  const {
    joinConversation,
    leaveConversation,
    sendMessage: socketSendMessage,
    emitMessageSeen,
    emitMessageDelivered,
    emitReaction,
    emitEditMessage,
    emitUnsendMessage,
    emitTypingStart,
    emitTypingStop,
    subscribe,
    connected,
  } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const activeConvoIdRef = useRef(null);
  const imageInputRef = useRef(null);
  const attachInputRef = useRef(null);
  const messagesScrollRef = useRef(null);
  const emojiPickerRef = useRef(null);
  activeConvoIdRef.current = activeConvo?._id;

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const chatMenuRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { conversations: list } = await chatService.getConversations();
      const mapped = (list || []).map((c) => mapConversation(c, currentUserId, new Set()));
      const openConv = location.state?.openConversation;
      const toSet = openConv
        ? [mapConversation(openConv, currentUserId, new Set()), ...mapped.filter((c) => String(c._id) !== String(openConv._id))]
        : mapped;
      setConversations(toSet);
      return toSet;
    } catch {
      setError('Failed to load conversations.');
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentUserId, location]);

  // Sync online status into conversation list when onlineUserIds changes
  useEffect(() => {
    if (onlineUserIds.size === 0) return;
    setConversations((prev) =>
      prev.map((c) => ({
        ...c,
        participant: { ...c.participant, online: onlineUserIds.has(String(c.participant?._id)) },
      }))
    );
  }, [onlineUserIds]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Open conversation from profile "Chat" (state.openConversationId or state.openConversation)
  const openFromState = location.state?.openConversationId ?? location.state?.openConversation?._id;
  useEffect(() => {
    if (!openFromState || !currentUserId) return;
    const openConv = location.state?.openConversation;
    if (openConv) {
      const mapped = mapConversation(openConv, currentUserId);
      setConversations((prev) => {
        const exists = prev.some((c) => c._id === mapped._id);
        if (exists) return prev;
        return [mapped, ...prev];
      });
      setActiveConvo(mapped);
      setShowSidebar(false);
      setMessagesLoading(true);
      chatService.getMessages(mapped._id).then(({ messages: msgs }) => {
        setMessages((msgs || []).map((m) => mapMessage(m, currentUserId)).reverse());
        setMessagesLoading(false);
      }).catch(() => setMessagesLoading(false));
    } else {
      const run = async () => {
        const list = await loadConversations();
        const found = list.find((c) => c._id === openFromState);
        if (found) {
          setActiveConvo(found);
          setShowSidebar(false);
          setMessagesLoading(true);
          try {
            const { messages: msgs } = await chatService.getMessages(openFromState);
            setMessages((msgs || []).map((m) => mapMessage(m, currentUserId)).reverse());
          } finally {
            setMessagesLoading(false);
          }
        }
      };
      run();
    }
    navigate('/messages', { replace: true, state: {} });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    if (!showEmojiPicker) return;
    const close = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target) && !e.target.closest('button[title="Emoji"]')) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [showEmojiPicker]);

  useEffect(() => {
    const close = (e) => {
      if (chatMenuRef.current && !chatMenuRef.current.contains(e.target)) setShowChatMenu(false);
    };
    if (showChatMenu) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showChatMenu]);

  const handleBlockFromChat = useCallback(async () => {
    if (!activeConvo?.participant?._id) return;
    setBlockLoading(true);
    try {
      await userService.blockUser(activeConvo.participant._id);
      setShowBlockModal(false);
      setShowChatMenu(false);
      setConversations((prev) => prev.filter((c) => c._id !== activeConvo._id));
      setActiveConvo(null);
      setMessages([]);
      toast.success('User blocked. You can no longer message each other.');
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to block');
    } finally {
      setBlockLoading(false);
    }
  }, [activeConvo]);

  const handleSelectConvo = useCallback(async (convo) => {
    if (activeConvo?._id) leaveConversation(activeConvo._id);
    setActiveConvo(convo);
    setShowSidebar(false);
    setMessagesLoading(true);
    setHasMoreMessages(true);
    joinConversation(convo._id);
    try {
      const { messages: msgs, pagination } = await chatService.getMessages(convo._id, { limit: 20 });
      setMessages((msgs || []).map((m) => mapMessage(m, currentUserId)).reverse());
      setHasMoreMessages(!!(pagination?.nextPage ?? pagination?.hasNext));
    } catch {
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
    setConversations((prev) =>
      prev.map((c) => (String(c._id) === String(convo._id) ? { ...c, unreadCount: 0 } : c))
    );
  }, [activeConvo?._id, currentUserId, joinConversation, leaveConversation]);

  const handleSend = useCallback(() => {
    if (!messageInput.trim() || !activeConvo || sending) return;
    const content = messageInput.trim();
    const replyToId = replyToMessage?._id ?? null;
    setMessageInput('');
    setReplyToMessage(null);
    setSending(true);
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      _id: tempId,
      senderId: String(currentUserId),
      content,
      type: 'text',
      timestamp: new Date().toISOString(),
      status: 'sent',
      replyTo: replyToMessage ? { text: replyToMessage.content?.text ?? replyToMessage.content, sender: { name: activeConvo.participant?.name } } : undefined,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    socketSendMessage(activeConvo._id, 'text', content, replyToId);
    setConversations((prev) =>
      prev.map((c) =>
        c._id === activeConvo._id
          ? { ...c, lastMessage: content, lastMessageTime: 'Just now', lastMessageSenderId: String(currentUserId) }
          : c
      )
    );
    setSending(false);
  }, [messageInput, activeConvo, sending, currentUserId, socketSendMessage, replyToMessage]);

  useEffect(() => {
    const unsubOnline = subscribe('user:online', ({ userId: id }) => {
      if (id) setOnlineUserIds((prev) => (prev.has(id) ? prev : new Set([...prev, id])));
    });
    const unsubOffline = subscribe('user:offline', ({ userId: id }) => {
      if (id) setOnlineUserIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    });
    return () => {
      unsubOnline();
      unsubOffline();
    };
  }, [subscribe]);

  useEffect(() => {
    if (!activeConvo?._id) return;
    const unsubNew = subscribe('message:new', (payload) => {
      const convId = payload?.conversation ?? payload?.conversationId;
      if (String(convId) !== String(activeConvo._id)) return;
      const mapped = mapMessage(payload, currentUserId);
      setMessages((prev) => {
        if (prev.some((m) => m._id === mapped._id)) return prev;
        const isFromMe = String(mapped.senderId) === String(currentUserId);
        if (isFromMe) {
          const withoutTemp = prev.filter((m) => !String(m._id).startsWith('temp-'));
          return [...withoutTemp, mapped];
        }
        if (emitMessageDelivered && payload._id) emitMessageDelivered(payload._id);
        return [...prev, mapped];
      });
    });
    const unsubSeen = subscribe('message:seen', ({ conversationId, messageIds }) => {
      if (String(conversationId) !== String(activeConvo._id)) return;
      if (!messageIds?.length) return;
      setMessages((prev) =>
        prev.map((m) => (messageIds.includes(String(m._id)) ? { ...m, status: 'read' } : m))
      );
    });
    const unsubDelivered = subscribe('message:delivered', ({ messageId }) => {
      if (!messageId) return;
      setMessages((prev) =>
        prev.map((m) => (String(m._id) === String(messageId) ? { ...m, status: 'delivered' } : m))
      );
    });
    const unsubReaction = subscribe('message:reaction', ({ messageId, message: updated }) => {
      if (!messageId || !updated) return;
      setMessages((prev) =>
        prev.map((m) => (String(m._id) === String(messageId) ? { ...m, reactions: updated.reactions ?? m.reactions } : m))
      );
    });
    const unsubEdit = subscribe('message:edit', ({ messageId, message: updated }) => {
      if (!messageId || !updated) return;
      setMessages((prev) =>
        prev.map((m) =>
          String(m._id) === String(messageId)
            ? { ...m, content: { text: updated.text ?? m.content?.text }, isEdited: true }
            : m
        )
      );
    });
    const unsubUnsend = subscribe('message:unsend', ({ messageId }) => {
      if (!messageId) return;
      setMessages((prev) =>
        prev.map((m) => (String(m._id) === String(messageId) ? { ...m, isUnsent: true } : m))
      );
    });
    const unsubTyping = subscribe('user:typing', ({ conversationId, userId }) => {
      if (conversationId === activeConvo._id && String(userId) !== String(currentUserId)) setIsTyping(true);
    });
    const unsubStopped = subscribe('user:stopped-typing', ({ conversationId }) => {
      if (conversationId === activeConvo._id) setIsTyping(false);
    });
    const unsubErr = subscribe('error', (err) => {
      if (err?.message) setError(err.message);
    });
    return () => {
      unsubNew();
      unsubSeen();
      unsubDelivered();
      unsubReaction();
      unsubEdit();
      unsubUnsend();
      unsubTyping();
      unsubStopped();
      unsubErr();
    };
  }, [activeConvo?._id, currentUserId, subscribe, emitMessageDelivered]);

  const handleTypingChange = useCallback(() => {
    if (!activeConvo?._id) return;
    emitTypingStart(activeConvo._id);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitTypingStop(activeConvo._id);
      typingTimeoutRef.current = null;
    }, TYPING_DEBOUNCE_MS);
  }, [activeConvo?._id, emitTypingStart, emitTypingStop]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      const id = activeConvoIdRef.current;
      if (id) leaveConversation(id);
    };
  }, [leaveConversation]);

  const loadOlderMessages = useCallback(async () => {
    if (!activeConvo?._id || loadingOlder || !hasMoreMessages || messages.length === 0) return;
    const oldestId = messages[0]._id;
    if (String(oldestId).startsWith('temp-')) return;
    setLoadingOlder(true);
    try {
      const { messages: older, pagination } = await chatService.getMessages(activeConvo._id, { before: oldestId, limit: 20 });
      const mapped = (older || []).map((m) => mapMessage(m, currentUserId)).reverse();
      setMessages((prev) => [...mapped, ...prev]);
      setHasMoreMessages(!!(mapped.length >= 20 || pagination?.hasNext));
    } finally {
      setLoadingOlder(false);
    }
  }, [activeConvo?._id, currentUserId, loadingOlder, hasMoreMessages, messages]);

  const handleScrollMessages = useCallback(
    (e) => {
      const { scrollTop } = e.target;
      if (scrollTop < 100 && hasMoreMessages && !loadingOlder) loadOlderMessages();
    },
    [hasMoreMessages, loadingOlder, loadOlderMessages]
  );

  const handleSearch = (q) => {
    setSearchQuery(q);
    if (!q.trim()) loadConversations();
    else setConversations((prev) => prev.filter((c) => c.participant?.name?.toLowerCase().includes(q.toLowerCase())));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const insertEmoji = (emoji) => {
    const ta = inputRef.current;
    if (!ta) {
      setMessageInput((prev) => prev + emoji);
      return;
    }
    const start = ta.selectionStart ?? messageInput.length;
    const end = ta.selectionEnd ?? messageInput.length;
    const before = messageInput.slice(0, start);
    const after = messageInput.slice(end);
    const next = before + emoji + after;
    setMessageInput(next);
    setShowEmojiPicker(false);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  };

  const sendImageFile = useCallback(async (file) => {
    if (!file || !activeConvo || !file.type.startsWith('image/')) return;
    if (file.size > CHAT_FILE_MAX_BYTES) {
      toast.error('File is too large. Maximum size is 100 MB.');
      return;
    }
    setUploadingImage(true);
    try {
      const result = await chatService.uploadMedia(file);
      const url = result?.url ?? result;
      if (url) {
        socketSendMessage(activeConvo._id, 'image', { url });
        const optimisticMsg = {
          _id: `temp-img-${Date.now()}`,
          senderId: String(currentUserId),
          content: { url },
          type: 'image',
          timestamp: new Date().toISOString(),
          status: 'sent',
        };
        setMessages((prev) => [...prev, optimisticMsg]);
        setConversations((prev) =>
          prev.map((c) =>
            c._id === activeConvo._id
              ? { ...c, lastMessage: '📷 Photo', lastMessageTime: 'now', lastMessageSenderId: String(currentUserId) }
              : c
          )
        );
      } else {
        toast.error('Upload failed');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Upload failed');
    } finally {
      setUploadingImage(false);
    }
  }, [activeConvo, currentUserId, socketSendMessage]);

  const sendFileAttachment = useCallback(async (file) => {
    if (!file || !activeConvo) return;
    if (file.size > CHAT_FILE_MAX_BYTES) {
      toast.error('File is too large. Maximum size is 100 MB.');
      return;
    }
    setUploadingImage(true);
    try {
      const result = await chatService.uploadMedia(file);
      if (result?.id) {
        socketSendMessage(activeConvo._id, 'file', {
          id: result.id,
          type: result.type,
          filename: result.filename,
          contentType: result.contentType,
          size: result.size,
        });
        const optimisticMsg = {
          _id: `temp-file-${Date.now()}`,
          senderId: String(currentUserId),
          content: { id: result.id, type: result.type, filename: result.filename },
          type: 'file',
          timestamp: new Date().toISOString(),
          status: 'sent',
        };
        setMessages((prev) => [...prev, optimisticMsg]);
        setConversations((prev) =>
          prev.map((c) =>
            c._id === activeConvo._id
              ? { ...c, lastMessage: result.type === 'video' ? '🎬 Video' : '📎 File', lastMessageTime: 'now', lastMessageSenderId: String(currentUserId) }
              : c
          )
        );
      } else {
        toast.error('Upload failed');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Upload failed');
    } finally {
      setUploadingImage(false);
    }
  }, [activeConvo, currentUserId, socketSendMessage]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) sendImageFile(file);
  };

  const handleAttachChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !activeConvo) return;
    if (file.size > CHAT_FILE_MAX_BYTES) {
      toast.error('File is too large. Maximum size is 100 MB.');
      return;
    }
    if (file.type.startsWith('image/')) {
      sendImageFile(file);
      return;
    }
    sendFileAttachment(file);
  };

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-6xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center gap-3 shadow-sm flex-shrink-0 transition-colors duration-200">
          <MessageSquare size={20} className="text-green-600 dark:text-green-400" />
          <h1 className="font-black text-gray-900 dark:text-gray-100">{t('messages.title')}</h1>
          {totalUnread > 0 && (
            <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full font-bold">{totalUnread}</span>
          )}
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Conversations Sidebar */}
          <div className={`${showSidebar ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-80 flex-shrink-0 transition-colors duration-200`}>
            <ConversationList
              conversations={conversations}
              loading={loading}
              error={error}
              searchQuery={searchQuery}
              onSearchChange={handleSearch}
              activeConvoId={activeConvo?._id}
              onSelectConversation={handleSelectConvo}
              onRetry={loadConversations}
              currentUserId={currentUserId}
              searchPlaceholder={t('messages.searchPlaceholder')}
              emptyMessage={t('messages.empty')}
              emptyHint={t('messages.emptyHint')}
            />
          </div>

          {/* Chat Area */}
          <div className={`${!showSidebar ? 'flex' : 'hidden'} md:flex flex-1 flex-col bg-gray-50 dark:bg-gray-900 min-w-0 transition-colors duration-200`}>
            {showBlockModal && activeConvo?.participant && (
              <BlockConfirmModal
                username={activeConvo.participant.name}
                onConfirm={handleBlockFromChat}
                onCancel={() => setShowBlockModal(false)}
                loading={blockLoading}
              />
            )}
            {!activeConvo ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="text-6xl mb-4">🌾</div>
                <p className="font-bold text-gray-700 dark:text-gray-300 text-lg">{t('messages.welcome')}</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">{t('messages.selectConversation')}</p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center gap-3 shadow-sm flex-shrink-0 transition-colors duration-200">
                  <button onClick={() => setShowSidebar(true)} className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-500 dark:text-gray-400">
                    <ArrowLeft size={18} />
                  </button>
                  <button
                    onClick={() => activeConvo.participant?._id && navigate(`/profile/${activeConvo.participant._id}`)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={activeConvo.participant?.avatar ?? DEFAULT_AVATAR}
                        alt={activeConvo.participant?.name ?? 'User'}
                        className="w-10 h-10 rounded-full object-cover border-2 border-green-100 dark:border-green-800"
                      />
                      {activeConvo.participant.online && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate">{activeConvo.participant.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {activeConvo.participant.online ? (
                          <span className="text-green-600 dark:text-green-400 font-medium">Active now</span>
                        ) : (
                          <span>Active recently</span>
                        )}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 relative" ref={chatMenuRef}>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-500 dark:text-gray-400 transition">
                      <Phone size={16} />
                    </button>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-500 dark:text-gray-400 transition">
                      <Video size={16} />
                    </button>
                    <button
                      onClick={() => setShowChatMenu((v) => !v)}
                      className={`p-2 rounded-xl text-gray-500 dark:text-gray-400 transition ${showChatMenu ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                      aria-label="Chat options"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {showChatMenu && (
                      <>
                        <div className="fixed inset-0 z-10" aria-hidden onClick={() => setShowChatMenu(false)} />
                        <div className="absolute right-0 top-full mt-1 py-1 w-48 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-lg z-20">
                          <button
                            type="button"
                            onClick={() => { setShowChatMenu(false); setShowBlockModal(true); }}
                            className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            Block {activeConvo.participant.name?.split(' ')[0] || 'user'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div ref={messagesScrollRef} className="flex-1 overflow-y-auto px-4 py-4" onScroll={handleScrollMessages}>
                  {loadingOlder && (
                    <div className="flex justify-center py-2">
                      <Loader size={20} className="animate-spin text-green-600 dark:text-green-400" />
                    </div>
                  )}
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader size={24} className="text-green-600 animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="text-4xl mb-3">👋</div>
                      <p className="font-semibold text-gray-700 dark:text-gray-300">Say hello to {activeConvo.participant.name}!</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('messages.selectConversation')}</p>
                    </div>
                  ) : (
                    <>
                      {Object.entries(groupedMessages).map(([date, msgs]) => (
                        <div key={date}>
                          <div className="flex items-center gap-3 my-4">
                            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
                            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium px-2">{date}</span>
                            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
                          </div>
                          {msgs.map((msg) => (
                            <MessageBubbleComponent
                              key={msg._id}
                              message={msg}
                              isMine={String(msg.senderId) === String(currentUserId)}
                              currentUserId={currentUserId}
                              formatTime={formatTime}
                              onReply={setReplyToMessage}
                              onReact={(messageId, emoji) => emitReaction(messageId, emoji)}
                              onEdit={(messageId, text) => emitEditMessage(messageId, text)}
                              onUnsend={(messageId) => emitUnsendMessage(messageId)}
                              onForward={() => toast('Forward to conversation — coming soon')}
                            />
                          ))}
                        </div>
                      ))}
                      {isTyping && <TypingIndicator />}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Input Area */}
                <div className="flex-shrink-0" ref={emojiPickerRef}>
                  <MessageInput
                    value={messageInput}
                    onChange={setMessageInput}
                    onSend={handleSend}
                    onAttach={sendFileAttachment}
                    onImageSelect={(file) => sendImageFile(file)}
                    replyPreview={replyToMessage ? { _id: replyToMessage._id, text: typeof replyToMessage.content === 'string' ? replyToMessage.content : replyToMessage.content?.text, sender: { name: activeConvo.participant?.name } } : null}
                    onDismissReply={() => setReplyToMessage(null)}
                    placeholder={t('messages.typePlaceholder')}
                    sendDisabled={sending}
                    sending={sending}
                    showEmojiPicker={showEmojiPicker}
                    onToggleEmojiPicker={() => setShowEmojiPicker((p) => !p)}
                    onEmojiSelect={insertEmoji}
                    emojiList={EMOJI_LIST}
                    maxFileBytes={CHAT_FILE_MAX_BYTES}
                    onFileTooLarge={() => toast.error('File is too large. Maximum size is 100 MB.')}
                    imageInputRef={imageInputRef}
                    attachInputRef={attachInputRef}
                    inputRef={inputRef}
                    onKeyDown={handleKeyDown}
                    onTyping={handleTypingChange}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
