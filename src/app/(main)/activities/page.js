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
 *
 * Dependencies:
 * - `useAuth` hook to manage user authentication and redirect if not logged in.
 * - `subscribeToOpenActivities` utility function to fetch Open activities from the database.
 * - `ActivityCard` component for displaying individual activity details.
 * - `ActivityDetailsModal` component for showing full activity details.
 * - `ActivityFilters` component for filtering activities.
 */

'use client'; // Enable client-side rendering for this page

import { subscribeToOpenActivities } from '@/utils/crudActivities';
import { useEffect, useState, useMemo } from 'react';
import ActivityCard from '@/components/activities/ActivityCard';
import ActivityDetailsModal from '@/components/activities/ActivityDetailsModal';
import ActivityFilters from '@/components/activities/ActivityFilters';
import { Modal, Button, Label, Textarea, Toast, Select, Spinner, Badge } from 'flowbite-react';
import { createApplication, checkExistingApplication } from '@/utils/crudApplications';
import { useAuth } from '@/utils/auth/AuthContext';
import BadgeAnimation from '@/components/badges/BadgeAnimation';
import { HiSearch, HiX, HiCheckCircle, HiExternalLink } from 'react-icons/hi';
import { useDebounce } from '@/hooks/useDebounce';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/utils/theme/ThemeContext';
import { useModal } from '@/utils/modal/useModal';

