'use client';

/*
 * Purpose:
 * This file defines the Members Page, displaying a list of all app members.
 * It provides filtering, sorting, and search capabilities, and allows users to view member profiles.
 *
 * Key Functionalities:
 * - Fetches all members from Firestore.
 * - Provides filtering by country.
 * - Provides sorting by name and join date.
 * - Provides search functionality for member names.
 * - Shows member details in PublicProfileModal when clicking on a member card.
 * - Mobile-friendly and user-friendly interface.
 *
 * Dependencies:
 * - `useAuth` hook to manage user authentication.
 * - `fetchMembers` utility function to fetch members from the database.
 * - `PublicProfileModal` component for showing member details.
 */

import { fetchMembers } from '@/utils/crudMemberProfile';
import { useEffect, useState, useMemo } from 'react';
import PublicProfileModal from '@/components/profile/PublicProfileModal';
import { Card, Avatar, Select, Spinner, Badge } from 'flowbite-react';
import { useAuth } from '@/utils/auth/AuthContext';
import { HiSearch, HiX, HiBadgeCheck, HiLocationMarker, HiFilter, HiChevronDown, HiChevronUp } from 'react-icons/hi';
import { useDebounce } from '@/hooks/useDebounce';
import { useTranslations } from 'next-intl';
import { countries } from 'countries-list';

