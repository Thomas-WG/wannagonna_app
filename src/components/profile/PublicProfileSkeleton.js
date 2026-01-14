'use client';

/**
 * Skeleton loading component for public profile modal
 * Matches the layout of the actual profile modal (mobile and desktop)
 */
export default function PublicProfileSkeleton() {
  return (
    <div className="space-y-4 md:space-y-6 w-full max-w-full overflow-x-hidden animate-pulse">
      {/* Header Section Skeleton */}
      <div className="flex flex-col gap-4 pb-4 md:pb-6 border-b-2 border-border-light dark:border-[#475569] w-full">
        <div className="w-full bg-background-hover dark:bg-background-hover rounded-lg p-3 md:p-4 border-2 border-border-light dark:border-[#475569] shadow-sm">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Profile Picture Skeleton */}
            <div className="relative flex-shrink-0">
              <div className="w-[70px] h-[70px] md:w-[90px] md:h-[90px] rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>
            
            {/* Name + Country Skeleton */}
            <div className="flex-1 min-w-0">
              <div className="h-5 md:h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1 w-1/2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            </div>
            
            {/* Level + XP Skeleton */}
            <div className="flex-shrink-0 flex flex-col items-end gap-2 md:gap-3">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-8 mt-1" />
              </div>
              <div className="flex flex-col items-center">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-6 mt-1" />
              </div>
            </div>
          </div>
          
          {/* XP Progress Bar Skeleton */}
          <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t-2 border-border-light dark:border-[#475569]">
            <div className="flex justify-between mb-1 md:mb-1.5">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            </div>
            <div className="h-2 md:h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          </div>
        </div>
      </div>

      {/* Content Layout Skeleton */}
      <div className="flex flex-col lg:flex-row gap-6 w-full">
        {/* Mobile: About and Availability Skeleton */}
        <div className="flex flex-col lg:hidden space-y-6 order-1">
          {/* About Section Skeleton */}
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            </div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16" />
              ))}
            </div>
          </div>

          {/* Skills & Availability Section Skeleton */}
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40" />
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Left Sidebar Skeleton - Badges and Connect */}
        <div className="lg:w-80 lg:flex-shrink-0 space-y-6 order-2 lg:order-1">
          {/* Badges Section Skeleton */}
          <div className="bg-background-hover dark:bg-background-hover rounded-lg p-4 border border-border-light dark:border-border-dark">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-3" />
            <div className="grid grid-cols-3 gap-2 justify-items-center">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="w-full max-w-[70px] aspect-square bg-gray-200 dark:bg-gray-700 rounded" />
              ))}
            </div>
          </div>

          {/* Connect Section Skeleton */}
          <div className="bg-background-hover dark:bg-background-hover rounded-lg p-4 border border-border-light dark:border-border-dark">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area Skeleton - Desktop Only */}
        <div className="hidden lg:flex flex-1 space-y-6 min-w-0 order-2">
          {/* About Section Skeleton */}
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            </div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20" />
              ))}
            </div>
          </div>

          {/* Skills & Availability Section Skeleton */}
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40" />
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Completed Activities Section Skeleton */}
      <div className="space-y-3 pt-6 border-t border-border-light dark:border-border-dark">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48 mx-auto" />
        <div className="space-y-2 max-w-xl mx-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 border-2 border-border-light dark:border-[#475569] rounded-lg">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
