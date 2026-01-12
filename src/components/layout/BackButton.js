'use client';

import { useRouter } from 'next/navigation';
import { Button } from 'flowbite-react';
import { HiArrowLeft } from 'react-icons/hi';
import { useTranslations } from 'next-intl';

/**
 * BackButton Component
 * 
 * A reusable back button component that navigates back in browser history.
 * Supports optional fallback path for cases where history might be empty.
 * 
 * @param {string} fallbackPath - Optional path to navigate to if history is empty
 * @param {string} className - Optional additional CSS classes
 * @param {string} translationNamespace - Optional translation namespace (defaults to 'XpHistory')
 */
export default function BackButton({ fallbackPath, className = '', translationNamespace = 'XpHistory' }) {
  const router = useRouter();
  const t = useTranslations(translationNamespace);

  const handleBack = () => {
    if (fallbackPath) {
      router.push(fallbackPath);
    } else {
      router.back();
    }
  };

  return (
    <div className={`flex items-center gap-4 mb-4 ${className}`}>
      <Button
        color="gray"
        size="sm"
        onClick={handleBack}
        className="flex items-center gap-2"
        aria-label={t('back') || 'Go back'}
      >
        <HiArrowLeft className="h-4 w-4" />
        {t('back') || 'Back'}
      </Button>
    </div>
  );
}
