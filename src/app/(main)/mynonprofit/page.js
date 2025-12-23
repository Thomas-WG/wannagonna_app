"use client";

import { Card, Toast, Select } from "flowbite-react";
import { HiUsers, HiOfficeBuilding, HiCalendar, HiDocumentText, HiPencil, HiTrash, HiEye, HiUserGroup, HiCog, HiViewGrid, HiLockClosed, HiQrcode, HiDuplicate } from "react-icons/hi";
import { MdOutlineSocialDistance } from "react-icons/md";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/utils/auth/AuthContext";
import { fetchOrganizationById } from "@/utils/crudOrganizations";
import { useRouter } from "next/navigation";
import { fetchActivitiesByCriteria, deleteActivity, duplicateActivity } from "@/utils/crudActivities";
import { useTranslations } from "next-intl";
import { countPendingApplicationsForOrganization } from "@/utils/crudApplications";
import ActivityCard from "@/components/activities/ActivityCard";
import DeleteActivityModal from "@/components/activities/DeleteActivityModal";
import ReviewApplicationsModal from "@/components/activities/ReviewApplicationsModal";
import ActivityDetailsModal from "@/components/activities/ActivityDetailsModal";
import StatusUpdateModal from "@/components/activities/StatusUpdateModal";
import QRCodeModal from "@/components/activities/QRCodeModal";
import ActivityValidationModal from "@/components/activities/ActivityValidationModal";
import ParticipantListModal from "@/components/activities/ParticipantListModal";
import { updateActivityStatus } from "@/utils/crudActivities";
import ActivityFilters from "@/components/activities/ActivityFilters";
import categories from "@/constant/categories";

