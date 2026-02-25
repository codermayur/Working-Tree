/**
 * Single Socket.IO client for chat. Connects with JWT on auth.
 * Exposes: connected, joinConversation, leaveConversation, sendMessage.
 * Subscribe to message:new, user:typing, user:stopped-typing via callbacks.
 */
import React, { createContext, useContext, useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';
import { authStore } from '../store/authStore';

function getSocketUrl() {
  try {
    const base = import.meta.env.VITE_API_URL || '';
    if (base) {
      const u = new URL(base);
      return u.origin;
    }
  } catch (_) {}
  // When VITE_API_URL is not set, socket must point at backend. Match backend default port (5005).
  return 'http://localhost:5005';
}

function getStoredToken() {
  try {
    const raw = localStorage.getItem('accessToken');
    if (!raw) return null;
    if (raw.startsWith('"') && raw.endsWith('"')) return JSON.parse(raw);
    return raw;
  } catch {
    return null;
  }
}

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const tokenRef = useRef(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }
    if (socketRef.current && tokenRef.current === token) return;
    tokenRef.current = token;
    const url = getSocketUrl();
    const socket = io(url, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnectionAttempts: 2,
      reconnectionDelay: 3000,
      timeout: 4000,
    });
    socketRef.current = socket;
    setConnected(false);
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => {
      console.warn('Socket server unavailable — running offline mode');
      setConnected(false);
      socket.disconnect();
    });
    socket.on('role-upgraded', async () => {
      try {
        const { userService } = await import('../services/user.service');
        const updated = await userService.getMe();
        if (updated && typeof authStore.setUser === 'function') {
          authStore.setUser(updated);
        }
      } catch (_) {}
    });
    socket.connect();
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('role-upgraded');
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      tokenRef.current = null;
      setConnected(false);
    };
  }, []);

  const joinConversation = useCallback((conversationId) => {
    if (socketRef.current && conversationId) {
      socketRef.current.emit('conversation:join', { conversationId });
    }
  }, []);

  // Note: socket.io-client does not expose .leave() on the client socket (server-only).
  // We emit 'conversation:leave' so the server can remove this socket from the room; otherwise no-op.
  const leaveConversation = useCallback((conversationId) => {
    if (!socketRef.current || !conversationId) return;
    if (typeof socketRef.current.leave === 'function') {
      socketRef.current.leave(conversationId);
    } else {
      socketRef.current.emit('conversation:leave', { conversationId });
    }
  }, []);

  const sendMessage = useCallback((conversationId, type, content, replyToId = null) => {
    if (socketRef.current && conversationId) {
      socketRef.current.emit('message:send', {
        conversationId,
        type: type || 'text',
        content: type === 'text' ? (typeof content === 'string' ? { text: content } : content) : content,
        ...(replyToId && { replyToId }),
      });
    }
  }, []);

  const emitMessageSeen = useCallback((conversationId) => {
    if (socketRef.current && conversationId) {
      socketRef.current.emit('message:seen', conversationId);
    }
  }, []);

  const emitMessageDelivered = useCallback((messageId) => {
    if (socketRef.current && messageId) {
      socketRef.current.emit('message:delivered', { messageId });
    }
  }, []);

  const emitReaction = useCallback((messageId, emoji) => {
    if (socketRef.current && messageId && emoji) {
      socketRef.current.emit('message:reaction', { messageId, emoji });
    }
  }, []);

  const emitEditMessage = useCallback((messageId, text) => {
    if (socketRef.current && messageId && text != null) {
      socketRef.current.emit('message:edit', { messageId, text });
    }
  }, []);

  const emitUnsendMessage = useCallback((messageId) => {
    if (socketRef.current && messageId) {
      socketRef.current.emit('message:unsend', { messageId });
    }
  }, []);

  const emitTypingStart = useCallback((conversationId) => {
    if (socketRef.current && conversationId) {
      socketRef.current.emit('typing:start', { conversationId });
    }
  }, []);

  const emitTypingStop = useCallback((conversationId) => {
    if (socketRef.current && conversationId) {
      socketRef.current.emit('typing:stop', { conversationId });
    }
  }, []);

  const subscribe = useCallback((event, handler) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on(event, handler);
    return () => socketRef.current?.off(event, handler);
  }, []);

  const value = {
    connected,
    joinConversation,
    leaveConversation,
    sendMessage,
    emitMessageSeen,
    emitMessageDelivered,
    emitReaction,
    emitEditMessage,
    emitUnsendMessage,
    emitTypingStart,
    emitTypingStop,
    subscribe,
    socket: socketRef.current,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
