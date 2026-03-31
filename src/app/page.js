/*
 * page.js
 *
 * Landing coming-soon page for WannaGonna — light, airy, warm.
 * Light mode only. Authenticated users are redirected to the dashboard.
 */

'use client';

import { useAuth } from '@/utils/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Dropdown, Toast } from 'flowbite-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { setUserLocaleClient } from '@/utils/localeClient';
import { useLocale } from 'next-intl';
import { addContactSubmission } from '@/utils/crudContact';

const LANGUAGE_OPTIONS = [
  { label: 'English', value: 'en' },
  { label: 'Español', value: 'es' },
  { label: 'Français', value: 'fr' },
  { label: '日本語', value: 'ja' },
];

const FEATURES = [
  { icon: '🌐', tag: 'volunteer', tagColor: 'teal', titleKey: 'featureOnlineTitle', descKey: 'featureOnlineDesc', chips: [] },
  { icon: '📍', tag: 'volunteer', tagColor: 'teal', titleKey: 'featureLocalTitle', descKey: 'featureLocalDesc', chips: ['🗺 Map view', '📅 Calendar', '🔍 Smart filters'] },
  { icon: '🏆', tag: 'volunteer', tagColor: 'teal', titleKey: 'featureGamifiedTitle', descKey: 'featureGamifiedDesc', chips: [] },
  { icon: '📊', tag: 'npo', tagColor: 'green', titleKey: 'featureDashboardTitle', descKey: 'featureDashboardDesc', chips: [] },
  { icon: '👥', tag: 'npo', tagColor: 'green', titleKey: 'featureVolMgmtTitle', descKey: 'featureVolMgmtDesc', chips: [] },
  { icon: '📤', tag: 'npo', tagColor: 'green', titleKey: 'featureExportTitle', descKey: 'featureExportDesc', chips: [] },
  { icon: '🌍', tag: 'everyone', tagColor: 'orange', titleKey: 'featureSdgTitle', descKey: 'featureSdgDesc', chips: [] },
];

const SDG_GOALS = [
  { n: 1, name: 'No Poverty' },
  { n: 2, name: 'Zero Hunger' },
  { n: 3, name: 'Good Health & Well-Being' },
  { n: 4, name: 'Quality Education' },
  { n: 5, name: 'Gender Equality' },
  { n: 6, name: 'Clean Water & Sanitation' },
  { n: 7, name: 'Affordable & Clean Energy' },
  { n: 8, name: 'Decent Work & Economic Growth' },
  { n: 9, name: 'Industry, Innovation & Infrastructure' },
  { n: 10, name: 'Reduced Inequalities' },
  { n: 11, name: 'Sustainable Cities & Communities' },
  { n: 12, name: 'Responsible Consumption & Production' },
  { n: 13, name: 'Climate Action' },
  { n: 14, name: 'Life Below Water' },
  { n: 15, name: 'Life on Land' },
  { n: 16, name: 'Peace, Justice & Strong Institutions' },
  { n: 17, name: 'Partnerships for the Goals' },
];

