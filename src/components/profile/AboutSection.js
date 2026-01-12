'use client';

import { Badge } from 'flowbite-react';
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
                     (profileData.languages && profileData.languages.length > 0) ||
                     (translatedSkills && translatedSkills.length > 0);

  if (!hasContent) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-text-primary dark:text-text-primary">{tProfile('about')}</h3>
      
      {profileData.bio && (
        <div>
          <p className="text-sm font-medium text-text-primary dark:text-text-primary mb-1">{tProfile('bioLabel')}</p>
          <p className="text-text-secondary dark:text-text-secondary whitespace-pre-wrap break-words">{profileData.bio}</p>
        </div>
      )}
      
      {profileData.cause && (
        <div>
          <p className="text-sm font-medium text-text-primary dark:text-text-primary mb-1">{tProfile('causeLabel')}</p>
          <p className="text-text-secondary dark:text-text-secondary whitespace-pre-wrap break-words">{profileData.cause}</p>
        </div>
      )}
      
      {profileData.hobbies && (
        <div>
          <p className="text-sm font-medium text-text-primary dark:text-text-primary mb-1">{tProfile('hobbiesLabel')}</p>
          <p className="text-text-secondary dark:text-text-secondary whitespace-pre-wrap break-words">{profileData.hobbies}</p>
        </div>
      )}
      
      {profileData.languages && profileData.languages.length > 0 && (
        <div>
          <p className="text-sm font-medium text-text-primary dark:text-text-primary mb-2">{t('languages')}</p>
          <div className="flex flex-wrap gap-2">
            {profileData.languages.map((lang, idx) => (
              <Badge key={idx} color="gray" className="text-xs">
                {typeof lang === 'object' ? lang.label : lang}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {/* Skills shown in About section for desktop only (mobile shows them in SkillsAvailabilitySection) */}
      {!isMobile && translatedSkills && translatedSkills.length > 0 && (
        <div>
          <p className="text-sm font-medium text-text-primary dark:text-text-primary mb-2">{t('skills')}</p>
          <div className="flex flex-wrap gap-2">
            {translatedSkills.map((skill, idx) => (
              <Badge key={idx} color="info" className="text-xs">
                {skill.label || skill.value || skill}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
