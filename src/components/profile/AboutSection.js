'use client';

import { useTranslations } from 'next-intl';

/**
 * About section component
 * Displays bio, cause, hobbies, and languages
 */
export default function AboutSection({ profileData, translatedSkills, isMobile = false }) {
  const t = useTranslations('CompleteProfile');
  const tProfile = useTranslations('PublicProfile');

  if (!profileData) return null;

  const hasContent = profileData.bio || profileData.cause || profileData.hobbies ||
                     (profileData.languages && profileData.languages.length > 0);

  if (!hasContent) return null;

  const languages = profileData.languages || [];
  const languagesText = languages
    .map((lang) => (typeof lang === 'object' ? lang.label : lang))
    .filter(Boolean)
    .join(', ');

  const subsections = [
    { title: tProfile('bioLabel'), content: profileData.bio },
    { title: tProfile('causeLabel'), content: profileData.cause },
    { title: tProfile('hobbiesLabel'), content: profileData.hobbies },
    { title: t('languages'), content: languagesText ? <p className="text-sm text-[#3F3F3F] dark:text-text-secondary font-light">{languagesText}</p> : null },
  ].filter((s) => s.content);

  return (
    <div className="rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
      <h3 className="text-xl font-semibold text-text-primary dark:text-text-primary">{tProfile('about')}</h3>

      <div className="space-y-0">
        {subsections.map((subsection, idx) => (
          <div
            key={idx}
            className="pb-4 border-b border-[#f0f0f0] dark:border-border-light last:border-b-0 last:pb-0"
          >
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#9ca3af] dark:text-text-tertiary mb-2">
              {subsection.title}
            </h4>
            <div className="text-sm text-[#3F3F3F] dark:text-text-secondary font-light leading-relaxed">
              {typeof subsection.content === 'string' ? (
                <p className="whitespace-pre-wrap break-words">{subsection.content}</p>
              ) : (
                subsection.content
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
