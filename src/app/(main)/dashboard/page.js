"use client";

import { Card, Avatar, Progress, Toast } from "flowbite-react";
import { 
  HiUser, 
  HiOfficeBuilding, 
  HiCalendar, 
  HiDocumentText,
  HiStar,
  HiBadgeCheck,
  HiLockClosed
} from "react-icons/hi";
import { MdOutlineSocialDistance } from "react-icons/md";
import { useEffect, useState } from "react";
import { useAuth } from "@/utils/auth/AuthContext";
import { fetchMemberById } from "@/utils/crudMemberProfile";
import { fetchApplicationsByUserId, fetchActivitiesForVolunteer } from "@/utils/crudApplications";
import { fetchHistoryActivities } from "@/utils/crudActivities";
import { useTranslations } from "next-intl";
import ActivityCard from "@/components/activities/ActivityCard";
import Image from "next/image";

export default function DashboardPage() {
  const t = useTranslations('Dashboard');
  const { user, claims } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [applications, setApplications] = useState([]);
  const [volunteerActivities, setVolunteerActivities] = useState([]);
  const [historyActivities, setHistoryActivities] = useState([]);
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

        // Fetch volunteer activities (accepted applications)
        const activities = await fetchActivitiesForVolunteer(user.uid);
        
        // Fetch history activities (closed activities)
        const history = await fetchHistoryActivities(user.uid);
        setHistoryActivities(history);
        
        // Filter activities to show only Open activities with accepted applications
        const openActivities = activities.filter(a => a.status === 'Open');
        setVolunteerActivities(openActivities);

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
        setGamificationData(prev => ({
          ...prev,
          badgesCount: completedActivities.length // Placeholder: badges count
        }));

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
      const totalXP = profileData.xp || profileData.totalXP || profileData.experiencePoints || 0;
      
      // Calculate level based on XP (100 XP per level)
      const level = Math.floor(totalXP / 100) + 1;
      const currentXP = totalXP % 100;

      // Read badges count from profile if available, otherwise use 0 as default
      const badgesCount = profileData.badgesCount || profileData.badges?.length || 0;

      setGamificationData(prev => ({
        level,
        currentXP,
        totalXP,
        badgesCount: badgesCount || prev.badgesCount || 0
      }));
    }
  }, [profileData]);

  const profilePicture = profileData?.profilePicture || user?.photoURL || null;
  const displayName = profileData?.displayName || user?.displayName || user?.email || 'Volunteer';

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
                    <Avatar
                      alt={displayName}
                      rounded
                      size="xl"
                      className="border-4 border-white shadow-lg"
                    >
                      <div className="rounded-full bg-indigo-500 w-24 h-24 flex items-center justify-center">
                        <HiUser className="w-12 h-12 text-white" />
                      </div>
                    </Avatar>
                  )}
                </div>

                {/* Profile Info and Gamification */}
                <div className="flex-1 w-full sm:w-auto text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{displayName}</h1>
                  
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
                    
                    {/* XP Progress Bar */}
                    <div className="w-full max-w-md mx-auto sm:mx-0">
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
              <Card className="hover:shadow-lg transition-shadow">
                <div className="flex flex-col items-center p-2 sm:p-3">
                  <div className="bg-green-100 p-2 rounded-full mb-2">
                    <HiOfficeBuilding className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                  <h2 className="text-xs sm:text-sm font-semibold mb-1 text-center">
                    {t('localActivities') || 'Local Activities'}
                  </h2>
                  <p className="text-xl sm:text-2xl font-bold text-green-600 text-center">
                    {stats.totalLocalActivities}
                  </p>
                </div>
              </Card>

              {/* Online Activities */}
              <Card className="hover:shadow-lg transition-shadow">
                <div className="flex flex-col items-center p-2 sm:p-3">
                  <div className="bg-blue-100 p-2 rounded-full mb-2">
                    <MdOutlineSocialDistance className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <h2 className="text-xs sm:text-sm font-semibold mb-1 text-center">
                    {t('onlineActivities') || 'Online Activities'}
                  </h2>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600 text-center">
                    {stats.totalOnlineActivities}
                  </p>
                </div>
              </Card>

              {/* Events */}
              <Card className="hover:shadow-lg transition-shadow">
                <div className="flex flex-col items-center p-2 sm:p-3">
                  <div className="bg-purple-100 p-2 rounded-full mb-2">
                    <HiCalendar className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                  </div>
                  <h2 className="text-xs sm:text-sm font-semibold mb-1 text-center">
                    {t('events') || 'Events'}
                  </h2>
                  <p className="text-xl sm:text-2xl font-bold text-purple-600 text-center">
                    {stats.totalEvents}
                  </p>
                </div>
              </Card>

              {/* Total Applications */}
              <Card className="hover:shadow-lg transition-shadow">
                <div className="flex flex-col items-center p-2 sm:p-3">
                  <div className="bg-yellow-100 p-2 rounded-full mb-2">
                    <HiDocumentText className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
                  </div>
                  <h2 className="text-xs sm:text-sm font-semibold mb-1 text-center">
                    {t('totalApplications') || 'Applications'}
                  </h2>
                  <p className="text-xl sm:text-2xl font-bold text-yellow-600 text-center">
                    {stats.totalApplications}
                  </p>
                </div>
              </Card>

              {/* Closed Activities */}
              <Card className="hover:shadow-lg transition-shadow">
                <div className="flex flex-col items-center p-2 sm:p-3">
                  <div className="bg-gray-100 p-2 rounded-full mb-2">
                    <HiLockClosed className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                  </div>
                  <h2 className="text-xs sm:text-sm font-semibold mb-1 text-center">
                    {t('closedActivities') || 'Closed'}
                  </h2>
                  <p className="text-xl sm:text-2xl font-bold text-gray-600 text-center">
                    {stats.closedActivities}
                  </p>
                </div>
              </Card>
            </div>
          </div>

          {/* Activities Section */}
          <div className="mb-6 sm:mb-10">
            <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 px-1">
              {t('yourActivities') || 'Your Activities'}
            </h2>
            {volunteerActivities.length === 0 ? (
              <p className="text-gray-600 px-1">
                {t('noActivitiesFound') || 'No activities found. Start applying to activities to see them here!'}
              </p>
            ) : (
              <div className='flex flex-wrap justify-center gap-4 sm:gap-6'>
                {volunteerActivities.map((activity) => (
                  <ActivityCard
                    key={activity.id}
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
                      // Navigate to activity details or handle click
                      console.log('Activity clicked:', activity.id);
                    }}
                    canEditStatus={false}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Badges Section - Placeholder */}
          <div className="mb-6 sm:mb-10">
            <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 px-1">
              {t('yourBadges') || 'Your Badges'}
            </h2>
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
              <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                <HiBadgeCheck className="w-16 h-16 sm:w-20 sm:h-20 text-purple-400 mb-4" />
                <p className="text-lg sm:text-xl text-gray-600 font-medium text-center">
                  {t('badgesComingSoon') || 'Badges system coming soon!'}
                </p>
                <p className="text-sm sm:text-base text-gray-500 text-center mt-2">
                  {t('badgesPlaceholder') || 'Earn badges by completing activities and reaching milestones.'}
                </p>
              </div>
            </Card>
          </div>

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