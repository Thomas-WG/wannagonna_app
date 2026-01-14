'use client';

import { useState, useEffect } from 'react';
import { fetchUserBadges } from '@/utils/crudBadges';
import BadgeDisplay from './BadgeDisplay';
import { HiBadgeCheck } from 'react-icons/hi';
import { Card } from 'flowbite-react';

/**
 * BadgeList component displays all badges earned by a user
 * @param {string} userId - The user's ID
 */
export default function BadgeList({ userId }) {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBadges = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userBadges = await fetchUserBadges(userId);
        console.log('Fetched user badges:', userBadges);
        setBadges(userBadges);
      } catch (error) {
        console.error('Error loading user badges:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBadges();
  }, [userId]);

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
      <div className="flex flex-wrap justify-center gap-4 sm:gap-6 py-4">
        {badges.map((badge) => (
          <BadgeDisplay key={badge.id} badge={badge} />
        ))}
      </div>
    </Card>
  );
}

