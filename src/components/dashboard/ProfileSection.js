'use client';

import { memo, useCallback } from 'react';
import { Card, Progress, Button, Avatar } from 'flowbite-react';
import { HiUser, HiBadgeCheck, HiClipboardCopy } from 'react-icons/hi';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useDashboardStore } from '@/stores/dashboardStore';

/**
 * ProfileSection Component
 * Displays user profile with gamification data (level, XP, badges)
 */
const ProfileSection = memo(function ProfileSection({
  profileData,
  gamificationData,
  user,
  onCopyCodeSuccess,
  onCopyCodeError,
}) {
  const t = useTranslations('Dashboard');
  const router = useRouter();
  const { setShowProfileModal, setSelectedProfileUserId } = useDashboardStore();

  const handleProfileClick = useCallback(() => {
    if (user?.uid) {
      setSelectedProfileUserId(user.uid);
      setShowProfileModal(true);
    }
  }, [user?.uid, setShowProfileModal, setSelectedProfileUserId]);

  const handleCopyCode = useCallback(async () => {
    const userCode = profileData?.code;
    if (!userCode) return;

    try {
      await navigator.clipboard.writeText(userCode);
      onCopyCodeSuccess?.();
    } catch (error) {
      console.error('Failed to copy code:', error);
      onCopyCodeError?.();
    }
  }, [profileData?.code, onCopyCodeSuccess, onCopyCodeError]);

  // Explicitly check if profileData.profilePicture is a valid non-empty string
  // Otherwise fall back to user?.photoURL (from Google auth)
  const profilePictureFromData = profileData?.profilePicture;
  const hasValidProfilePicture = profilePictureFromData && profilePictureFromData.trim() !== '';
  const profilePicture = hasValidProfilePicture ? profilePictureFromData : (user?.photoURL || null);
  
  const displayName =
    profileData?.displayName || user?.displayName || user?.email || 'Volunteer';
  const userCode = profileData?.code || null;

  return (
    <div className="mb-6 sm:mb-8">
      <Card className="bg-background-card dark:bg-background-card border-2 border-primary-200 dark:border-primary-700 shadow-lg">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          {/* Profile Picture */}
          <div
            className="relative cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleProfileClick}
          >
            <Avatar
              img={profilePicture || undefined}
              alt={displayName}
              size="xl"
              rounded
              className="border-4 border-white dark:border-neutral-800 shadow-lg"
            />
          </div>

          {/* Profile Info and Gamification */}
          <div className="flex-1 w-full sm:w-auto text-center sm:text-left">
            <h1
              className="text-2xl sm:text-3xl font-bold text-text-primary dark:text-text-primary mb-2 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              onClick={handleProfileClick}
            >
              {displayName}
            </h1>

            {/* User Code */}
            {userCode && (
              <div className="mb-4 flex items-center justify-center sm:justify-start gap-2">
                <span className="text-sm sm:text-base text-text-secondary dark:text-text-secondary font-mono font-semibold">
                  {t('code') || 'Code'}: {userCode}
                </span>
                <Button
                  size="xs"
                  color="gray"
                  onClick={handleCopyCode}
                  className="p-1.5"
                  title={t('copyCode') || 'Copy code'}
                >
                  <HiClipboardCopy className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Level and XP Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg sm:text-xl font-bold text-text-primary dark:text-text-primary">
                    Level {gamificationData.level}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm text-text-secondary dark:text-text-secondary">
                  <span>{gamificationData.totalXP} XP</span>
                </div>
              </div>

              {/* XP Progress Bar - Clickable */}
              <div
                className="w-full max-w-md mx-auto sm:mx-0 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => router.push('/xp-history')}
                title={t('viewXpHistory') || 'View XP History'}
              >
                <div className="flex justify-between text-xs text-text-secondary dark:text-text-secondary mb-1">
                  <span>{gamificationData.currentXP} / 100 XP</span>
                  <span>{100 - gamificationData.currentXP} XP to next level</span>
                </div>
                <Progress
                  progress={gamificationData.currentXP}
                  color="blue"
                  size="lg"
                  className="h-3"
                />
              </div>
            </div>

            {/* Badges Count */}
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <HiBadgeCheck className="w-5 h-5 text-activityType-event-500 dark:text-activityType-event-400" />
              <span className="text-sm sm:text-base text-text-primary dark:text-text-primary">
                <span className="font-semibold">{gamificationData.badgesCount}</span> Badges
                earned
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
});

export default ProfileSection;

