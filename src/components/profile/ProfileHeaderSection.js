'use client';

import { HiGlobeAlt } from 'react-icons/hi';
import { formatJoinedDate } from '@/utils/crudMemberProfile';
import { countries } from 'countries-list';
import { useTranslations } from 'next-intl';
import ProfilePicture from '@/components/common/ProfilePicture';

/**
 * Profile header section component
 * Displays avatar, name, country, level, XP, and XP progress bar
 * Same two-column design as dashboard ProfileSection
 */
export default function ProfileHeaderSection({ profileData, badges: badgesProp, activitiesCount }) {
  const tProfile = useTranslations('PublicProfile');

  if (!profileData) return null;

  const joinedDate = profileData.created_at ? formatJoinedDate(profileData.created_at) : null;
  const totalXP = profileData.xp || 0;
  const level = profileData.level ?? Math.floor(totalXP / 100) + 1;
  const currentXP = totalXP % 100;
  const xpForNextLevel = 100;
  const xpRemaining = xpForNextLevel - currentXP;
  const progressPercent = Math.min(Math.round((currentXP / xpForNextLevel) * 100), 100);
  const isCloseToLevelUp = xpRemaining <= Math.ceil(xpForNextLevel * 0.2);
  const activitiesCompleted =
    activitiesCount ?? profileData?.impact_summary?.total_activities ?? 0;

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

  const getCountryName = (countryCode) => {
    if (!countryCode) return null;
    const country = countries[countryCode.toUpperCase()];
    return country ? country.name : countryCode;
  };
  const countryName = profileData.country ? getCountryName(profileData.country) : null;

  return (
    <div className="pb-4 md:pb-6 border-b-2 border-border-light dark:border-[#475569] w-full">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-[#e5e7eb] dark:border-gray-700 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-5 sm:gap-8">
          {/* LEFT COLUMN — identity */}
          <div className="flex sm:flex-col items-center sm:items-start gap-4 sm:gap-0 flex-shrink-0">
            {/* Avatar with level pill overlapping bottom */}
            <div className="relative flex-shrink-0">
              <ProfilePicture
                src={profileData.profile_picture}
                alt={profileData.display_name || tProfile('anonymousUser')}
                size={80}
                priority={true}
                variant="subtle"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-0 !bg-[#009AA2]"
              />
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-[#009AA2] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                Lvl {level}
              </div>
            </div>

            {/* Name + country + joined date */}
            <div className="sm:mt-5 min-w-0 text-center sm:text-left">
              <h2 className="text-lg sm:text-xl font-bold text-[#1A1A1A] dark:text-gray-100 leading-tight">
                {profileData.display_name || tProfile('anonymousUser')}
              </h2>
              {countryName && (
                <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-1.5">
                  <HiGlobeAlt className="w-3.5 h-3.5 text-[#9ca3af] flex-shrink-0" />
                  <span className="text-xs text-[#6b7280] dark:text-gray-400 truncate">
                    {countryName}
                  </span>
                </div>
              )}
              {joinedDate && (
                <p className="text-xs text-[#9ca3af] dark:text-gray-400 mt-0.5 truncate">
                  {joinedDate}
                </p>
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
                  {tProfile('xp')}
                </div>
              </div>

              <div className="bg-[#fff8f0] dark:bg-amber-900/20 border border-[#F08602]/15 dark:border-amber-500/30 rounded-xl p-3 text-center">
                <div className="text-xl font-black text-[#F08602] leading-none dark:text-amber-400">
                  {displayBadges.length}
                </div>
                <div className="text-[10px] text-[#9ca3af] dark:text-gray-400 mt-1 font-medium uppercase tracking-wide">
                  {tProfile('badges')}
                </div>
              </div>

              <div className="bg-[#f0fdf0] dark:bg-green-900/20 border border-[#51AC31]/15 dark:border-green-500/30 rounded-xl p-3 text-center">
                <div className="text-xl font-black text-[#51AC31] leading-none dark:text-green-400">
                  {activitiesCompleted}
                </div>
                <div className="text-[10px] text-[#9ca3af] dark:text-gray-400 mt-1 font-medium uppercase tracking-wide">
                  {tProfile('activitiesCompleted') || 'Activities'}
                </div>
              </div>
            </div>

            {/* XP PROGRESS BAR */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-[#6b7280] dark:text-gray-400">
                  {currentXP} / {xpForNextLevel} {tProfile('xp')}
                </span>
                <span
                  className={`text-xs font-medium transition-colors ${
                    isCloseToLevelUp
                      ? 'text-[#F08602] font-semibold dark:text-amber-400'
                      : 'text-[#9ca3af] dark:text-gray-400'
                  }`}
                >
                  {xpRemaining} {tProfile('xpToNext')}
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
                      <span className="text-lg" aria-hidden="true">
                        🏅
                      </span>
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
