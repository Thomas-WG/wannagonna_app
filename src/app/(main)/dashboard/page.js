"use client";

import { Card, Progress, Toast, Badge, Button, Select } from "flowbite-react";
import { 
  HiUser, 
  HiOfficeBuilding, 
  HiCalendar, 
  HiDocumentText,
  HiBadgeCheck,
  HiLockClosed,
  HiCheck,
  HiX,
  HiClock,
  HiClipboardCopy,
  HiEye,
  HiPencil,
  HiQrcode
} from "react-icons/hi";
import { MdOutlineSocialDistance } from "react-icons/md";
import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/utils/auth/AuthContext";
import { fetchMemberById } from "@/utils/crudMemberProfile";
import { fetchApplicationsByUserId, fetchActivitiesForVolunteer } from "@/utils/crudApplications";
import { fetchHistoryActivities, fetchActivityById } from "@/utils/crudActivities";
import { useTranslations } from "next-intl";
import ActivityCard from "@/components/activities/ActivityCard";
import ActivityDetailsModal from "@/components/activities/ActivityDetailsModal";
import ViewApplicationModal from "@/components/activities/ViewApplicationModal";
import BadgeList from "@/components/badges/BadgeList";
import QRCodeScanner from "@/components/activities/QRCodeScanner";
import ActivityValidationSuccessModal from "@/components/activities/ActivityValidationSuccessModal";
import PublicProfileModal from "@/components/profile/PublicProfileModal";
import { Alert } from "flowbite-react";
import Image from "next/image";
import ActivityFilters from "@/components/activities/ActivityFilters";
import categories from "@/constant/categories";

