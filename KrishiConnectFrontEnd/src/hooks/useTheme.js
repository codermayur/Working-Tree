/**
 * Theme hook: dark mode state and toggle. Syncs with themeStore and document.documentElement.
 */
import { useThemeStore } from '../store/themeStore';

export function useTheme() {
  const darkMode = useThemeStore((s) => s.darkMode);
  const setDarkMode = useThemeStore((s) => s.setDarkMode);
  const toggleDarkMode = useThemeStore((s) => s.toggleDarkMode);
  const init = useThemeStore((s) => s.init);

  return {
    isDark: darkMode,
    darkMode,
    setDarkMode,
    toggleDarkMode,
    init,
  };
}

export default useTheme;
