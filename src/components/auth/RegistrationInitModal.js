import Image from 'next/image';
import { useEffect, useRef } from 'react';

export default function RegistrationInitModal({ t }) {
  const statusRef = useRef(null);

  useEffect(() => {
    statusRef.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4"
      role="presentation"
      aria-hidden="false"
    >
      <div
        ref={statusRef}
        tabIndex={-1}
        className="w-full max-w-md rounded-2xl bg-background-card p-6 shadow-xl ring-1 ring-border-light dark:bg-background-card dark:ring-border-dark sm:p-8"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center">
          <Image
            src="/logo/Favicon.png"
            alt="WannaGonna"
            width={56}
            height={56}
            className="h-14 w-14 object-contain"
            priority
          />
        </div>

        <div
          className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500 dark:border-primary-900 dark:border-t-primary-400"
          aria-hidden="true"
        />
        <span className="sr-only">{t('registrationInitLoadingA11y')}</span>

        <h2 className="text-center text-xl font-semibold text-text-primary dark:text-text-primary">
          {t('registrationInitPrimaryMessage')}
        </h2>
        <p className="mt-2 text-center text-sm text-text-secondary dark:text-text-secondary">
          {t('registrationInitSecondaryMessage')}
        </p>

        <div className="mt-6 rounded-lg bg-primary-50 p-4 dark:bg-primary-950/40">
          <p className="text-sm font-semibold text-primary-700 dark:text-primary-300">
            {t('registrationInitTipLabel')}
          </p>
          <p className="mt-1 text-sm text-text-secondary dark:text-text-secondary">
            {t('registrationInitTipBody')}
          </p>
        </div>
      </div>
    </div>
  );
}
