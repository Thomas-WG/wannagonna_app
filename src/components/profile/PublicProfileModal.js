'use client';

import { Modal } from 'flowbite-react';
import { HiX, HiUser } from 'react-icons/hi';
import { useTranslations } from 'next-intl';
import { useModal } from '@/utils/modal/useModal';
import { usePublicProfile } from '@/hooks/profile/usePublicProfile';
import { usePublicProfileBadges } from '@/hooks/profile/usePublicProfileBadges';
import { usePublicProfileActivities } from '@/hooks/profile/usePublicProfileActivities';
import PublicProfileSkeleton from './PublicProfileSkeleton';
import ProfileHeaderSection from './ProfileHeaderSection';
import AboutSection from './AboutSection';
import SkillsAvailabilitySection from './SkillsAvailabilitySection';
import BadgesSection from './BadgesSection';
import ConnectSection from './ConnectSection';
import ActivitiesSection from './ActivitiesSection';

export default function PublicProfileModal({ isOpen, onClose, userId, isOwnProfile = false }) {
  // Register this modal with the global modal manager for ESC key and browser back button support
  useModal(isOpen, onClose, 'public-profile-modal');
  const tProfile = useTranslations('PublicProfile');

  // Fetch data using React Query hooks
  const { 
    data: profileData, 
    isLoading: isLoadingProfile, 
    error: profileError 
  } = usePublicProfile(userId);

  const { 
    data: badges = [], 
    isLoading: isLoadingBadges 
  } = usePublicProfileBadges(userId);

  const { 
    data: completedActivities = [], 
    isLoading: isLoadingActivities 
  } = usePublicProfileActivities(userId);

  // Determine loading and error states
  const isLoading = isLoadingProfile || isLoadingBadges || isLoadingActivities;
  const error = profileError;

  // Extract profile and translated skills from profileData
  const profile = profileData?.profile || null;
  const translatedSkills = profileData?.translatedSkills || [];

  return (
    <Modal show={isOpen} onClose={onClose} size="5xl" className="z-50">
      <Modal.Header className="border-b border-border-light dark:border-border-dark px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-text-primary dark:text-text-primary">{tProfile('title')}</span>
        </div>
      </Modal.Header>
      <Modal.Body className="max-h-[80vh] overflow-y-auto px-4 sm:px-6 overflow-x-hidden">
        {isLoading ? (
          <PublicProfileSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <HiX className="w-12 h-12 text-semantic-error-500 dark:text-semantic-error-400 mb-4" />
            <p className="text-text-secondary dark:text-text-secondary">{error.message || 'Failed to load profile data'}</p>
          </div>
        ) : !profileData || !profile ? (
          <div className="flex flex-col items-center justify-center py-12">
            <HiUser className="w-12 h-12 text-text-tertiary dark:text-text-tertiary mb-4" />
            <p className="text-text-secondary dark:text-text-secondary">{tProfile('notFound')}</p>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6 w-full max-w-full overflow-x-hidden">
            {/* Header Section */}
            <ProfileHeaderSection profileData={profile} />

            {/* Content Layout - Mobile: About/Availability first, then Badges/Connect. Desktop: Sidebar + Main Content */}
            <div className="flex flex-col lg:flex-row gap-6 w-full">
              {/* Mobile: About and Availability shown first, Desktop: Left Sidebar */}
              <div className="flex flex-col lg:hidden space-y-6 order-1">
                <AboutSection profileData={profile} translatedSkills={translatedSkills} isMobile={true} />
                <SkillsAvailabilitySection profileData={profile} translatedSkills={translatedSkills} isMobile={true} />
              </div>

              {/* Left Sidebar - Stats, Badges, Connect (narrower, fixed width on desktop) */}
              <div className="lg:w-80 lg:flex-shrink-0 space-y-6 order-2 lg:order-1">
                <BadgesSection badges={badges} />
                <ConnectSection profileData={profile} />
              </div>

              {/* Main Content Area - About, Skills, Availability (flexible width) - Desktop Only */}
              <div className="hidden lg:flex flex-1 space-y-6 min-w-0 order-2">
                <AboutSection profileData={profile} translatedSkills={translatedSkills} isMobile={false} />
                <SkillsAvailabilitySection profileData={profile} translatedSkills={translatedSkills} isMobile={false} />
              </div>
            </div>

            {/* Completed Activities Section - Full Width, Centered */}
            <ActivitiesSection completedActivities={completedActivities} />
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="px-4 sm:px-6 border-t border-border-light dark:border-border-dark">
        <div className="flex justify-end w-full">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-primary dark:text-text-primary bg-background-card dark:bg-background-card border border-border-light dark:border-border-dark rounded-lg hover:bg-background-hover dark:hover:bg-background-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-colors duration-200"
          >
            {tProfile('close')}
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
