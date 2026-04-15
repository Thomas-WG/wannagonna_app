'use client';

import { useState, useEffect } from 'react';
import { fetchUserBadges } from '@/utils/crudBadges';
import BadgeCard from './BadgeCard';
import { HiBadgeCheck } from 'react-icons/hi';
import { Card } from 'flowbite-react';

/**
 * BadgeList component displays all badges earned by a user
 * @param {string} userId - The user's ID (used when badges not provided)
 * @param {Array} badges - Optional pre-fetched badges with imageUrl (e.g. from parent)
 * @param {boolean} badgesLoading - When badges from parent, true while parent is loading
 */
export default function BadgeList({ userId, badges: badgesProp, badgesLoading }) {
  const [badges, setBadges] = useState(badgesProp ?? []);
  const [loading, setLoading] = useState(badgesProp === undefined);

  useEffect(() => {
    if (badgesProp !== undefined) {
      setBadges(badgesProp);
      setLoading(badgesLoading ?? false);
      return;
    }
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadBadges = async () => {
      try {
        setLoading(true);
        const userBadges = await fetchUserBadges(userId);
        setBadges(userBadges);
      } catch (error) {
        console.error('Error loading user badges:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBadges();
  }, [userId, badgesProp, badgesLoading]);

  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
        <div className="flex flex-col items-center justify-center py-8 sm:py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-gray-600">Loading badges...</p>
        </div>
      </Card>
    );
  }

  if (badges.length === 0) {
    return (
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
        <div className="flex flex-col items-center justify-center py-8 sm:py-12">
          <HiBadgeCheck className="w-16 h-16 sm:w-20 sm:h-20 text-purple-400 mb-4" />
          <p className="text-lg sm:text-xl text-gray-600 font-medium text-center">
            No badges earned yet
          </p>
          <p className="text-sm sm:text-base text-gray-500 text-center mt-2">
            Complete your profile and participate in activities to earn badges!
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
        {badges.map((badge) => (
          <BadgeCard
            key={badge.id}
            badge={badge}
            imageUrl={badge.imageUrl}
            isEarned={true}
          />
        ))}
      </div>
    </Card>
  );
}

