'use client';

import { memo, useCallback } from 'react';
import { HiClipboardCopy } from 'react-icons/hi';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useDashboardStore } from '@/stores/dashboardStore';
import ProfilePicture from '@/components/common/ProfilePicture';

/**
 * ProfileSection Component
 * Displays user profile with gamification data (level, XP, badges)
 */
const ProfileSection = memo(function ProfileSection({
  profileData,
  gamificationData,
  user,
  badges: badgesProp,
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

  // Explicitly check if profileData.profile_picture is a valid non-empty string
  const profilePictureFromData = profileData?.profile_picture;
  const hasValidProfilePicture = profilePictureFromData && profilePictureFromData.trim() !== '';
  const profilePicture = hasValidProfilePicture ? profilePictureFromData : (user?.photoURL || null);

  const displayName =
    profileData?.display_name || user?.displayName || user?.email || 'Volunteer';
  const userCode = profileData?.code || null;

  const level = gamificationData?.level ?? 1;
  const currentXP = gamificationData?.current_xp ?? 0;
  const totalXP = gamificationData?.total_xp ?? 0;
  const xpForNextLevel = 100;
  const xpRemaining = xpForNextLevel - currentXP;
  const progressPercent = Math.min(Math.round((currentXP / xpForNextLevel) * 100), 100);
  const isCloseToLevelUp = xpRemaining <= Math.ceil(xpForNextLevel * 0.2);
  const activitiesCompleted = profileData?.impact_summary?.total_activities ?? 0;

  // Use enriched badges from parent when provided, else fall back to profileData.badges
  const displayBadges = badgesProp?.length
    ? badgesProp.map((b) => ({
        id: b.id,
        name: b.title ?? b.name ?? b.label ?? null,
        label: b.label ?? b.title ?? null,
        imageUrl: b.imageUrl ?? null,
      }))
    : (profileData?.badges ?? [])
        .map((b) => ({
          id: typeof b === 'string' ? b : b?.id,
          name: b?.name ?? b?.title ?? null,
          label: b?.label ?? null,
          imageUrl: b?.imageUrl ?? null,
        }))
        .filter((b) => b.id);

  return (
    <div className="mb-6 sm:mb-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-[#e5e7eb] dark:border-gray-700 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-5 sm:gap-8">
          {/* LEFT COLUMN — identity */}
          <div className="flex sm:flex-col items-center sm:items-start gap-4 sm:gap-0 flex-shrink-0">
            {/* Avatar with level pill overlapping bottom */}
            <div className="relative flex-shrink-0" onClick={handleProfileClick} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleProfileClick(); } }} aria-label={displayName}>
              <ProfilePicture
                src={profilePicture}
                alt={displayName}
                size={80}
                priority={true}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-0 !bg-[#009AA2] shadow-md cursor-pointer hover:opacity-90 transition-opacity"
              />
              {/* Level pill — overlaps bottom center of avatar */}
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-[#009AA2] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                Lvl {level}
              </div>
            </div>

            {/* Name + referral code */}
            <div className="sm:mt-5 min-w-0 text-center sm:text-left">
              <h2
                className="text-lg sm:text-xl font-bold text-[#1A1A1A] dark:text-gray-100 leading-tight cursor-pointer hover:text-[#009AA2] dark:hover:text-teal-400 transition-colors"
                onClick={handleProfileClick}
              >
                {displayName}
              </h2>
              {userCode && (
                <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-1.5">
                  <span className="text-xs text-[#9ca3af]">Ref:</span>
                  <span className="text-xs font-mono font-semibold text-[#3F3F3F] dark:text-gray-300 tracking-wide">
                    {userCode}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="p-1 rounded-md hover:bg-[#f5f5f5] dark:hover:bg-gray-700 transition-colors text-[#9ca3af] hover:text-[#009AA2] dark:hover:text-teal-400"
                    title={t('copyCode') || 'Copy referral code'}
                  >
                    <HiClipboardCopy className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN — stats + XP + badges */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            {/* STATS ROW — 3 tiles */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="bg-[#f0fdfd] dark:bg-teal-900/20 border border-[#009AA2]/15 dark:border-teal-500/30 rounded-xl p-3 text-center">
                <div className="text-xl font-black text-[#009AA2] leading-none dark:text-teal-400">
                  {totalXP}
                </div>
                <div className="text-[10px] text-[#9ca3af] dark:text-gray-400 mt-1 font-medium uppercase tracking-wide">
                  Total XP
                </div>
              </div>

              <div className="bg-[#fff8f0] dark:bg-amber-900/20 border border-[#F08602]/15 dark:border-amber-500/30 rounded-xl p-3 text-center">
                <div className="text-xl font-black text-[#F08602] leading-none dark:text-amber-400">
                  {displayBadges.length}
                </div>
                <div className="text-[10px] text-[#9ca3af] dark:text-gray-400 mt-1 font-medium uppercase tracking-wide">
                  Badges
                </div>
              </div>

              <div className="bg-[#f0fdf0] dark:bg-green-900/20 border border-[#51AC31]/15 dark:border-green-500/30 rounded-xl p-3 text-center">
                <div className="text-xl font-black text-[#51AC31] leading-none dark:text-green-400">
                  {activitiesCompleted}
                </div>
                <div className="text-[10px] text-[#9ca3af] dark:text-gray-400 mt-1 font-medium uppercase tracking-wide">
                  Activities
                </div>
              </div>
            </div>

            {/* XP PROGRESS BAR */}
            <div
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => router.push('/xp-history')}
              title={t('viewXpHistory') || 'View XP History'}
            >
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-[#6b7280] dark:text-gray-400">
                  {currentXP} / {xpForNextLevel} XP
                </span>
                <span
                  className={`text-xs font-medium transition-colors ${
                    isCloseToLevelUp
                      ? 'text-[#F08602] font-semibold dark:text-amber-400'
                      : 'text-[#9ca3af] dark:text-gray-400'
                  }`}
                >
                  {xpRemaining} XP to Level {level + 1}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-[#e5e7eb] dark:bg-gray-600 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#009AA2] dark:bg-teal-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* BADGES PREVIEW — last 3 earned + overflow count */}
            {displayBadges.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {displayBadges.slice(-3).map((badge) => (
                  <div
                    key={badge.id}
                    title={badge.name ?? badge.label ?? badge.title ?? 'Badge'}
                    className="w-9 h-9 rounded-full border-2 border-white dark:border-gray-700 ring-1 ring-[#e5e7eb] dark:ring-gray-600 shadow-sm overflow-hidden bg-[#f5f5f5] dark:bg-gray-600 flex-shrink-0 flex items-center justify-center"
                  >
                    {badge.imageUrl ? (
                      <img
                        src={badge.imageUrl}
                        alt={badge.name ?? badge.label ?? badge.title ?? 'Badge'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg" aria-hidden="true">🏅</span>
                    )}
                  </div>
                ))}

                {displayBadges.length > 3 && (
                  <div className="w-9 h-9 rounded-full bg-[#f5f5f5] dark:bg-gray-600 ring-1 ring-[#e5e7eb] dark:ring-gray-600 shadow-sm flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-[#6b7280] dark:text-gray-300">
                      +{displayBadges.length - 3}
                    </span>
                  </div>
                )}

                <a
                  href="#badges"
                  className="ml-1 text-xs text-[#009AA2] hover:underline font-medium dark:text-teal-400"
                >
                  View all
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default ProfileSection;
