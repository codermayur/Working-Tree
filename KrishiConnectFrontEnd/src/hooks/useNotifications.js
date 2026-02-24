/**
 * useNotifications: list, unread count, socket subscription, mark-as-read, pagination.
 */
import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import * as notificationApi from '../services/notificationApiService';

export function useNotifications(options = {}) {
  const { initialLimit = 20 } = options;
  const [list, setList] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ nextCursor: null, hasMore: false, limit: initialLimit });
  const { subscribe } = useSocket();

  const fetchList = useCallback(async (cursor = null, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const { list: nextList, pagination: nextPag } = await notificationApi.getNotifications({
        cursor: cursor || undefined,
        limit: initialLimit,
      });
      if (append) {
        setList((prev) => [...prev, ...nextList]);
      } else {
        setList(nextList);
      }
      setPagination(nextPag);
      return nextList;
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load notifications');
      if (!append) setList([]);
      return [];
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [initialLimit]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationApi.getUnreadCount();
      setUnreadCount(count);
      return count;
    } catch (_) {
      return unreadCount;
    }
  }, [unreadCount]);

  useEffect(() => {
    fetchList();
    fetchUnreadCount();
  }, []);

  useEffect(() => {
    const unsubNew = subscribe('notification:new', (notification) => {
      setList((prev) => [notification, ...prev]);
      setUnreadCount((c) => c + 1);
    });
    const unsubCount = subscribe('notification:count', (payload) => {
      const count = payload?.count ?? payload;
      setUnreadCount(typeof count === 'number' ? count : 0);
    });
    return () => {
      unsubNew();
      unsubCount();
    };
  }, [subscribe]);

  const loadMore = useCallback(() => {
    if (loadingMore || !pagination.hasMore || !pagination.nextCursor) return;
    fetchList(pagination.nextCursor, true);
  }, [fetchList, loadingMore, pagination.hasMore, pagination.nextCursor]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationApi.markAsRead(notificationId);
      setList((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (_) {}
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationApi.markAllAsRead();
      setList((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (_) {}
  }, []);

  const removeNotification = useCallback(async (notificationId) => {
    try {
      const item = list.find((n) => n._id === notificationId);
      await notificationApi.deleteNotification(notificationId);
      setList((prev) => prev.filter((n) => n._id !== notificationId));
      if (item && !item.isRead) setUnreadCount((c) => Math.max(0, c - 1));
    } catch (_) {}
  }, [list]);

  const refresh = useCallback(() => {
    fetchList();
    fetchUnreadCount();
  }, [fetchList, fetchUnreadCount]);

  return {
    list,
    unreadCount,
    loading,
    loadingMore,
    error,
    pagination,
    fetchList,
    fetchUnreadCount,
    loadMore,
    markAsRead,
    markAllAsRead,
    removeNotification,
    refresh,
  };
}
