/**
 * Global auth state: user, tokens. Persists accessToken in localStorage for refresh.
 */
import { useState, useEffect, useRef } from 'react';

const STORAGE_KEYS = { accessToken: 'accessToken', refreshToken: 'refreshToken', user: 'user' };

function getStored(key) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[key]);
    if (raw == null) return null;
    if (key === 'accessToken' || key === 'refreshToken') {
      if (raw.startsWith('"') && raw.endsWith('"')) return JSON.parse(raw);
      return raw;
    }
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setStored(key, value) {
  try {
    if (value == null) localStorage.removeItem(STORAGE_KEYS[key]);
    else if (key === 'accessToken' || key === 'refreshToken') localStorage.setItem(STORAGE_KEYS[key], value);
    else localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(value));
  } catch (_) {}
}

// Simple store without zustand to avoid extra dependency; use React context if you prefer.
let state = {
  user: getStored('user'),
  accessToken: getStored('accessToken'),
  refreshToken: getStored('refreshToken'),
};

const listeners = new Set();

function getState() {
  return {
    ...state,
    setAuth,
    setUser,
    setLanguage,
    logout,
  };
}

function setAuth(user, accessToken, refreshToken) {
  state = {
    user: user ?? state.user,
    accessToken: accessToken ?? state.accessToken,
    refreshToken: refreshToken ?? state.refreshToken,
  };
  setStored('user', state.user);
  setStored('accessToken', state.accessToken);
  setStored('refreshToken', state.refreshToken);
  listeners.forEach((fn) => fn(getState()));
}

/** Update only the user (e.g. after profile/avatar update); keeps existing tokens. Use for sidebar sync. */
function setUser(updatedUser) {
  if (updatedUser == null) return;
  state = { ...state, user: updatedUser };
  setStored('user', state.user);
  listeners.forEach((fn) => fn(getState()));
}

/** Update language preference in user and localStorage; does not call API. Call after backend update. */
function setLanguage(lang) {
  if (!lang) return;
  const nextUser = state.user
    ? { ...state.user, preferences: { ...(state.user.preferences || {}), language: lang } }
    : state.user;
  state = { ...state, user: nextUser };
  setStored('user', state.user);
  try {
    localStorage.setItem('app_language', lang);
  } catch (_) {}
  listeners.forEach((fn) => fn(getState()));
}

function logout() {
  state = { user: null, accessToken: null, refreshToken: null };
  Object.keys(STORAGE_KEYS).forEach((k) => setStored(k, null));
  listeners.forEach((fn) => fn(getState()));
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// React hook compatible with useAuthStore((s) => s.setAuth) and (s) => s.user etc.
// Only calls setState when the selected value actually changes (avoids re-render loops).
export function useAuthStore(selector) {
  const [state, setState] = useState(() => selector(getState()));
  const selectorRef = useRef(selector);
  const prevRef = useRef(state);
  selectorRef.current = selector;
  useEffect(() => {
    return subscribe(() => {
      const next = selectorRef.current(getState());
      if (Object.is(next, prevRef.current)) return;
      prevRef.current = next;
      setState(next);
    });
  }, []);
  return state;
}

// For non-React code or when you need the full store
export const authStore = {
  getState,
  setAuth,
  setUser,
  setLanguage,
  logout,
  subscribe,
};

// Default export for useAuthStore
export default useAuthStore;