export default function MembersPage() {
  const t = useTranslations('Members');
  const { user, loading: authLoading } = useAuth();

  // State variables
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
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

  // Fetch all members
  useEffect(() => {
    const loadMembers = async () => {
      if (user) {
        setLoading(true);
        try {
          const members = await fetchMembers();
          setAllMembers(members || []);
        } catch (error) {
          console.error('Error fetching members:', error);
          setAllMembers([]);
        } finally {
          setLoading(false);
        }
      }
    };

    loadMembers();
  }, [user]);

  // Process member data: calculate level, badge count, format country names
  const processedMembers = useMemo(() => {
    return allMembers.map((member) => {
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
  }, [allMembers]);

  // Extract available countries from members
  const availableCountries = useMemo(() => {
    const countriesSet = new Set();
    processedMembers.forEach((member) => {
      if (member.country) {
        countriesSet.add(member.country);
      }
    });
    return Array.from(countriesSet).sort();
  }, [processedMembers]);

  // Filter members
  const filteredMembers = useMemo(() => {
    let filtered = [...processedMembers];

    // Apply country filter
    if (filters.country !== 'all') {
      filtered = filtered.filter((member) => member.country === filters.country);
    }

    // Apply search
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter((member) => {
        const displayName = member.displayName || '';
        return displayName.toLowerCase().includes(query);
      });
    }

    return filtered;
  }, [processedMembers, filters, debouncedSearchQuery]);

  // Sort members
  const sortedMembers = useMemo(() => {
    const sorted = [...filteredMembers];

    switch (sortBy) {
      case 'name_az':
        return sorted.sort((a, b) => {
          const nameA = (a.displayName || '').toLowerCase();
          const nameB = (b.displayName || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
      case 'name_za':
        return sorted.sort((a, b) => {
          const nameA = (a.displayName || '').toLowerCase();
          const nameB = (b.displayName || '').toLowerCase();
          return nameB.localeCompare(nameA);
        });
      case 'joined_newest':
        return sorted.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
      case 'joined_oldest':
        return sorted.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateA - dateB;
        });
      default:
        return sorted;
    }
  }, [filteredMembers, sortBy]);

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

  // If there is no authenticated user, return null
  if (!user && !authLoading) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {t('title')}
          </h1>
          <p className="text-gray-600">
            {t('subtitle')}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
              className="w-full flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <HiFilter className="h-5 w-5" />
                <span className="font-medium">{t('filters')}</span>
                {hasActiveFilters && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                    {t('active')}
                  </span>
                )}
              </div>
              {isFilterOpen ? (
                <HiChevronUp className="h-5 w-5" />
              ) : (
                <HiChevronDown className="h-5 w-5" />
              )}
            </button>
            {isFilterOpen && (
              <div className="mt-2 p-4 bg-white rounded-lg shadow-sm border border-gray-200 space-y-4">
                {/* Country Filter */}
                {availableCountries.length > 0 && (
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      {t('filterCountry')}
                    </label>
                    <Select
                      value={filters.country}
                      onChange={(e) => handleFilterChange('country', e.target.value)}
                      className="w-full"
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
                    className="w-full px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <HiX className="h-4 w-4" />
                    {t('clearAllFilters')}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Desktop: Horizontal Layout */}
          <div className="hidden md:flex flex-wrap items-end gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
            {availableCountries.length > 0 && (
              <div className="flex-1 min-w-[150px]">
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  {t('filterCountry')}
                </label>
                <Select
                  value={filters.country}
                  onChange={(e) => handleFilterChange('country', e.target.value)}
                  className="w-full"
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
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
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
                  className="ml-1 hover:text-gray-800"
                >
                  <HiX className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Sort and Results Count */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="text-sm text-gray-600">
            {t('showing')} <span className="font-semibold">{sortedMembers.length}</span> {t('of')}{' '}
            <span className="font-semibold">{allMembers.length}</span> {t('members')}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">{t('sortBy')}</label>
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full sm:w-auto">
              <option value="name_az">{t('sortNameAZ')}</option>
              <option value="name_za">{t('sortNameZA')}</option>
              <option value="joined_newest">{t('sortJoinedNewest')}</option>
              <option value="joined_oldest">{t('sortJoinedOldest')}</option>
            </Select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Spinner size="xl" />
          </div>
        )}

        {/* Empty State */}
        {!loading && sortedMembers.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-lg text-gray-600 mb-2">{t('noMembersFound')}</p>
            <p className="text-sm text-gray-500">
              {allMembers.length === 0
                ? t('noMembers')
                : t('tryAdjustingFilters')}
            </p>
          </div>
        )}

        {/* Members Grid */}
        {!loading && sortedMembers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
            {sortedMembers.map((member) => (
              <Card
                key={member.id}
                onClick={() => handleMemberClick(member.id)}
                className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 transform"
              >
                {/* Mobile: Horizontal Layout */}
                <div className="flex md:hidden items-center gap-3">
                  {/* Profile Picture - Left */}
                  <div className="flex-shrink-0">
                    <Avatar
                      img={member.profilePicture || '/favicon.ico'}
                      alt={member.displayName || 'Member'}
                      size="lg"
                      rounded
                    />
                  </div>

                  {/* Middle: Name + Country */}
                  <div className="flex-1 min-w-0">
                    {/* Display Name */}
                    <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-1">
                      {member.displayName || 'Anonymous'}
                    </h3>

                    {/* Country */}
                    {member.countryName && (
                      <div className="flex items-center gap-1.5">
                        <HiLocationMarker className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-600 truncate">
                          {member.countryName}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right Side: Level + Badges */}
                  <div className="flex-shrink-0 flex flex-col items-end gap-2">
                    {/* Level in Circle */}
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-500">
                        <span className="text-sm font-bold text-blue-700">
                          {member.level}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 mt-0.5">{t('level')}</span>
                    </div>

                    {/* Badge Count */}
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1">
                        <HiBadgeCheck className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-semibold text-gray-700">
                          {member.badgeCount}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">{t('badges')}</span>
                    </div>
                  </div>
                </div>

                {/* Desktop: Horizontal Layout */}
                <div className="hidden md:flex items-center gap-4">
                  {/* Profile Picture - Left */}
                  <div className="flex-shrink-0">
                    <Avatar
                      img={member.profilePicture || '/favicon.ico'}
                      alt={member.displayName || 'Member'}
                      size="lg"
                      rounded
                    />
                  </div>

                  {/* Middle: Name + Country */}
                  <div className="flex-1 min-w-0">
                    {/* Display Name */}
                    <h3 className="text-xl font-semibold text-gray-900 mb-1.5 line-clamp-1">
                      {member.displayName || 'Anonymous'}
                    </h3>

                    {/* Country */}
                    {member.countryName && (
                      <div className="flex items-center gap-1.5">
                        <HiLocationMarker className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-600 truncate">
                          {member.countryName}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right Side: Level + Badges */}
                  <div className="flex-shrink-0 flex flex-col items-end gap-2">
                    {/* Level in Circle */}
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-500">
                        <span className="text-base font-bold text-blue-700">
                          {member.level}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 mt-0.5">{t('level')}</span>
                    </div>

                    {/* Badge Count */}
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1">
                        <HiBadgeCheck className="w-5 h-5 text-purple-600" />
                        <span className="text-base font-semibold text-gray-700">
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

