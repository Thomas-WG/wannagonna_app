'use client';

/*
 * Purpose:
 * This file defines the Members Page, displaying a list of all app members.
 * It provides filtering, sorting, and search capabilities, and allows users to view member profiles.
 *
 * Key Functionalities:
 * - Fetches members with server-side pagination, filtering, and sorting.
 * - Provides filtering by country (server-side).
 * - Provides sorting by name and join date (server-side).
 * - Provides search functionality for member names (client-side on paginated results).
 * - Shows member details in PublicProfileModal when clicking on a member card.
 * - Mobile-friendly and user-friendly interface.
 * - Uses React Query for caching and performance.
 *
 * Dependencies:
 * - `useAuth` hook to manage user authentication.
 * - `useMembersPaginated` hook for fetching and caching paginated members.
 * - `PublicProfileModal` component for showing member details.
 * - `MemberCardSkeleton` component for loading states.
 * - `MembersPagination` component for pagination controls.
 */

import { useState, useMemo, useEffect } from 'react';
import PublicProfileModal from '@/components/profile/PublicProfileModal';
import { Card, Select, Badge } from 'flowbite-react';
import { useAuth } from '@/utils/auth/AuthContext';
import { HiSearch, HiX, HiBadgeCheck, HiLocationMarker, HiFilter, HiChevronDown, HiChevronUp } from 'react-icons/hi';
import { useDebounce } from '@/hooks/useDebounce';
import { useTranslations } from 'next-intl';
import { countries } from 'countries-list';
import { useMembersPaginated } from '@/hooks/members/useMembersPaginated';
import MemberCardSkeleton from '@/components/members/MemberCardSkeleton';
import MembersPagination from '@/components/members/MembersPagination';
import ProfilePicture from '@/components/common/ProfilePicture';

