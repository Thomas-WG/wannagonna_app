/*
 * Purpose:
 * This file defines the main Activities Page, displaying a list of activities that users can view.
 * It checks if a user is authenticated and then retrieves and displays activity data from Firestore.
 *
 * Key Functionalities:
 * - Ensures only authenticated users can view the activity content.
 * - Fetches only Open activities efficiently from Firestore.
 * - Provides filtering, sorting, and search capabilities.
 * - Shows activity details modal first, then apply modal.
 * - Mobile-friendly and user-friendly interface.
 * - Pagination for large activity lists.
 *
 * Dependencies:
 * - `useAuth` hook to manage user authentication and redirect if not logged in.
 * - `useOpenActivities` hook to fetch Open activities with React Query caching.
 * - `useApplicationStatuses` hook to batch fetch and cache application statuses.
 * - `useActivitiesStore` Zustand store for UI state management.
 * - `ActivityCard` component for displaying individual activity details.
 * - `ActivityDetailsModal` component for showing full activity details.
 * - `ActivityFilters` component for filtering activities.
 * - `ApplyActivityModal` component for submitting applications.
 */

'use client'; // Enable client-side rendering for this page

import { useMemo, useState, useEffect } from 'react';
import ActivityCard from '@/components/activities/ActivityCard';
import ActivityDetailsModal from '@/components/activities/ActivityDetailsModal';
import ActivityFilters from '@/components/activities/ActivityFilters';
import ApplyActivityModal from '@/components/activities/ApplyActivityModal';
import { Toast, Select, Spinner, Badge, Button } from 'flowbite-react';
import { createApplication } from '@/utils/crudApplications';
import { useAuth } from '@/utils/auth/AuthContext';
import BadgeAnimation from '@/components/badges/BadgeAnimation';
import { HiSearch, HiX, HiCheckCircle, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { useDebounce } from '@/hooks/useDebounce';
import { useTranslations, useLocale } from 'next-intl';
import { countries } from 'countries-list';
import { useOpenActivities } from '@/hooks/activities/useOpenActivities';
import { useApplicationStatuses } from '@/hooks/activities/useApplicationStatuses';
import { useActivitiesStore } from '@/stores/activitiesStore';
import { useActivitiesPagination } from '@/hooks/activities/useActivitiesPagination';
import { getSkillsForSelect } from '@/utils/crudSkills';

// Main component to display activities
export default function ActivitiesPage() {
  const t = useTranslations('Activities');
  const locale = useLocale();
  const { user, loading: authLoading } = useAuth();

  // Data hooks
  const { activities: allActivities, isLoading: activitiesLoading } = useOpenActivities();
  const { applicationStatuses, invalidateStatuses } = useApplicationStatuses(user?.uid);

  // Zustand store for UI state
  const {
    showDetailsModal,
    openApplyModal,
    selectedActivityId,
    selectedActivity,
    filters,
    searchQuery,
    sortBy,
    currentPage,
    itemsPerPage,
    setSearchQuery: setStoreSearchQuery,
    setFilters: setStoreFilters,
    updateFilter,
    setSortBy: setStoreSortBy,
    setCurrentPage,
    openDetailsModal,
    openApplyModalWithActivity,
    closeDetailsModal,
    closeApplyModal,
  } = useActivitiesStore();

  // Local state for toast and badge animation
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ type: '', message: '' });
  const [showBadgeAnimation, setShowBadgeAnimation] = useState(false);
  const [earnedBadgeId, setEarnedBadgeId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skillLabelsMap, setSkillLabelsMap] = useState({});

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Helper function to get date from activity start_date
  const getActivityDate = (date) => {
    if (!date) return null;
    if (date.seconds) return new Date(date.seconds * 1000);
    if (date.toDate) return date.toDate();
    if (date instanceof Date) return date;
    return new Date(date);
  };

  // Helper function to apply start date filter
  const applyStartDateFilter = (activities, startDateFilter) => {
    if (startDateFilter === 'all') return activities;

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const thisWeekEnd = new Date(now);
    thisWeekEnd.setDate(thisWeekEnd.getDate() + 7);
    const nextWeekStart = new Date(thisWeekEnd);
    nextWeekStart.setDate(nextWeekStart.getDate() + 1);
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);
    const thisWeekendStart = new Date(now);
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    const daysUntilSaturday = dayOfWeek === 0 ? 6 : 6 - dayOfWeek; // If Sunday, go to next Saturday
    thisWeekendStart.setDate(now.getDate() + daysUntilSaturday);
    const thisWeekendEnd = new Date(thisWeekendStart);
    thisWeekendEnd.setDate(thisWeekendEnd.getDate() + 1); // Include Sunday
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    const thisYearEnd = new Date(now.getFullYear(), 11, 31);
    const nextYearEnd = new Date(now.getFullYear() + 1, 11, 31);

    return activities.filter((activity) => {
      const startDate = getActivityDate(activity.start_date);
      if (!startDate) return false;

      switch (startDateFilter) {
        case 'today':
          return startDate.toDateString() === now.toDateString();
        case 'tomorrow':
          return startDate.toDateString() === tomorrow.toDateString();
        case 'thisWeek':
          return startDate >= now && startDate <= thisWeekEnd;
        case 'thisWeekend':
          return startDate >= thisWeekendStart && startDate <= thisWeekendEnd;
        case 'thisMonth':
          return startDate >= now && startDate <= thisMonthEnd;
        case 'thisYear':
          return startDate >= now && startDate <= thisYearEnd;
        case 'nextWeek':
          return startDate >= nextWeekStart && startDate <= nextWeekEnd;
        case 'nextMonth':
          return startDate >= nextMonthStart && startDate <= nextMonthEnd;
        case 'nextYear':
          return startDate >= new Date(now.getFullYear() + 1, 0, 1) && startDate <= nextYearEnd;
        default:
          return true;
      }
    });
  };

  // Extract available options from activities (for initial filter setup)
  const { availableCountries, availableCategories, availableSkills, availableSDGs } = useMemo(() => {
    const countries = new Set();
    const categories = new Set();
    const skills = new Set();
    const sdgs = new Set();
    
    allActivities.forEach((activity) => {
      if (activity.country) countries.add(activity.country);
      if (activity.category) categories.add(activity.category);
      if (activity.sdg) {
        // SDG can be stored as number or string, normalize to string
        const sdgValue = String(activity.sdg);
        sdgs.add(sdgValue);
      }
      if (activity.skills && Array.isArray(activity.skills)) {
        activity.skills.forEach(skill => {
          if (skill) {
            // Handle both object format {value, label} and string format
            const skillValue = typeof skill === 'object' && skill !== null 
              ? (skill.value || skill.id || skill.label) 
              : skill;
            if (skillValue) skills.add(skillValue);
          }
        });
      }
    });

    return {
      availableCountries: Array.from(countries).sort(),
      availableCategories: Array.from(categories).sort(),
      availableSkills: Array.from(skills).sort(),
      availableSDGs: Array.from(sdgs).sort((a, b) => Number(a) - Number(b)),
    };
  }, [allActivities]);

  // Load skill labels for translation
  useEffect(() => {
    const loadSkillLabels = async () => {
      if (!availableSkills || availableSkills.length === 0) {
        setSkillLabelsMap({});
        return;
      }

      try {
        const skillOptions = await getSkillsForSelect(locale);
        // Create a flat map of all skills for easy lookup
        const allSkills = skillOptions.reduce((acc, group) => {
          return [...acc, ...group.options];
        }, []);

        // Create a mapping from skill ID to label
        const labelsMap = {};
        availableSkills.forEach(skillId => {
          const foundSkill = allSkills.find(s => s.value === skillId);
          if (foundSkill) {
            labelsMap[skillId] = foundSkill.label;
          } else {
            // Fallback to ID if not found
            labelsMap[skillId] = skillId;
          }
        });

        setSkillLabelsMap(labelsMap);
      } catch (error) {
        console.error('Error loading skill labels:', error);
        // Fallback: create map with IDs as labels
        const fallbackMap = {};
        availableSkills.forEach(skillId => {
          fallbackMap[skillId] = skillId;
        });
        setSkillLabelsMap(fallbackMap);
      }
    };

    loadSkillLabels();
  }, [availableSkills, locale]);

  // Calculate available options from filtered list (before category/status filters are applied)
  // This ensures category and status filters only show options that exist in the current filtered results
  const filteredForOptions = useMemo(() => {
    let filtered = [...allActivities];

    // Apply filters that come before category/status in the filter chain
    if (filters.type !== 'all') {
      filtered = filtered.filter((activity) => activity.type === filters.type);
    }
    if (filters.country !== 'all') {
      filtered = filtered.filter((activity) => activity.country === filters.country);
    }
    if (filters.sdg !== 'all') {
      filtered = filtered.filter((activity) => String(activity.sdg) === String(filters.sdg));
    }
    if (filters.skill !== 'all') {
      filtered = filtered.filter((activity) => {
        if (!activity.skills || !Array.isArray(activity.skills)) return false;
        return activity.skills.some(skill => {
          const skillValue = typeof skill === 'object' && skill !== null 
            ? (skill.value || skill.id || skill.label) 
            : skill;
          return skillValue === filters.skill;
        });
      });
    }
    if (filters.startDate !== 'all') {
      filtered = applyStartDateFilter(filtered, filters.startDate);
    }

    return filtered;
  }, [allActivities, filters.type, filters.country, filters.sdg, filters.skill, filters.startDate]);

  // Extract available categories and statuses from the filtered list
  const { availableCategoriesFiltered, availableStatusesFiltered } = useMemo(() => {
    const categories = new Set();
    const statuses = new Set();
    
    filteredForOptions.forEach((activity) => {
      if (activity.category) categories.add(activity.category);
      if (activity.status) statuses.add(activity.status);
    });

    return {
      availableCategoriesFiltered: Array.from(categories).sort(),
      availableStatusesFiltered: Array.from(statuses).sort(),
    };
  }, [filteredForOptions]);

  // Filter and search activities
  const filteredActivities = useMemo(() => {
    let filtered = [...allActivities];

    // Apply filters
    if (filters.type !== 'all') {
      filtered = filtered.filter((activity) => activity.type === filters.type);
    }
    if (filters.category !== 'all') {
      filtered = filtered.filter((activity) => activity.category === filters.category);
    }
    if (filters.country !== 'all') {
      filtered = filtered.filter((activity) => activity.country === filters.country);
    }
    if (filters.sdg !== 'all') {
      filtered = filtered.filter((activity) => String(activity.sdg) === String(filters.sdg));
    }
    if (filters.skill !== 'all') {
      filtered = filtered.filter((activity) => {
        if (!activity.skills || !Array.isArray(activity.skills)) return false;
        return activity.skills.some(skill => {
          // Handle both object format {value, label} and string format
          const skillValue = typeof skill === 'object' && skill !== null 
            ? (skill.value || skill.id || skill.label) 
            : skill;
          return skillValue === filters.skill;
        });
      });
    }
    if (filters.startDate !== 'all') {
      filtered = applyStartDateFilter(filtered, filters.startDate);
    }

    // Apply search
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (activity) =>
          activity.title?.toLowerCase().includes(query) ||
          activity.description?.toLowerCase().includes(query) ||
          activity.organization_name?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allActivities, filters, debouncedSearchQuery]);

  // Sort activities
  const sortedActivities = useMemo(() => {
    const sorted = [...filteredActivities];

    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => {
          const getDate = (date) => {
            if (!date) return new Date(0);
            if (date.seconds) return new Date(date.seconds * 1000);
            if (date.toDate) return date.toDate();
            if (date instanceof Date) return date;
            return new Date(date);
          };
          const dateA = getDate(a.start_date);
          const dateB = getDate(b.start_date);
          return dateB - dateA;
        });
      case 'oldest':
        return sorted.sort((a, b) => {
          const getDate = (date) => {
            if (!date) return new Date(0);
            if (date.seconds) return new Date(date.seconds * 1000);
            if (date.toDate) return date.toDate();
            if (date instanceof Date) return date;
            return new Date(date);
          };
          const dateA = getDate(a.start_date);
          const dateB = getDate(b.start_date);
          return dateA - dateB;
        });
      case 'xp_high':
        return sorted.sort((a, b) => (b.xp_reward || 0) - (a.xp_reward || 0));
      case 'xp_low':
        return sorted.sort((a, b) => (a.xp_reward || 0) - (b.xp_reward || 0));
      case 'applicants_high':
        return sorted.sort((a, b) => (b.applicants || 0) - (a.applicants || 0));
      case 'applicants_low':
        return sorted.sort((a, b) => (a.applicants || 0) - (b.applicants || 0));
      case 'alphabetical':
        return sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      default:
        return sorted;
    }
  }, [filteredActivities, sortBy]);

  // Pagination
  const {
    paginatedActivities,
    totalPages,
    startIndex,
    endIndex,
    hasNextPage,
    hasPreviousPage,
  } = useActivitiesPagination(sortedActivities, currentPage, itemsPerPage);

  // Handle card click - show details modal
  const handleCardClick = (activity) => {
    openDetailsModal(activity.id);
  };

  // Handle Apply Now from details modal
  const handleApplyFromDetails = () => {
    const activity = allActivities.find((a) => a.id === selectedActivityId);
    if (activity) {
      // Check if applications are allowed
      // Don't allow applications for events or local activities with external platform only
      const canApply = activity.type !== 'event' && 
                      !(activity.type === 'local' && activity.acceptApplicationsWG === false);
      
      if (canApply) {
        openApplyModalWithActivity(activity);
      }
    }
  };

  // Handle submit application
  const handleSubmitApplication = async (message) => {
    if (!selectedActivity || !user) return;
    
    // Check if already applied
    if (applicationStatuses[selectedActivity.id]) {
      setToastMessage({
        type: 'warning',
        message: t('toastAlreadyApplied'),
      });
      setShowToast(true);
      closeApplyModal();
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createApplication({
        activityId: selectedActivity.id,
        userId: user.uid,
        userEmail: user.email,
        message: message,
      });
      
      if (result.success) {
        // Invalidate application statuses cache to refetch
        invalidateStatuses();
        
        setToastMessage({
          type: 'success',
          message: t('toastApplicationSuccess'),
        });
        closeApplyModal();
        
        // Show badge animation if a badge was earned
        if (result.badgeDetails) {
          setEarnedBadgeId(result.badgeDetails.id);
          setShowBadgeAnimation(true);
        }
      } else if (result.error === 'existing_application') {
        setToastMessage({
          type: 'warning',
          message: t('toastAlreadyApplied'),
        });
        invalidateStatuses();
      }
    } catch (error) {
      setToastMessage({
        type: 'error',
        message: t('toastApplicationError'),
      });
    } finally {
      setShowToast(true);
      setIsSubmitting(false);
    }
  };

  // Handle view full details from apply modal
  const handleViewFullDetails = () => {
    if (selectedActivity) {
      openDetailsModal(selectedActivity.id);
    }
  };

  // If there is no authenticated user, return null (no content rendered)
  if (!user && !authLoading) return null;

  return (
    <div className="min-h-dvh bg-background-page dark:bg-background-page">
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
              onChange={(e) => setStoreSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setStoreSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-tertiary dark:text-text-tertiary hover:text-text-primary dark:hover:text-text-primary transition-colors duration-200"
              >
                <HiX className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <ActivityFilters
          filters={filters}
          onFiltersChange={setStoreFilters}
          availableCountries={availableCountries}
          availableCategories={availableCategoriesFiltered}
          availableSkills={availableSkills}
          availableSDGs={availableSDGs}
          availableStatuses={availableStatusesFiltered}
        />

        {/* Color Legend */}
        <div className="mb-4 flex items-center justify-center sm:justify-start gap-4 text-xs text-text-secondary dark:text-text-secondary">
          <span className="font-medium">{t('activityTypes')}</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-blue-500 border border-blue-600"></div>
            <span>{t('online')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-green-500 border border-green-600"></div>
            <span>{t('local')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-purple-500 border border-purple-600"></div>
            <span>{t('event')}</span>
          </div>
        </div>

        {/* Sort and Results Count */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="text-sm text-text-secondary dark:text-text-secondary">
            {t('showing')} <span className="font-semibold">{startIndex}-{endIndex}</span> {t('of')}{' '}
            <span className="font-semibold">{sortedActivities.length}</span> {t('activities')}
            {allActivities.length !== sortedActivities.length && (
              <span> ({t('filtered')} {allActivities.length} {t('total')})</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-text-primary dark:text-text-primary">{t('sortBy')}</label>
            <Select value={sortBy} onChange={(e) => setStoreSortBy(e.target.value)} className="w-full sm:w-auto bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border-border-light dark:border-border-dark">
              <option value="newest">{t('sortNewest')}</option>
              <option value="oldest">{t('sortOldest')}</option>
              <option value="xp_high">{t('sortXpHigh')}</option>
              <option value="xp_low">{t('sortXpLow')}</option>
              <option value="applicants_high">{t('sortApplicantsHigh')}</option>
              <option value="applicants_low">{t('sortApplicantsLow')}</option>
              <option value="alphabetical">{t('sortAlphabetical')}</option>
            </Select>
          </div>
        </div>

        {/* Active Filter Badges */}
        {Object.entries(filters).some(([key, value]) => value !== 'all') && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.type !== 'all' && (
              <Badge color="blue" className="flex items-center gap-1">
                {t('filterType')} {filters.type}
                <button
                  onClick={() => updateFilter('type', 'all')}
                  className="ml-1 hover:text-gray-800"
                >
                  <HiX className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.category !== 'all' && (
              <Badge color="blue" className="flex items-center gap-1">
                {t('filterCategory')} {filters.category}
                <button
                  onClick={() => updateFilter('category', 'all')}
                  className="ml-1 hover:text-gray-800"
                >
                  <HiX className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.country !== 'all' && (
              <Badge color="blue" className="flex items-center gap-1">
                {t('filterLocation')} {(() => {
                  const countryData = countries[filters.country];
                  return countryData ? countryData.name : filters.country;
                })()}
                <button
                  onClick={() => updateFilter('country', 'all')}
                  className="ml-1 hover:text-gray-800"
                >
                  <HiX className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.sdg !== 'all' && (
              <Badge color="blue" className="flex items-center gap-1">
                {t('filterSdg')} {filters.sdg}
                <button
                  onClick={() => updateFilter('sdg', 'all')}
                  className="ml-1 hover:text-gray-800"
                >
                  <HiX className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.skill !== 'all' && (
              <Badge color="blue" className="flex items-center gap-1">
                {t('filterSkill')} {skillLabelsMap[filters.skill] || filters.skill}
                <button
                  onClick={() => updateFilter('skill', 'all')}
                  className="ml-1 hover:text-gray-800"
                >
                  <HiX className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.startDate !== 'all' && (
              <Badge color="blue" className="flex items-center gap-1">
                {t('filterStartDate') || 'Start Date'} {t(filters.startDate) || filters.startDate}
                <button
                  onClick={() => updateFilter('startDate', 'all')}
                  className="ml-1 hover:text-gray-800"
                >
                  <HiX className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Loading State */}
        {activitiesLoading && (
          <div className="flex justify-center items-center py-12">
            <Spinner size="xl" />
          </div>
        )}

        {/* Empty State */}
        {!activitiesLoading && sortedActivities.length === 0 && (
          <div className="text-center py-12 bg-background-card dark:bg-background-card rounded-lg shadow-sm">
            <p className="text-lg text-text-secondary dark:text-text-secondary mb-2">{t('noActivitiesFound')}</p>
            <p className="text-sm text-text-tertiary dark:text-text-tertiary">
              {allActivities.length === 0
                ? t('noOpenActivities')
                : t('tryAdjustingFilters')}
            </p>
          </div>
        )}

        {/* Top Pagination Controls */}
        {!activitiesLoading && totalPages > 1 && paginatedActivities.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-6 border-b border-border-light dark:border-border-dark">
            <div className="text-sm text-text-secondary dark:text-text-secondary">
              {t('page')} {currentPage} {t('of')} {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                color="gray"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={!hasPreviousPage}
                className="bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border-border-light dark:border-border-dark"
              >
                <HiChevronLeft className="h-4 w-4 mr-1" />
                {t('previous')}
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      color={currentPage === pageNum ? 'blue' : 'gray'}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={
                        currentPage === pageNum
                          ? 'bg-primary-500 hover:bg-primary-600 text-white'
                          : 'bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border-border-light dark:border-border-dark'
                      }
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                color="gray"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={!hasNextPage}
                className="bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border-border-light dark:border-border-dark"
              >
                {t('next')}
                <HiChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Activities Grid */}
        {!activitiesLoading && paginatedActivities.length > 0 && (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {paginatedActivities.map((activity) => (
              <div key={activity.id} className="relative">
                <ActivityCard
                  id={activity.id}
                  organization_name={activity.organization_name}
                  organization_logo={activity.organization_logo}
                  title={activity.title}
                  type={activity.type}
                  country={activity.country}
                  start_date={activity.start_date}
                  end_date={activity.end_date}
                  sdg={activity.sdg}
                  applicants={activity.applicants}
                  xp_reward={activity.xp_reward}
                  description={activity.description}
                  last_updated={activity.last_updated}
                  city={activity.city}
                  category={activity.category}
                  status={activity.status}
                  qrCodeToken={activity.qrCodeToken}
                  frequency={activity.frequency}
                  skills={activity.skills}
                  participantTarget={activity.participantTarget}
                  acceptApplicationsWG={activity.acceptApplicationsWG}
                  onClick={() => handleCardClick(activity)}
                />
                {/* Applied Badge - Ribbon Style */}
                {applicationStatuses[activity.id] && (
                  <div className="absolute top-0 right-0 z-10">
                    <div className="bg-green-500 text-white px-3 py-1 text-xs font-semibold rounded-bl-lg shadow-md flex items-center gap-1.5">
                      <HiCheckCircle className="h-3.5 w-3.5" />
                      <span>{t('applied')}</span>
                    </div>
                    {/* Ribbon tail effect */}
                    <div className="absolute top-full right-0 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[6px] border-t-green-600"></div>
                  </div>
                )}
              </div>
            ))}
          </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-border-light dark:border-border-dark">
                <div className="text-sm text-text-secondary dark:text-text-secondary">
                  {t('page')} {currentPage} {t('of')} {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    color="gray"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={!hasPreviousPage}
                    className="bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border-border-light dark:border-border-dark"
                  >
                    <HiChevronLeft className="h-4 w-4 mr-1" />
                    {t('previous')}
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          color={currentPage === pageNum ? 'blue' : 'gray'}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className={
                            currentPage === pageNum
                              ? 'bg-primary-500 hover:bg-primary-600 text-white'
                              : 'bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border-border-light dark:border-border-dark'
                          }
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    color="gray"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={!hasNextPage}
                    className="bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border-border-light dark:border-border-dark"
                  >
                    {t('next')}
                    <HiChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Toast Notification */}
        {showToast && (
          <div className="fixed bottom-5 right-5 z-[60]">
            <Toast duration={5000} onClose={() => setShowToast(false)}>
              {toastMessage.type === 'success' && (
                <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-500">
                  ✓
                </div>
              )}
              {toastMessage.type === 'warning' && (
                <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-500">
                  !
                </div>
              )}
              {toastMessage.type === 'error' && (
                <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-500">
                  !
                </div>
              )}
              <div className="ml-3 text-sm font-normal">{toastMessage.message}</div>
              <Toast.Toggle onClose={() => setShowToast(false)} />
            </Toast>
          </div>
        )}

        {/* Activity Details Modal */}
        <ActivityDetailsModal
          isOpen={showDetailsModal}
          onClose={closeDetailsModal}
          activityId={selectedActivityId}
          onApply={handleApplyFromDetails}
          hasApplied={selectedActivityId ? applicationStatuses[selectedActivityId] : false}
        />

        {/* Apply Modal */}
        <ApplyActivityModal
          isOpen={openApplyModal}
          onClose={closeApplyModal}
          activity={selectedActivity}
          onSubmit={handleSubmitApplication}
          isSubmitting={isSubmitting}
          onViewFullDetails={handleViewFullDetails}
        />

        {/* Badge Animation */}
        <BadgeAnimation
          badgeId={earnedBadgeId}
          show={showBadgeAnimation}
          onClose={() => {
            setShowBadgeAnimation(false);
            setEarnedBadgeId(null);
          }}
        />
      </div>
    </div>
  );
}
