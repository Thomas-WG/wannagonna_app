'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Modal, ToggleSwitch } from 'flowbite-react';
import { useLocale, useTranslations } from 'next-intl';
import {
  acceptAllConsent,
  getStoredConsent,
  needsConsent,
  refuseNonEssentialConsent,
  saveCustomConsent,
} from '@/utils/cookies/consent';

const OPEN_COOKIE_SETTINGS_EVENT = 'wg:open-cookie-settings';

export function openCookieSettings() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
}

export default function CookieConsentManager() {
  const t = useTranslations('CookieConsent');
  const locale = useLocale();
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [preferences, setPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  const policyHref = useMemo(() => `/legal/cookies-${locale}.html`, [locale]);

  useEffect(() => {
    if (needsConsent()) {
      setShowBanner(true);
      return;
    }
    const consent = getStoredConsent();
    setPreferences(!!consent.categories?.preferences);
    setAnalytics(!!consent.categories?.analytics);
  }, []);

  useEffect(() => {
    const onOpenSettings = () => {
      const consent = getStoredConsent();
      setPreferences(!!consent.categories?.preferences);
      setAnalytics(!!consent.categories?.analytics);
      setShowModal(true);
      setShowBanner(false);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpenSettings);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpenSettings);
  }, []);

  const handleAcceptAll = () => {
    acceptAllConsent();
    setPreferences(true);
    setAnalytics(true);
    setShowBanner(false);
    setShowModal(false);
  };

  const handleRefuse = () => {
    refuseNonEssentialConsent();
    setPreferences(false);
    setAnalytics(false);
    setShowBanner(false);
    setShowModal(false);
  };

  const handleSaveCustom = () => {
    saveCustomConsent({ preferences, analytics });
    setShowBanner(false);
    setShowModal(false);
  };

  return (
    <>
      {showBanner && (
        <section
          className="fixed inset-x-0 bottom-0 z-[80] border-t border-border-light dark:border-border-dark bg-background-card dark:bg-background-card shadow-2xl pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          aria-label={t('bannerTitle')}
        >
          <div className="mx-auto w-full max-w-5xl px-4 py-4 sm:px-6">
            <h2 className="text-base font-semibold text-text-primary dark:text-text-primary">
              {t('bannerTitle')}
            </h2>
            <p className="mt-2 text-sm text-text-secondary dark:text-text-secondary">
              {t('bannerDescription')}{' '}
              <a
                href={policyHref}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-primary-600 dark:text-primary-400"
              >
                {t('policyLinkLabel')}
              </a>
            </p>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:justify-end">
              <Button color="gray" onClick={handleRefuse} className="min-h-11 w-full sm:w-auto">
                {t('refuse')}
              </Button>
              <Button color="light" onClick={() => setShowModal(true)} className="min-h-11 w-full sm:w-auto">
                {t('customize')}
              </Button>
              <Button color="info" onClick={handleAcceptAll} className="min-h-11 w-full sm:w-auto">
                {t('acceptAll')}
              </Button>
            </div>
          </div>
        </section>
      )}

      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        size="lg"
        className="px-2 sm:px-0"
      >
        <Modal.Header>{t('modalTitle')}</Modal.Header>
        <Modal.Body className="max-h-[70dvh] overflow-y-auto">
          <p className="text-sm text-text-secondary dark:text-text-secondary mb-4">
            {t('modalDescription')}
          </p>

          <div className="space-y-4">
            <div className="rounded-lg border border-border-light dark:border-border-dark p-3">
              <p className="font-medium text-text-primary dark:text-text-primary">{t('necessaryTitle')}</p>
              <p className="text-sm text-text-secondary dark:text-text-secondary mt-1">
                {t('necessaryDescription')}
              </p>
            </div>

            <div className="rounded-lg border border-border-light dark:border-border-dark p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-text-primary dark:text-text-primary">{t('preferencesTitle')}</p>
                  <p className="text-sm text-text-secondary dark:text-text-secondary mt-1">
                    {t('preferencesDescription')}
                  </p>
                </div>
                <ToggleSwitch checked={preferences} label="" onChange={setPreferences} />
              </div>
            </div>

            <div className="rounded-lg border border-border-light dark:border-border-dark p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-text-primary dark:text-text-primary">{t('analyticsTitle')}</p>
                  <p className="text-sm text-text-secondary dark:text-text-secondary mt-1">
                    {t('analyticsDescription')}
                  </p>
                </div>
                <ToggleSwitch checked={analytics} label="" onChange={setAnalytics} />
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:justify-end">
            <Button color="gray" onClick={handleRefuse} className="min-h-11 w-full sm:w-auto">
              {t('refuse')}
            </Button>
            <Button color="light" onClick={handleSaveCustom} className="min-h-11 w-full sm:w-auto">
              {t('saveChoices')}
            </Button>
            <Button color="info" onClick={handleAcceptAll} className="min-h-11 w-full sm:w-auto">
              {t('acceptAll')}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </>
  );
}