export default function MembersPage() {
  const t = useTranslations('Members');
  const { user, loading: authLoading } = useAuth();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // State variables
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    country: 'all',
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Sort state
  const [sortBy, setSortBy] = useState('name_az');

  // Reset to page 1 when filters or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortBy]);

  // Fetch paginated members with server-side filtering and sorting
  const {
    members: paginatedMembers,
    totalCount,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    startIndex,
    endIndex,
    isLoading,
    error,
  } = useMembersPaginated(currentPage, pageSize, filters, sortBy);

  // Process member data: calculate level, badge count, format country names
  const processedMembers = useMemo(() => {
    return paginatedMembers.map((member) => {
      const xp = member.xp || 0;
      const level = Math.floor(xp / 100) + 1;
      const badgeCount = Array.isArray(member.badges) ? member.badges.length : 0;
      
      // Convert country code to full name
      let countryName = '';
      if (member.country) {
        const countryData = countries[member.country];
        countryName = countryData ? countryData.name : member.country;
      }

      // Convert createdAt timestamp
      let createdAt = null;
      if (member.createdAt) {
        if (member.createdAt.toDate && typeof member.createdAt.toDate === 'function') {
          createdAt = member.createdAt.toDate();
        } else if (member.createdAt.seconds) {
          createdAt = new Date(member.createdAt.seconds * 1000);
        } else if (member.createdAt instanceof Date) {
          createdAt = member.createdAt;
        }
      }

      return {
        ...member,
        level,
        badgeCount,
        countryName,
        createdAt,
      };
    });
  }, [paginatedMembers]);

  // Apply client-side search filtering (Firestore doesn't support full-text search)
  // This is acceptable for small page sizes (20 items)
  const searchedMembers = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return processedMembers;
    }

    const query = debouncedSearchQuery.toLowerCase();
    return processedMembers.filter((member) => {
      const displayName = member.displayName || '';
      return displayName.toLowerCase().includes(query);
    });
  }, [processedMembers, debouncedSearchQuery]);

  // Extract available countries from all countries list
  // Note: In a production app, you might want to fetch this from the database
  // For now, we'll use a subset of common countries or fetch from member data
  // This is a simplified approach - you may want to fetch unique countries from the database
  const availableCountries = useMemo(() => {
    // Get unique countries from processed members
    // Since we're paginating, we might not have all countries visible
    // For a better UX, consider fetching all unique countries separately
    const countriesSet = new Set();
    processedMembers.forEach((member) => {
      if (member.country) {
        countriesSet.add(member.country);
      }
    });
    return Array.from(countriesSet).sort();
  }, [processedMembers]);

  // Handle member card click
  const handleMemberClick = (memberId) => {
    setSelectedUserId(memberId);
    setProfileModalOpen(true);
  };

  // Handle filter change
  const handleFilterChange = (filterKey, value) => {
    setFilters({
      ...filters,
      [filterKey]: value,
    });
  };

  const clearFilters = () => {
    setFilters({
      country: 'all',
    });
  };

  const hasActiveFilters = filters.country !== 'all';

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If there is no authenticated user, return null
  if (!user && !authLoading) return null;

  return (
    <div className="min-h-screen bg-background-page dark:bg-background-page">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary dark:text-text-primary mb-2">
            {t('title')}
          </h1>
          <p className="text-text-secondary dark:text-text-secondary">
            {t('subtitle')}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-tertiary dark:text-text-tertiary" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-tertiary dark:text-text-tertiary hover:text-text-primary dark:hover:text-text-primary transition-colors duration-200"
              >
                <HiX className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="w-full mb-6">
          {/* Mobile: Collapsible Section */}
          <div className="block md:hidden">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="w-full flex items-center justify-between p-4 bg-background-card dark:bg-background-card rounded-lg shadow-sm border border-border-light dark:border-border-dark hover:bg-background-hover dark:hover:bg-background-hover transition-colors"
            >
              <div className="flex items-center gap-2">
                <HiFilter className="h-5 w-5 text-text-primary dark:text-text-primary" />
                <span className="font-medium text-text-primary dark:text-text-primary">{t('filters')}</span>
                {hasActiveFilters && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-primary-500 dark:bg-primary-600 text-white rounded-full">
                    {t('active')}
                  </span>
                )}
              </div>
              {isFilterOpen ? (
                <HiChevronUp className="h-5 w-5 text-text-primary dark:text-text-primary" />
              ) : (
                <HiChevronDown className="h-5 w-5 text-text-primary dark:text-text-primary" />
              )}
            </button>
            {isFilterOpen && (
              <div className="mt-2 p-4 bg-background-card dark:bg-background-card rounded-lg shadow-sm border border-border-light dark:border-border-dark space-y-4">
                {/* Country Filter */}
                {availableCountries.length > 0 && (
                  <div>
                    <label className="block mb-1 text-sm font-medium text-text-primary dark:text-text-primary">
                      {t('filterCountry')}
                    </label>
                    <Select
                      value={filters.country}
                      onChange={(e) => handleFilterChange('country', e.target.value)}
                      className="w-full bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border-border-light dark:border-border-dark"
                    >
                      <option value="all">{t('allCountries')}</option>
                      {availableCountries.map((countryCode) => {
                        const countryData = countries[countryCode];
                        const countryName = countryData ? countryData.name : countryCode;
                        return (
                          <option key={countryCode} value={countryCode}>
                            {countryName}
                          </option>
                        );
                      })}
                    </Select>
                  </div>
                )}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2 text-sm text-text-primary dark:text-text-primary bg-background-hover dark:bg-background-hover hover:bg-opacity-80 dark:hover:bg-opacity-80 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <HiX className="h-4 w-4" />
                    {t('clearAllFilters')}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Desktop: Horizontal Layout */}
          <div className="hidden md:flex flex-wrap items-end gap-4 p-4 bg-background-card dark:bg-background-card rounded-lg shadow-sm border border-border-light dark:border-border-dark">
            {availableCountries.length > 0 && (
              <div className="flex-1 min-w-[150px]">
                <label className="block mb-1 text-sm font-medium text-text-primary dark:text-text-primary">
                  {t('filterCountry')}
                </label>
                <Select
                  value={filters.country}
                  onChange={(e) => handleFilterChange('country', e.target.value)}
                  className="w-full bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border-border-light dark:border-border-dark"
                >
                  <option value="all">{t('allCountries')}</option>
                  {availableCountries.map((countryCode) => {
                    const countryData = countries[countryCode];
                    const countryName = countryData ? countryData.name : countryCode;
                    return (
                      <option key={countryCode} value={countryCode}>
                        {countryName}
                      </option>
                    );
                  })}
                </Select>
              </div>
            )}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-text-primary dark:text-text-primary bg-background-hover dark:bg-background-hover hover:bg-opacity-80 dark:hover:bg-opacity-80 rounded-lg transition-colors flex items-center gap-2"
              >
                <HiX className="h-4 w-4" />
                {t('clearAll')}
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.country !== 'all' && (
              <Badge color="blue" className="flex items-center gap-1">
                {(() => {
                  const countryData = countries[filters.country];
                  return countryData ? countryData.name : filters.country;
                })()}
                <button
                  onClick={() => setFilters({ ...filters, country: 'all' })}
                  className="ml-1 hover:text-text-primary dark:hover:text-text-primary transition-colors"
                >
                  <HiX className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Sort and Results Count */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="text-sm text-text-secondary dark:text-text-secondary">
            {isLoading ? (
              <span>{t('loading')}...</span>
            ) : (
              <>
                {t('showing')} <span className="font-semibold">{startIndex}</span>-<span className="font-semibold">{endIndex}</span> {t('of')}{' '}
                <span className="font-semibold">{totalCount}</span> {t('members')}
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-text-primary dark:text-text-primary">{t('sortBy')}</label>
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full sm:w-auto bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border-border-light dark:border-border-dark">
              <option value="name_az">{t('sortNameAZ')}</option>
              <option value="name_za">{t('sortNameZA')}</option>
              <option value="joined_newest">{t('sortJoinedNewest')}</option>
              <option value="joined_oldest">{t('sortJoinedOldest')}</option>
            </Select>
          </div>
        </div>

        {/* Top Pagination Controls */}
        {!isLoading && totalPages > 1 && searchedMembers.length > 0 && (
          <MembersPagination
            currentPage={currentPage}
            totalPages={totalPages}
            hasNextPage={hasNextPage}
            hasPreviousPage={hasPreviousPage}
            onPageChange={handlePageChange}
            variant="top"
          />
        )}

        {/* Loading State - Show Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
            {Array.from({ length: pageSize }).map((_, index) => (
              <MemberCardSkeleton key={index} />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-12 bg-background-card dark:bg-background-card rounded-lg shadow-sm border border-border-light dark:border-border-dark">
            <p className="text-lg text-text-secondary dark:text-text-secondary mb-2">{t('errorLoadingMembers') || 'Error loading members'}</p>
            <p className="text-sm text-text-tertiary dark:text-text-tertiary">
              {error.message || 'Please try again later'}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && searchedMembers.length === 0 && (
          <div className="text-center py-12 bg-background-card dark:bg-background-card rounded-lg shadow-sm border border-border-light dark:border-border-dark">
            <p className="text-lg text-text-secondary dark:text-text-secondary mb-2">{t('noMembersFound')}</p>
            <p className="text-sm text-text-tertiary dark:text-text-tertiary">
              {totalCount === 0
                ? t('noMembers')
                : t('tryAdjustingFilters')}
            </p>
          </div>
        )}

        {/* Members Grid */}
        {!isLoading && !error && searchedMembers.length > 0 && (
          <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
            {searchedMembers.map((member) => (
              <Card
                key={member.id}
                onClick={() => handleMemberClick(member.id)}
                className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 transform"
              >
                {/* Mobile: Horizontal Layout */}
                <div className="flex md:hidden items-center gap-3">
                  {/* Profile Picture - Left */}
                  <div className="flex-shrink-0">
                    <ProfilePicture
                      src={member.profilePicture}
                      alt={member.displayName || 'Member'}
                      size={48}
                      showInitials={true}
                      name={member.displayName || 'Member'}
                      loading="lazy"
                    />
                  </div>

                  {/* Middle: Name + Country */}
                  <div className="flex-1 min-w-0">
                    {/* Display Name */}
                    <h3 className="text-base font-semibold text-text-primary dark:text-text-primary mb-1 line-clamp-1">
                      {member.displayName || 'Anonymous'}
                    </h3>

                    {/* Country */}
                    {member.countryName && (
                      <div className="flex items-center gap-1.5">
                        <HiLocationMarker className="w-3.5 h-3.5 text-text-tertiary dark:text-text-tertiary flex-shrink-0" />
                        <span className="text-xs text-text-secondary dark:text-text-secondary truncate">
                          {member.countryName}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right Side: Level + Badges */}
                  <div className="flex-shrink-0 flex flex-col items-end gap-2">
                    {/* Level in Circle */}
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-semantic-info-100 dark:bg-semantic-info-900 flex items-center justify-center border-2 border-semantic-info-500 dark:border-semantic-info-400">
                        <span className="text-sm font-bold text-semantic-info-700 dark:text-semantic-info-300">
                          {member.level}
                        </span>
                      </div>
                      <span className="text-xs text-text-tertiary dark:text-text-tertiary mt-0.5">{t('level')}</span>
                    </div>

                    {/* Badge Count */}
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1">
                        <HiBadgeCheck className="w-4 h-4 text-activityType-event-500 dark:text-activityType-event-400" />
                        <span className="text-sm font-semibold text-text-primary dark:text-text-primary">
                          {member.badgeCount}
                        </span>
                      </div>
                      <span className="text-xs text-text-tertiary dark:text-text-tertiary">{t('badges')}</span>
                    </div>
                  </div>
                </div>

                {/* Desktop: Horizontal Layout */}
                <div className="hidden md:flex items-center gap-4">
                  {/* Profile Picture - Left */}
                  <div className="flex-shrink-0">
                    <ProfilePicture
                      src={member.profilePicture}
                      alt={member.displayName || 'Member'}
                      size={48}
                      showInitials={true}
                      name={member.displayName || 'Member'}
                      loading="lazy"
                    />
                  </div>

                  {/* Middle: Name + Country */}
                  <div className="flex-1 min-w-0">
                    {/* Display Name */}
                    <h3 className="text-xl font-semibold text-text-primary dark:text-text-primary mb-1.5 line-clamp-1">
                      {member.displayName || 'Anonymous'}
                    </h3>

                    {/* Country */}
                    {member.countryName && (
                      <div className="flex items-center gap-1.5">
                        <HiLocationMarker className="w-4 h-4 text-text-tertiary dark:text-text-tertiary flex-shrink-0" />
                        <span className="text-sm text-text-secondary dark:text-text-secondary truncate">
                          {member.countryName}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right Side: Level + Badges */}
                  <div className="flex-shrink-0 flex flex-col items-end gap-2">
                    {/* Level in Circle */}
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-semantic-info-100 dark:bg-semantic-info-900 flex items-center justify-center border-2 border-semantic-info-500 dark:border-semantic-info-400">
                        <span className="text-base font-bold text-semantic-info-700 dark:text-semantic-info-300">
                          {member.level}
                        </span>
                      </div>
                      <span className="text-xs text-text-tertiary dark:text-text-tertiary mt-0.5">{t('level')}</span>
                    </div>

                    {/* Badge Count */}
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1">
                        <HiBadgeCheck className="w-5 h-5 text-activityType-event-500 dark:text-activityType-event-400" />
                        <span className="text-base font-semibold text-text-primary dark:text-text-primary">
                          {member.badgeCount}
                        </span>
                        {t('badges')}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <MembersPagination
              currentPage={currentPage}
              totalPages={totalPages}
              hasNextPage={hasNextPage}
              hasPreviousPage={hasPreviousPage}
              onPageChange={handlePageChange}
            />
          )}
          </>
        )}

        {/* Public Profile Modal */}
        <PublicProfileModal
          isOpen={profileModalOpen}
          onClose={() => {
            setProfileModalOpen(false);
            setSelectedUserId(null);
          }}
          userId={selectedUserId}
          isOwnProfile={selectedUserId === user?.uid}
        />
      </div>
    </div>
  );
}

