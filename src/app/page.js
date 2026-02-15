/*
 * page.js
 *
 * Landing one-pager for the Wanna Gonna platform: hero, intro, features for NPOs and
 * volunteers, placeholders, app preview, contact form, stay-in-touch signup.
 * Light mode only. Authenticated users are redirected to the dashboard.
 */

'use client';

import { useAuth } from '@/utils/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Button, Label, TextInput, Textarea, Toast, Dropdown } from 'flowbite-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { setUserLocaleClient } from '@/utils/localeClient';
import { useLocale } from 'next-intl';
import { httpsCallable } from 'firebase/functions';
import { functions } from 'firebaseConfig';
import { addWaitlistEntry } from '@/utils/crudContact';
import { HiCheckCircle } from 'react-icons/hi';

const LANGUAGE_OPTIONS = [
  { label: 'English', value: 'en' },
  { label: 'Español', value: 'es' },
  { label: 'Français', value: 'fr' },
  { label: '日本語', value: 'ja' },
];

const PLACEHOLDER = {
  npo: '/placeholders/npo-features.jpg',
  volunteer: '/placeholders/volunteers-features.jpg',
  impact1: 'https://picsum.photos/seed/wannagonna-impact1/400/300',
  impact2: 'https://picsum.photos/seed/wannagonna-impact2/400/300',
  impact3: 'https://picsum.photos/seed/wannagonna-impact3/400/300',
  appMobile: 'https://picsum.photos/seed/wannagonna-mobile/400/700',
  appDesktop: 'https://picsum.photos/seed/wannagonna-desktop/1200/600',
};

