// This code defines the settings page for language selection in a Next.js application

'use client'; // Enable client-side rendering for this component

import React, { useState } from 'react';
import { useTranslations } from "next-intl"; // Import hook to handle translations
import { setUserLocale } from '@/utils/locale'; // Import function to set the user's preferred locale
import { useAuth } from '@/hooks/useAuth'; // Hook for accessing user authentication status
import LoadingSpinner from '@/components/LoadingSpinner'; // Component to show the loading spinner

// Main component for the Settings Page
export default function SettingsPage() {
  // State to manage the visibility of the language dropdown
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const t = useTranslations("Settings"); // Hook to handle translations for the Settings page

    // Destructure `user` and `loading` state from `useAuth` to manage access control
    const { user, loading } = useAuth();

  // Function to toggle the visibility of the dropdown menu
  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
  };

  // Function to handle changing the language and updating the locale in cookies
  const handleLanguageChange = async (locale) => {
    setUserLocale(locale); // Set the new locale using the setUserLocale utility
    setDropdownVisible(false); // Close the dropdown menu after selecting a language
  };
// Display loading spinner while user authentication status is being determined
if (loading)
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <LoadingSpinner />
      </div>
    );

  // If there is no authenticated user, return null (no content rendered)
  if (!user) return null;
  return (
    <div className="relative inline-block text-left">
      {/* Button to open/close the language dropdown menu */}
      <button
        id="dropdownDefaultButton"
        onClick={toggleDropdown}
        className="text-white bg-orange-700 hover:bg-orange-800 focus:ring-4 focus:outline-none focus:ring-orange-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-orange-600 dark:hover:bg-orange-700 dark:focus:ring-orange-800"
        type="button"
      >
        {t("language")}{' '}
        <svg
          className="w-2.5 h-2.5 ms-3"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 10 6"
        >
          {/* SVG icon for dropdown indicator */}
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="m1 1 4 4 4-4"
          />
        </svg>
      </button>

      {/* Dropdown menu for language selection */}
      {dropdownVisible && (
        <div
          id="languageDropdown"
          className="z-10 absolute bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700 mt-2"
        >
          <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownDefaultButton">
            {/* Language options */}
            <li>
              <a
                href="#"
                onClick={() => handleLanguageChange('en')}
                className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
              >
                English
              </a>
            </li>
            <li>
              <a
                href="#"
                onClick={() => handleLanguageChange('fr')}
                className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
              >
                Français
              </a>
            </li>
            <li>
              <a
                href="#"
                onClick={() => handleLanguageChange('ja')}
                className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
              >
                日本語
              </a>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};
