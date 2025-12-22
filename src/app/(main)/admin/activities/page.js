'use client';

import { Card, Toast, Select } from "flowbite-react";
import { HiUsers, HiOfficeBuilding, HiCalendar, HiDocumentText, HiPencil, HiTrash, HiEye, HiUserGroup, HiViewGrid, HiLockClosed, HiQrcode, HiDuplicate } from "react-icons/hi";
import { MdOutlineSocialDistance } from "react-icons/md";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { fetchActivities, deleteActivity, updateActivityStatus } from "@/utils/crudActivities";
import { fetchOrganizations } from "@/utils/crudOrganizations";
import { useTranslations } from "next-intl";
import { useTheme } from '@/utils/theme/ThemeContext';
import ActivityCard from "@/components/activities/ActivityCard";
import DeleteActivityModal from "@/components/activities/DeleteActivityModal";
import ReviewApplicationsModal from "@/components/activities/ReviewApplicationsModal";
import ActivityDetailsModal from "@/components/activities/ActivityDetailsModal";
import StatusUpdateModal from "@/components/activities/StatusUpdateModal";
import QRCodeModal from "@/components/activities/QRCodeModal";
import ActivityValidationModal from "@/components/activities/ActivityValidationModal";
import ParticipantListModal from "@/components/activities/ParticipantListModal";
import ActivityFilters from "@/components/activities/ActivityFilters";
import categories from "@/constant/categories";

