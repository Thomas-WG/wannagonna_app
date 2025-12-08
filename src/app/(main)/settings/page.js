// This code defines the settings page for language selection in a Next.js application

'use client'; // Enable client-side rendering for this component

import React, {useEffect, useState} from 'react';
import {useTranslations} from "next-intl"; // Import hook to handle translations
import {setUserLocale} from '@/utils/locale'; // Import function to set the user's preferred locale
import {useAuth} from '@/utils/auth/AuthContext'; // Hook for accessing user authentication status
import {Dropdown} from "flowbite-react";
import {doc, getDoc} from 'firebase/firestore';
import {db} from 'firebaseConfig';
import {enablePushForUser, updateNotificationPreferences} from '@/utils/notifications';

// Main component for the Settings Page
export default function SettingsPage() {
  const t = useTranslations('Settings');
  const languageOptions = [
    {label: 'English', value: 'en'},
    {label: 'Español', value: 'es'},
    {label: 'Français', value: 'fr'},
    {label: '日本語', value: 'ja'},
  ];

  const {user} = useAuth();
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefs, setPrefs] = useState({
    GAMIFICATION: {inApp: true, push: false},
    ACTIVITY: {inApp: true, push: false},
  });
  const [error, setError] = useState('');

  // Function to handle language change
  const handleLanguageChange = (locale) => {
    setUserLocale(locale); // Set the new locale using the setUserLocale utility
    console.log(`Language changed to: ${locale}`);
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
        setError('Failed to load notification preferences.');
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
          setError('Unable to enable push notifications in this browser.');
        }
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to enable push notifications:', e);
        }
        nextPrefs[category].push = false;
        setError('Failed to enable push notifications.');
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
      setError('Failed to save notification preferences.');
    } finally {
      setSavingPrefs(false);
    }
  };

  // If there is no authenticated user, return null (no content rendered)
  if (!user) return null;

  return (
    <div className="min-h-screen py-6 px-4">
      <div className="mx-auto max-w-xl flex flex-col gap-6">
        {/* Language selector */}
        <div className="flex justify-start">
          <Dropdown label={t('language')} inline={true}>
            {languageOptions.map((option) => (
              <Dropdown.Item
                key={option.value}
                onClick={() => handleLanguageChange(option.value)}
              >
                {option.label}
              </Dropdown.Item>
            ))}
          </Dropdown>
        </div>

        {/* Notification settings */}
        <div className="w-full bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">
            {t('notifications') || 'Notifications'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
            {t('notificationDescription') ||
              'Choose how you want to be notified for gamification and activity updates.'}
          </p>

          {error && (
            <p className="text-xs text-red-600 mb-2 break-words">{error}</p>
          )}

          {loadingPrefs ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {/* Gamification row */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border rounded-md px-3 py-2 sm:px-4 sm:py-3">
                <div className="mb-2 sm:mb-0">
                  <p className="text-sm font-medium">
                    {t('gamification') || 'Gamification (badges, XP, referrals)'}
                  </p>
                </div>
                <div className="flex items-center gap-4 sm:gap-6">
                  <label className="flex items-center gap-2 text-xs sm:text-sm">
                    <input
                      type="checkbox"
                      checked={prefs.GAMIFICATION.inApp}
                      onChange={() => handleToggle('GAMIFICATION', 'inApp')}
                      disabled={savingPrefs}
                      className="h-4 w-4"
                    />
                    <span>{t('inApp') || 'In-app'}</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs sm:text-sm">
                    <input
                      type="checkbox"
                      checked={prefs.GAMIFICATION.push}
                      onChange={() => handleToggle('GAMIFICATION', 'push')}
                      disabled={savingPrefs}
                      className="h-4 w-4"
                    />
                    <span>{t('push') || 'Push'}</span>
                  </label>
                </div>
              </div>

              {/* Activities row */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border rounded-md px-3 py-2 sm:px-4 sm:py-3">
                <div className="mb-2 sm:mb-0">
                  <p className="text-sm font-medium">
                    {t('activities') || 'Activities (applications & updates)'}
                  </p>
                </div>
                <div className="flex items-center gap-4 sm:gap-6">
                  <label className="flex items-center gap-2 text-xs sm:text-sm">
                    <input
                      type="checkbox"
                      checked={prefs.ACTIVITY.inApp}
                      onChange={() => handleToggle('ACTIVITY', 'inApp')}
                      disabled={savingPrefs}
                      className="h-4 w-4"
                    />
                    <span>{t('inApp') || 'In-app'}</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs sm:text-sm">
                    <input
                      type="checkbox"
                      checked={prefs.ACTIVITY.push}
                      onChange={() => handleToggle('ACTIVITY', 'push')}
                      disabled={savingPrefs}
                      className="h-4 w-4"
                    />
                    <span>{t('push') || 'Push'}</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {savingPrefs && (
            <p className="mt-2 text-xs text-gray-400">
              {t('saving') || 'Saving preferences...'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
