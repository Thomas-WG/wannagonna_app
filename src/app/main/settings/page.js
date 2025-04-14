// This code defines the settings page for language selection in a Next.js application

'use client'; // Enable client-side rendering for this component

import React, { useState } from 'react';
import { useTranslations } from "next-intl"; // Import hook to handle translations
import { setUserLocale } from '@/utils/locale'; // Import function to set the user's preferred locale
import { useAuth } from '@/hooks/useAuth'; // Hook for accessing user authentication status
import { Dropdown, DropdownItem } from "flowbite-react";

// Main component for the Settings Page
export default function SettingsPage() {
  const t = useTranslations('Settings');
  const languageOptions = [
    { label: 'English', value: 'en' },
    { label: 'Español', value: 'es' },
    { label: 'Français', value: 'fr' },
    { label: '日本語', value: 'ja' },
  ];

  // Function to handle language change
  const handleLanguageChange = (locale) => {
    setUserLocale(locale); // Set the new locale using the setUserLocale utility
    console.log(`Language changed to: ${locale}`);
    // You might want to store the selected language in local storage or context
  };
  
    // Destructure `user` and `loading` state from `useAuth` to manage access control
    const { user, loading } = useAuth();

 

  // If there is no authenticated user, return null (no content rendered)
  if (!user) return null;
  return (
    <div className="flex justify-center items-center min-h-screen">
        <Dropdown label={t('language')} inline={true}>
          {languageOptions.map((option) => (
            <Dropdown.Item key={option.value} onClick={() => handleLanguageChange(option.value)}>
              {option.label}
            </Dropdown.Item>
          ))}
        </Dropdown>
      </div>
  );
};