const TAG_LABELS = { volunteer: 'Volunteers', npo: 'NPOs', everyone: 'Everyone' };
const TAG_CLASSES = {
  teal: 'bg-[#009AA2]/10 text-[#009AA2]',
  green: 'bg-[#51AC31]/10 text-[#3F7818]',
  orange: 'bg-[#F08602]/10 text-[#F08602]',
};

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const t = useTranslations('Landing');
  const locale = useLocale();

  const [audienceType, setAudienceType] = useState('volunteer');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactToast, setContactToast] = useState({ show: false, type: 'success', message: '' });
  const [contactError, setContactError] = useState('');
  const sectionRefs = useRef([]);


  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('is-visible');
        });
      },
      { rootMargin: '0px 0px -80px 0px', threshold: 0.01 }
    );
    const els = sectionRefs.current.filter(Boolean);
    els.forEach((el) => observer.observe(el));
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
      setContactError(t('stayInTouchEmailRequired'));
      return;
    }
    if (!contactMessage.trim()) {
      setContactError(t('contactMessageRequired'));
      return;
    }
    setContactSubmitting(true);
    try {
      await addContactSubmission({ name: contactName.trim(), email: contactEmail.trim(), message: contactMessage.trim() });
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

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#fafaf9]">
        <div className="text-[#1A1A1A]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh bg-[#fafaf9] text-[#1A1A1A] overflow-x-hidden">
      {/* Fixed background blobs */}
      <div aria-hidden>
        <div className="landing-bg-blob" />
        <div className="landing-bg-blob" />
        <div className="landing-bg-blob" />
        <div className="landing-bg-blob" />
      </div>
      {/* Fixed dot grid */}
      <div className="landing-dot-grid" aria-hidden />

      <div className="relative z-10 flex flex-col">
        {/* HEADER */}
        <header className="sticky top-0 z-50 flex items-center justify-between px-5 py-3 bg-white/95 border-b border-[#e5e7eb] backdrop-blur-sm">
          <a href="#" className="flex items-center flex-shrink-0" aria-label="Wanna Gonna home">
            <Image
              src="/logo/1%20-%20Color%20on%20White%20-%20RGB.png"
              alt="Wanna Gonna"
              width={120}
              height={44}
              className="h-9 w-auto object-contain"
              priority
            />
          </a>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="inline-flex items-center px-4 py-2 rounded-full bg-[#009AA2] text-white text-xs sm:text-sm font-bold font-montserrat-alt hover:bg-[#007a81] transition-colors whitespace-nowrap"
            >
              Get Started
            </button>
            <Dropdown
              label={LANGUAGE_OPTIONS.find((o) => o.value === locale)?.label ?? t('selectLanguage')}
              inline
              className="bg-white border border-[#e5e7eb]"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <Dropdown.Item
                  key={opt.value}
                  onClick={() => handleLanguageChange(opt.value)}
                  className="text-[#1A1A1A] hover:bg-[#f5f5f5]"
                >
                  {opt.label}
                </Dropdown.Item>
              ))}
            </Dropdown>
          </div>
        </header>

        {/* MAIN */}
        <main>
          {/* HERO */}
          <section className="flex flex-col items-center justify-center text-center px-4 pt-20 pb-16 sm:pt-28 sm:pb-20 min-h-[65vh]">
            <div className="max-w-3xl mx-auto">


              <h1
                className="font-montserrat-alt font-black tracking-tight leading-[0.95] mb-6"
                style={{ fontSize: 'clamp(52px, 9vw, 96px)' }}
              >
                Make a<br />
                <span className="text-[#009AA2]">difference</span>
                <br />
                <span className="text-[#F08602]">today.</span>
              </h1>

              <p
                className="text-[#6b7280] font-light leading-relaxed mb-8 max-w-xl mx-auto"
                style={{ fontSize: 'clamp(16px, 2.2vw, 19px)' }}
              >
                {t('heroSubtitle')}
              </p>


              <div className="bg-[#009AA2] hover:bg-[#007a81] inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#009AA2]/30 text-white text-xs font-semibold font-montserrat-alt tracking-wide mb-6">
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                >
                  Get Started
                </button>
              </div>
            </div>
          </section>

          {/* WHAT'S COMING */}
          <section
            ref={(el) => (sectionRefs.current[0] = el)}
            className="landing-animate-in is-visible px-4 py-16 sm:py-20"
          >
            <div className="max-w-6xl mx-auto">
              <p className="text-center text-[#9ca3af] text-xs font-bold tracking-[0.16em] uppercase font-montserrat-alt mb-10">
                {t('whatsComingLabel')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {FEATURES.map((f) => (
                  <div key={f.titleKey} className="landing-feature-card">
                    <span className="text-3xl mb-3 block">{f.icon}</span>
                    <span
                      className={`inline-block text-[10px] font-bold tracking-[0.1em] uppercase px-2.5 py-1 rounded-full mb-2.5 font-montserrat-alt ${TAG_CLASSES[f.tagColor]}`}
                    >
                      {TAG_LABELS[f.tag]}
                    </span>
                    <h3 className="font-montserrat-alt font-bold text-base text-[#1A1A1A] mb-2">{t(f.titleKey)}</h3>
                    <p className="text-sm text-[#6b7280] font-light leading-relaxed">{t(f.descKey)}</p>
                    {f.chips.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap mt-3">
                        {f.chips.map((chip) => (
                          <span
                            key={chip}
                            className="text-[11px] font-medium bg-[#f5f5f5] text-[#3F3F3F] rounded-full px-2.5 py-1"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SDG SECTION */}
          <section
            ref={(el) => (sectionRefs.current[1] = el)}
            className="landing-animate-in is-visible px-4 py-16 sm:py-20"
          >
            <div className="max-w-5xl mx-auto text-center">
              <p className="text-[#9ca3af] text-xs font-bold tracking-[0.16em] uppercase font-montserrat-alt mb-3">
                {t('sdgSectionLabel')}
              </p>
              <h2 className="font-montserrat-alt font-bold text-2xl sm:text-3xl text-[#1A1A1A] mb-3">
                {t('sdgSectionTitle')}
              </h2>
              <p className="text-sm text-[#6b7280] font-light mb-8 max-w-lg mx-auto leading-relaxed">
                {t('sdgSectionSub')}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SDG_GOALS.map(({ n, name }) => (
                  <img
                    key={n}
                    src={`https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-${String(n).padStart(2, '0')}.jpg`}
                    alt={`SDG ${n} — ${name}`}
                    title={`SDG ${n} · ${name}`}
                    className="sdg-logo-item"
                    width={56}
                    height={56}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* MISSION STRIP */}
          <section
            ref={(el) => (sectionRefs.current[2] = el)}
            className="landing-animate-in is-visible px-4 py-16 sm:py-20"
          >
            <div className="max-w-5xl mx-auto landing-mission-strip flex flex-col lg:flex-row items-start lg:items-center gap-10 lg:gap-14">
              <div className="flex-1 min-w-0">
                <p className="text-[#009AA2] text-xs font-bold tracking-[0.16em] uppercase font-montserrat-alt mb-3">
                  {t('missionLabel')}
                </p>
                <h2
                  className="font-montserrat-alt font-black text-[#1A1A1A] leading-tight mb-4"
                  style={{ fontSize: 'clamp(20px, 2.8vw, 28px)' }}
                >
                  {t('missionQuoteLine1')}
                  <br />
                  {t('missionQuoteLine2')}
                  <br />
                  <span className="text-[#009AA2]">{t('missionQuoteLine3')}</span>
                </h2>
                <p className="text-sm text-[#6b7280] font-light leading-relaxed max-w-xl">{t('missionSub')}</p>
              </div>
              <div className="flex items-center gap-6 sm:gap-8 flex-wrap lg:flex-nowrap flex-shrink-0">
                <div className="text-center">
                  <div className="font-montserrat-alt font-black text-4xl text-[#009AA2] leading-none">17</div>
                  <div className="text-xs text-[#6b7280] mt-1.5 leading-tight">{t('statSdgs')}</div>
                </div>
                <div className="w-px h-10 bg-[#e5e7eb]" />
                <div className="text-center">
                  <div className="font-montserrat-alt font-black text-4xl text-[#F08602] leading-none">3</div>
                  <div className="text-xs text-[#6b7280] mt-1.5 leading-tight">{t('statActivities')}</div>
                </div>
                <div className="w-px h-10 bg-[#e5e7eb]" />
                <div className="text-center">
                  <div className="font-montserrat-alt font-black text-4xl text-[#51AC31] leading-none">∞</div>
                  <div className="text-xs text-[#6b7280] mt-1.5 leading-tight">{t('statImpact')}</div>
                </div>
              </div>
            </div>
          </section>

          {/* CONTACT */}
          <section
            ref={(el) => (sectionRefs.current[3] = el)}
            className="landing-animate-in is-visible px-4 py-16 sm:py-20"
          >
            <div className="max-w-2xl mx-auto">
              <p className="text-center text-[#9ca3af] text-xs font-bold tracking-[0.16em] uppercase font-montserrat-alt mb-3">
                {t('contactLabel')}
              </p>
              <h2 className="font-montserrat-alt font-bold text-2xl sm:text-3xl text-[#1A1A1A] mb-3 text-center">
                {t('contactTitle')}
              </h2>
              <p className="text-sm text-[#6b7280] font-light mb-8 text-center leading-relaxed">
                {t('contactSub')}
              </p>
              <form
                onSubmit={handleContactSubmit}
                className="landing-feature-card space-y-4"
              >
                <div>
                  <label htmlFor="contact-name" className="block text-xs font-semibold text-[#6b7280] font-montserrat-alt mb-1.5">
                    {t('contactNameLabel')}
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder={t('contactNamePlaceholder')}
                    required
                    className="w-full px-4 py-3 rounded-xl border-[1.5px] border-[#e5e7eb] bg-white text-[#1A1A1A] text-sm placeholder-[#9ca3af] font-light focus:border-[#009AA2] focus:outline-none focus:ring-2 focus:ring-[#009AA2]/20 transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-xs font-semibold text-[#6b7280] font-montserrat-alt mb-1.5">
                    {t('contactEmailLabel')}
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder={t('stayInTouchPlaceholder')}
                    required
                    className="w-full px-4 py-3 rounded-xl border-[1.5px] border-[#e5e7eb] bg-white text-[#1A1A1A] text-sm placeholder-[#9ca3af] font-light focus:border-[#009AA2] focus:outline-none focus:ring-2 focus:ring-[#009AA2]/20 transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="block text-xs font-semibold text-[#6b7280] font-montserrat-alt mb-1.5">
                    {t('contactMessageLabel')}
                  </label>
                  <textarea
                    id="contact-message"
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder={t('contactMessagePlaceholder')}
                    required
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border-[1.5px] border-[#e5e7eb] bg-white text-[#1A1A1A] text-sm placeholder-[#9ca3af] font-light focus:border-[#009AA2] focus:outline-none focus:ring-2 focus:ring-[#009AA2]/20 transition-all resize-none"
                  />
                </div>
                {contactError && <p className="text-xs text-red-500">{contactError}</p>}
                <button
                  type="submit"
                  disabled={contactSubmitting}
                  className="w-full px-5 py-3.5 rounded-full bg-[#009AA2] text-white text-sm font-bold font-montserrat-alt hover:bg-[#007a81] transition-colors disabled:opacity-60"
                >
                  {contactSubmitting ? '...' : t('contactSubmit')}
                </button>
              </form>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="px-5 py-8 border-t border-[#e5e7eb] bg-white">
            <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <Image
                src="/logo/1%20-%20Color%20on%20White%20-%20RGB.png"
                alt="Wanna Gonna"
                width={90}
                height={32}
                className="h-7 w-auto object-contain opacity-80"
              />
              <p className="text-sm text-[#9ca3af] text-center">{t('footerTagline')}</p>
              <div className="flex gap-5 text-sm text-[#9ca3af]">
                <a href="mailto:contact@wannagonna.org" className="hover:text-[#009AA2] transition-colors">
                  contact@wannagonna.org
                </a>
                <a
                  href="https://app.wannagonna.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#009AA2] transition-colors"
                >
                  app.wannagonna.org
                </a>
              </div>
            </div>
            <p className="max-w-5xl mx-auto mt-6 pt-4 border-t border-[#e5e7eb] text-xs text-[#9ca3af] text-center">
              {t('footerCopyright', { year: new Date().getFullYear() })}
            </p>
          </footer>
        </main>
      </div>

      {/* Toast */}
      {contactToast.show && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-sm z-50">
          <Toast
            onClose={() => {
              setContactToast((p) => ({ ...p, show: false }));
            }}
            className="bg-white border border-[#e5e7eb] shadow-lg"
          >
            <div
              className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                contactToast.type === 'success'
                  ? 'bg-green-100 text-green-600'
                  : 'bg-red-100 text-red-600'
              }`}
            >
              {contactToast.type === 'success' ? '✓' : '!'}
            </div>
            <div className="ml-3 text-[#1A1A1A] text-sm">{contactToast.message}</div>
            <Toast.Toggle
              onClose={() => {
                setContactToast((p) => ({ ...p, show: false }));
              }}
            />
          </Toast>
        </div>
      )}
    </div>
  );
}
