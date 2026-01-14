'use client';

import { Card } from 'flowbite-react';

/**
 * Skeleton loading component for member cards
 * Matches the layout of the actual member card (mobile and desktop)
 */
export default function MemberCardSkeleton() {
  return (
    <Card className="animate-pulse">
      {/* Mobile: Horizontal Layout */}
      <div className="flex md:hidden items-center gap-3">
        {/* Profile Picture - Left */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Middle: Name + Country */}
        <div className="flex-1 min-w-0">
          {/* Display Name */}
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4" />

          {/* Country */}
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>

        {/* Right Side: Level + Badges */}
        <div className="flex-shrink-0 flex flex-col items-end gap-2">
          {/* Level in Circle */}
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-8 mt-1" />
          </div>

          {/* Badge Count */}
          <div className="flex flex-col items-center">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-6" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-10 mt-1" />
          </div>
        </div>
      </div>

      {/* Desktop: Horizontal Layout */}
      <div className="hidden md:flex items-center gap-4">
        {/* Profile Picture - Left */}
        <div className="flex-shrink-0">
          <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Middle: Name + Country */}
        <div className="flex-1 min-w-0">
          {/* Display Name */}
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-2/3" />

          {/* Country */}
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        </div>

        {/* Right Side: Level + Badges */}
        <div className="flex-shrink-0 flex flex-col items-end gap-2">
          {/* Level in Circle */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-8 mt-1" />
          </div>

          {/* Badge Count */}
          <div className="flex flex-col items-center">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-8" />
          </div>
        </div>
      </div>
    </Card>
  );
}

