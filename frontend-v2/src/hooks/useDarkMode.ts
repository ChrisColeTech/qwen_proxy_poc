import { useEffect } from 'react';
import { useUIStore } from '@/stores/useUIStore';

export function useDarkMode() {
  const theme = useUIStore((state) => state.uiState.theme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  return { theme, toggleTheme };
}
