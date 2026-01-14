/**
 * Language Selector Component
 * Dropdown for selecting application language
 */

'use client';

import { Dropdown } from 'flowbite-react';

/**
 * LanguageSelector component
 * @param {Array} options - Array of language options with { label, value }
 * @param {Function} onChangeLocale - Callback when locale changes
 * @param {Function} t - Translation function
 */
export default function LanguageSelector({ options, onChangeLocale, t }) {
  return (
    <div className="absolute top-4 right-4">
      <Dropdown label={t('select')} inline={true} className="bg-background-card dark:bg-background-card border-border-light dark:border-border-dark">
        {options.map((option) => (
          <Dropdown.Item 
            key={option.value} 
            onClick={() => onChangeLocale(option.value)} 
            className="text-text-primary dark:text-text-primary hover:bg-background-hover dark:hover:bg-background-hover"
          >
            {option.label}
          </Dropdown.Item>
        ))}
      </Dropdown>
    </div>
  );
}