export default function DashboardPage() {
  const t = useTranslations('Dashboard');
  const tActivities = useTranslations('Activities');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, claims } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [applications, setApplications] = useState([]);
  const [volunteerActivities, setVolunteerActivities] = useState([]);
  const [historyActivities, setHistoryActivities] = useState([]);
  const [openActivities, setOpenActivities] = useState([]);
  const [allApplicationsActivities, setAllApplicationsActivities] = useState([]);
  const [showApplications, setShowApplications] = useState(false);
  const [applicationsWithActivities, setApplicationsWithActivities] = useState([]);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const [selectedApplicationActivity, setSelectedApplicationActivity] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [stats, setStats] = useState({
    totalLocalActivities: 0,
    totalOnlineActivities: 0,
    totalEvents: 0,
    totalApplications: 0,
    closedActivities: 0
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ type: '', message: '' });
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    status: 'all',
  });
  const [sortBy, setSortBy] = useState('newest');
  
  // Validation result modal state
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const validationProcessedRef = useRef(false);
  
  // Public profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Gamification data (placeholder - can be enhanced later)
  const [gamificationData, setGamificationData] = useState({
    level: 1,
    currentXP: 0,
    totalXP: 0,
    badgesCount: 0
  });

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Handle validation results from QR code scan
  useEffect(() => {
    const validation = searchParams.get('validation');
    
    // Only process once per validation key
    const validationKey = validation ? `${validation}-${searchParams.get('xp') || ''}-${searchParams.get('activityTitle') || ''}` : null;
    
    if (!validation || !validationKey || validationProcessedRef.current === validationKey) {
      return;
    }

    // Mark as processed immediately
    validationProcessedRef.current = validationKey;

    if (validation === 'success') {
      // Parse success params
      const xp = parseInt(searchParams.get('xp') || '0', 10);
      const activityTitle = searchParams.get('activityTitle') || '';
      
      // Parse badges
      const badges = [];
      let idx = 0;
      while (searchParams.get(`badge${idx}`)) {
        const badgeId = searchParams.get(`badge${idx}`);
        badges.push({ id: badgeId, title: badgeId }); // You might want to fetch badge details
        idx++;
      }

      setValidationResult({
        xpReward: xp,
        badges: badges,
        activityTitle: activityTitle
      });
      setShowValidationModal(true);

      // Clean up URL immediately
      if (window.location.search.includes('validation=')) {
        router.replace('/dashboard', { scroll: false });
      }
    } else if (validation === 'already-validated') {
      setToastMessage({
        type: 'info',
        message: 'You have already validated this activity.'
      });
      setShowToast(true);
      
      // Clean up URL immediately
      if (window.location.search.includes('validation=')) {
        router.replace('/dashboard', { scroll: false });
      }
    } else if (validation === 'error') {
      const message = decodeURIComponent(searchParams.get('message') || 'Validation failed');
      setToastMessage({
        type: 'failure',
        message: message
      });
      setShowToast(true);
      
      // Clean up URL immediately
      if (window.location.search.includes('validation=')) {
        router.replace('/dashboard', { scroll: false });
      }
    }
  }, [searchParams, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch profile data
        await fetchMemberById(user.uid, (data) => {
          setProfileData(data);
        });

        // Fetch applications
        const userApplications = await fetchApplicationsByUserId(user.uid);
        setApplications(userApplications);

        // Fetch activities for each application and combine
        const appsWithActivities = await Promise.all(
          userApplications.map(async (app) => {
            try {
              const activity = await fetchActivityById(app.activityId);
              if (activity) {
                return {
                  ...app,
                  activity: activity
                };
              }
              return { ...app, activity: null };
            } catch (error) {
              console.error(`Error fetching activity ${app.activityId}:`, error);
              return { ...app, activity: null };
            }
          })
        );

        // Sort applications: open activities first, then by status (pending, accepted, rejected)
        const sortedApps = appsWithActivities.sort((a, b) => {
          const aActivityStatus = a.activity?.status || '';
          const bActivityStatus = b.activity?.status || '';
          
          // First sort by activity status: Open activities first
          if (aActivityStatus === 'Open' && bActivityStatus !== 'Open') return -1;
          if (aActivityStatus !== 'Open' && bActivityStatus === 'Open') return 1;
          
          // Then sort by application status: pending, accepted, rejected
          const statusOrder = { 'pending': 0, 'accepted': 1, 'rejected': 2 };
          const aStatusOrder = statusOrder[a.status] ?? 3;
          const bStatusOrder = statusOrder[b.status] ?? 3;
          
          if (aStatusOrder !== bStatusOrder) {
            return aStatusOrder - bStatusOrder;
          }
          
          // Finally sort by creation date (newest first)
          const aDate = a.createdAt?.getTime?.() || 0;
          const bDate = b.createdAt?.getTime?.() || 0;
          return bDate - aDate;
        });

        setApplicationsWithActivities(sortedApps);

        // Fetch volunteer activities (accepted applications)
        const activities = await fetchActivitiesForVolunteer(user.uid);
        
        // Fetch history activities (closed activities)
        const history = await fetchHistoryActivities(user.uid);
        setHistoryActivities(history);
        
        // Filter activities to show only Open activities with accepted applications
        const open = activities.filter(a => a.status === 'Open');
        setOpenActivities(open);
        
        // Show all activities (Open and Closed) by default
        const allActivitiesForDisplay = [...activities, ...history];
        setVolunteerActivities(allActivitiesForDisplay);

        // Calculate stats from all activities (including closed)
        const allActivities = [...activities];
        const localActivities = allActivities.filter(a => a.type === 'local');
        const onlineActivities = allActivities.filter(a => a.type === 'online');
        const eventActivities = allActivities.filter(a => a.type === 'event');
        
        // Count closed activities from both current activities and history
        const closedFromActivities = allActivities.filter(a => 
          a.status === 'Closed' || a.status === 'Completed'
        );
        const closedActivitiesCount = closedFromActivities.length + history.length;

        // Count completed activities for badges
        const completedActivities = allActivities.filter(a => 
          a.status === 'Completed' || a.status === 'Closed'
        );

        setStats({
          totalLocalActivities: localActivities.length,
          totalOnlineActivities: onlineActivities.length,
          totalEvents: eventActivities.length,
          totalApplications: userApplications.length,
          closedActivities: closedActivitiesCount
        });

        // Note: Gamification data will be updated in separate useEffect when profileData is available
        // Don't update badge count here as profileData might not be set yet due to async callback

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setToastMessage({ 
          type: 'error', 
          message: t('errorLoading') || 'Error loading dashboard data' 
        });
        setShowToast(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, t]);

  // Update gamification data when profileData is available
  useEffect(() => {
    if (profileData) {
      // Read XP from user profile (default to 0 if not present)
      // Try different possible field names: xp, totalXP, experiencePoints
      const totalXP = profileData.xp || 0;
      
      // Calculate level based on XP (100 XP per level)
      const level = Math.floor(totalXP / 100) + 1;
      const currentXP = totalXP % 100;

      // Read badges count from profile if available, otherwise use 0 as default
      // Check if badges array exists and has items
      const badgesArray = profileData.badges;
      const badgesCount = Array.isArray(badgesArray) ? badgesArray.length : 0;
      
      // Debug logging
      console.log('Profile data badges:', badgesArray);
      console.log('Badges count:', badgesCount);

      setGamificationData(prev => ({
        level,
        currentXP,
        totalXP,
        badgesCount
      }));
    }
  }, [profileData]);

  // Ensure profilePicture is a valid non-empty string or null
  const profilePictureValue = profileData?.profilePicture || user?.photoURL || null;
  const profilePicture = profilePictureValue && profilePictureValue.trim() !== '' ? profilePictureValue : null;
  const displayName = profileData?.displayName || user?.displayName || user?.email || 'Volunteer';
  const userCode = profileData?.code || null;

  // Handle copying user code to clipboard
  const handleCopyCode = async () => {
    if (!userCode) return;
    
    try {
      await navigator.clipboard.writeText(userCode);
      setToastMessage({ 
        type: 'success', 
        message: t('codeCopied') || 'Code copied to clipboard!' 
      });
      setShowToast(true);
    } catch (error) {
      console.error('Failed to copy code:', error);
      setToastMessage({ 
        type: 'error', 
        message: t('codeCopyFailed') || 'Failed to copy code' 
      });
      setShowToast(true);
    }
  };

  // Handle clicking on type filter cards (Local, Online, Events) - removed filtering, cards are display-only
  const handleTypeFilterClick = (type) => {
    // Cards are now display-only, no filtering action
  };

  // Calculate dynamic stats - show closed activities count for each type
  const dynamicStats = {
    local: stats.totalLocalActivities,
    online: stats.totalOnlineActivities,
    event: stats.totalEvents
  };

  // Get all activities for current view - show Open and Closed activities
  const allActivitiesForView = useMemo(() => {
    if (showApplications) {
      return allApplicationsActivities;
    } else {
      // Show all activities (Open and Closed) - combine openActivities and historyActivities
      // Deduplicate by activity ID to prevent same activity appearing twice
      const combined = [...openActivities, ...historyActivities];
      const seenIds = new Set();
      const deduplicated = combined.filter(activity => {
        const activityId = activity.id || activity.activityId;
        if (seenIds.has(activityId)) {
          return false; // Skip duplicate
        }
        seenIds.add(activityId);
        return true;
      });
      return deduplicated;
    }
  }, [showApplications, allApplicationsActivities, openActivities, historyActivities]);

  // Get all applications for the sub-section (pending, accepted, rejected)
  const allApplications = useMemo(() => {
    if (showApplications) {
      return []; // Don't show in applications view
    }
    // Show all applications (pending, accepted, rejected) with valid activity data
    return applicationsWithActivities
      .filter(app => app.activity !== null)
      .map(app => ({
        ...app.activity,
        applicationStatus: app.status,
        applicationId: app.id,
        applicationData: app,
        appliedAt: app.createdAt
      }));
  }, [showApplications, applicationsWithActivities]);

  // Extract available categories from activities
  const availableCategories = useMemo(() => {
    const cats = new Set();
    allActivitiesForView.forEach((activity) => {
      if (activity.category) cats.add(activity.category);
    });
    return Array.from(cats).sort();
  }, [allActivitiesForView]);

  // Filter activities based on filters
  const filteredActivities = useMemo(() => {
    let filtered = [...allActivitiesForView];

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
  }, [allActivitiesForView, filters]);

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

  // Handle application card click - show action buttons for applications
  const handleApplicationCardClick = (activity) => {
    // If activity has applicationStatus, it's an application (from applications view or pending sub-section)
    if (activity.applicationStatus || showApplications) {
      setSelectedApplicationActivity(activity);
      setShowActionModal(true);
    } else {
      // For non-application views, just open activity modal
      // Use activityId if available (for history activities), otherwise use id
      const activityIdToUse = activity.activityId || activity.id;
      setSelectedActivityId(activityIdToUse);
      setShowActivityModal(true);
    }
  };

  // Handle viewing activity from application
  const handleViewActivity = () => {
    if (selectedApplicationActivity) {
      // Use activityId if available (for history activities), otherwise use id
      const activityIdToUse = selectedApplicationActivity.activityId || selectedApplicationActivity.id;
      setSelectedActivityId(activityIdToUse);
      setShowActivityModal(true);
      setShowActionModal(false);
    }
  };

  // Handle viewing application details
  const handleViewApplication = () => {
    setShowApplicationModal(true);
    setShowActionModal(false);
  };

  // Handle application updated (after cancellation)
  const handleApplicationUpdated = (applicationId, newStatus) => {
    // Update the application status in the local state
    const updatedApplications = applicationsWithActivities.map(app => {
      if (app.id === applicationId) {
        return { ...app, status: newStatus };
      }
      return app;
    });
    setApplicationsWithActivities(updatedApplications);

    // Update the displayed activities
    const updatedActivities = allApplicationsActivities.map(activity => {
      if (activity.applicationId === applicationId) {
        return { ...activity, applicationStatus: newStatus };
      }
      return activity;
    });
    setAllApplicationsActivities(updatedActivities);

    // If current view is applications, update it
    if (showApplications) {
      setVolunteerActivities(updatedActivities);
    }

    // Refresh applications list
    const refreshApplications = async () => {
      try {
        const userApplications = await fetchApplicationsByUserId(user.uid);
        const appsWithActivities = await Promise.all(
          userApplications.map(async (app) => {
            try {
              const activity = await fetchActivityById(app.activityId);
              if (activity) {
                return {
                  ...app,
                  activity: activity
                };
              }
              return { ...app, activity: null };
            } catch (error) {
              console.error(`Error fetching activity ${app.activityId}:`, error);
              return { ...app, activity: null };
            }
          })
        );

        const sortedApps = appsWithActivities.sort((a, b) => {
          const aActivityStatus = a.activity?.status || '';
          const bActivityStatus = b.activity?.status || '';
          
          if (aActivityStatus === 'Open' && bActivityStatus !== 'Open') return -1;
          if (aActivityStatus !== 'Open' && bActivityStatus === 'Open') return 1;
          
          const statusOrder = { 'pending': 0, 'accepted': 1, 'rejected': 2 };
          const aStatusOrder = statusOrder[a.status] ?? 3;
          const bStatusOrder = statusOrder[b.status] ?? 3;
          
          if (aStatusOrder !== bStatusOrder) {
            return aStatusOrder - bStatusOrder;
          }
          
          const aDate = a.createdAt?.getTime?.() || 0;
          const bDate = b.createdAt?.getTime?.() || 0;
          return bDate - aDate;
        });

        setApplicationsWithActivities(sortedApps);
        
        if (showApplications) {
          const activitiesToShow = sortedApps
            .filter(app => app.activity !== null)
            .map(app => ({
              ...app.activity,
              applicationStatus: app.status,
              applicationId: app.id,
              applicationData: app, // Store full application data
              appliedAt: app.createdAt
            }));
          setAllApplicationsActivities(activitiesToShow);
          setVolunteerActivities(activitiesToShow);
        }
      } catch (error) {
        console.error('Error refreshing applications:', error);
      }
    };

    refreshApplications();
  };

  // Handle clicking on Applications card to show all applications
  const handleApplicationsCardClick = () => {
    if (showApplications) {
      // Switch back to activities view
      const allActivitiesForDisplay = [...openActivities, ...historyActivities];
      setVolunteerActivities(allActivitiesForDisplay);
      setShowApplications(false);
      // Reset filters
      setFilters({ type: 'all', category: 'all', status: 'all' });
    } else {
      // Convert applications with activities to display format
      const activitiesToShow = applicationsWithActivities
        .filter(app => app.activity !== null)
        .map(app => ({
          ...app.activity,
          applicationStatus: app.status,
          applicationId: app.id, // Store user's application document ID
          applicationData: app, // Store full application data for easy access
          appliedAt: app.createdAt
        }));
      
      setAllApplicationsActivities(activitiesToShow);
      setVolunteerActivities(activitiesToShow);
      setShowApplications(true);
      // Reset filters
      setFilters({ type: 'all', category: 'all', status: 'all' });
    }
  };

  // Get application status badge
  const getApplicationStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return <Badge color="success" icon={HiCheck}>{t('statusAccepted') || 'Accepted'}</Badge>;
      case 'rejected':
        return <Badge color="failure" icon={HiX}>{t('statusRejected') || 'Rejected'}</Badge>;
      case 'cancelled':
        return <Badge color="gray" icon={HiX}>{t('statusCancelled') || 'Cancelled'}</Badge>;
      default:
        return <Badge color="warning" icon={HiClock}>{t('statusPending') || 'Pending'}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 bg-background-page dark:bg-background-page min-h-screen">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 dark:border-primary-400"></div>
        </div>
      ) : (
        <>
          {/* Profile Section with Gamification */}
          <div className="mb-6 sm:mb-8">
            <Card className="bg-background-card dark:bg-background-card border-2 border-primary-200 dark:border-primary-700 shadow-lg">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                {/* Profile Picture */}
                <div
                  className="relative cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => user?.uid && setShowProfileModal(true)}
                >
                  {profilePicture ? (
                    <Image
                      src={profilePicture}
                      alt={displayName}
                      width={100}
                      height={100}
                      className="rounded-full border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="rounded-full bg-primary-500 dark:bg-primary-600 w-24 h-24 flex items-center justify-center border-4 border-white dark:border-neutral-800 shadow-lg">
                      <HiUser className="w-12 h-12 text-white" />
                    </div>
                  )}
                </div>

                {/* Profile Info and Gamification */}
                <div className="flex-1 w-full sm:w-auto text-center sm:text-left">
                  <h1
                    className="text-2xl sm:text-3xl font-bold text-text-primary dark:text-text-primary mb-2 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    onClick={() => user?.uid && setShowProfileModal(true)}
                  >
                    {displayName}
                  </h1>
                  
                  {/* User Code */}
                  {userCode && (
                    <div className="mb-4 flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-sm sm:text-base text-text-secondary dark:text-text-secondary font-mono font-semibold">
                        {t('code') || 'Code'}: {userCode}
                      </span>
                      <Button
                        size="xs"
                        color="gray"
                        onClick={handleCopyCode}
                        className="p-1.5"
                        title={t('copyCode') || 'Copy code'}
                      >
                        <HiClipboardCopy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Level and XP Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg sm:text-xl font-bold text-text-primary dark:text-text-primary">
                          Level {gamificationData.level}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-text-secondary dark:text-text-secondary">
                        <span>{gamificationData.totalXP} XP</span>
                      </div>
                    </div>
                    
                    {/* XP Progress Bar - Clickable */}
                    <div 
                      className="w-full max-w-md mx-auto sm:mx-0 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => router.push('/xp-history')}
                      title={t('viewXpHistory') || 'View XP History'}
                    >
                      <div className="flex justify-between text-xs text-text-secondary dark:text-text-secondary mb-1">
                        <span>{gamificationData.currentXP} / 100 XP</span>
                        <span>{100 - gamificationData.currentXP} XP to next level</span>
                      </div>
                      <Progress 
                        progress={gamificationData.currentXP} 
                        color="blue"
                        size="lg"
                        className="h-3"
                      />
                    </div>
                  </div>

                  {/* Badges Count */}
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <HiBadgeCheck className="w-5 h-5 text-activityType-event-500 dark:text-activityType-event-400" />
                    <span className="text-sm sm:text-base text-text-primary dark:text-text-primary">
                      <span className="font-semibold">{gamificationData.badgesCount}</span> Badges earned
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Stats Section */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 px-1 text-text-primary dark:text-text-primary">
              {t('yourStatistics') || 'Your Statistics'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Local Activities */}
              <div className="bg-background-card dark:bg-background-card rounded-lg shadow-md border border-border-light dark:border-border-dark hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 sm:gap-3 py-1 sm:py-1.5 px-2 sm:px-2.5">
                  <div className="bg-activityType-local-100 dark:bg-activityType-local-900 p-2 rounded-full flex-shrink-0">
                    <HiOfficeBuilding className="h-5 w-5 sm:h-6 sm:w-6 text-activityType-local-600 dark:text-activityType-local-400" />
                  </div>
                  <h2 className="text-xs sm:text-sm font-semibold flex-1 text-text-primary dark:text-text-primary">
                    {t('localActivities') || 'Local Activities'}
                  </h2>
                  <p className="text-xl sm:text-2xl font-bold text-activityType-local-600 dark:text-activityType-local-400 flex-shrink-0">
                    {dynamicStats.local}
                  </p>
                </div>
              </div>

              {/* Online Activities */}
              <div className="bg-background-card dark:bg-background-card rounded-lg shadow-md border border-border-light dark:border-border-dark hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 sm:gap-3 py-1 sm:py-1.5 px-2 sm:px-2.5">
                  <div className="bg-activityType-online-100 dark:bg-activityType-online-900 p-2 rounded-full flex-shrink-0">
                    <MdOutlineSocialDistance className="h-5 w-5 sm:h-6 sm:w-6 text-activityType-online-600 dark:text-activityType-online-400" />
                  </div>
                  <h2 className="text-xs sm:text-sm font-semibold flex-1 text-text-primary dark:text-text-primary">
                    {t('onlineActivities') || 'Online Activities'}
                  </h2>
                  <p className="text-xl sm:text-2xl font-bold text-activityType-online-600 dark:text-activityType-online-400 flex-shrink-0">
                    {dynamicStats.online}
                  </p>
                </div>
              </div>

              {/* Events */}
              <div className="bg-background-card dark:bg-background-card rounded-lg shadow-md border border-border-light dark:border-border-dark hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 sm:gap-3 py-1 sm:py-1.5 px-2 sm:px-2.5">
                  <div className="bg-activityType-event-100 dark:bg-activityType-event-900 p-2 rounded-full flex-shrink-0">
                    <HiCalendar className="h-5 w-5 sm:h-6 sm:w-6 text-activityType-event-600 dark:text-activityType-event-400" />
                  </div>
                  <h2 className="text-xs sm:text-sm font-semibold flex-1 text-text-primary dark:text-text-primary">
                    {t('events') || 'Events'}
                  </h2>
                  <p className="text-xl sm:text-2xl font-bold text-activityType-event-600 dark:text-activityType-event-400 flex-shrink-0">
                    {dynamicStats.event}
                  </p>
                </div>
              </div>

              {/* Total Applications */}
              <div className="bg-background-card dark:bg-background-card rounded-lg shadow-md border border-border-light dark:border-border-dark hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 sm:gap-3 py-1 sm:py-1.5 px-2 sm:px-2.5">
                  <div className="bg-semantic-warning-100 dark:bg-semantic-warning-900 p-2 rounded-full flex-shrink-0">
                    <HiDocumentText className="h-5 w-5 sm:h-6 sm:w-6 text-semantic-warning-600 dark:text-semantic-warning-400" />
                  </div>
                  <h2 className="text-xs sm:text-sm font-semibold flex-1 text-text-primary dark:text-text-primary">
                    {t('totalApplications') || 'Total applications'}
                  </h2>
                  <p className="text-xl sm:text-2xl font-bold text-semantic-warning-600 dark:text-semantic-warning-400 flex-shrink-0">
                    {stats.totalApplications}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Activities Section */}
          <div className="mb-6 sm:mb-10">
            <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 px-1 text-text-primary dark:text-text-primary">
              {showApplications
                ? (t('yourApplications') || 'Your Applications')
                : (t('yourActivities') || 'Your Activities')
              }
            </h2>
            
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
                <span className="font-semibold">{allActivitiesForView.length}</span> {tActivities('activities')}
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

            {sortedActivities.length === 0 ? (
              <p className="text-text-secondary dark:text-text-secondary px-1">
                {showApplications
                  ? (t('noApplicationsFound') || 'No applications found.')
                  : (t('noActivitiesFound') || 'No activities found. Start applying to activities to see them here!')
                }
              </p>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5'>
                {sortedActivities.map((activity) => {
                  // Find the application data for this activity if in applications view
                  const applicationData = showApplications 
                    ? applicationsWithActivities.find(app => app.id === activity.applicationId)
                    : null;

                  return (
                    <div key={activity.id || activity.applicationId} className="relative">
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
                        onClick={() => {
                          if (showApplications) {
                            handleApplicationCardClick(activity);
                          } else {
                            // Use activityId if available (for history activities), otherwise use id
                            const activityIdToUse = activity.activityId || activity.id;
                            setSelectedActivityId(activityIdToUse);
                            setShowActivityModal(true);
                          }
                        }}
                        canEditStatus={false}
                      />
                      {/* Show application status badge if showing applications */}
                      {showApplications && activity.applicationStatus && (
                        <div className="absolute top-3 right-3 z-10">
                          {getApplicationStatusBadge(activity.applicationStatus)}
                        </div>
                      )}

                      {/* Overlay with action buttons for applications */}
                      {showApplications && selectedApplicationActivity && selectedApplicationActivity.id === activity.id && showActionModal && (
                        <div className="absolute inset-0 bg-black bg-opacity-60 rounded-lg flex items-center justify-center z-10 p-3 sm:p-4">
                          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 sm:gap-4 md:gap-6 w-full sm:w-auto">
                            {/* View Activity Button */}
                            <div className="flex flex-col items-center">
                              <button
                                onClick={handleViewActivity}
                                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-lg hover:bg-purple-600 active:bg-purple-700 transition-colors touch-manipulation"
                                aria-label={t('viewActivity') || 'View Activity'}
                              >
                                <HiEye className="h-6 w-6 sm:h-8 sm:w-8" />
                              </button>
                              <span className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-white font-medium">{t('viewActivity') || 'View Activity'}</span>
                            </div>

                            {/* View Application Button */}
                            <div className="flex flex-col items-center">
                              <button
                                onClick={handleViewApplication}
                                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg hover:bg-blue-600 active:bg-blue-700 transition-colors touch-manipulation"
                                aria-label={t('viewMyApplication') || 'View Application'}
                              >
                                <HiDocumentText className="h-6 w-6 sm:h-8 sm:w-8" />
                              </button>
                              <span className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-white font-medium">{t('viewMyApplication') || 'View Application'}</span>
                            </div>
                          </div>
                          
                          {/* Close button */}
                          <button
                            onClick={() => {
                              setShowActionModal(false);
                              setSelectedApplicationActivity(null);
                            }}
                            className="absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-600 text-white flex items-center justify-center hover:bg-gray-700 active:bg-gray-800 transition-colors text-lg sm:text-xl touch-manipulation"
                            aria-label={t('close') || 'Close'}
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* My Applications Sub-section - Show all applications when not in applications view */}
          {!showApplications && allApplications.length > 0 && (
            <div className="mb-6 sm:mb-10">
              <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 px-1">
                {t('myApplications') || 'My Applications'}
              </h2>
              <p className="text-sm text-gray-600 mb-4 px-1">
                {t('allApplicationsDescription') || 'All your applications'}
              </p>
              
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5'>
                {allApplications.map((activity) => {
                  const applicationData = applicationsWithActivities.find(app => app.id === activity.applicationId);

                  return (
                    <div key={activity.applicationId} className="relative">
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
                        onClick={() => {
                          handleApplicationCardClick(activity);
                        }}
                        canEditStatus={false}
                      />
                      {/* Show pending status badge */}
                      {activity.applicationStatus && (
                        <div className="absolute top-3 right-3 z-10">
                          {getApplicationStatusBadge(activity.applicationStatus)}
                        </div>
                      )}

                      {/* Overlay with action buttons */}
                      {selectedApplicationActivity && selectedApplicationActivity.id === activity.id && showActionModal && (
                        <div className="absolute inset-0 bg-black bg-opacity-60 rounded-lg flex items-center justify-center z-10 p-3 sm:p-4">
                          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 sm:gap-4 md:gap-6 w-full sm:w-auto">
                            {/* View Activity Button */}
                            <div className="flex flex-col items-center">
                              <button
                                onClick={handleViewActivity}
                                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-lg hover:bg-purple-600 active:bg-purple-700 transition-colors touch-manipulation"
                                aria-label={t('viewActivity') || 'View Activity'}
                              >
                                <HiEye className="h-6 w-6 sm:h-8 sm:w-8" />
                              </button>
                              <span className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-white font-medium">{t('viewActivity') || 'View Activity'}</span>
                            </div>

                            {/* View Application Button */}
                            <div className="flex flex-col items-center">
                              <button
                                onClick={handleViewApplication}
                                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg hover:bg-blue-600 active:bg-blue-700 transition-colors touch-manipulation"
                                aria-label={t('viewMyApplication') || 'View Application'}
                              >
                                <HiDocumentText className="h-6 w-6 sm:h-8 sm:w-8" />
                              </button>
                              <span className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-white font-medium">{t('viewMyApplication') || 'View Application'}</span>
                            </div>
                          </div>
                          
                          {/* Close button */}
                          <button
                            onClick={() => {
                              setShowActionModal(false);
                              setSelectedApplicationActivity(null);
                            }}
                            className="absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-600 text-white flex items-center justify-center hover:bg-gray-700 active:bg-gray-800 transition-colors text-lg sm:text-xl touch-manipulation"
                            aria-label={t('close') || 'Close'}
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Badges Section */}
          <div className="mb-6 sm:mb-10">
            <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 px-1">
              {t('yourBadges') || 'Your Badges'}
            </h2>
            <BadgeList userId={user?.uid} />
          </div>

          {/* Activity Details Modal */}
          <ActivityDetailsModal
            isOpen={showActivityModal}
            onClose={() => {
              setShowActivityModal(false);
              setSelectedActivityId(null);
            }}
            activityId={selectedActivityId}
          />

          {/* View Application Modal */}
          {selectedApplicationActivity && showApplicationModal && (
            <ViewApplicationModal
              isOpen={showApplicationModal}
              onClose={() => {
                setShowApplicationModal(false);
                setSelectedApplicationActivity(null);
              }}
              application={selectedApplicationActivity.applicationData || 
                (selectedApplicationActivity.applicationId 
                  ? applicationsWithActivities.find(app => app.id === selectedApplicationActivity.applicationId)
                  : null)
              }
              activityId={selectedApplicationActivity.id}
              onApplicationUpdated={handleApplicationUpdated}
            />
          )}

          {/* Toast Notification */}
          {showToast && (
            <div className="fixed bottom-16 sm:bottom-5 right-4 sm:right-5 left-4 sm:left-auto z-[60] max-w-sm sm:max-w-none">
              <Toast onClose={() => setShowToast(false)}>
                {toastMessage.type === 'success' && (
                  <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-500">
                    ✓
                  </div>
                )}
                {toastMessage.type === 'error' && (
                  <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-500">
                    !
                  </div>
                )}
                <div className="ml-3 text-sm font-normal break-words">
                  {toastMessage.message}
                </div>
                <Toast.Toggle onClose={() => setShowToast(false)} />
              </Toast>
            </div>
          )}

          {/* QR Code Scanner Floating Button */}
          <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50">
            <button
              onClick={() => setShowQRScanner(true)}
              className="bg-blue-500 text-white text-xl sm:text-2xl w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg hover:bg-blue-600 active:bg-blue-700 transition-colors touch-manipulation flex items-center justify-center"
              aria-label="Scan QR Code"
            >
              <HiQrcode className="h-6 w-6 sm:h-7 sm:w-7" />
            </button>
          </div>

          {/* QR Code Scanner Modal */}
          <QRCodeScanner
            isOpen={showQRScanner}
            onClose={() => setShowQRScanner(false)}
            onScanSuccess={({ activityId, token, url }) => {
              setShowQRScanner(false);
              // Use replace instead of push to avoid adding to history
              router.replace(`/validate-activity?activityId=${activityId}&token=${token}`);
            }}
          />

          {/* Activity Validation Success Modal */}
          <ActivityValidationSuccessModal
            show={showValidationModal}
            onClose={() => {
              setShowValidationModal(false);
              setValidationResult(null);
            }}
            xpReward={validationResult?.xpReward || 0}
            badges={validationResult?.badges || []}
            activityTitle={validationResult?.activityTitle || ''}
          />

          {/* Public Profile Modal */}
          <PublicProfileModal
            isOpen={showProfileModal}
            onClose={() => setShowProfileModal(false)}
            userId={user?.uid}
            isOwnProfile={true}
          />
        </>
      )}
    </div>
  );
}