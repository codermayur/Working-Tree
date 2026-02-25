/**
 * Admin-only API. Uses shared api (Bearer token). Only for users with role admin.
 */
import { api } from './api';

const adminBase = 'admin';

export const adminService = {
  /** GET /admin/expert-applications — all expert applications (admin only). Returns { data, pagination }. */
  getExpertApplications: async (params = {}) => {
    const { page = 1, limit = 10, status = '' } = params;
    const searchParams = new URLSearchParams();
    searchParams.set('page', String(page));
    searchParams.set('limit', String(limit));
    if (status) searchParams.set('status', String(status));
    const response = await api.get(`${adminBase}/expert-applications?${searchParams.toString()}`);
    const body = response.data || {};
    const list = Array.isArray(body.data) ? body.data : (body.data != null ? [body.data] : []);
    const pagination = body.meta?.pagination ?? body.pagination ?? { page: 1, totalPages: 1, totalItems: 0 };
    return { data: list, pagination };
  },

  /** GET /admin/expert-applications/:id — single application (admin only). */
  getExpertApplicationById: async (id) => {
    const response = await api.get(`${adminBase}/expert-applications/${id}`);
    const body = response.data || {};
    return body.data ?? body;
  },

  /** PATCH /admin/expert-applications/:id/approve — approve application (admin only). */
  approveApplication: async (id) => {
    const res = await api.patch(`${adminBase}/expert-applications/${id}/approve`);
    return res.data?.data ?? res.data;
  },

  /** PATCH /admin/expert-applications/:id/reject — reject application (admin only). Body: { adminNote } */
  rejectApplication: async (id, adminNote) => {
    const res = await api.patch(`${adminBase}/expert-applications/${id}/reject`, {
      adminNote: adminNote ?? '',
    });
    return res.data?.data ?? res.data;
  },

  /** POST /admin/create-admin — create new admin. Body: { name, email, password } */
  createAdmin: async (payload) => {
    const { data } = await api.post(`${adminBase}/create-admin`, payload);
    return data?.data ?? data;
  },

  /** GET /admin/users — list users (optional query: page, limit, role, q) */
  listUsers: async (params = {}) => {
    const { data } = await api.get(`${adminBase}/users`, { params });
    return { data: data?.data ?? data ?? [], pagination: data?.meta?.pagination ?? data?.pagination ?? {} };
  },
};