export default function MyNonProfitDashboard() {
  const t = useTranslations('MyNonProfit');
  const tActivities = useTranslations('Activities');
  const { claims } = useAuth();
  const router = useRouter();
  const [orgData, setOrgData] = useState({
    totalOnlineActivities: 0,
    totalLocalActivities: 0,
    totalEvents: 0,
    totalNewApplications: 0,
    totalParticipants: 0
  });
  const [loading, setLoading] = useState(true);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [orgActivities, setOrgActivities] = useState([]);
  const [allOrgActivities, setAllOrgActivities] = useState([]); // Store all activities for filtering
  const [loadingActivities, setLoadingActivities] = useState(true);
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
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    status: 'all',
  });
  const [sortBy, setSortBy] = useState('newest');

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [showToast]);


  useEffect(() => {
    const fetchKpiData = async () => {
      if (claims && claims.npoId) {
        try {
          const orgData = await fetchOrganizationById(claims.npoId);
          if (orgData) {
            // Count pending applications dynamically instead of using stored value
            const pendingCount = await countPendingApplicationsForOrganization(claims.npoId);
            setOrgData({
              ...orgData,
              totalNewApplications: pendingCount
            });
          }
        } catch (error) {
          console.error("Error fetching KPI data:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchKpiData();
  }, [claims]);

  useEffect(() => {
    const fetchActivities = async () => {
      if (claims && claims.npoId) {
        try {
          const results = await fetchActivitiesByCriteria(claims.npoId, 'any', 'any');
          setAllOrgActivities(results || []);
        } catch (error) {
          console.error("Error fetching organization activities:", error);
          setAllOrgActivities([]);
        } finally {
          setLoadingActivities(false);
        }
      } else {
        setLoadingActivities(false);
      }
    };
    fetchActivities();
  }, [claims]);

  // Extract available categories from activities
  const availableCategories = useMemo(() => {
    const cats = new Set();
    allOrgActivities.forEach((activity) => {
      if (activity.category) cats.add(activity.category);
    });
    return Array.from(cats).sort();
  }, [allOrgActivities]);

  // Filter activities based on filters
  const filteredActivities = useMemo(() => {
    let filtered = [...allOrgActivities];

    // Filter by type
    if (filters.type !== 'all') {
      filtered = filtered.filter((activity) => activity.type === filters.type);
    }

    // Filter by category
    if (filters.category !== 'all') {
      filtered = filtered.filter((activity) => activity.category === filters.category);
    }

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter((activity) => activity.status === filters.status);
    }

    return filtered;
  }, [allOrgActivities, filters]);

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

  // Handle status change from activity card
  const handleStatusChange = (activityId, newStatus) => {
    setAllOrgActivities(prevActivities => 
      prevActivities.map(activity => 
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
      const results = await fetchActivitiesByCriteria(claims.npoId, 'any', 'any');
      setAllOrgActivities(results || []);
      
      // Refresh organization data to update activity counts
      const orgData = await fetchOrganizationById(claims.npoId);
      if (orgData) {
        // Count pending applications dynamically instead of using stored value
        const pendingCount = await countPendingApplicationsForOrganization(claims.npoId);
        setOrgData({
          ...orgData,
          totalNewApplications: pendingCount
        });
      }
      
      setShowDeleteModal(false);
      setSelectedActivity(null);
      
      // Show success toast
      const message = deletedCount > 1 
        ? t('successDeletedMultiple', { count: deletedCount })
        : t('successDeletedSingle');
      setToastMessage({ type: 'success', message });
      setShowToast(true);
    } catch (error) {
      console.error("Error refreshing activities:", error);
      // Show error toast
      setToastMessage({ type: 'error', message: t('errorRefreshing') });
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
      alert('Error updating activity status. Please try again.');
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
        alert('Failed to close activity');
      }
    }
  };

  // Calculate closed activities count
  const closedActivitiesCount = allOrgActivities.filter(
    activity => activity.status === 'Closed'
  ).length;

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 bg-background-page dark:bg-background-page min-h-screen">
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 dark:border-primary-400"></div>
        </div>
      ) : (
        <>
          {/* Primary Metrics Section */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 px-1 text-text-primary dark:text-text-primary">{t('metricsAndFilters')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {/* All Activities Card */}
              <div className="bg-background-card dark:bg-background-card rounded-lg shadow-md border border-border-light dark:border-border-dark hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 sm:gap-3 py-1 sm:py-1.5 px-2 sm:px-2.5">
                  <div className="bg-neutral-100 dark:bg-neutral-800 p-2 rounded-full flex-shrink-0">
                    <HiViewGrid className="h-5 w-5 sm:h-6 sm:w-6 text-neutral-600 dark:text-neutral-400" />
                  </div>
                  <h2 className="text-xs sm:text-sm font-semibold flex-1 text-text-primary dark:text-text-primary">{t('allActivities')}</h2>
                  <p className="text-xl sm:text-2xl font-bold text-neutral-600 dark:text-neutral-400 flex-shrink-0">{allOrgActivities.length}</p>
                </div>
              </div>

              {/* Online Activities Card */}
              <div className="bg-background-card dark:bg-background-card rounded-lg shadow-md border border-border-light dark:border-border-dark hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 sm:gap-3 py-1 sm:py-1.5 px-2 sm:px-2.5">
                  <div className="bg-activityType-online-100 dark:bg-activityType-online-900 p-2 rounded-full flex-shrink-0">
                    <MdOutlineSocialDistance className="h-5 w-5 sm:h-6 sm:w-6 text-activityType-online-600 dark:text-activityType-online-400" />
                  </div>
                  <h2 className="text-xs sm:text-sm font-semibold flex-1 text-text-primary dark:text-text-primary">{t('online')}</h2>
                  <p className="text-xl sm:text-2xl font-bold text-activityType-online-600 dark:text-activityType-online-400 flex-shrink-0">{orgData.totalOnlineActivities}</p>
                </div>
              </div>

              {/* Local Activities Card */}
              <div className="bg-background-card dark:bg-background-card rounded-lg shadow-md border border-border-light dark:border-border-dark hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 sm:gap-3 py-1 sm:py-1.5 px-2 sm:px-2.5">
                  <div className="bg-activityType-local-100 dark:bg-activityType-local-900 p-2 rounded-full flex-shrink-0">
                    <HiOfficeBuilding className="h-5 w-5 sm:h-6 sm:w-6 text-activityType-local-600 dark:text-activityType-local-400" />
                  </div>
                  <h2 className="text-xs sm:text-sm font-semibold flex-1 text-text-primary dark:text-text-primary">{t('local')}</h2>
                  <p className="text-xl sm:text-2xl font-bold text-activityType-local-600 dark:text-activityType-local-400 flex-shrink-0">{orgData.totalLocalActivities}</p>
                </div>
              </div>

              {/* Total Events Card */}
              <div className="bg-background-card dark:bg-background-card rounded-lg shadow-md border border-border-light dark:border-border-dark hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 sm:gap-3 py-1 sm:py-1.5 px-2 sm:px-2.5">
                  <div className="bg-activityType-event-100 dark:bg-activityType-event-900 p-2 rounded-full flex-shrink-0">
                    <HiCalendar className="h-5 w-5 sm:h-6 sm:w-6 text-activityType-event-600 dark:text-activityType-event-400" />
                  </div>
                  <h2 className="text-xs sm:text-sm font-semibold flex-1 text-text-primary dark:text-text-primary">{t('events')}</h2>
                  <p className="text-xl sm:text-2xl font-bold text-activityType-event-600 dark:text-activityType-event-400 flex-shrink-0">{orgData.totalEvents}</p>
                </div>
              </div>

              {/* Closed Activities Card */}
              <div className="bg-background-card dark:bg-background-card rounded-lg shadow-md border border-border-light dark:border-border-dark hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 sm:gap-3 py-1 sm:py-1.5 px-2 sm:px-2.5">
                  <div className="bg-primary-100 dark:bg-primary-900 p-2 rounded-full flex-shrink-0">
                    <HiLockClosed className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h2 className="text-xs sm:text-sm font-semibold flex-1 text-text-primary dark:text-text-primary">{t('closed')}</h2>
                  <p className="text-xl sm:text-2xl font-bold text-primary-600 dark:text-primary-400 flex-shrink-0">{closedActivitiesCount}</p>
                </div>
              </div>

              {/* Total Participants Card */}
              <div className="bg-background-card dark:bg-background-card rounded-lg shadow-md border border-border-light dark:border-border-dark hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 sm:gap-3 py-1 sm:py-1.5 px-2 sm:px-2.5">
                  <div className="bg-semantic-error-100 dark:bg-semantic-error-900 p-2 rounded-full flex-shrink-0">
                    <HiUsers className="h-5 w-5 sm:h-6 sm:w-6 text-semantic-error-600 dark:text-semantic-error-400" />
                  </div>
                  <h2 className="text-xs sm:text-sm font-semibold flex-1 text-text-primary dark:text-text-primary">{t('participants')}</h2>
                  <p className="text-xl sm:text-2xl font-bold text-semantic-error-600 dark:text-semantic-error-400 flex-shrink-0">{orgData.totalParticipants}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions & Alerts Section */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 px-1 text-text-primary dark:text-text-primary">{t('quickActions')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4">
              {/* New Applications Card - With Badge */}
              <Card 
                className="hover:shadow-lg transition-shadow cursor-pointer relative"
                onClick={() => router.push('/mynonprofit/activities/applications')}
              >
                <div className="flex items-center gap-2 sm:gap-3 py-1 sm:py-1.5 px-2 sm:px-2.5">
                  {/* Badge indicator */}
                  {orgData.totalNewApplications > 0 && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-xs sm:text-sm font-bold shadow-lg animate-pulse">
                      {orgData.totalNewApplications > 99 ? '99+' : orgData.totalNewApplications}
                    </div>
                  )}
                  <div className={`p-2 rounded-full flex-shrink-0 transition-colors ${
                    orgData.totalNewApplications > 0 
                      ? 'bg-yellow-500' 
                      : 'bg-yellow-100'
                  }`}>
                    <HiDocumentText className={`h-5 w-5 sm:h-6 sm:w-6 ${
                      orgData.totalNewApplications > 0 
                        ? 'text-white' 
                        : 'text-yellow-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xs sm:text-sm font-semibold text-text-primary dark:text-text-primary">{t('reviewApplications')}</h2>
                    {orgData.totalNewApplications > 0 && (
                      <p className="text-[10px] sm:text-xs text-text-tertiary dark:text-text-tertiary mt-0.5">{t('requiresAttention')}</p>
                    )}
                  </div>
                </div>
              </Card>

              {/* Edit Organization Card */}
              <Card 
                className="hover:shadow-lg transition-shadow cursor-pointer bg-background-card dark:bg-background-card border-border-light dark:border-border-dark"
                onClick={() => router.push('/mynonprofit/organization/edit')}
              >
                <div className="flex items-center gap-2 sm:gap-3 py-1 sm:py-1.5 px-2 sm:px-2.5">
                  <div className="bg-semantic-info-100 dark:bg-semantic-info-900 p-2 rounded-full flex-shrink-0">
                    <HiCog className="h-5 w-5 sm:h-6 sm:w-6 text-semantic-info-600 dark:text-semantic-info-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xs sm:text-sm font-semibold text-text-primary dark:text-text-primary">{t('organization')}</h2>
                    <p className="text-[10px] sm:text-xs text-semantic-info-600 dark:text-semantic-info-400 font-medium mt-0.5">{t('editInformation')}</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Organization Activities */}
      <div className="mt-6 sm:mt-10">
        <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 px-1 text-text-primary dark:text-text-primary">{t('yourActivities')}</h2>
        
        {/* Filters */}
        <ActivityFilters
          filters={filters}
          onFiltersChange={setFilters}
          availableCountries={[]}
          availableCategories={availableCategories}
          availableSkills={[]}
        />

        {/* Sort and Results Count */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="text-sm text-text-secondary dark:text-text-secondary">
            {tActivities('showing')} <span className="font-semibold">{sortedActivities.length}</span> {tActivities('of')}{' '}
            <span className="font-semibold">{allOrgActivities.length}</span> {tActivities('activities')}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-text-primary dark:text-text-primary">{tActivities('sortBy')}</label>
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full sm:w-auto bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border-border-light dark:border-border-dark">
              <option value="newest">{tActivities('sortNewest')}</option>
              <option value="oldest">{tActivities('sortOldest')}</option>
              <option value="xp_high">{tActivities('sortXpHigh')}</option>
              <option value="xp_low">{tActivities('sortXpLow')}</option>
              <option value="applicants_high">{tActivities('sortApplicantsHigh')}</option>
              <option value="applicants_low">{tActivities('sortApplicantsLow')}</option>
              <option value="alphabetical">{tActivities('sortAlphabetical')}</option>
            </Select>
          </div>
        </div>

        {loadingActivities ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500 dark:border-primary-400"></div>
          </div>
        ) : sortedActivities.length === 0 ? (
          <p className="text-text-secondary dark:text-text-secondary px-1">
            {t('noActivitiesFound')}
          </p>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5'>
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
                  last_updated={activity.last_updated}
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
                    {/* Grid layout: 3 columns, flexible rows */}
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
                            <span className="mt-1.5 text-xs sm:text-[11px] md:text-xs text-white font-medium text-center leading-tight px-0.5">{t('changeStatus')}</span>
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
                            <span className="mt-1.5 text-xs sm:text-[11px] md:text-xs text-white font-medium text-center leading-tight px-0.5">{t('edit')}</span>
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
                            <span className="mt-1.5 text-xs sm:text-[11px] md:text-xs text-white font-medium text-center leading-tight px-0.5">{t('duplicate')}</span>
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
                            <span className="mt-1.5 text-xs sm:text-[11px] md:text-xs text-white font-medium text-center leading-tight px-0.5">{t('delete')}</span>
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
                            <span className="mt-1.5 text-xs sm:text-[11px] md:text-xs text-white font-medium text-center leading-tight px-0.5">{t('view')}</span>
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
                              <span className="mt-1.5 text-xs sm:text-[11px] md:text-xs text-white font-medium text-center leading-tight px-0.5">{t('applications')}</span>
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
                              <span className="mt-1.5 text-xs sm:text-[11px] md:text-xs text-white font-medium text-center leading-tight px-0.5">{t('showQRCode')}</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    
                    {/* Close button */}
                    <button
                      onClick={() => setShowActionModal(false)}
                      className="absolute top-2 right-2 sm:top-2 sm:right-2 w-9 h-9 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full bg-gray-600 text-white flex items-center justify-center hover:bg-gray-700 active:bg-gray-800 transition-colors text-xl sm:text-lg md:text-xl lg:text-2xl touch-manipulation"
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

      {/* Floating Action Button with horizontal menu */}
      <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50">
        {isFabOpen && (
          <div className="absolute bottom-16 right-0 flex flex-col items-end space-y-2 sm:space-y-3">
            {/* Online */}
            <div className="flex flex-col items-center">
              <button
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg hover:bg-blue-600 active:bg-blue-700 transition-colors touch-manipulation"
                aria-label="Online"
                onClick={() => {
                  setIsFabOpen(false);
                  router.push('/mynonprofit/activities/manage?type=online');
                }}
              >
                <MdOutlineSocialDistance className="h-6 w-6 sm:h-7 sm:w-7" />
              </button>
              <span className="mt-1 text-xs sm:text-sm text-blue-600 font-medium">{t('online')}</span>
            </div>

            {/* Local */}
            <div className="flex flex-col items-center">
              <button
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg hover:bg-green-600 active:bg-green-700 transition-colors touch-manipulation"
                aria-label="Local"
                onClick={() => {
                  setIsFabOpen(false);
                  router.push('/mynonprofit/activities/manage?type=local');
                }}
              >
                <HiOfficeBuilding className="h-6 w-6 sm:h-7 sm:w-7" />
              </button>
              <span className="mt-1 text-xs sm:text-sm text-green-600 font-medium">{t('local')}</span>
            </div>

            {/* Event */}
            <div className="flex flex-col items-center">
              <button
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-lg hover:bg-purple-600 active:bg-purple-700 transition-colors touch-manipulation"
                aria-label="Event"
                onClick={() => {
                  setIsFabOpen(false);
                  router.push('/mynonprofit/activities/manage?type=event');
                }}
              >
                <HiCalendar className="h-6 w-6 sm:h-7 sm:w-7" />
              </button>
              <span className="mt-1 text-xs sm:text-sm text-purple-600 font-medium">{t('event')}</span>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsFabOpen((prev) => !prev)}
          className="bg-orange-500 text-white text-xl sm:text-2xl w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg hover:bg-orange-600 active:bg-orange-700 transition-colors touch-manipulation flex items-center justify-center"
          aria-label={isFabOpen ? t('closeMenu') : t('openMenu')}
        >
          {isFabOpen ? '×' : '+'}
        </button>
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
        onOrganizationDataUpdate={setOrgData}
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
        <div className="fixed bottom-16 sm:bottom-5 right-4 sm:right-5 left-4 sm:left-auto z-[60] max-w-sm sm:max-w-none">
          <Toast onClose={() => setShowToast(false)}>
            {toastMessage.type === 'success' && <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-500">✓</div>}
            {toastMessage.type === 'warning' && <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-500">!</div>}
            {toastMessage.type === 'error' && <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-500">!</div>}
            <div className="ml-3 text-sm font-normal break-words">{toastMessage.message}</div>
            <Toast.Toggle onClose={() => setShowToast(false)} />
          </Toast>
        </div>
      )}

    </div>
  );
}