/* Background for Hero + Intro block; overlay stays solid (transition is in Stay in touch section) */
/* Background under title, description and stay in touch; smooth fade at the bottom */
const HERO_INTRO_BG =
  'linear-gradient(to bottom, rgba(255,255,255,0.72) 0%, rgba(255,247,237,0.76) 40%, rgba(255,247,237,0.7) 55%, rgba(248,250,252,0.6) 72%, rgba(248,250,252,0.92) 88%, rgba(248,250,252,1) 100%), url(/placeholders/hero-intro-bg.jpg)';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const t = useTranslations('Landing');
  const locale = useLocale();

  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactToast, setContactToast] = useState({ show: false, type: 'success', message: '' });
  const [contactError, setContactError] = useState('');

  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [waitlistToast, setWaitlistToast] = useState({ show: false, type: 'success', message: '' });
  const [waitlistError, setWaitlistError] = useState('');

  const sectionRefs = useRef([]);

  useEffect(() => {
    if (!loading && user) router.push('/dashboard');
  }, [user, loading, router]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('is-visible');
        });
      },
      { rootMargin: '0px 0px -40px 0px', threshold: 0.1 }
    );
    sectionRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleLanguageChange = (locale) => {
    setUserLocaleClient(locale);
    router.refresh();
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactError('');
    if (!contactName.trim()) {
      setContactError(t('contactNameRequired'));
      return;
    }
    if (!contactEmail.trim()) {
      setContactError(t('contactEmailRequired'));
      return;
    }
    if (!contactMessage.trim()) {
      setContactError(t('contactMessageRequired'));
      return;
    }
    if (contactMessage.trim().length < 10) {
      setContactError(t('contactMessageMinLength'));
      return;
    }
    setContactSubmitting(true);
    try {
      const sendContactEmailFn = httpsCallable(functions, 'sendContactEmail');
      await sendContactEmailFn({
        name: contactName.trim(),
        email: contactEmail.trim(),
        message: contactMessage.trim(),
      });
      setContactToast({ show: true, type: 'success', message: t('contactSuccess') });
      setContactName('');
      setContactEmail('');
      setContactMessage('');
      setTimeout(() => setContactToast((prev) => ({ ...prev, show: false })), 5000);
    } catch (err) {
      console.error('Contact submit error:', err);
      setContactToast({ show: true, type: 'error', message: t('contactError') });
    } finally {
      setContactSubmitting(false);
    }
  };

  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    setWaitlistError('');
    if (!waitlistEmail.trim()) {
      setWaitlistError(t('stayInTouchEmailRequired'));
      return;
    }
    setWaitlistSubmitting(true);
    try {
      await addWaitlistEntry({ email: waitlistEmail.trim() });
      setWaitlistToast({ show: true, type: 'success', message: t('stayInTouchSuccess') });
      setWaitlistEmail('');
      setTimeout(() => setWaitlistToast((prev) => ({ ...prev, show: false })), 5000);
    } catch (err) {
      console.error('Waitlist submit error:', err);
      setWaitlistToast({ show: true, type: 'error', message: t('stayInTouchError') });
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#f8fafc]">
        <div className="text-[#0f172a]">Loading...</div>
      </div>
    );
  }
  if (user) return null;

  return (
    <div className="min-h-dvh landing-page-bg text-[#0f172a]">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between gap-4 px-4 py-3 sm:px-6 bg-white/95 border-b border-[#e2e8f0] backdrop-blur">
        <a href="#" className="flex-shrink-0 flex items-center" aria-label="Wanna Gonna home">
          <Image
            src="/logo/1%20-%20Color%20on%20White%20-%20RGB.png"
            alt="Wanna Gonna"
            width={120}
            height={44}
            className="h-9 w-auto object-contain sm:h-10"
            priority
            sizes="120px"
          />
        </a>
        <div className="flex items-center gap-2 sm:gap-4">
          <Dropdown
            label={LANGUAGE_OPTIONS.find((o) => o.value === locale)?.label ?? t('selectLanguage')}
            inline
            className="bg-white border border-[#e2e8f0]"
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <Dropdown.Item
                key={opt.value}
                onClick={() => handleLanguageChange(opt.value)}
                className="text-[#0f172a] hover:bg-[#f1f5f9]"
              >
                {opt.label}
              </Dropdown.Item>
            ))}
          </Dropdown>
        </div>
      </header>

      <main className="overflow-x-hidden">
        {/* Hero + Intro: shared background image with light overlay */}
        <div
          className="relative landing-intro-block"
          style={{ backgroundImage: HERO_INTRO_BG }}
        >
          {/* Hero: logo + title only */}
          <section className="relative px-4 py-14 sm:py-20 md:py-24 text-center">
            <div className="flex justify-center mb-6">
              <Image
                src="/logo/1%20-%20Color%20on%20White%20-%20RGB.png"
                alt="Wanna Gonna"
                width={320}
                height={114}
                className="h-20 w-auto object-contain sm:h-24 md:h-28"
                priority
                sizes="320px"
              />
            </div>
            <h1 className="landing-hero-title text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#0f172a] tracking-tight">
              {t('heroTitle')}
            </h1>
          </section>

          {/* Intro */}
          <section
            ref={(el) => (sectionRefs.current[0] = el)}
            className="landing-animate-in px-4 py-12 sm:py-16"
          >
            <div className="max-w-3xl mx-auto text-center bg-white rounded-2xl border border-[#e2e8f0] p-8 sm:p-10 shadow-lg">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#ea580c] mb-3">
                {t('introTitle')}
              </h2>
              <div className="w-12 h-1 rounded-full bg-[#fb923c] mx-auto mb-6" aria-hidden />
              <p className="text-[#475569] text-base sm:text-lg leading-relaxed">
                {t('introDescription')}
              </p>
            </div>
          </section>

          {/* Stay in touch — inside block so background image ends here with the fade */}
          <section
            ref={(el) => (sectionRefs.current[1] = el)}
            className="landing-animate-in landing-stay-transition px-4 py-12 sm:py-16"
            id="stay-in-touch"
          >
            <div className="max-w-xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-[#fed7aa]/60 p-6 sm:p-8 text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-[#0f172a] mb-2">
                  {t('stayInTouchTitle')}
                </h2>
                <p className="text-[#475569] mb-6">
                  {t('stayInTouchDescription')}
                </p>
                <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-3">
                  <TextInput
                    type="email"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    placeholder={t('stayInTouchPlaceholder')}
                    className="flex-1 bg-[#f8fafc] border-[#e2e8f0] text-[#0f172a]"
                    required
                  />
                  <Button
                    type="submit"
                    disabled={waitlistSubmitting}
                    className="min-h-[44px] bg-[#f97316] hover:bg-[#ea580c] text-white px-6 font-semibold"
                  >
                    {waitlistSubmitting ? '...' : t('stayInTouchSubmit')}
                  </Button>
                </form>
                {waitlistError && (
                  <p className="mt-2 text-sm text-red-600">{waitlistError}</p>
                )}
                <p className="mt-4 text-sm text-[#64748b]">
                  {t('stayInTouchNoSpam')}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Features for NPOs */}
        <section
          ref={(el) => (sectionRefs.current[2] = el)}
          className="landing-animate-in px-4 py-12 sm:py-16"
        >
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl shadow-md border border-[#e2e8f0] overflow-hidden">
              <div className="p-6 sm:p-8 md:p-10">
                <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#0f172a] mb-8">
                  {t('forNposTitle')}
                </h2>
                <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#f97316] flex items-center justify-center mt-0.5 shadow-sm">
                          <HiCheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-[#0f172a] font-medium">{t(`npoBullet${i}`)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="relative rounded-xl overflow-hidden border border-[#e2e8f0] shadow-lg aspect-[8/5] max-h-[300px] md:max-h-none">
                    <Image
                      src={PLACEHOLDER.npo}
                      alt={t('placeholderNpo')}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features for volunteers */}
        <section
          ref={(el) => (sectionRefs.current[3] = el)}
          className="landing-animate-in landing-section-alt px-4 py-12 sm:py-16"
        >
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl shadow-md border border-[#e2e8f0] overflow-hidden">
              <div className="p-6 sm:p-8 md:p-10">
                <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#0f172a] mb-8">
                  {t('forVolunteersTitle')}
                </h2>
                <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                  <div className="relative rounded-xl overflow-hidden border border-[#e2e8f0] shadow-lg aspect-[8/5] max-h-[300px] md:max-h-none order-2 md:order-1">
                    <Image
                      src={PLACEHOLDER.volunteer}
                      alt={t('placeholderVolunteer')}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  <div className="space-y-4 order-1 md:order-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center mt-0.5 shadow-sm">
                          <HiCheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-[#0f172a] font-medium">{t(`volunteerBullet${i}`)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Impact placeholders */}
        <section
          ref={(el) => (sectionRefs.current[4] = el)}
          className="landing-animate-in px-4 py-12 sm:py-16"
        >
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {[PLACEHOLDER.impact1, PLACEHOLDER.impact2, PLACEHOLDER.impact3].map((src, i) => (
                <div key={i} className="relative rounded-2xl overflow-hidden border border-[#e2e8f0] shadow-md aspect-[4/3]">
                  <Image
                    src={src}
                    alt={`${t('placeholderImpact')} ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* App preview */}
        <section
          ref={(el) => (sectionRefs.current[5] = el)}
          className="landing-animate-in landing-section-alt px-4 py-12 sm:py-16"
        >
          <div className="max-w-5xl mx-auto space-y-10">
            <div className="flex justify-center">
              <div className="relative w-[280px] sm:w-[320px]">
                <div className="aspect-[9/19] rounded-[2.5rem] border-8 border-[#334155] bg-[#1e293b] p-2 shadow-xl">
                  <div className="relative w-full h-full rounded-[2rem] overflow-hidden bg-white">
                    <Image
                      src={PLACEHOLDER.appMobile}
                      alt={t('placeholderAppMobile')}
                      fill
                      className="object-cover"
                      sizes="320px"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden border border-[#e2e8f0] shadow-md aspect-[2/1] max-h-[400px]">
              <Image
                src={PLACEHOLDER.appDesktop}
                alt={t('placeholderAppDesktop')}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 1200px"
              />
            </div>
          </div>
        </section>

        {/* Contact form */}
        <section
          ref={(el) => (sectionRefs.current[6] = el)}
          className="landing-animate-in landing-section-alt landing-dots-subtle px-4 py-12 sm:py-16"
          id="contact"
        >
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-2xl shadow-md border border-[#e2e8f0] p-6 sm:p-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#0f172a] mb-6">
                {t('contactTitle')}
              </h2>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="contact-name" className="text-[#0f172a]">
                    {t('contactName')}
                  </Label>
                  <TextInput
                    id="contact-name"
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="mt-1 bg-[#f8fafc] border-[#e2e8f0] text-[#0f172a]"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contact-email" className="text-[#0f172a]">
                    {t('contactEmail')}
                  </Label>
                  <TextInput
                    id="contact-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="mt-1 bg-[#f8fafc] border-[#e2e8f0] text-[#0f172a]"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contact-message" className="text-[#0f172a]">
                    {t('contactMessage')}
                  </Label>
                  <Textarea
                    id="contact-message"
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    rows={4}
                    className="mt-1 bg-[#f8fafc] border-[#e2e8f0] text-[#0f172a]"
                    required
                  />
                </div>
                {contactError && (
                  <p className="text-sm text-red-600">{contactError}</p>
                )}
                <Button
                  type="submit"
                  disabled={contactSubmitting}
                  className="w-full sm:w-auto min-h-[44px] bg-[#f97316] hover:bg-[#ea580c] text-white font-semibold"
                >
                  {contactSubmitting ? '...' : t('contactSubmit')}
                </Button>
              </form>
              <p className="mt-4 text-sm text-[#64748b]">
                {t('contactReplyTime')}
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-4 py-8 pb-safe-bottom border-t border-[#e2e8f0] bg-white">
          <p className="text-center text-[#64748b] text-sm">
            {t('footerTagline')}
          </p>
        </footer>
      </main>

      {/* Toasts */}
      {contactToast.show && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50">
          <Toast onClose={() => setContactToast((prev) => ({ ...prev, show: false }))} className="bg-white border border-[#e2e8f0] shadow-lg">
            {contactToast.type === 'success' && <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600"><HiCheckCircle className="w-5 h-5" /></div>}
            {contactToast.type === 'error' && <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">!</div>}
            <div className="text-[#0f172a]">{contactToast.message}</div>
            <Toast.Toggle onClose={() => setContactToast((prev) => ({ ...prev, show: false }))} className="text-[#64748b]" />
          </Toast>
        </div>
      )}
      {waitlistToast.show && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50">
          <Toast onClose={() => setWaitlistToast((prev) => ({ ...prev, show: false }))} className="bg-white border border-[#e2e8f0] shadow-lg">
            {waitlistToast.type === 'success' && <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600"><HiCheckCircle className="w-5 h-5" /></div>}
            {waitlistToast.type === 'error' && <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">!</div>}
            <div className="text-[#0f172a]">{waitlistToast.message}</div>
            <Toast.Toggle onClose={() => setWaitlistToast((prev) => ({ ...prev, show: false }))} className="text-[#64748b]" />
          </Toast>
        </div>
      )}
    </div>
  );
}
