/**
 * Global dark mode state. Persists to localStorage and syncs with backend user preferences.
 * Apply dark class to document.documentElement for Tailwind dark: variant.
 */
import { create } from 'zustand';

const STORAGE_KEY = 'app_theme_dark';

function getStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'true') return true;
    if (raw === 'false') return false;
  } catch (_) {}
  return null;
}

function applyClass(isDark) {
  try {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  } catch (_) {}
}

export const useThemeStore = create((set, get) => ({
  darkMode: getStored() ?? false,

  setDarkMode: (value) => {
    const isDark = !!value;
    set({ darkMode: isDark });
    try {
      localStorage.setItem(STORAGE_KEY, String(isDark));
    } catch (_) {}
    applyClass(isDark);
  },

  toggleDarkMode: () => {
    const next = !get().darkMode;
    set({ darkMode: next });
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch (_) {}
    applyClass(next);
    return next;
  },

  /** Call once on app init: apply stored theme to DOM (before first paint if possible). */
  init: () => {
    const stored = getStored();
    const isDark = stored !== null ? stored : get().darkMode;
    set({ darkMode: isDark });
    applyClass(isDark);
    return isDark;
  },
}));

export default useThemeStore;
