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
import { HiSearch, HiX, HiCheckCircle } from 'react-icons/hi';
import { useDebounce } from '@/hooks/useDebounce';

// Main component to display activities
export default function ActivitiesPage() {
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
          if (skill) skills.add(skill);
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
      filtered = filtered.filter((activity) => 
        activity.skills && Array.isArray(activity.skills) && activity.skills.includes(filters.skill)
      );
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
      setSelectedActivity(activity);
      setShowDetailsModal(false);
      setOpenApplyModal(true);
    }
  };

  // Handle apply modal close
  const handleApplyModalClose = () => {
    setOpenApplyModal(false);
    setApplyMessage('');
    setSelectedActivity(null);
  };

  // Handle submit application
  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    if (!selectedActivity || !user) return;
    
    // Check if already applied
    if (applicationStatuses[selectedActivity.id]) {
      setToastMessage({
        type: 'warning',
        message: 'You have already applied for this activity. Check your profile for the application status.',
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
          message: 'Your application has been successfully submitted!',
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
          message: 'You have already applied for this activity. Check your profile for the application status.',
        });
        setApplicationStatuses((prev) => ({
          ...prev,
          [selectedActivity.id]: true,
        }));
      }
    } catch (error) {
      setToastMessage({
        type: 'error',
        message: 'An error occurred while submitting your application. Please try again.',
      });
    } finally {
      setShowToast(true);
      setIsSubmitting(false);
    }
  };

  // If there is no authenticated user, return null (no content rendered)
  if (!user && !authLoading) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Available Activities
          </h1>
          <p className="text-gray-600">
            Discover opportunities to make a difference
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search activities by title, description, or organization..."
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
        <ActivityFilters
          filters={filters}
          onFiltersChange={setFilters}
          availableCountries={availableCountries}
          availableCategories={availableCategories}
          availableSkills={availableSkills}
        />

        {/* Color Legend */}
        <div className="mb-4 flex items-center justify-center sm:justify-start gap-4 text-xs text-gray-600">
          <span className="font-medium">Activity types:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-blue-500 border border-blue-600"></div>
            <span>Online</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-green-500 border border-green-600"></div>
            <span>Local</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-purple-500 border border-purple-600"></div>
            <span>Event</span>
          </div>
        </div>

        {/* Sort and Results Count */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">{sortedActivities.length}</span> of{' '}
            <span className="font-semibold">{allActivities.length}</span> activities
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full sm:w-auto">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="xp_high">Highest XP Reward</option>
              <option value="xp_low">Lowest XP Reward</option>
              <option value="applicants_high">Most Applicants</option>
              <option value="applicants_low">Least Applicants</option>
              <option value="alphabetical">Alphabetical (A-Z)</option>
            </Select>
          </div>
        </div>

        {/* Active Filter Badges */}
        {Object.entries(filters).some(([key, value]) => value !== 'all') && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.type !== 'all' && (
              <Badge color="blue" className="flex items-center gap-1">
                Type: {filters.type}
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
                Category: {filters.category}
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
                Location: {filters.country}
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
                SDG: {filters.sdg}
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
                Skill: {filters.skill}
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
            <p className="text-lg text-gray-600 mb-2">No activities found</p>
            <p className="text-sm text-gray-500">
              {allActivities.length === 0
                ? 'There are no open activities at the moment. Check back later!'
                : 'Try adjusting your filters or search query.'}
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
                  city={activity.city}
                  category={activity.category}
                  status={activity.status}
                  qrCodeToken={activity.qrCodeToken}
                  frequency={activity.frequency}
                  skills={activity.skills}
                  onClick={() => handleCardClick(activity)}
                />
                {/* Applied Badge - Ribbon Style */}
                {applicationStatuses[activity.id] && (
                  <div className="absolute top-0 right-0 z-10">
                    <div className="bg-green-500 text-white px-3 py-1 text-xs font-semibold rounded-bl-lg shadow-md flex items-center gap-1.5">
                      <HiCheckCircle className="h-3.5 w-3.5" />
                      <span>Applied</span>
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
          onClose={handleApplyModalClose}
          size="2xl"
          className="z-50"
        >
          <Modal.Header>
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-xl font-semibold">Apply for Activity</h3>
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
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {selectedActivity.title}
                      </h4>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Organization:</span>
                          <span>{selectedActivity.organization_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">XP Reward:</span>
                          <span className="text-indigo-600 font-semibold">
                            {selectedActivity.xp_reward || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description Preview */}
                <div>
                  <Label htmlFor="description" value="Activity Description" />
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 max-h-32 overflow-y-auto">
                    <p className="text-sm text-gray-700 line-clamp-4">
                      {selectedActivity.description || 'No description provided.'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      handleApplyModalClose();
                      setSelectedActivityId(selectedActivity.id);
                      setShowDetailsModal(true);
                    }}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    View full details
                  </button>
                </div>

                {/* Application Message */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <Label htmlFor="message" value="Why do you want to help? *" />
                    <span className="text-xs text-gray-500">
                      {applyMessage.length}/500 characters
                    </span>
                  </div>
                  <Textarea
                    id="message"
                    placeholder="Tell us why you're interested in this activity and what skills or experience you can bring..."
                    required
                    rows={6}
                    maxLength={500}
                    value={applyMessage}
                    onChange={(e) => setApplyMessage(e.target.value)}
                    className="resize-none"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Tip: Be specific about your interest and relevant experience. This helps organizations understand your motivation.
                  </p>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              onClick={handleSubmitApplication}
              disabled={isSubmitting || !applyMessage.trim() || applyMessage.length < 10}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
            <Button
              color="gray"
              onClick={handleApplyModalClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
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
