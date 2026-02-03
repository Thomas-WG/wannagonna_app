/**
 * Referral Code Input Component
 * Reusable component for referral code input with validation display
 */

'use client';

import { Label, TextInput } from 'flowbite-react';
import useInputFocusScroll from '@/hooks/useInputFocusScroll';

/**
 * ReferralCodeInput component
 * @param {string} value - Current referral code value
 * @param {Function} onChange - Callback when value changes
 * @param {string} error - Error message to display
 * @param {string} helperText - Helper text to display below input
 * @param {string} label - Label text for the input
 * @param {string} requiredNote - Optional note about requirement (e.g., "optional for returning users")
 * @param {Function} t - Translation function
 */
export default function ReferralCodeInput({ 
  value, 
  onChange, 
  error, 
  helperText, 
  label, 
  requiredNote,
  t 
}) {
  const handleInputFocus = useInputFocusScroll();
  
  return (
    <div className="mb-4">
      <Label htmlFor="referralCode" className="text-text-primary dark:text-text-primary">
        {label || t('referralCode')} 
        {requiredNote && <span className="text-text-tertiary dark:text-text-tertiary text-xs"> ({requiredNote})</span>}
      </Label>
      <TextInput 
        id="referralCode" 
        type="text" 
        placeholder={t('referralCodePlaceholder')}
        value={value}
        onChange={(e) => {
          onChange(e.target.value.toUpperCase());
          // Clear error when user starts typing (if onChange handler doesn't do it)
        }}
        onFocus={handleInputFocus}
        maxLength={5}
        className="uppercase bg-background-card dark:bg-background-card !text-text-primary dark:!text-text-primary border-border-light dark:border-border-dark placeholder:text-text-tertiary dark:placeholder:text-text-tertiary"
      />
      {helperText && (
        <p className="text-xs text-text-tertiary dark:text-text-tertiary mt-1">{helperText}</p>
      )}
      {error && (
        <div className="mt-2 p-2 bg-semantic-error-50 dark:bg-semantic-error-900 border border-semantic-error-200 dark:border-semantic-error-700 rounded text-xs text-semantic-error-600 dark:text-semantic-error-400">
          <p className="font-medium">{error}</p>
        </div>
      )}
    </div>
  );
}

