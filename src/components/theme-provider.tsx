'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
});

const THEME_STORAGE_KEY = 'ganesh-honey:theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 1. Initial read from localStorage
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    const initialTheme: Theme = saved && ['light', 'dark', 'system'].includes(saved) ? saved : 'system';
    setThemeState(initialTheme);

    // 2. Resolve theme
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const computeResolved = (t: Theme): 'light' | 'dark' => {
      if (t === 'dark') return 'dark';
      if (t === 'light') return 'light';
      return mediaQuery.matches ? 'dark' : 'light';
    };

    const resolved = computeResolved(initialTheme);
    setResolvedTheme(resolved);
    document.documentElement.classList.toggle('dark', resolved === 'dark');
    setMounted(true);

    // 3. Listen for OS theme changes when in 'system' mode
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setThemeState((current) => {
        if (current === 'system') {
          const nextResolved = e.matches ? 'dark' : 'light';
          setResolvedTheme(nextResolved);
          document.documentElement.classList.toggle('dark', nextResolved === 'dark');
        }
        return current;
      });
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, []);

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const resolved: 'light' | 'dark' =
      nextTheme === 'dark' ? 'dark' : nextTheme === 'light' ? 'light' : mediaQuery.matches ? 'dark' : 'light';

    setResolvedTheme(resolved);
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  };

  const toggleTheme = () => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
