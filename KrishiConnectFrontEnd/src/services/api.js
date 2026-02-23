/**
 * Shared API client: global axios instance with Bearer token and 401 handling.
 * Uses VITE_API_URL (e.g. http://localhost:5000/api/v1).
 * Token is read from localStorage (set by auth store on login).
 */
import axios from 'axios';
import { authStore } from '../store/authStore';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';
const baseURL = API_BASE.replace(/\/$/, '');

/** Global axios instance: single place for base URL and auth */
export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/** Read token from localStorage (same key as auth store). Handles both raw string and JSON-stringified value. */
function getStoredToken() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem('accessToken');
    if (!raw) return null;
    if (raw.startsWith('"') && raw.endsWith('"')) return JSON.parse(raw);
    return raw;
  } catch {
    return null;
  }
}

/** Attach Bearer token to every request (including FormData / file uploads). */
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (err) => Promise.reject(err)
);

/** On 401: clear auth and redirect to login (token missing or expired) */
api.interceptors.response.use(
  (response) => response,
  (err) => {
    if (err.response?.status === 401) {
      if (typeof authStore.logout === 'function') {
        authStore.logout();
      }
      try {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      } catch (_) {}
      const isLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';
      if (!isLoginPage && typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

/**
 * Request helper for services. Uses global api instance (with token + 401 handling).
 * @param {string} method - GET, POST, PATCH, PUT, DELETE
 * @param {string} path - e.g. '/users/me' (no leading slash or with, both work)
 * @param {object|FormData|null} data - JSON body or null for GET
 * @param {{ body?: FormData, headers?: object }} opts - optional body (FormData) or headers
 * @returns {{ data: any }} - same shape as before for compatibility
 */
export async function request(method, path, data = null, opts = {}) {
  const url = path.startsWith('/') ? path : `/${path}`;
  const bodyFromOpts = opts.body;
  const isFormData = bodyFromOpts instanceof FormData;

  const headers = { ...opts.headers };
  if (isFormData) {
    delete headers['Content-Type'];
  }

  const config = {
    method,
    url,
    headers,
  };
  if (isFormData) {
    config.data = bodyFromOpts;
    config.headers['Content-Type'] = false;
  } else if (data != null && ['POST', 'PUT', 'PATCH'].includes(method) && !(data instanceof FormData)) {
    config.data = data;
  }

  const response = await api.request(config);
  return { data: response.data };
}

export function getUrl(path) {
  return `${baseURL}${path.startsWith('/') ? path : `/${path}`}`;
}