// Main component to display activities
export default function ActivitiesPage() {
  const t = useTranslations('Activities');
  const { isDark } = useTheme();
  // Destructure `user`, `claims`, and `loading` state from `useAuth` to manage access control
  const { user, claims, loading: authLoading } = useAuth();

  // State variable to store the list of fetched activities
  const [allActivities, setAllActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const [openApplyModal, setOpenApplyModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  
  // Application states
  const [applyMessage, setApplyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationStatuses, setApplicationStatuses] = useState({}); // Map of activityId -> hasApplied
  
  // Toast states
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ type: '', message: '' });
  
  // Badge animation state
  const [showBadgeAnimation, setShowBadgeAnimation] = useState(false);
  const [earnedBadgeId, setEarnedBadgeId] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    country: 'all',
    sdg: 'all',
    skill: 'all',
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Sort state
  const [sortBy, setSortBy] = useState('newest');

  // Subscribe to Open activities only (efficient server-side filtering)
  useEffect(() => {
    let unsubscribe;
    if (user) {
      setLoading(true);
      unsubscribe = subscribeToOpenActivities((updatedActivities) => {
        setAllActivities(updatedActivities);
        setLoading(false);
      });
    }
    // Cleanup subscription when component unmounts or user changes
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  // Check application statuses for all activities
  useEffect(() => {
    if (!user || allActivities.length === 0) return;

    const checkApplicationStatuses = async () => {
      const statusMap = {};
      await Promise.all(
        allActivities.map(async (activity) => {
          try {
            const hasApplied = await checkExistingApplication(activity.id, user.uid);
            statusMap[activity.id] = hasApplied;
          } catch (error) {
            console.error(`Error checking application for activity ${activity.id}:`, error);
            statusMap[activity.id] = false;
          }
        })
      );
      setApplicationStatuses(statusMap);
    };

    checkApplicationStatuses();
  }, [user, allActivities]);

  // Extract available countries, categories, and skills from activities
  const { availableCountries, availableCategories, availableSkills } = useMemo(() => {
    const countries = new Set();
    const categories = new Set();
    const skills = new Set();
    
    allActivities.forEach((activity) => {
      if (activity.country) countries.add(activity.country);
      if (activity.category) categories.add(activity.category);
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
    };
  }, [allActivities]);

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

  // Handle card click - show details modal
  const handleCardClick = (activity) => {
    setSelectedActivityId(activity.id);
    setShowDetailsModal(true);
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
        setSelectedActivity(activity);
        setShowDetailsModal(false);
        setOpenApplyModal(true);
      }
    }
  };

  // Handle apply modal close
  const handleApplyModalClose = () => {
    setOpenApplyModal(false);
    setApplyMessage('');
    setSelectedActivity(null);
  };
  
  // Register apply modal with global modal manager
  const wrappedApplyModalOnClose = useModal(openApplyModal, handleApplyModalClose, 'apply-activity-modal');

  // Handle submit application
  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    if (!selectedActivity || !user) return;
    
    // Check if already applied
    if (applicationStatuses[selectedActivity.id]) {
      setToastMessage({
        type: 'warning',
        message: t('toastAlreadyApplied'),
      });
      setShowToast(true);
      handleApplyModalClose();
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createApplication({
        activityId: selectedActivity.id,
        userId: user.uid,
        userEmail: user.email,
        message: applyMessage,
      });
      
      if (result.success) {
        // Update application status
        setApplicationStatuses((prev) => ({
          ...prev,
          [selectedActivity.id]: true,
        }));
        
        setToastMessage({
          type: 'success',
          message: t('toastApplicationSuccess'),
        });
        setApplyMessage('');
        handleApplyModalClose();
        
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
        setApplicationStatuses((prev) => ({
          ...prev,
          [selectedActivity.id]: true,
        }));
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

  // If there is no authenticated user, return null (no content rendered)
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
        <ActivityFilters
          filters={filters}
          onFiltersChange={setFilters}
          availableCountries={availableCountries}
          availableCategories={availableCategories}
          availableSkills={availableSkills}
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
          <div className="text-sm text-gray-600">
            {t('showing')} <span className="font-semibold">{sortedActivities.length}</span> {t('of')}{' '}
            <span className="font-semibold">{allActivities.length}</span> {t('activities')}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">{t('sortBy')}</label>
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full sm:w-auto">
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
                  onClick={() => setFilters({ ...filters, type: 'all' })}
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
                  onClick={() => setFilters({ ...filters, category: 'all' })}
                  className="ml-1 hover:text-gray-800"
                >
                  <HiX className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.country !== 'all' && (
              <Badge color="blue" className="flex items-center gap-1">
                {t('filterLocation')} {filters.country}
                <button
                  onClick={() => setFilters({ ...filters, country: 'all' })}
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
                  onClick={() => setFilters({ ...filters, sdg: 'all' })}
                  className="ml-1 hover:text-gray-800"
                >
                  <HiX className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.skill !== 'all' && (
              <Badge color="blue" className="flex items-center gap-1">
                {t('filterSkill')} {filters.skill}
                <button
                  onClick={() => setFilters({ ...filters, skill: 'all' })}
                  className="ml-1 hover:text-gray-800"
                >
                  <HiX className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Spinner size="xl" />
          </div>
        )}

        {/* Empty State */}
        {!loading && sortedActivities.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-lg text-gray-600 mb-2">{t('noActivitiesFound')}</p>
            <p className="text-sm text-gray-500">
              {allActivities.length === 0
                ? t('noOpenActivities')
                : t('tryAdjustingFilters')}
            </p>
          </div>
        )}

        {/* Activities Grid */}
        {!loading && sortedActivities.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {sortedActivities.map((activity) => (
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
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedActivityId(null);
          }}
          activityId={selectedActivityId}
          onApply={handleApplyFromDetails}
          hasApplied={selectedActivityId ? applicationStatuses[selectedActivityId] : false}
        />

        {/* Enhanced Apply Modal */}
        <Modal
          show={openApplyModal}
          onClose={wrappedApplyModalOnClose}
          size="2xl"
          className="z-50"
        >
          <Modal.Header>
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-xl font-semibold">{t('applyForActivity')}</h3>
                {selectedActivity && (
                  <p className="text-sm text-gray-500 mt-1">{selectedActivity.title}</p>
                )}
              </div>
            </div>
          </Modal.Header>
          <Modal.Body>
            {selectedActivity && (
              <div className="space-y-6">
                {/* Activity Summary */}
                <div className="bg-gradient-to-r from-semantic-info-50 to-semantic-info-100 dark:from-semantic-info-900 dark:to-semantic-info-800 rounded-lg p-4 border-2 border-semantic-info-200 dark:border-semantic-info-700">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-text-primary dark:text-text-primary mb-2">
                        {selectedActivity.title}
                      </h4>
                      <div className="flex flex-wrap gap-3 text-sm text-text-secondary dark:text-text-secondary">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{t('organization')}</span>
                          <span>{selectedActivity.organization_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{t('xpReward')}</span>
                          <span className="text-primary-600 dark:text-primary-400 font-semibold">
                            {selectedActivity.xp_reward || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description Preview */}
                <div>
                  <Label htmlFor="description" value={t('activityDescription')} className="text-text-primary dark:text-text-primary" />
                  <div className="mt-2 p-3 bg-background-hover dark:bg-background-hover rounded-lg border-2 border-border-light dark:border-[#475569] max-h-32 overflow-y-auto">
                    <p className="text-sm text-text-secondary dark:text-text-secondary line-clamp-4">
                      {selectedActivity.description || t('noDescriptionProvided')}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      wrappedApplyModalOnClose();
                      setSelectedActivityId(selectedActivity.id);
                      setShowDetailsModal(true);
                    }}
                    className="mt-2 text-sm text-semantic-info-600 dark:text-semantic-info-400 hover:text-semantic-info-700 dark:hover:text-semantic-info-300 underline"
                  >
                    {t('viewFullDetails')}
                  </button>
                </div>

                {/* External Platform Link */}
                {(selectedActivity.externalPlatformLink || selectedActivity.activity_url) && (
                  <div className="flex items-center gap-4 p-4 bg-background-hover dark:bg-background-hover rounded-xl border-2 border-border-light dark:border-[#475569] hover:shadow-md transition-all">
                    <div className="bg-semantic-info-100 dark:bg-semantic-info-900 p-3 rounded-full">
                      <HiExternalLink className="h-6 w-6 text-semantic-info-600 dark:text-semantic-info-400 flex-shrink-0" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-text-tertiary dark:text-text-tertiary mb-1 uppercase tracking-wide">{t('externalPlatformLink')}</p>
                      <a
                        href={(selectedActivity.externalPlatformLink || selectedActivity.activity_url).startsWith('http') 
                          ? (selectedActivity.externalPlatformLink || selectedActivity.activity_url) 
                          : `https://${selectedActivity.externalPlatformLink || selectedActivity.activity_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-semantic-info-600 dark:text-semantic-info-400 hover:text-semantic-info-700 dark:hover:text-semantic-info-300 text-sm font-medium break-all hover:underline"
                      >
                        {selectedActivity.externalPlatformLink || selectedActivity.activity_url}
                      </a>
                    </div>
                  </div>
                )}

                {/* Application Message */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <Label htmlFor="message" value={t('whyHelp')} className="text-text-primary dark:text-text-primary" />
                    <span className="text-xs text-text-tertiary dark:text-text-tertiary">
                      {applyMessage.length}/500 {t('characters')}
                    </span>
                  </div>
                  <Textarea
                    id="message"
                    placeholder={t('messagePlaceholder')}
                    required
                    rows={6}
                    maxLength={500}
                    value={applyMessage}
                    onChange={(e) => setApplyMessage(e.target.value)}
                    className="resize-none bg-background-card dark:bg-background-card !text-text-primary dark:!text-text-primary border-border-light dark:border-border-dark placeholder:text-text-tertiary dark:placeholder:text-text-tertiary"
                  />
                  <p className="mt-2 text-xs text-text-tertiary dark:text-text-tertiary">
                    {t('messageTip')}
                  </p>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="bg-background-card dark:bg-background-card border-t-2 border-border-light dark:border-[#475569]">
            <Button
              onClick={handleSubmitApplication}
              disabled={isSubmitting || !applyMessage.trim() || applyMessage.length < 10}
              className="w-full sm:w-auto bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  {t('submitting')}
                </>
              ) : (
                t('submitApplication')
              )}
            </Button>
            <Button
              color="gray"
              onClick={wrappedApplyModalOnClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600"
            >
              {t('cancel')}
            </Button>
          </Modal.Footer>
        </Modal>

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
