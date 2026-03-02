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
    <div className="rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
      <h3 className="text-xl font-semibold text-text-primary dark:text-text-primary">{t('skillsAvailable') || 'Skills & Availability'}</h3>

      <div className="space-y-5">
        {/* Skills block — keep teal style, prominent for NPOs */}
        {hasSkills && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#9ca3af] dark:text-text-tertiary mb-2.5">
              {t('skills')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {translatedSkills.map((skill, idx) => (
                <Badge key={idx} color="info" className="text-xs">
                  {skill.label || skill.value || skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Time Commitment — softened read-only style */}
        {timeCommitments.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#9ca3af] dark:text-text-tertiary mb-2.5 flex items-center gap-2">
              <HiClock className="w-4 h-4" />
              {t('frequency') || 'How often can you help?'}
            </h4>
            <div className="flex flex-wrap gap-2">
              {timeCommitments.map((commitment, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-full bg-[#f5f5f5] dark:bg-background-hover text-xs text-[#6b7280] dark:text-text-tertiary font-normal"
                >
                  {commitment}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Availability — softened read-only style */}
        {availabilities.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#9ca3af] dark:text-text-tertiary mb-2.5 flex items-center gap-2">
              <HiCalendar className="w-4 h-4" />
              {t('availabilities') || 'When are you usually available?'}
            </h4>
            <div className="flex flex-wrap gap-2">
              {availabilities.map((availability, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-full bg-[#f5f5f5] dark:bg-background-hover text-xs text-[#6b7280] dark:text-text-tertiary font-normal"
                >
                  {availability}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