export default function AdminActivitiesPage() {
  const t = useTranslations('Admin');
  const tActivities = useTranslations('Activities');
  const { isDark } = useTheme();
  const router = useRouter();
  
  const [allActivities, setAllActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showActivityDetailsModal, setShowActivityDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ type: '', message: '' });

  // Filter states
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    country: 'all',
    sdg: 'all',
    skill: 'all',
    status: 'all',
    organization: 'all'
  });

  // Sort state
  const [sortBy, setSortBy] = useState('newest');

  // Fetch all activities (no organization filter)
  useEffect(() => {
    const fetchAllActivities = async () => {
      try {
        setLoadingActivities(true);
        const results = await fetchActivities();
        setAllActivities(results || []);
      } catch (error) {
        console.error("Error fetching activities:", error);
        setAllActivities([]);
      } finally {
        setLoadingActivities(false);
      }
    };
    fetchAllActivities();
  }, []);

  // Fetch all organizations
  useEffect(() => {
    const fetchAllOrganizations = async () => {
      try {
        const results = await fetchOrganizations();
        setOrganizations(results || []);
      } catch (error) {
        console.error("Error fetching organizations:", error);
        setOrganizations([]);
      }
    };
    fetchAllOrganizations();
  }, []);

  // Extract available categories, countries, skills, organizations from activities
  const availableCategories = useMemo(() => {
    const cats = new Set();
    allActivities.forEach((activity) => {
      if (activity.category) cats.add(activity.category);
    });
    return Array.from(cats).sort();
  }, [allActivities]);

  const availableCountries = useMemo(() => {
    const countries = new Set();
    allActivities.forEach((activity) => {
      if (activity.country) countries.add(activity.country);
    });
    return Array.from(countries).sort();
  }, [allActivities]);

  const availableSkills = useMemo(() => {
    const skills = new Set();
    allActivities.forEach((activity) => {
      if (activity.skills && Array.isArray(activity.skills)) {
        activity.skills.forEach(skill => {
          if (skill) {
            // Handle both object format {value, label, category} and string format
            const skillValue = typeof skill === 'object' && skill !== null 
              ? (skill.value || skill.id || skill.label) 
              : skill;
            if (skillValue) skills.add(skillValue);
          }
        });
      }
    });
    return Array.from(skills).sort();
  }, [allActivities]);

  const availableOrganizations = useMemo(() => {
    const orgMap = new Map();
    allActivities.forEach((activity) => {
      if (activity.organizationId) {
        // Find organization name from fetched organizations or use activity's organization_name
        const org = organizations.find(o => o.id === activity.organizationId);
        const orgName = org?.name || activity.organization_name || activity.organizationId;
        orgMap.set(activity.organizationId, {
          id: activity.organizationId,
          name: orgName
        });
      }
    });
    // Return array of organization objects sorted by name
    return Array.from(orgMap.values()).sort((a, b) => 
      (a.name || '').localeCompare(b.name || '')
    );
  }, [allActivities, organizations]);

  // Filter activities based on filters
  const filteredActivities = useMemo(() => {
    return allActivities.filter((activity) => {
      if (filters.type !== 'all' && activity.type !== filters.type) return false;
      if (filters.category !== 'all' && activity.category !== filters.category) return false;
      if (filters.country !== 'all' && activity.country !== filters.country) return false;
      if (filters.sdg !== 'all' && activity.sdg !== filters.sdg) return false;
      if (filters.status !== 'all' && activity.status !== filters.status) return false;
      if (filters.organization !== 'all') {
        const orgMatch = activity.organizationId === filters.organization || 
                        activity.organization_name === filters.organization;
        if (!orgMatch) return false;
      }
      if (filters.skill !== 'all') {
        if (!activity.skills || !Array.isArray(activity.skills)) {
          return false;
        }
        // Check if the skill matches (handle both object and string formats)
        const skillMatches = activity.skills.some(skill => {
          const skillValue = typeof skill === 'object' && skill !== null 
            ? (skill.value || skill.id || skill.label) 
            : skill;
          return skillValue === filters.skill;
        });
        if (!skillMatches) {
          return false;
        }
      }
      return true;
    });
  }, [allActivities, filters]);

  // Sort activities
  const sortedActivities = useMemo(() => {
    const sorted = [...filteredActivities];
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => {
          const aDate = a.creation_date?.toDate?.() || a.creation_date || new Date(0);
          const bDate = b.creation_date?.toDate?.() || b.creation_date || new Date(0);
          return bDate - aDate;
        });
      case 'oldest':
        return sorted.sort((a, b) => {
          const aDate = a.creation_date?.toDate?.() || a.creation_date || new Date(0);
          const bDate = b.creation_date?.toDate?.() || b.creation_date || new Date(0);
          return aDate - bDate;
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

  // Calculate metrics
  const metrics = useMemo(() => {
    const online = allActivities.filter(a => a.type === 'online').length;
    const local = allActivities.filter(a => a.type === 'local').length;
    const events = allActivities.filter(a => a.type === 'event').length;
    const closed = allActivities.filter(a => a.status === 'Closed').length;
    const open = allActivities.filter(a => a.status === 'Open').length;
    const draft = allActivities.filter(a => a.status === 'Draft').length;
    
    return {
      total: allActivities.length,
      online,
      local,
      events,
      closed,
      open,
      draft
    };
  }, [allActivities]);

  const handleStatusChange = (activityId, newStatus) => {
    setAllActivities((prev) =>
      prev.map((activity) =>
        activity.id === activityId
          ? { ...activity, status: newStatus }
          : activity
      )
    );
  };

  const handleActivityCardClick = (activity) => {
    setSelectedActivity(activity);
    setShowActionModal(true);
  };

  const handleEditActivity = () => {
    setShowActionModal(false);
    // Navigate to edit page - admin can edit any activity
    router.push(`/mynonprofit/activities/manage?activityId=${selectedActivity.id}`);
  };

  const handleDeleteActivity = () => {
    if (selectedActivity) {
      setShowActionModal(false);
      setShowDeleteModal(true);
    }
  };

  const handleActivityDeleted = async (deletedCount) => {
    try {
      // Refresh activities list
      const results = await fetchActivities();
      setAllActivities(results || []);
      
      setShowDeleteModal(false);
      setSelectedActivity(null);
      
      // Show success toast
      const message = deletedCount > 1 
        ? t('successDeletedMultiple') || `Successfully deleted ${deletedCount} activities`
        : t('successDeletedSingle') || 'Activity deleted successfully';
      setToastMessage({ type: 'success', message });
      setShowToast(true);
    } catch (error) {
      console.error("Error refreshing activities:", error);
      setToastMessage({ type: 'error', message: t('errorRefreshing') || 'Error refreshing activities' });
      setShowToast(true);
    }
  };

  const handleReviewApplications = () => {
    setShowActionModal(false);
    setShowReviewModal(true);
  };

  const handleViewActivity = () => {
    setShowActionModal(false);
    setShowActivityDetailsModal(true);
  };

  const handleChangeStatus = () => {
    setShowActionModal(false);
    setShowStatusModal(true);
  };

  const handleShowQRCode = () => {
    setShowActionModal(false);
    setShowQRModal(true);
  };

  const handleViewParticipants = () => {
    setShowActionModal(false);
    setShowParticipantModal(true);
  };

  const handleDuplicateActivity = async () => {
    if (!selectedActivity) return;
    
    try {
      setShowActionModal(false);
      // Duplicate the activity
      const newActivityId = await duplicateActivity(selectedActivity.id);
      // Navigate to edit page for the new activity
      router.push(`/mynonprofit/activities/manage?activityId=${newActivityId}`);
    } catch (error) {
      console.error('Error duplicating activity:', error);
      setToastMessage({ type: 'error', message: t('errorDuplicating') || 'Error duplicating activity' });
      setShowToast(true);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!selectedActivity) return;

    // If trying to close the activity, open validation modal instead
    if (newStatus === 'Closed') {
      setShowStatusModal(false);
      setShowValidationModal(true);
      return;
    }

    // For other status changes, proceed normally
    try {
      setIsUpdatingStatus(true);
      await updateActivityStatus(selectedActivity.id, newStatus);
      handleStatusChange(selectedActivity.id, newStatus);
      setShowStatusModal(false);
    } catch (error) {
      console.error('Error updating activity status:', error);
      setToastMessage({ type: 'error', message: t('errorUpdatingStatus') || 'Error updating activity status' });
      setShowToast(true);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleValidationModalClose = async (shouldCloseActivity) => {
    setShowValidationModal(false);
    
    // If all applicants are processed, close the activity
    if (shouldCloseActivity && selectedActivity) {
      try {
        await updateActivityStatus(selectedActivity.id, 'Closed');
        handleStatusChange(selectedActivity.id, 'Closed');
      } catch (error) {
        console.error('Error closing activity:', error);
        setToastMessage({ type: 'error', message: t('errorClosingActivity') || 'Failed to close activity' });
        setShowToast(true);
      }
    }
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 bg-background-page dark:bg-background-page min-h-screen">
      {/* Header */}
      <div className="mb-4 sm:mb-6 md:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 text-text-primary dark:text-text-primary">{t('activitiesManagement') || 'Activities Management'}</h1>
        <p className="text-xs sm:text-sm md:text-base text-text-secondary dark:text-text-secondary">{t('allActivitiesDescription') || 'Manage all activities from all organizations'}</p>
      </div>

      {/* Metrics Section */}
      <div className="mb-4 sm:mb-6 md:mb-8">
        <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-2 sm:mb-3 md:mb-4 px-1 text-text-primary dark:text-text-primary">{t('metrics') || 'Metrics'}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3 md:gap-4">
          {/* All Activities Card */}
          <div className="bg-background-card dark:bg-background-card rounded-lg shadow-md border border-border-light dark:border-border-dark">
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 py-1.5 sm:py-2 px-2 sm:px-2.5">
              <div className="bg-background-hover dark:bg-background-hover p-1.5 sm:p-2 rounded-full flex-shrink-0">
                <HiViewGrid className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-text-secondary dark:text-text-secondary" />
              </div>
              <h2 className="text-[10px] xs:text-xs sm:text-sm font-semibold flex-1 text-text-primary dark:text-text-primary truncate">{t('all') || 'All'}</h2>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-text-primary dark:text-text-primary flex-shrink-0">{metrics.total}</p>
            </div>
          </div>

          {/* Online Activities Card */}
          <div className="bg-background-card dark:bg-background-card rounded-lg shadow-md border border-border-light dark:border-border-dark">
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 py-1.5 sm:py-2 px-2 sm:px-2.5">
              <div className="bg-semantic-info-100 dark:bg-semantic-info-900 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                <MdOutlineSocialDistance className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-semantic-info-600 dark:text-semantic-info-400" />
              </div>
              <h2 className="text-[10px] xs:text-xs sm:text-sm font-semibold flex-1 text-text-primary dark:text-text-primary truncate">{t('online') || 'Online'}</h2>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-semantic-info-600 dark:text-semantic-info-400 flex-shrink-0">{metrics.online}</p>
            </div>
          </div>

          {/* Local Activities Card */}
          <div className="bg-background-card dark:bg-background-card rounded-lg shadow-md border border-border-light dark:border-border-dark">
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 py-1.5 sm:py-2 px-2 sm:px-2.5">
              <div className="bg-semantic-success-100 dark:bg-semantic-success-900 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                <HiOfficeBuilding className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-semantic-success-600 dark:text-semantic-success-400" />
              </div>
              <h2 className="text-[10px] xs:text-xs sm:text-sm font-semibold flex-1 text-text-primary dark:text-text-primary truncate">{t('local') || 'Local'}</h2>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-semantic-success-600 dark:text-semantic-success-400 flex-shrink-0">{metrics.local}</p>
            </div>
          </div>

          {/* Events Card */}
          <div className="bg-background-card dark:bg-background-card rounded-lg shadow-md border border-border-light dark:border-border-dark">
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 py-1.5 sm:py-2 px-2 sm:px-2.5">
              <div className="bg-activityType-event-100 dark:bg-activityType-event-900 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                <HiCalendar className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-activityType-event-500 dark:text-activityType-event-400" />
              </div>
              <h2 className="text-[10px] xs:text-xs sm:text-sm font-semibold flex-1 text-text-primary dark:text-text-primary truncate">{t('events') || 'Events'}</h2>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-activityType-event-500 dark:text-activityType-event-400 flex-shrink-0">{metrics.events}</p>
            </div>
          </div>

          {/* Open Activities Card */}
          <div className="bg-background-card dark:bg-background-card rounded-lg shadow-md border border-border-light dark:border-border-dark">
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 py-1.5 sm:py-2 px-2 sm:px-2.5">
              <div className="bg-semantic-success-100 dark:bg-semantic-success-900 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                <HiCalendar className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-semantic-success-600 dark:text-semantic-success-400" />
              </div>
              <h2 className="text-[10px] xs:text-xs sm:text-sm font-semibold flex-1 text-text-primary dark:text-text-primary truncate">{t('open') || 'Open'}</h2>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-semantic-success-600 dark:text-semantic-success-400 flex-shrink-0">{metrics.open}</p>
            </div>
          </div>

          {/* Draft Activities Card */}
          <div className="bg-background-card dark:bg-background-card rounded-lg shadow-md border border-border-light dark:border-border-dark">
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 py-1.5 sm:py-2 px-2 sm:px-2.5">
              <div className="bg-semantic-warning-100 dark:bg-semantic-warning-900 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                <HiDocumentText className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-semantic-warning-600 dark:text-semantic-warning-400" />
              </div>
              <h2 className="text-[10px] xs:text-xs sm:text-sm font-semibold flex-1 text-text-primary dark:text-text-primary truncate">{t('draft') || 'Draft'}</h2>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-semantic-warning-600 dark:text-semantic-warning-400 flex-shrink-0">{metrics.draft}</p>
            </div>
          </div>

          {/* Closed Activities Card */}
          <div className="bg-background-card dark:bg-background-card rounded-lg shadow-md border border-border-light dark:border-border-dark">
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 py-1.5 sm:py-2 px-2 sm:px-2.5">
              <div className="bg-primary-100 dark:bg-primary-900 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                <HiLockClosed className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-[10px] xs:text-xs sm:text-sm font-semibold flex-1 text-text-primary dark:text-text-primary truncate">{t('closed') || 'Closed'}</h2>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-primary-600 dark:text-primary-400 flex-shrink-0">{metrics.closed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activities List */}
      <div className="mt-4 sm:mt-6 md:mt-10">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-3 sm:mb-4 px-1 text-text-primary dark:text-text-primary">{t('allActivities') || 'All Activities'}</h2>
        
        {/* Filters */}
        <ActivityFilters
          filters={{
            type: filters.type,
            category: filters.category,
            country: filters.country,
            skill: filters.skill,
            status: filters.status
          }}
          onFiltersChange={(newFilters) => {
            // Merge with organization filter
            setFilters({ ...newFilters, organization: filters.organization });
          }}
          availableCountries={availableCountries}
          availableCategories={availableCategories}
          availableSkills={availableSkills}
        />

        {/* Organization Filter (Admin specific) */}
        {availableOrganizations.length > 0 && (
          <div className="mb-4 p-3 sm:p-4 bg-background-card dark:bg-background-card rounded-lg shadow-sm border border-border-light dark:border-border-dark">
            <label className="block text-xs sm:text-sm font-medium text-text-primary dark:text-text-primary mb-2">{t('filterByOrganization') || 'Filter by Organization'}</label>
            <Select
              value={filters.organization}
              onChange={(e) => setFilters({ ...filters, organization: e.target.value })}
              className="w-full sm:w-auto text-sm sm:text-base bg-background-card dark:bg-background-card border-border-light dark:border-border-dark text-text-primary dark:text-text-primary"
            >
              <option value="all">{t('allOrganizations') || 'All Organizations'}</option>
              {availableOrganizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </Select>
          </div>
        )}

        {/* Sort and Results Count */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="text-xs sm:text-sm text-text-secondary dark:text-text-secondary">
            {tActivities('showing') || 'Showing'} <span className="font-semibold text-text-primary dark:text-text-primary">{sortedActivities.length}</span> {tActivities('of') || 'of'}{' '}
            <span className="font-semibold text-text-primary dark:text-text-primary">{allActivities.length}</span> {tActivities('activities') || 'activities'}
          </div>
          <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2">
            <label className="text-xs sm:text-sm font-medium text-text-primary dark:text-text-primary whitespace-nowrap">{tActivities('sortBy') || 'Sort by'}</label>
            <Select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)} 
              className="w-full xs:w-auto text-sm sm:text-base bg-background-card dark:bg-background-card border-border-light dark:border-border-dark text-text-primary dark:text-text-primary"
            >
              <option value="newest">{tActivities('sortNewest') || 'Newest'}</option>
              <option value="oldest">{tActivities('sortOldest') || 'Oldest'}</option>
              <option value="xp_high">{tActivities('sortXpHigh') || 'XP: High to Low'}</option>
              <option value="xp_low">{tActivities('sortXpLow') || 'XP: Low to High'}</option>
              <option value="applicants_high">{tActivities('sortApplicantsHigh') || 'Applicants: High to Low'}</option>
              <option value="applicants_low">{tActivities('sortApplicantsLow') || 'Applicants: Low to High'}</option>
              <option value="alphabetical">{tActivities('sortAlphabetical') || 'Alphabetical'}</option>
            </Select>
          </div>
        </div>

        {loadingActivities ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500 dark:border-primary-400"></div>
          </div>
        ) : sortedActivities.length === 0 ? (
          <p className="text-text-secondary dark:text-text-secondary px-1">
            {t('noActivitiesFound') || 'No activities found'}
          </p>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5'>
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
                  status={activity.status}
                  city={activity.city}
                  category={activity.category}
                  qrCodeToken={activity.qrCodeToken}
                  frequency={activity.frequency}
                  skills={activity.skills}
                  participantTarget={activity.participantTarget}
                  acceptApplicationsWG={activity.acceptApplicationsWG}
                  onClick={() => handleActivityCardClick(activity)}
                  canEditStatus={true}
                  onStatusChange={handleStatusChange}
                  showQRButton={true}
                />
                
                {/* Overlay with action buttons */}
                {selectedActivity && selectedActivity.id === activity.id && showActionModal && (
                  <div className="absolute inset-0 bg-black bg-opacity-60 rounded-lg flex items-center justify-center z-10 p-3 sm:p-3">
                    {(() => {
                      const hasQRCode = activity.qrCodeToken && (activity.type === 'local' || activity.type === 'event');
                      const isEvent = activity.type === 'event';
                      return (
                        <div className="grid grid-cols-3 gap-3 sm:gap-2.5 md:gap-3 w-full max-w-xs sm:max-w-sm">
                          {/* Change Status Button */}
                          <div className="flex flex-col items-center">
                            <button
                              onClick={handleChangeStatus}
                              className="w-16 h-16 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg hover:bg-orange-600 active:bg-orange-700 transition-colors touch-manipulation"
                              aria-label="Change Status"
                            >
                              <HiDocumentText className="h-7 w-7 sm:h-6 sm:w-6 md:h-7 md:w-7" />
                            </button>
                            <span className="mt-1.5 text-xs sm:text-[11px] md:text-xs text-white font-medium text-center leading-tight px-0.5">{t('changeStatus') || 'Status'}</span>
                          </div>

                          {/* Edit Button */}
                          <div className="flex flex-col items-center">
                            <button
                              onClick={handleEditActivity}
                              className="w-16 h-16 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg hover:bg-blue-600 active:bg-blue-700 transition-colors touch-manipulation"
                              aria-label="Edit Activity"
                            >
                              <HiPencil className="h-7 w-7 sm:h-6 sm:w-6 md:h-7 md:w-7" />
                            </button>
                            <span className="mt-1.5 text-xs sm:text-[11px] md:text-xs text-white font-medium text-center leading-tight px-0.5">{t('edit') || 'Edit'}</span>
                          </div>

                          {/* Duplicate Button */}
                          <div className="flex flex-col items-center">
                            <button
                              onClick={handleDuplicateActivity}
                              className="w-16 h-16 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-yellow-500 text-white flex items-center justify-center shadow-lg hover:bg-yellow-600 active:bg-yellow-700 transition-colors touch-manipulation"
                              aria-label="Duplicate Activity"
                            >
                              <HiDuplicate className="h-7 w-7 sm:h-6 sm:w-6 md:h-7 md:w-7" />
                            </button>
                            <span className="mt-1.5 text-xs sm:text-[11px] md:text-xs text-white font-medium text-center leading-tight px-0.5">{t('duplicate') || 'Duplicate'}</span>
                          </div>

                          {/* Delete Button */}
                          <div className="flex flex-col items-center">
                            <button
                              onClick={handleDeleteActivity}
                              className="w-16 h-16 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 active:bg-red-700 transition-colors touch-manipulation"
                              aria-label="Delete Activity"
                            >
                              <HiTrash className="h-7 w-7 sm:h-6 sm:w-6 md:h-7 md:w-7" />
                            </button>
                            <span className="mt-1.5 text-xs sm:text-[11px] md:text-xs text-white font-medium text-center leading-tight px-0.5">{t('delete') || 'Delete'}</span>
                          </div>

                          {/* View Activity Button */}
                          <div className="flex flex-col items-center">
                            <button
                              onClick={handleViewActivity}
                              className="w-16 h-16 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-lg hover:bg-purple-600 active:bg-purple-700 transition-colors touch-manipulation"
                              aria-label="View Activity"
                            >
                              <HiEye className="h-7 w-7 sm:h-6 sm:w-6 md:h-7 md:w-7" />
                            </button>
                            <span className="mt-1.5 text-xs sm:text-[11px] md:text-xs text-white font-medium text-center leading-tight px-0.5">{t('view') || 'View'}</span>
                          </div>

                          {/* Review Applications Button - Hidden for events */}
                          {!isEvent && (
                            <div className="flex flex-col items-center">
                              <button
                                onClick={handleReviewApplications}
                                className="w-16 h-16 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg hover:bg-green-600 active:bg-green-700 transition-colors touch-manipulation"
                                aria-label="Review Applications"
                              >
                                <HiUserGroup className="h-7 w-7 sm:h-6 sm:w-6 md:h-7 md:w-7" />
                              </button>
                              <span className="mt-1.5 text-xs sm:text-[11px] md:text-xs text-white font-medium text-center leading-tight px-0.5">{t('applications') || 'Applications'}</span>
                            </div>
                          )}

                          {/* View Participants Button */}
                          <div className="flex flex-col items-center">
                            <button
                              onClick={handleViewParticipants}
                              className="w-16 h-16 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-teal-500 text-white flex items-center justify-center shadow-lg hover:bg-teal-600 active:bg-teal-700 transition-colors touch-manipulation"
                              aria-label="View Participants"
                            >
                              <HiUsers className="h-7 w-7 sm:h-6 sm:w-6 md:h-7 md:w-7" />
                            </button>
                            <span className="mt-1.5 text-xs sm:text-[11px] md:text-xs text-white font-medium text-center leading-tight px-0.5">{t('viewParticipants') || 'Participants'}</span>
                          </div>

                          {/* Show QR Code Button - Conditional */}
                          {hasQRCode && (
                            <div className="flex flex-col items-center">
                              <button
                                onClick={handleShowQRCode}
                                className="w-16 h-16 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg hover:bg-indigo-600 active:bg-indigo-700 transition-colors touch-manipulation"
                                aria-label="Show QR Code"
                              >
                                <HiQrcode className="h-7 w-7 sm:h-6 sm:w-6 md:h-7 md:w-7" />
                              </button>
                              <span className="mt-1.5 text-xs sm:text-[11px] md:text-xs text-white font-medium text-center leading-tight px-0.5">{t('showQRCode') || 'QR Code'}</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    
                    {/* Close button */}
                    <button
                      onClick={() => setShowActionModal(false)}
                      className="absolute top-2 right-2 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-gray-600 text-white flex items-center justify-center hover:bg-gray-700 active:bg-gray-800 transition-colors text-lg sm:text-xl md:text-2xl touch-manipulation"
                      aria-label="Close"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Activity Modal */}
      <DeleteActivityModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        activity={selectedActivity}
        onActivityDeleted={handleActivityDeleted}
      />

      {/* Review Applications Modal */}
      <ReviewApplicationsModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        activity={selectedActivity}
      />

      {/* Activity Details Modal */}
      <ActivityDetailsModal
        isOpen={showActivityDetailsModal}
        onClose={() => {
          setShowActivityDetailsModal(false);
          setSelectedActivity(null);
        }}
        activityId={selectedActivity?.id}
      />

      {/* Status Update Modal */}
      <StatusUpdateModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        currentStatus={selectedActivity?.status}
        onStatusUpdate={handleStatusUpdate}
        isUpdating={isUpdatingStatus}
      />

      {/* QR Code Modal */}
      {selectedActivity && (
        <QRCodeModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          activityId={selectedActivity.id}
          qrCodeToken={selectedActivity.qrCodeToken}
          title={selectedActivity.title}
          startDate={selectedActivity.start_date}
        />
      )}

      {/* Activity Validation Modal */}
      {selectedActivity && (
        <ActivityValidationModal
          isOpen={showValidationModal}
          onClose={handleValidationModalClose}
          activity={{
            id: selectedActivity.id,
            title: selectedActivity.title,
            type: selectedActivity.type,
            status: selectedActivity.status
          }}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Participant List Modal */}
      {selectedActivity && (
        <ParticipantListModal
          isOpen={showParticipantModal}
          onClose={() => {
            setShowParticipantModal(false);
          }}
          activity={selectedActivity}
        />
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[60] max-w-sm sm:max-w-none">
          <Toast onClose={() => setShowToast(false)} className="bg-background-card dark:bg-background-card border border-border-light dark:border-border-dark">
            {toastMessage.type === 'success' && <div className="inline-flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-semantic-success-100 dark:bg-semantic-success-900 text-semantic-success-600 dark:text-semantic-success-400 text-xs sm:text-base">✓</div>}
            {toastMessage.type === 'warning' && <div className="inline-flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-semantic-warning-100 dark:bg-semantic-warning-900 text-semantic-warning-600 dark:text-semantic-warning-400 text-xs sm:text-base">!</div>}
            {toastMessage.type === 'error' && <div className="inline-flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-semantic-error-100 dark:bg-semantic-error-900 text-semantic-error-600 dark:text-semantic-error-400 text-xs sm:text-base">!</div>}
            <div className="ml-2 sm:ml-3 text-xs sm:text-sm font-normal break-words text-text-primary dark:text-text-primary">{toastMessage.message}</div>
            <Toast.Toggle onClose={() => setShowToast(false)} className="text-text-tertiary dark:text-text-tertiary" />
          </Toast>
        </div>
      )}
    </div>
  );
}
