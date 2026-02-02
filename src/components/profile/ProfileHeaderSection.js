'use client';

import Image from 'next/image';
import { HiUser, HiGlobeAlt } from 'react-icons/hi';
import { Progress } from 'flowbite-react';
import { formatJoinedDate } from '@/utils/crudMemberProfile';
import { countries } from 'countries-list';
import { useTranslations } from 'next-intl';

/**
 * Profile header section component
 * Displays avatar, name, country, level, XP, and XP progress bar
 */
export default function ProfileHeaderSection({ profileData }) {
  const tProfile = useTranslations('PublicProfile');
  
  if (!profileData) return null;

  const joinedDate = profileData.createdAt ? formatJoinedDate(profileData.createdAt) : null;
  const currentXP = profileData.xp ? (profileData.xp % 100) : 0;
  const level = profileData.level || 1;
  const totalXP = profileData.xp || 0;

  // Get country name from country code
  const getCountryName = (countryCode) => {
    if (!countryCode) return null;
    const country = countries[countryCode.toUpperCase()];
    return country ? country.name : countryCode;
  };

  const countryName = profileData.country ? getCountryName(profileData.country) : null;

  return (
    <div className="flex flex-col gap-4 pb-4 md:pb-6 border-b-2 border-border-light dark:border-[#475569] w-full">
      <div className="w-full bg-background-hover dark:bg-background-hover rounded-lg p-3 md:p-4 border-2 border-border-light dark:border-[#475569] shadow-sm">
        <div className="flex items-center gap-3 md:gap-4">
          {/* Profile Picture - Left */}
          <div className="relative flex-shrink-0">
            {profileData.profilePicture && profileData.profilePicture.trim() !== '' ? (
              <Image
                src={profileData.profilePicture}
                alt={profileData.displayName || 'User'}
                width={70}
                height={70}
                className="md:w-[90px] md:h-[90px] rounded-full border-2 border-white shadow-md object-cover"
                priority
              />
            ) : (
              <div className="w-[70px] h-[70px] md:w-[90px] md:h-[90px] rounded-full bg-semantic-info-500 dark:bg-semantic-info-600 flex items-center justify-center border-2 border-white dark:border-neutral-800 shadow-md">
                <HiUser className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
            )}
          </div>
          
          {/* Middle: Name + Country */}
          <div className="flex-1 min-w-0">
            <h2 className="text-base md:text-xl font-bold text-text-primary dark:text-text-primary mb-1 md:mb-1.5 break-words line-clamp-1">
              {profileData.displayName || tProfile('anonymousUser')}
            </h2>
            
            {countryName && (
              <div className="flex items-center gap-1.5 md:gap-2 mb-1">
                <HiGlobeAlt className="w-3.5 h-3.5 md:w-4 md:h-4 text-text-tertiary dark:text-text-tertiary flex-shrink-0" />
                <span className="text-xs md:text-sm text-text-secondary dark:text-text-secondary truncate">{countryName}</span>
              </div>
            )}
            
            {joinedDate && (
              <p className="text-xs md:text-sm text-text-tertiary dark:text-text-tertiary truncate">
                {joinedDate}
              </p>
            )}
          </div>
          
          {/* Right Side: Level + XP */}
          <div className="flex-shrink-0 flex flex-col items-end gap-2 md:gap-3">
            {/* Level in Circle */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-semantic-info-100 dark:bg-semantic-info-900 flex items-center justify-center border-2 border-semantic-info-500 dark:border-semantic-info-400">
                <span className="text-base md:text-lg font-bold text-semantic-info-700 dark:text-semantic-info-300">
                  {level}
                </span>
              </div>
              <span className="text-xs text-text-tertiary dark:text-text-tertiary mt-0.5 md:mt-1">{tProfile('level')}</span>
            </div>
            
            {/* XP */}
            <div className="flex flex-col items-center">
              <span className="text-sm md:text-base font-semibold text-text-primary dark:text-text-primary">
                {totalXP}
              </span>
              <span className="text-xs text-text-tertiary dark:text-text-tertiary">{tProfile('xp')}</span>
            </div>
          </div>
        </div>
        
        {/* XP Progress Bar */}
        <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t-2 border-border-light dark:border-[#475569]">
          <div className="flex justify-between text-xs md:text-sm text-text-secondary dark:text-text-secondary mb-1 md:mb-1.5">
            <span className="truncate">{currentXP} / 100 {tProfile('xp')}</span>
            <span className="truncate ml-2">{100 - currentXP} {tProfile('xpToNext')}</span>
          </div>
          <Progress 
            progress={currentXP} 
            color="blue"
            size="sm"
            className="md:!h-3 h-2 w-full"
          />
        </div>
      </div>
    </div>
  );
}
