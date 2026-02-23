/**
 * Chat REST API. Uses shared api (Bearer token). Base: VITE_API_URL.
 */
import { api } from './api';

const chatBase = 'chat';
const usersBase = 'users';

export const chatService = {
  /** GET /users/:userId/can-chat → { canChat: boolean } */
  async getCanChat(userId) {
    const { data } = await api.get(`${usersBase}/${userId}/can-chat`);
    return data?.data ?? data;
  },

  /** POST /chat/conversations/start body { otherUserId } → conversation */
  async startConversation(otherUserId) {
    const { data } = await api.post(`${chatBase}/conversations/start`, { otherUserId });
    return data?.data ?? data;
  },

  /** GET /chat/conversations → { data: conversations[], meta: { pagination } } */
  async getConversations(params = {}) {
    const { data } = await api.get(`${chatBase}/conversations`, { params });
    const list = data?.data ?? data ?? [];
    const pagination = data?.meta?.pagination ?? data?.pagination;
    return { conversations: Array.isArray(list) ? list : [], pagination };
  },

  /** GET /chat/conversations/:id/messages → { messages[], pagination }. Params: page, limit, before (messageId for older messages). */
  async getMessages(conversationId, params = {}) {
    const { limit = 20, before, page } = params;
    const query = { limit, ...(before && { before }), ...(page != null && { page }) };
    const { data } = await api.get(`${chatBase}/conversations/${conversationId}/messages`, { params: query });
    const list = data?.data ?? data ?? [];
    const pagination = data?.pagination ?? data?.meta?.pagination;
    return { messages: Array.isArray(list) ? list : [], pagination };
  },

  /** POST /chat/upload — FormData with field name "file". Omit Content-Type so axios sets multipart/form-data with boundary. */
  async uploadMedia(file) {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post(`${chatBase}/upload`, formData, {
      headers: { 'Content-Type': false },
    });
    const out = data?.data ?? data;
    return out;
  },
};
