'use client';

import { useEffect } from 'react';
import { useTheme } from '@/utils/theme/ThemeContext';

const THEME_COLORS = {
  light: '#ffffff',
  dark: '#0f172a',
};

/**
 * Sets meta theme-color to match app theme (status bar / PWA).
 * Must be rendered inside ThemeProvider.
 */
export default function ThemeColorMeta() {
  const { theme } = useTheme();

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const color = THEME_COLORS[theme] || THEME_COLORS.light;
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', color);
    return () => {
      // Optional: restore default on unmount; usually not needed
    };
  }, [theme]);

  return null;
}
