'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import ApplicationCard from '@/components/activities/ApplicationCard';
import { useDashboardStore } from '@/stores/dashboardStore';
import { fetchOrganizationById } from '@/utils/crudOrganizations';

/**
 * ApplicationsSection Component
 * Displays applications sub-section with all user applications
 */
const ApplicationsSection = memo(function ApplicationsSection({
  allApplications,
  applicationsWithActivities,
  user,
  displayName,
  profilePicture,
  onApplicationUpdated,
}) {
  const t = useTranslations('Dashboard');
  const {
    setShowActivityModal,
    setSelectedActivityId,
    setShowProfileModal,
    setSelectedProfileUserId,
    setShowOrgModal,
    setSelectedOrganization,
    setShowCancelModal,
    setCancelApplication,
  } = useDashboardStore();

  const handleCancelClick = (application, activity) => {
    setCancelApplication({ application, activity });
    setShowCancelModal(true);
  };

  const handleOrgLogoClick = async (activity) => {
    if (activity.organizationId) {
      try {
        const orgData = await fetchOrganizationById(activity.organizationId);
        if (orgData) {
          setSelectedOrganization(orgData);
          setShowOrgModal(true);
        }
      } catch (error) {
        console.error('Error fetching organization:', error);
      }
    }
  };

  if (allApplications.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 sm:mb-10">
      <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 px-1">
        {t('myApplications') || 'My Applications'}
      </h2>
      <p className="text-sm text-gray-600 mb-4 px-1">
        {t('allApplicationsDescription') || 'All your applications'}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {allApplications.map((activity) => {
          const applicationData = applicationsWithActivities.find(
            (app) => app.id === activity.applicationId
          );

          if (!applicationData) return null;

          return (
            <ApplicationCard
              key={applicationData.id}
              application={applicationData}
              activity={activity}
              memberProfile={{
                displayName,
                profilePicture,
              }}
              onOpenActivity={() => {
                const activityIdToUse = activity.activityId || activity.id;
                setSelectedActivityId(activityIdToUse);
                setShowActivityModal(true);
              }}
              onCancelClick={() => handleCancelClick(applicationData, activity)}
              onMemberAvatarClick={() => {
                setSelectedProfileUserId(user?.uid);
                setShowProfileModal(true);
              }}
              onOrgLogoClick={() => handleOrgLogoClick(activity)}
            />
          );
        })}
      </div>
    </div>
  );
});

export default ApplicationsSection;

