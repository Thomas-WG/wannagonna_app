'use client';

import { Badge } from 'flowbite-react';
import { HiClock, HiCalendar } from 'react-icons/hi';
import { useTranslations } from 'next-intl';

/**
 * Helper function to get selected time commitment options
 */
function getSelectedTimeCommitments(profileData, t) {
  if (!profileData?.timeCommitment) return [];
  const commitments = [];
  if (profileData.timeCommitment.daily) commitments.push(t('daily') || 'Daily');
  if (profileData.timeCommitment.weekly) commitments.push(t('weekly') || 'Weekly');
  if (profileData.timeCommitment.biweekly) commitments.push(t('biweekly') || 'Every two weeks');
  if (profileData.timeCommitment.monthly) commitments.push(t('monthly') || 'Monthly');
  if (profileData.timeCommitment.occasional) commitments.push(t('occasionally') || 'Occasionally');
  if (profileData.timeCommitment.flexible) commitments.push(t('flexible') || 'Flexible');
  return commitments;
}

/**
 * Helper function to get selected availability options
 */
function getSelectedAvailabilities(profileData, t) {
  if (!profileData?.availabilities) return [];
  const availabilities = [];
  if (profileData.availabilities.weekdays) availabilities.push(t('weekdays') || 'Weekdays');
  if (profileData.availabilities.weekends) availabilities.push(t('weekends') || 'Weekends');
  if (profileData.availabilities.mornings) availabilities.push(t('mornings') || 'Mornings');
  if (profileData.availabilities.afternoons) availabilities.push(t('afternoons') || 'Afternoons');
  if (profileData.availabilities.evenings) availabilities.push(t('evenings') || 'Evenings');
  if (profileData.availabilities.flexible) availabilities.push(t('flexible') || 'Flexible');
  return availabilities;
}

/**
 * Skills and availability section component
 * Displays skills, time commitment, and availability badges
 */
export default function SkillsAvailabilitySection({ profileData, translatedSkills, isMobile = false }) {
  const t = useTranslations('CompleteProfile');

  if (!profileData) return null;

  const timeCommitments = getSelectedTimeCommitments(profileData, t);
  const availabilities = getSelectedAvailabilities(profileData, t);
  const hasSkills = translatedSkills && translatedSkills.length > 0;
  // On mobile, show skills here. On desktop, skills are shown in AboutSection
  const hasContent = timeCommitments.length > 0 || availabilities.length > 0 || hasSkills;

  if (!hasContent) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-text-primary dark:text-text-primary">{t('skillsAvailable') || 'Skills & Availability'}</h3>
      
      {/* Skills shown here for mobile, in AboutSection for desktop */}
      {hasSkills && (
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
      
      {/* Time Commitment */}
      {timeCommitments.length > 0 && (
        <div>
          <p className="text-sm font-medium text-text-primary dark:text-text-primary mb-2 flex items-center gap-2">
            <HiClock className="w-4 h-4 text-text-tertiary dark:text-text-tertiary" />
            {t('frequency') || 'How often can you help?'}
          </p>
          <div className="flex flex-wrap gap-2">
            {timeCommitments.map((commitment, idx) => (
              <Badge key={idx} color="gray" className="text-xs">
                {commitment}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {/* Availability */}
      {availabilities.length > 0 && (
        <div>
          <p className="text-sm font-medium text-text-primary dark:text-text-primary mb-2 flex items-center gap-2">
            <HiCalendar className="w-4 h-4 text-text-tertiary dark:text-text-tertiary" />
            {t('availabilities') || 'When are you usually available?'}
          </p>
          <div className="flex flex-wrap gap-2">
            {availabilities.map((availability, idx) => (
              <Badge key={idx} color="info" className="text-xs">
                {availability}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
