// This code defines the settings page for language selection in a Next.js application

'use client'; // Enable client-side rendering for this component

import React, {useEffect, useState} from 'react';
import {useTranslations, useLocale} from "next-intl"; // Import hook to handle translations
import {useRouter} from 'next/navigation'; // Import Next.js router
import {setUserLocaleClient} from '@/utils/localeClient'; // Client-side helper to set the user's preferred locale
import {useAuth} from '@/utils/auth/AuthContext'; // Hook for accessing user authentication status
import {useTheme} from '@/utils/theme/ThemeContext'; // Hook for theme management
import {Select, Label, Toast, Modal, Button} from "flowbite-react";
import {doc, getDoc} from 'firebase/firestore';
import {db} from 'firebaseConfig';
import {enablePushForUser, updateNotificationPreferences} from '@/utils/notifications';
import {HiMoon, HiSun, HiTranslate} from 'react-icons/hi';
import { HiExclamationTriangle } from "react-icons/hi2";
import {useModal} from '@/utils/modal/useModal';

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

  const router = useRouter();
  const {user} = useAuth();
  const {theme, toggleTheme, isLoading: themeLoading} = useTheme();
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingToggle, setSavingToggle] = useState(null); // Track which toggle is being saved
  const [changingLanguage, setChangingLanguage] = useState(false);
  const [prefs, setPrefs] = useState({
    GAMIFICATION: {inApp: true, push: false, email: false},
    ACTIVITY: {inApp: true, push: false, email: false},
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ type: 'success', message: '' });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingToggle, setPendingToggle] = useState(null); // {category, channel} for confirmation

  // Function to handle language change
  const handleLanguageChange = async (e) => {
    const newLocale = e.target.value;
    if (newLocale === locale) return; // No change needed
    
    try {
      setChangingLanguage(true);
      setUserLocaleClient(newLocale); // Set the new locale cookie on the client
      // Use router.refresh() instead of window.location.reload() for smoother UX
      router.refresh();
      
      // Show success toast after a brief delay to allow refresh
      setTimeout(() => {
        setToastMessage({
          type: 'success',
          message: t('successLanguageChange')
        });
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }, 100);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to change language:', error);
      }
      setToastMessage({
        type: 'error',
        message: t('errorLanguageChange')
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    } finally {
      setChangingLanguage(false);
    }
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
              email: storedPrefs.GAMIFICATION?.email === true,
            },
            ACTIVITY: {
              inApp: storedPrefs.ACTIVITY?.inApp !== false,
              push: storedPrefs.ACTIVITY?.push === true,
              email: storedPrefs.ACTIVITY?.email === true,
            },
          });
        }
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to load notification preferences:', e);
        }
        // Determine error type for better error message
        let errorKey = 'errorLoadingPreferences';
        if (!navigator.onLine) {
          errorKey = 'errorSavePreferencesNetwork';
        } else if (e.code === 'permission-denied') {
          errorKey = 'errorSavePreferencesPermission';
        }
        
        setToastMessage({
          type: 'error',
          message: t(errorKey)
        });
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
      } finally {
        setLoadingPrefs(false);
      }
    };
    loadPreferences();
  }, [user]);

  const channels = ['inApp', 'push', 'email'];

  // Check if disabling this toggle would disable all notifications
  const wouldDisableAllNotifications = (category, channel, nextPrefs) => {
    const otherCategory = category === 'GAMIFICATION' ? 'ACTIVITY' : 'GAMIFICATION';
    const otherChannelsInCategory = channels.filter((ch) => ch !== channel);
    const anyOtherInCategory = otherChannelsInCategory.some(
      (ch) => nextPrefs[category][ch] === true,
    );
    const otherCategoryFullyDisabled = channels.every(
      (ch) => !nextPrefs[otherCategory][ch],
    );

    if (!nextPrefs[category][channel]) {
      if (!anyOtherInCategory && otherCategoryFullyDisabled) {
        return true;
      }
    }
    return false;
  };

  const handleToggle = async (category, channel) => {
    if (!user?.uid) return;

    const nextPrefs = {
      ...prefs,
      [category]: {
        ...prefs[category],
        [channel]: !prefs[category][channel],
      },
    };

    // Check if this would disable all notifications - show confirmation
    if (wouldDisableAllNotifications(category, channel, nextPrefs)) {
      setPendingToggle({ category, channel });
      setShowConfirmDialog(true);
      return;
    }

    // Proceed with toggle
    await performToggle(category, channel, nextPrefs);
  };

  const performToggle = async (category, channel, nextPrefs) => {
    if (!user?.uid) return;

    setSavingPrefs(true);
    setSavingToggle(`${category}-${channel}`);
    setShowToast(false);

    // If enabling push and no token yet, ensure push is enabled
    if (channel === 'push' && !prefs[category].push && nextPrefs[category].push) {
      try {
        // Check if VAPID key is configured before attempting to enable push
        const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        if (!VAPID_KEY) {
          // VAPID key is missing - configuration issue
          nextPrefs[category].push = false;
          setToastMessage({
            type: 'error',
            message: t('errorEnablePushBrowser')
          });
          setShowToast(true);
          setTimeout(() => setShowToast(false), 5000);
          setSavingToggle(null);
          setSavingPrefs(false);
          return;
        }

        const token = await enablePushForUser(user.uid);
        if (!token) {
          // Revert change if token acquisition failed
          nextPrefs[category].push = false;
          // Check if permission was denied
          const permission = Notification.permission;
          let errorKey = 'errorEnablePushBrowser';
          if (permission === 'denied') {
            errorKey = 'errorSavePreferencesPermission';
          }
          setToastMessage({
            type: 'error',
            message: t(errorKey)
          });
          setShowToast(true);
          setTimeout(() => setShowToast(false), 5000);
          setSavingToggle(null);
          setSavingPrefs(false);
          return;
        }
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to enable push notifications:', e);
        }
        nextPrefs[category].push = false;
        
        // Determine error type
        let errorKey = 'errorEnablePush';
        if (e.code === 'permission-denied' || e.message?.includes('permission')) {
          errorKey = 'errorSavePreferencesPermission';
        } else if (!navigator.onLine) {
          errorKey = 'errorSavePreferencesNetwork';
        } else if (e.message?.includes('VAPID') || e.message?.includes('vapid')) {
          errorKey = 'errorEnablePushBrowser';
        }
        
        setToastMessage({
          type: 'error',
          message: t(errorKey)
        });
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
        setSavingToggle(null);
        setSavingPrefs(false);
        return;
      }
    }

    setPrefs(nextPrefs);
    try {
      await updateNotificationPreferences(user.uid, nextPrefs);
      
      // Show success message
      setToastMessage({
        type: 'success',
        message: t('successSavePreferences')
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to save notification preferences:', e);
      }
      
      // Revert the change
      setPrefs(prefs);
      
      // Determine error type for better error message
      let errorKey = 'errorSavePreferencesGeneric';
      if (!navigator.onLine) {
        errorKey = 'errorSavePreferencesNetwork';
      } else if (e.code === 'permission-denied') {
        errorKey = 'errorSavePreferencesPermission';
      } else if (e.code === 'unavailable') {
        errorKey = 'errorSavePreferencesNetwork';
      }
      
      setToastMessage({
        type: 'error',
        message: t(errorKey)
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    } finally {
      setSavingToggle(null);
      setSavingPrefs(false);
    }
  };

  const handleConfirmDisable = async () => {
    if (!pendingToggle) return;
    
    const { category, channel } = pendingToggle;
    const nextPrefs = {
      ...prefs,
      [category]: {
        ...prefs[category],
        [channel]: !prefs[category][channel],
      },
    };
    
    setShowConfirmDialog(false);
    setPendingToggle(null);
    
    await performToggle(category, channel, nextPrefs);
  };

  const wrappedConfirmDialogOnClose = useModal(showConfirmDialog, () => {
    setShowConfirmDialog(false);
    setPendingToggle(null);
  }, 'settings-confirm-disable-all-notifications');

  // If there is no authenticated user, return null (no content rendered)
  if (!user) return null;

  return (
    <div className="min-h-dvh py-6 px-4 bg-background-page dark:bg-background-page">
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
              disabled={changingLanguage}
              className="w-full bg-background-card dark:bg-background-card border-border-light dark:border-border-dark text-text-primary dark:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
              {changingLanguage ? (
                <span>{t('savingLanguage')}</span>
              ) : (
                <span>{t('currentLanguage')}: {languageOptions.find(opt => opt.value === locale)?.label || locale}</span>
              )}
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
                      disabled={savingPrefs || savingToggle === 'GAMIFICATION-inApp'}
                      className="h-4 w-4 rounded border-border-light dark:border-border-dark text-primary-600 focus:ring-primary-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="flex items-center gap-1">
                      {t('inApp')}
                      {savingToggle === 'GAMIFICATION-inApp' && (
                        <span className="text-xs text-text-tertiary dark:text-text-tertiary">({t('saving')})</span>
                      )}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 text-xs sm:text-sm text-text-primary dark:text-text-primary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefs.GAMIFICATION.push}
                      onChange={() => handleToggle('GAMIFICATION', 'push')}
                      disabled={savingPrefs || savingToggle === 'GAMIFICATION-push'}
                      className="h-4 w-4 rounded border-border-light dark:border-border-dark text-primary-600 focus:ring-primary-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="flex items-center gap-1">
                      {t('push')}
                      {savingToggle === 'GAMIFICATION-push' && (
                        <span className="text-xs text-text-tertiary dark:text-text-tertiary">({t('saving')})</span>
                      )}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 text-xs sm:text-sm text-text-primary dark:text-text-primary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefs.GAMIFICATION.email}
                      onChange={() => handleToggle('GAMIFICATION', 'email')}
                      disabled={savingPrefs || savingToggle === 'GAMIFICATION-email'}
                      className="h-4 w-4 rounded border-border-light dark:border-border-dark text-primary-600 focus:ring-primary-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="flex items-center gap-1">
                      {t('email')}
                      {savingToggle === 'GAMIFICATION-email' && (
                        <span className="text-xs text-text-tertiary dark:text-text-tertiary">({t('saving')})</span>
                      )}
                    </span>
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
                      disabled={savingPrefs || savingToggle === 'ACTIVITY-inApp'}
                      className="h-4 w-4 rounded border-border-light dark:border-border-dark text-primary-600 focus:ring-primary-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="flex items-center gap-1">
                      {t('inApp')}
                      {savingToggle === 'ACTIVITY-inApp' && (
                        <span className="text-xs text-text-tertiary dark:text-text-tertiary">({t('saving')})</span>
                      )}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 text-xs sm:text-sm text-text-primary dark:text-text-primary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefs.ACTIVITY.push}
                      onChange={() => handleToggle('ACTIVITY', 'push')}
                      disabled={savingPrefs || savingToggle === 'ACTIVITY-push'}
                      className="h-4 w-4 rounded border-border-light dark:border-border-dark text-primary-600 focus:ring-primary-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="flex items-center gap-1">
                      {t('push')}
                      {savingToggle === 'ACTIVITY-push' && (
                        <span className="text-xs text-text-tertiary dark:text-text-tertiary">({t('saving')})</span>
                      )}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 text-xs sm:text-sm text-text-primary dark:text-text-primary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefs.ACTIVITY.email}
                      onChange={() => handleToggle('ACTIVITY', 'email')}
                      disabled={savingPrefs || savingToggle === 'ACTIVITY-email'}
                      className="h-4 w-4 rounded border-border-light dark:border-border-dark text-primary-600 focus:ring-primary-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="flex items-center gap-1">
                      {t('email')}
                      {savingToggle === 'ACTIVITY-email' && (
                        <span className="text-xs text-text-tertiary dark:text-text-tertiary">({t('saving')})</span>
                      )}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {savingPrefs && !savingToggle && (
            <p className="mt-2 text-xs text-text-tertiary dark:text-text-tertiary">
              {t('saving')}
            </p>
          )}
        </div>

        {/* Toast Notification */}
        {showToast && (
          <div className="fixed bottom-16 sm:bottom-5 right-4 sm:right-5 left-4 sm:left-auto z-[60] max-w-sm sm:max-w-none">
            <Toast onClose={() => setShowToast(false)}>
              {toastMessage.type === 'success' && (
                <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-500">
                  ✓
                </div>
              )}
              {toastMessage.type === 'error' && (
                <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-500">
                  !
                </div>
              )}
              <div className="ml-3 text-sm font-normal break-words">
                {toastMessage.message}
              </div>
              <Toast.Toggle onClose={() => setShowToast(false)} />
            </Toast>
          </div>
        )}

        {/* Confirmation Dialog for Disabling All Notifications */}
        <Modal show={showConfirmDialog} onClose={wrappedConfirmDialogOnClose} size="md">
          <Modal.Header className="border-b border-border-light dark:border-border-dark">
            <div className="flex items-center gap-2">
              <HiExclamationTriangle className="h-5 w-5 text-semantic-warning-600 dark:text-semantic-warning-400" />
              <span className="text-text-primary dark:text-text-primary">{t('confirmDisableAllNotifications')}</span>
            </div>
          </Modal.Header>
          <Modal.Body>
            <div className="space-y-4">
              <p className="text-sm text-text-secondary dark:text-text-secondary">
                {t('confirmDisableAllNotificationsMessage')}
              </p>
            </div>
          </Modal.Body>
          <Modal.Footer className="border-t border-border-light dark:border-border-dark">
            <div className="flex justify-end gap-3">
              <Button 
                color="gray" 
                onClick={wrappedConfirmDialogOnClose}
              >
                {t('cancel')}
              </Button>
              <Button 
                color="failure"
                onClick={handleConfirmDisable}
              >
                {t('confirm')}
              </Button>
            </div>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};
