"use client";

import { Card, Progress, Toast, Badge, Button } from "flowbite-react";
import { 
  HiUser, 
  HiOfficeBuilding, 
  HiCalendar, 
  HiDocumentText,
  HiStar,
  HiBadgeCheck,
  HiLockClosed,
  HiCheck,
  HiX,
  HiClock,
  HiClipboardCopy,
  HiEye,
  HiPencil
} from "react-icons/hi";
import { MdOutlineSocialDistance } from "react-icons/md";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/utils/auth/AuthContext";
import { fetchMemberById } from "@/utils/crudMemberProfile";
import { fetchApplicationsByUserId, fetchActivitiesForVolunteer } from "@/utils/crudApplications";
import { fetchHistoryActivities, fetchActivityById } from "@/utils/crudActivities";
import { useTranslations } from "next-intl";
import ActivityCard from "@/components/activities/ActivityCard";
import ActivityDetailsModal from "@/components/activities/ActivityDetailsModal";
import ViewApplicationModal from "@/components/activities/ViewApplicationModal";
import BadgeList from "@/components/badges/BadgeList";
import Image from "next/image";

export default function DashboardPage() {
  const t = useTranslations('Dashboard');
  const router = useRouter();
  const { user, claims } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [applications, setApplications] = useState([]);
  const [volunteerActivities, setVolunteerActivities] = useState([]);
  const [historyActivities, setHistoryActivities] = useState([]);
  const [openActivities, setOpenActivities] = useState([]);
  const [allApplicationsActivities, setAllApplicationsActivities] = useState([]);
  const [showClosedActivities, setShowClosedActivities] = useState(false);
  const [showApplications, setShowApplications] = useState(false);
  const [applicationsWithActivities, setApplicationsWithActivities] = useState([]);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState(null); // 'local', 'online', 'event', or null
  const [selectedApplicationActivity, setSelectedApplicationActivity] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [stats, setStats] = useState({
    totalLocalActivities: 0,
    totalOnlineActivities: 0,
    totalEvents: 0,
    totalApplications: 0,
    closedActivities: 0
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ type: '', message: '' });
  
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
        setVolunteerActivities(open);

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

  // Handle clicking on Closed card to show closed activities
  const handleClosedCardClick = () => {
    if (showClosedActivities) {
      // Switch back to open activities
      setVolunteerActivities(openActivities);
      setShowClosedActivities(false);
      setShowApplications(false);
      setSelectedTypeFilter(null);
    } else {
      // Show closed activities from history
      setVolunteerActivities(historyActivities);
      setShowClosedActivities(true);
      setShowApplications(false);
      setSelectedTypeFilter(null);
    }
  };

  // Handle clicking on type filter cards (Local, Online, Events)
  const handleTypeFilterClick = (type) => {
    // Determine source activities based on current view
    let sourceActivities = [];
    if (showApplications) {
      sourceActivities = allApplicationsActivities;
    } else if (showClosedActivities) {
      sourceActivities = historyActivities;
    } else {
      sourceActivities = openActivities;
    }

    // Toggle filter: if clicking the same type, remove filter
    if (selectedTypeFilter === type) {
      setSelectedTypeFilter(null);
      setVolunteerActivities(sourceActivities);
    } else {
      // Apply filter
      setSelectedTypeFilter(type);
      const filtered = sourceActivities.filter(a => a.type === type);
      setVolunteerActivities(filtered);
    }
  };

  // Calculate dynamic stats based on current view
  const getDynamicStats = () => {
    let activitiesToCount = [];
    if (showApplications) {
      activitiesToCount = allApplicationsActivities;
    } else if (showClosedActivities) {
      activitiesToCount = historyActivities;
    } else {
      activitiesToCount = openActivities;
    }

    return {
      local: activitiesToCount.filter(a => a.type === 'local').length,
      online: activitiesToCount.filter(a => a.type === 'online').length,
      event: activitiesToCount.filter(a => a.type === 'event').length
    };
  };

  const dynamicStats = getDynamicStats();

  // Handle application card click - show action buttons for applications
  const handleApplicationCardClick = (activity) => {
    if (showApplications) {
      setSelectedApplicationActivity(activity);
      setShowActionModal(true);
    } else {
      // For non-application views, just open activity modal
      setSelectedActivityId(activity.id);
      setShowActivityModal(true);
    }
  };

  // Handle viewing activity from application
  const handleViewActivity = () => {
    if (selectedApplicationActivity) {
      setSelectedActivityId(selectedApplicationActivity.id);
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
      // Switch back to open activities
      setVolunteerActivities(openActivities);
      setShowApplications(false);
      setShowClosedActivities(false);
      setSelectedTypeFilter(null);
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
      setShowClosedActivities(false);
      setSelectedTypeFilter(null);
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
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Profile Section with Gamification */}
          <div className="mb-6 sm:mb-8">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-200">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                {/* Profile Picture */}
                <div className="relative">
                  {profilePicture ? (
                    <Image
                      src={profilePicture}
                      alt={displayName}
                      width={100}
                      height={100}
                      className="rounded-full border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="rounded-full bg-indigo-500 w-24 h-24 flex items-center justify-center border-4 border-white shadow-lg">
                      <HiUser className="w-12 h-12 text-white" />
                    </div>
                  )}
                </div>

                {/* Profile Info and Gamification */}
                <div className="flex-1 w-full sm:w-auto text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{displayName}</h1>
                  
                  {/* User Code */}
                  {userCode && (
                    <div className="mb-4 flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-sm sm:text-base text-gray-600 font-mono font-semibold">
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
                        <HiStar className="w-6 h-6 text-yellow-500" />
                        <span className="text-lg sm:text-xl font-bold text-gray-800">
                          Level {gamificationData.level}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <span>{gamificationData.totalXP} XP</span>
                      </div>
                    </div>
                    
                    {/* XP Progress Bar - Clickable */}
                    <div 
                      className="w-full max-w-md mx-auto sm:mx-0 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => router.push('/xp-history')}
                      title={t('viewXpHistory') || 'View XP History'}
                    >
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
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
                    <HiBadgeCheck className="w-5 h-5 text-purple-600" />
                    <span className="text-sm sm:text-base text-gray-700">
                      <span className="font-semibold">{gamificationData.badgesCount}</span> Badges earned
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Stats Section */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 px-1 text-gray-700">
              {t('yourStatistics') || 'Your Statistics'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {/* Local Activities */}
              <Card 
                className={`hover:shadow-lg transition-all cursor-pointer touch-manipulation ${
                  selectedTypeFilter === 'local' 
                    ? 'ring-4 ring-green-400 shadow-xl scale-105' 
                    : 'shadow-md'
                }`}
                onClick={() => handleTypeFilterClick('local')}
              >
                <div className="flex flex-col items-center p-2 sm:p-3">
                  <div className={`p-2 rounded-full mb-2 transition-colors ${
                    selectedTypeFilter === 'local' 
                      ? 'bg-green-500' 
                      : 'bg-green-100'
                  }`}>
                    <HiOfficeBuilding className={`h-5 w-5 sm:h-6 sm:w-6 ${
                      selectedTypeFilter === 'local' 
                        ? 'text-white' 
                        : 'text-green-600'
                    }`} />
                  </div>
                  <h2 className="text-xs sm:text-sm font-semibold mb-1 text-center">
                    {t('localActivities') || 'Local Activities'}
                  </h2>
                  <p className={`text-xl sm:text-2xl font-bold text-center ${
                    selectedTypeFilter === 'local' 
                      ? 'text-green-800' 
                      : 'text-green-600'
                  }`}>
                    {dynamicStats.local}
                  </p>
                </div>
              </Card>

              {/* Online Activities */}
              <Card 
                className={`hover:shadow-lg transition-all cursor-pointer touch-manipulation ${
                  selectedTypeFilter === 'online' 
                    ? 'ring-4 ring-blue-400 shadow-xl scale-105' 
                    : 'shadow-md'
                }`}
                onClick={() => handleTypeFilterClick('online')}
              >
                <div className="flex flex-col items-center p-2 sm:p-3">
                  <div className={`p-2 rounded-full mb-2 transition-colors ${
                    selectedTypeFilter === 'online' 
                      ? 'bg-blue-500' 
                      : 'bg-blue-100'
                  }`}>
                    <MdOutlineSocialDistance className={`h-5 w-5 sm:h-6 sm:w-6 ${
                      selectedTypeFilter === 'online' 
                        ? 'text-white' 
                        : 'text-blue-600'
                    }`} />
                  </div>
                  <h2 className="text-xs sm:text-sm font-semibold mb-1 text-center">
                    {t('onlineActivities') || 'Online Activities'}
                  </h2>
                  <p className={`text-xl sm:text-2xl font-bold text-center ${
                    selectedTypeFilter === 'online' 
                      ? 'text-blue-800' 
                      : 'text-blue-600'
                  }`}>
                    {dynamicStats.online}
                  </p>
                </div>
              </Card>

              {/* Events */}
              <Card 
                className={`hover:shadow-lg transition-all cursor-pointer touch-manipulation ${
                  selectedTypeFilter === 'event' 
                    ? 'ring-4 ring-purple-400 shadow-xl scale-105' 
                    : 'shadow-md'
                }`}
                onClick={() => handleTypeFilterClick('event')}
              >
                <div className="flex flex-col items-center p-2 sm:p-3">
                  <div className={`p-2 rounded-full mb-2 transition-colors ${
                    selectedTypeFilter === 'event' 
                      ? 'bg-purple-500' 
                      : 'bg-purple-100'
                  }`}>
                    <HiCalendar className={`h-5 w-5 sm:h-6 sm:w-6 ${
                      selectedTypeFilter === 'event' 
                        ? 'text-white' 
                        : 'text-purple-600'
                    }`} />
                  </div>
                  <h2 className="text-xs sm:text-sm font-semibold mb-1 text-center">
                    {t('events') || 'Events'}
                  </h2>
                  <p className={`text-xl sm:text-2xl font-bold text-center ${
                    selectedTypeFilter === 'event' 
                      ? 'text-purple-800' 
                      : 'text-purple-600'
                  }`}>
                    {dynamicStats.event}
                  </p>
                </div>
              </Card>

              {/* Total Applications */}
              <Card 
                className={`hover:shadow-lg transition-all cursor-pointer touch-manipulation ${
                  showApplications 
                    ? 'ring-4 ring-yellow-400 shadow-xl scale-105' 
                    : 'shadow-md'
                }`}
                onClick={handleApplicationsCardClick}
              >
                <div className="flex flex-col items-center p-2 sm:p-3">
                  <div className={`p-2 rounded-full mb-2 transition-colors ${
                    showApplications 
                      ? 'bg-yellow-500' 
                      : 'bg-yellow-100'
                  }`}>
                    <HiDocumentText className={`h-5 w-5 sm:h-6 sm:w-6 ${
                      showApplications 
                        ? 'text-white' 
                        : 'text-yellow-600'
                    }`} />
                  </div>
                  <h2 className="text-xs sm:text-sm font-semibold mb-1 text-center">
                    {t('totalApplications') || 'Applications'}
                  </h2>
                  <p className={`text-xl sm:text-2xl font-bold text-center ${
                    showApplications 
                      ? 'text-yellow-800' 
                      : 'text-yellow-600'
                  }`}>
                    {stats.totalApplications}
                  </p>
                </div>
              </Card>

              {/* Closed Activities */}
              <Card 
                className={`hover:shadow-lg transition-all cursor-pointer touch-manipulation ${
                  showClosedActivities 
                    ? 'ring-4 ring-gray-400 shadow-xl scale-105' 
                    : 'shadow-md'
                }`}
                onClick={handleClosedCardClick}
              >
                <div className="flex flex-col items-center p-2 sm:p-3">
                  <div className={`p-2 rounded-full mb-2 transition-colors ${
                    showClosedActivities 
                      ? 'bg-gray-500' 
                      : 'bg-gray-100'
                  }`}>
                    <HiLockClosed className={`h-5 w-5 sm:h-6 sm:w-6 ${
                      showClosedActivities 
                        ? 'text-white' 
                        : 'text-gray-600'
                    }`} />
                  </div>
                  <h2 className="text-xs sm:text-sm font-semibold mb-1 text-center">
                    {t('closedActivities') || 'Closed'}
                  </h2>
                  <p className={`text-xl sm:text-2xl font-bold text-center ${
                    showClosedActivities 
                      ? 'text-gray-800' 
                      : 'text-gray-600'
                  }`}>
                    {stats.closedActivities}
                  </p>
                </div>
        </Card>
            </div>
          </div>

          {/* Activities Section */}
          <div className="mb-6 sm:mb-10">
            <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 px-1">
              {showApplications
                ? (t('yourApplications') || 'Your Applications')
                : showClosedActivities 
                  ? (t('closedActivities') || 'Closed Activities')
                  : (t('yourActivities') || 'Your Activities')
              }
            </h2>
            {volunteerActivities.length === 0 ? (
              <p className="text-gray-600 px-1">
                {showApplications
                  ? (t('noApplicationsFound') || 'No applications found.')
                  : showClosedActivities
                    ? (t('noClosedActivitiesFound') || 'No closed activities found in your history.')
                    : (t('noActivitiesFound') || 'No activities found. Start applying to activities to see them here!')
                }
              </p>
            ) : (
              <div className='flex flex-wrap justify-center gap-4 sm:gap-6'>
                {volunteerActivities.map((activity) => {
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
                        onClick={() => {
                          if (showApplications) {
                            handleApplicationCardClick(activity);
                          } else {
                            setSelectedActivityId(activity.id);
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
        </>
      )}
    </div>
  );
}