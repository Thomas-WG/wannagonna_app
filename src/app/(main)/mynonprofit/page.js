"use client";

import { Card, Toast } from "flowbite-react";
import { HiUsers, HiOfficeBuilding, HiCalendar, HiDocumentText, HiPencil, HiTrash, HiEye, HiUserGroup } from "react-icons/hi";
import { MdOutlineSocialDistance } from "react-icons/md";
import { useEffect, useState } from "react";
import { useAuth } from "@/utils/auth/AuthContext";
import { fetchOrganizationById } from "@/utils/crudOrganizations";
import { useRouter } from "next/navigation";
import { fetchActivitiesByCriteria, deleteActivity } from "@/utils/crudActivities";
import ActivityCard from "@/components/activities/ActivityCard";
import DeleteActivityModal from "@/components/activities/DeleteActivityModal";
import ReviewApplicationsModal from "@/components/activities/ReviewApplicationsModal";

export default function MyNonProfitDashboard() {
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
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ type: '', message: '' });

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
            setOrgData(orgData);
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
          setOrgActivities(results || []);
        } catch (error) {
          console.error("Error fetching organization activities:", error);
          setOrgActivities([]);
        } finally {
          setLoadingActivities(false);
        }
      } else {
        setLoadingActivities(false);
      }
    };
    fetchActivities();
  }, [claims]);

  const handleActivityCardClick = (activity) => {
    setSelectedActivity(activity);
    setShowActionModal(true);
  };

  const handleEditActivity = () => {
    setShowActionModal(false);
    router.push(`/activities/manage?activityId=${selectedActivity.id}`);
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
      setOrgActivities(results || []);
      
      // Refresh organization data to update activity counts
      const orgData = await fetchOrganizationById(claims.npoId);
      if (orgData) {
        setOrgData(orgData);
      }
      
      setShowDeleteModal(false);
      setSelectedActivity(null);
      
      // Show success toast
      const message = deletedCount > 1 
        ? `Successfully deleted ${deletedCount} activities!`
        : 'Activity deleted successfully!';
      setToastMessage({ type: 'success', message });
      setShowToast(true);
    } catch (error) {
      console.error("Error refreshing activities:", error);
      // Show error toast
      setToastMessage({ type: 'error', message: 'Error refreshing activities. Please try again.' });
      setShowToast(true);
    }
  };

  const handleReviewApplications = () => {
    setShowActionModal(false);
    setShowReviewModal(true);
  };

  const handleViewActivity = () => {
    setShowActionModal(false);
    router.push(`/activities/${selectedActivity.id}`);
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
          {/* Online Activities Card */}
          <Card 
            className="w-[calc(50%-0.375rem)] sm:w-36 hover:shadow-lg transition-shadow"
          >
            <div className="flex flex-col items-center p-2 sm:p-3">
              <div className="bg-blue-100 p-2 rounded-full mb-2">
                <MdOutlineSocialDistance className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <h2 className="text-xs sm:text-sm font-semibold mb-1 text-center">Online Activities</h2>
              <p className="text-xl sm:text-2xl font-bold text-blue-600 text-center">{orgData.totalOnlineActivities}</p>
            </div>
          </Card>

          {/* Local Activities Card */}
          <Card 
            className="w-[calc(50%-0.375rem)] sm:w-36 hover:shadow-lg transition-shadow"
          >
            <div className="flex flex-col items-center p-2 sm:p-3">
              <div className="bg-green-100 p-2 rounded-full mb-2">
                <HiOfficeBuilding className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <h2 className="text-xs sm:text-sm font-semibold mb-1 text-center">Local Activities</h2>
              <p className="text-xl sm:text-2xl font-bold text-green-600 text-center">{orgData.totalLocalActivities}</p>
            </div>
          </Card>

          {/* Total Events Card */}
          <Card className="w-[calc(50%-0.375rem)] sm:w-36 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center p-2 sm:p-3">
              <div className="bg-purple-100 p-2 rounded-full mb-2">
                <HiCalendar className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <h2 className="text-xs sm:text-sm font-semibold mb-1 text-center">Total Events</h2>
              <p className="text-xl sm:text-2xl font-bold text-purple-600 text-center">{orgData.totalEvents}</p>
            </div>
          </Card>

          {/* New Applications Card */}
          <Card 
            className="w-[calc(50%-0.375rem)] sm:w-36 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push('/mynonprofit/activities/applications')}
          >
            <div className="flex flex-col items-center p-2 sm:p-3">
              <div className="bg-yellow-100 p-2 rounded-full mb-2">
                <HiDocumentText className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
              </div>
              <h2 className="text-xs sm:text-sm font-semibold mb-1 text-center">New Applications</h2>
              <p className="text-xl sm:text-2xl font-bold text-yellow-600 text-center">{orgData.totalNewApplications}</p>
            </div>
          </Card>

          {/* Total Participants Card */}
          <Card className="w-[calc(50%-0.375rem)] sm:w-36 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center p-2 sm:p-3">
              <div className="bg-red-100 p-2 rounded-full mb-2">
                <HiUsers className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              </div>
              <h2 className="text-xs sm:text-sm font-semibold mb-1 text-center">Total Participants</h2>
              <p className="text-xl sm:text-2xl font-bold text-red-600 text-center">{orgData.totalParticipants}</p>
            </div>
          </Card>
        </div>
      )}

      {/* Organization Activities */}
      <div className="mt-6 sm:mt-10">
        <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 px-1">Your Activities</h2>
        {loadingActivities ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : orgActivities.length === 0 ? (
          <p className="text-gray-600 px-1">No activities found for your organization.</p>
        ) : (
          <div className='flex flex-wrap justify-center gap-4 sm:gap-6'>
            {orgActivities.map((activity) => (
              <div key={activity.id} className="relative w-full sm:w-auto">
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
                  onClick={() => handleActivityCardClick(activity)}
                />
                
                {/* Overlay with action buttons */}
                {selectedActivity && selectedActivity.id === activity.id && showActionModal && (
                  <div className="absolute inset-0 bg-black bg-opacity-60 rounded-lg flex items-center justify-center z-10 p-3 sm:p-4">
                    <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 sm:gap-4 md:gap-6 w-full sm:w-auto">
                      {/* Edit Button */}
                      <div className="flex flex-col items-center">
                        <button
                          onClick={handleEditActivity}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg hover:bg-blue-600 active:bg-blue-700 transition-colors touch-manipulation"
                          aria-label="Edit Activity"
                        >
                          <HiPencil className="h-6 w-6 sm:h-8 sm:w-8" />
                        </button>
                        <span className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-white font-medium">Edit</span>
                      </div>

                      {/* Delete Button */}
                      <div className="flex flex-col items-center">
                        <button
                          onClick={handleDeleteActivity}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 active:bg-red-700 transition-colors touch-manipulation"
                          aria-label="Delete Activity"
                        >
                          <HiTrash className="h-6 w-6 sm:h-8 sm:w-8" />
                        </button>
                        <span className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-white font-medium">Delete</span>
                      </div>

                      {/* View Activity Button */}
                      <div className="flex flex-col items-center">
                        <button
                          onClick={handleViewActivity}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-lg hover:bg-purple-600 active:bg-purple-700 transition-colors touch-manipulation"
                          aria-label="View Activity"
                        >
                          <HiEye className="h-6 w-6 sm:h-8 sm:w-8" />
                        </button>
                        <span className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-white font-medium">View</span>
                      </div>

                      {/* Review Applications Button */}
                      <div className="flex flex-col items-center">
                        <button
                          onClick={handleReviewApplications}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg hover:bg-green-600 active:bg-green-700 transition-colors touch-manipulation"
                          aria-label="Review Applications"
                        >
                          <HiUserGroup className="h-6 w-6 sm:h-8 sm:w-8" />
                        </button>
                        <span className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-white font-medium">Applications</span>
                      </div>
                    </div>
                    
                    {/* Close button */}
                    <button
                      onClick={() => setShowActionModal(false)}
                      className="absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-600 text-white flex items-center justify-center hover:bg-gray-700 active:bg-gray-800 transition-colors text-lg sm:text-xl touch-manipulation"
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
              <span className="mt-1 text-xs sm:text-sm text-blue-600 font-medium">Online</span>
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
              <span className="mt-1 text-xs sm:text-sm text-green-600 font-medium">Local</span>
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
              <span className="mt-1 text-xs sm:text-sm text-purple-600 font-medium">Event</span>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsFabOpen((prev) => !prev)}
          className="bg-orange-500 text-white text-xl sm:text-2xl w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg hover:bg-orange-600 active:bg-orange-700 transition-colors touch-manipulation flex items-center justify-center"
          aria-label={isFabOpen ? 'Close menu' : 'Open menu'}
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
