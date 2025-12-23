// This code defines the settings page for language selection in a Next.js application

'use client'; // Enable client-side rendering for this component

import React, {useEffect, useState} from 'react';
import {useTranslations, useLocale} from "next-intl"; // Import hook to handle translations
import {setUserLocaleClient} from '@/utils/localeClient'; // Client-side helper to set the user's preferred locale
import {useAuth} from '@/utils/auth/AuthContext'; // Hook for accessing user authentication status
import {useTheme} from '@/utils/theme/ThemeContext'; // Hook for theme management
import {Select, Label} from "flowbite-react";
import {doc, getDoc} from 'firebase/firestore';
import {db} from 'firebaseConfig';
import {enablePushForUser, updateNotificationPreferences} from '@/utils/notifications';
import {HiMoon, HiSun, HiTranslate} from 'react-icons/hi';

// Main component for the Settings Page
export default function SettingsPage() {
  const t = useTranslations('Settings');
  const locale = useLocale();
  const languageOptions = [
    {label: 'English', value: 'en'},
    {label: 'Español', value: 'es'},
    {label: 'Français', value: 'fr'},
    {label: '日本語', value: 'ja'},
  ];

  const {user} = useAuth();
  const {theme, toggleTheme, isLoading: themeLoading} = useTheme();
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefs, setPrefs] = useState({
    GAMIFICATION: {inApp: true, push: false},
    ACTIVITY: {inApp: true, push: false},
  });
  const [error, setError] = useState('');

  // Function to handle language change
  const handleLanguageChange = (e) => {
    const newLocale = e.target.value;
    setUserLocaleClient(newLocale); // Set the new locale cookie on the client
    // Reload the page to apply the new locale
    window.location.reload();
  };

  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.uid) {
        setLoadingPrefs(false);
        return;
      }
      try {
        const userRef = doc(db, 'members', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          const storedPrefs = data.notificationPreferences || {};
          setPrefs({
            GAMIFICATION: {
              inApp: storedPrefs.GAMIFICATION?.inApp !== false,
              push: storedPrefs.GAMIFICATION?.push === true,
            },
            ACTIVITY: {
              inApp: storedPrefs.ACTIVITY?.inApp !== false,
              push: storedPrefs.ACTIVITY?.push === true,
            },
          });
        }
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to load notification preferences:', e);
        }
        setError(t('errorLoadingPreferences'));
      } finally {
        setLoadingPrefs(false);
      }
    };
    loadPreferences();
  }, [user]);

  const handleToggle = async (category, channel) => {
    if (!user?.uid) return;

    const nextPrefs = {
      ...prefs,
      [category]: {
        ...prefs[category],
        [channel]: !prefs[category][channel],
      },
    };

    // If enabling push and no token yet, ensure push is enabled
    if (channel === 'push' && !prefs[category].push && nextPrefs[category].push) {
      try {
        setSavingPrefs(true);
        setError('');
        const token = await enablePushForUser(user.uid);
        if (!token) {
          // Revert change if token acquisition failed
          nextPrefs[category].push = false;
          setError(t('errorEnablePushBrowser'));
        }
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to enable push notifications:', e);
        }
        nextPrefs[category].push = false;
        setError(t('errorEnablePush'));
      } finally {
        setSavingPrefs(false);
      }
    }

    setPrefs(nextPrefs);
    try {
      setSavingPrefs(true);
      await updateNotificationPreferences(user.uid, nextPrefs);
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to save notification preferences:', e);
      }
      setError(t('errorSavePreferences'));
    } finally {
      setSavingPrefs(false);
    }
  };

  // If there is no authenticated user, return null (no content rendered)
  if (!user) return null;

  return (
    <div className="min-h-screen py-6 px-4 bg-background-page dark:bg-background-page">
      <div className="mx-auto max-w-xl flex flex-col gap-6">
        {/* Language selector */}
        <div className="w-full bg-background-card dark:bg-background-card rounded-lg shadow-md p-4 sm:p-6 border border-border-light dark:border-border-dark">
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <HiTranslate className="h-5 w-5 text-semantic-info-500 dark:text-semantic-info-400 flex-shrink-0" />
            <div className="flex-1">
              <h2 className="text-base sm:text-lg font-semibold text-text-primary dark:text-text-primary mb-1">
                {t('language')}
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary dark:text-text-secondary">
                {t('languageDescription')}
              </p>
            </div>
          </div>
          <div>
            <Label htmlFor="language-select" className="mb-2 block text-sm font-medium text-text-primary dark:text-text-primary">
              {t('selectLanguage')}
            </Label>
            <Select
              id="language-select"
              value={locale}
              onChange={handleLanguageChange}
              className="w-full bg-background-card dark:bg-background-card border-border-light dark:border-border-dark text-text-primary dark:text-text-primary"
            >
              {languageOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary"
                >
                  {option.label}
                </option>
              ))}
            </Select>
            <div className="mt-3 flex items-center gap-2 text-xs text-text-tertiary dark:text-text-tertiary">
              <span>{t('currentLanguage')}: {languageOptions.find(opt => opt.value === locale)?.label || locale}</span>
            </div>
          </div>
        </div>

        {/* Dark Mode Toggle */}
        <div className="w-full bg-background-card dark:bg-background-card rounded-lg shadow-md p-4 sm:p-6 border border-border-light dark:border-border-dark">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-base sm:text-lg font-semibold text-text-primary dark:text-text-primary mb-1">
                {t('appearance')}
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary dark:text-text-secondary">
                {t('appearanceDescription')}
              </p>
            </div>
            <button
              onClick={toggleTheme}
              disabled={themeLoading}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-neutral-300 dark:bg-neutral-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={theme === 'dark' ? t('toggleDarkMode') : t('toggleLightMode')}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                }`}
              >
                {theme === 'dark' ? (
                  <HiMoon className="h-3 w-3 text-primary-600 mt-0.5 ml-0.5" />
                ) : (
                  <HiSun className="h-3 w-3 text-amber-500 mt-0.5 ml-0.5" />
                )}
              </span>
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-text-tertiary dark:text-text-tertiary">
            <span>{theme === 'dark' ? t('darkMode') : t('lightMode')}</span>
          </div>
        </div>

        {/* Notification settings */}
        <div className="w-full bg-background-card dark:bg-background-card rounded-lg shadow-md p-4 sm:p-6 border border-border-light dark:border-border-dark">
          <h2 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2 text-text-primary dark:text-text-primary">
            {t('notifications')}
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary dark:text-text-secondary mb-3 sm:mb-4">
            {t('notificationDescription')}
          </p>

          {error && (
            <p className="text-xs text-semantic-error-600 dark:text-semantic-error-400 mb-2 break-words">{error}</p>
          )}

          {loadingPrefs ? (
            <p className="text-sm text-text-secondary dark:text-text-secondary">{t('loading')}</p>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {/* Gamification row */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border border-border-light dark:border-border-dark rounded-lg px-3 py-2 sm:px-4 sm:py-3 bg-background-hover dark:bg-background-hover hover:bg-opacity-50 transition-colors">
                <div className="mb-2 sm:mb-0">
                  <p className="text-sm font-medium text-text-primary dark:text-text-primary">
                    {t('gamification')}
                  </p>
                </div>
                <div className="flex items-center gap-4 sm:gap-6">
                  <label className="flex items-center gap-2 text-xs sm:text-sm text-text-primary dark:text-text-primary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefs.GAMIFICATION.inApp}
                      onChange={() => handleToggle('GAMIFICATION', 'inApp')}
                      disabled={savingPrefs}
                      className="h-4 w-4 rounded border-border-light dark:border-border-dark text-primary-600 focus:ring-primary-500 focus:ring-2"
                    />
                    <span>{t('inApp')}</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs sm:text-sm text-text-primary dark:text-text-primary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefs.GAMIFICATION.push}
                      onChange={() => handleToggle('GAMIFICATION', 'push')}
                      disabled={savingPrefs}
                      className="h-4 w-4 rounded border-border-light dark:border-border-dark text-primary-600 focus:ring-primary-500 focus:ring-2"
                    />
                    <span>{t('push')}</span>
                  </label>
                </div>
              </div>

              {/* Activities row */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border border-border-light dark:border-border-dark rounded-lg px-3 py-2 sm:px-4 sm:py-3 bg-background-hover dark:bg-background-hover hover:bg-opacity-50 transition-colors">
                <div className="mb-2 sm:mb-0">
                  <p className="text-sm font-medium text-text-primary dark:text-text-primary">
                    {t('activities')}
                  </p>
                </div>
                <div className="flex items-center gap-4 sm:gap-6">
                  <label className="flex items-center gap-2 text-xs sm:text-sm text-text-primary dark:text-text-primary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefs.ACTIVITY.inApp}
                      onChange={() => handleToggle('ACTIVITY', 'inApp')}
                      disabled={savingPrefs}
                      className="h-4 w-4 rounded border-border-light dark:border-border-dark text-primary-600 focus:ring-primary-500 focus:ring-2"
                    />
                    <span>{t('inApp')}</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs sm:text-sm text-text-primary dark:text-text-primary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefs.ACTIVITY.push}
                      onChange={() => handleToggle('ACTIVITY', 'push')}
                      disabled={savingPrefs}
                      className="h-4 w-4 rounded border-border-light dark:border-border-dark text-primary-600 focus:ring-primary-500 focus:ring-2"
                    />
                    <span>{t('push')}</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {savingPrefs && (
            <p className="mt-2 text-xs text-text-tertiary dark:text-text-tertiary">
              {t('saving')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
