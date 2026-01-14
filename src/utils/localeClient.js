'use client';

const COOKIE_NAME = 'NEXT_LOCALE';

// Client-side helper to set the locale cookie synchronously
export function setUserLocaleClient(locale) {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(locale)}; path=/; max-age=31536000`;
}


