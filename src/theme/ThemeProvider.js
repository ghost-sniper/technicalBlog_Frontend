import React, { createContext, useContext, useLayoutEffect, useState } from 'react';
import { ConfigProvider, theme } from 'antd';

const ThemeContext = createContext(null);
export const THEME_KEY = 'blog-theme';
function initialTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch (_) { /* Storage may be disabled by the browser. */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(initialTheme);
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = mode;
    document.documentElement.style.colorScheme = mode;
    try { localStorage.setItem(THEME_KEY, mode); } catch (_) { /* Keep switching available without storage. */ }
  }, [mode]);
  return <ThemeContext.Provider value={{ mode, toggleTheme: () => setMode(value => value === 'light' ? 'dark' : 'light') }}>
    <ConfigProvider theme={{ algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
      token: { colorPrimary: mode === 'dark' ? '#86aaa0' : '#35685c', borderRadius: 10,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif' } }}>
      {children}
    </ConfigProvider>
  </ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);
