'use client';

const CONSENT_STORAGE_KEY = 'wg_cookie_consent';
const CONSENT_COOKIE_KEY = 'wg_cookie_consent_v';
const CONSENT_VERSION = 1;
const CONSENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export const COOKIE_CATEGORIES = {
  necessary: 'necessary',
  preferences: 'preferences',
  analytics: 'analytics',
};

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function createBaseConsent() {
  return {
    version: CONSENT_VERSION,
    decision: null,
    categories: {
      necessary: true,
      preferences: false,
      analytics: false,
    },
    updatedAt: null,
  };
}

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizeConsent(raw) {
  const base = createBaseConsent();
  if (!raw || typeof raw !== 'object') return base;

  const categories = {
    necessary: true,
    preferences: raw.categories?.preferences === true,
    analytics: raw.categories?.analytics === true,
  };

  return {
    version: Number(raw.version) || CONSENT_VERSION,
    decision: typeof raw.decision === 'string' ? raw.decision : null,
    categories,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null,
  };
}

function setVersionCookie() {
  if (!isBrowser()) return;
  document.cookie = `${CONSENT_COOKIE_KEY}=${CONSENT_VERSION}; path=/; max-age=${CONSENT_COOKIE_MAX_AGE}; samesite=lax`;
}

export function getDefaultConsent() {
  return createBaseConsent();
}

export function getStoredConsent() {
  if (!isBrowser()) return createBaseConsent();
  const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  const parsed = safeParse(raw);
  return normalizeConsent(parsed);
}

export function hasValidConsent() {
  const consent = getStoredConsent();
  return consent.version === CONSENT_VERSION && !!consent.decision;
}

export function needsConsent() {
  return !hasValidConsent();
}

export function saveConsent(consent) {
  if (!isBrowser()) return createBaseConsent();
  const normalized = normalizeConsent(consent);
  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(normalized));
  setVersionCookie();
  return normalized;
}

export function acceptAllConsent() {
  return saveConsent({
    version: CONSENT_VERSION,
    decision: 'accept_all',
    categories: {
      necessary: true,
      preferences: true,
      analytics: true,
    },
    updatedAt: new Date().toISOString(),
  });
}

export function refuseNonEssentialConsent() {
  return saveConsent({
    version: CONSENT_VERSION,
    decision: 'refuse_non_essential',
    categories: {
      necessary: true,
      preferences: false,
      analytics: false,
    },
    updatedAt: new Date().toISOString(),
  });
}

export function saveCustomConsent(selectedCategories) {
  return saveConsent({
    version: CONSENT_VERSION,
    decision: 'customize',
    categories: {
      necessary: true,
      preferences: !!selectedCategories?.preferences,
      analytics: !!selectedCategories?.analytics,
    },
    updatedAt: new Date().toISOString(),
  });
}

export function canUseCategory(categoryKey) {
  const consent = getStoredConsent();
  if (categoryKey === COOKIE_CATEGORIES.necessary) return true;
  return consent.categories?.[categoryKey] === true;
}

export function canUseAnalytics() {
  return canUseCategory(COOKIE_CATEGORIES.analytics);
}

export function canUsePreferences() {
  return canUseCategory(COOKIE_CATEGORIES.preferences);
}

export function getConsentVersion() {
  return CONSENT_VERSION;
}
