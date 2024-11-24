'use client';

import React, { useState } from 'react';
import { useTranslations } from "next-intl";
import { setUserLocale } from '@/utils/locale';

export default function SettingsPage(){
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const t = useTranslations("Settings");

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
  };

  const handleLanguageChange = async (locale) => {
    setUserLocale(locale);
    setDropdownVisible(false);
  };

  return (
    <div className="relative inline-block text-left">
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
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="m1 1 4 4 4-4"
          />
        </svg>
      </button>

      {/* Dropdown menu */}
      {dropdownVisible && (
        <div
          id="languageDropdown"
          className="z-10 absolute bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700 mt-2"
        >
          <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownDefaultButton">
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

