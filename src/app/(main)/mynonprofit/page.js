'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { Toast } from 'flowbite-react';
import { HiCalendar } from 'react-icons/hi';
import { MdOutlineSocialDistance } from 'react-icons/md';
import { HiOfficeBuilding } from 'react-icons/hi';
import { useAuth } from '@/utils/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { updateActivityStatus } from '@/utils/crudActivities';
import KPISection from '@/components/dashboard/KPISection';
import QuickActions from '@/components/dashboard/QuickActions';
import ActivityManager from '@/components/dashboard/ActivityManager';
import { useNPODashboardData } from '@/hooks/dashboard/useNPODashboardData';
import { useNPODashboardActivities } from '@/hooks/dashboard/useNPODashboardActivities';
import { useModalManager } from '@/hooks/dashboard/useModalManager';

// Lazy load modals and heavy components
const NPOModalManager = dynamic(() => import('@/components/dashboard/NPOModalManager'), {
  ssr: false,
});
const ActivityAnalytics = dynamic(() => import('@/components/dashboard/ActivityAnalytics'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500 dark:border-primary-400"></div>
    </div>
  ),
});

export default function MyNonProfitDashboard() {
  const t = useTranslations('MyNonProfit');
  const { claims } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ type: '', message: '' });
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Use custom hooks for data fetching
  const { orgData, isLoading: isLoadingData } = useNPODashboardData(claims?.npoId);
  const { activities, metrics, isLoading: isLoadingActivities, handleStatusChange, refetch } =
    useNPODashboardActivities(claims?.npoId);
  const modalManager = useModalManager();

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Show toast helper
  const showToastMessage = useCallback((type, message) => {
    setToastMessage({ type, message });
    setShowToast(true);
  }, []);

  // Handle activity deleted
  const handleActivityDeleted = useCallback(
    async (deletedCount) => {
      try {
        // Invalidate and refetch activities
        await queryClient.invalidateQueries({ queryKey: ['npoDashboardActivities', claims?.npoId] });
        await queryClient.invalidateQueries({ queryKey: ['npoOrganization', claims?.npoId] });
        await queryClient.invalidateQueries({ queryKey: ['npoPendingApplications', claims?.npoId] });
        
        await refetch();
        
        modalManager.closeModal();
        
        const message =
          deletedCount > 1
            ? t('successDeletedMultiple', { count: deletedCount })
            : t('successDeletedSingle');
        showToastMessage('success', message);
        } catch (error) {
        console.error('Error refreshing activities:', error);
        showToastMessage('error', t('errorRefreshing'));
      }
    },
    [claims?.npoId, queryClient, refetch, modalManager, showToastMessage, t]
  );

  // Handle organization data update
  const handleOrganizationDataUpdate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['npoOrganization', claims?.npoId] });
    queryClient.invalidateQueries({ queryKey: ['npoPendingApplications', claims?.npoId] });
  }, [claims?.npoId, queryClient]);

  // Handle status update
  const handleStatusUpdate = useCallback(
    async (newStatus) => {
      const activity = modalManager.selectedActivity;
      if (!activity) return;

    // If trying to close the activity, open validation modal instead
    if (newStatus === 'Closed') {
        modalManager.closeModal();
        modalManager.openModal('activity-validation', {
          activity,
        });
      return;
    }

    // For other status changes, proceed normally
    try {
      setIsUpdatingStatus(true);
        await updateActivityStatus(activity.id, newStatus);
        handleStatusChange(activity.id, newStatus);
        modalManager.closeModal();
    } catch (error) {
      console.error('Error updating activity status:', error);
        showToastMessage('error', t('errorUpdatingStatus') || 'Error updating activity status');
    } finally {
      setIsUpdatingStatus(false);
    }
    },
    [modalManager, handleStatusChange, showToastMessage, t]
  );

  // Handle validation modal close
  const handleValidationModalClose = useCallback(
    async (shouldCloseActivity) => {
      modalManager.closeModal();
    
    // If all applicants are processed, close the activity
      if (shouldCloseActivity && modalManager.selectedActivity) {
      try {
          await updateActivityStatus(modalManager.selectedActivity.id, 'Closed');
          handleStatusChange(modalManager.selectedActivity.id, 'Closed');
      } catch (error) {
        console.error('Error closing activity:', error);
          showToastMessage('error', t('errorClosingActivity') || 'Failed to close activity');
        }
      }
    },
    [modalManager, handleStatusChange, showToastMessage, t]
  );

  const loading = isLoadingData || isLoadingActivities;

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 bg-background-page dark:bg-background-page min-h-screen">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 dark:border-primary-400"></div>
        </div>
      ) : (
        <>
          {/* Primary Metrics Section */}
          <KPISection
            orgData={orgData}
            closedActivitiesCount={metrics.closedCount}
            totalActivities={metrics.totalActivities}
          />

          {/* Quick Actions Section */}
          <QuickActions orgData={orgData} />
        </>
      )}

      {/* Organization Activities */}
      <ActivityManager
        organizationId={claims?.npoId}
        onActivityDeleted={handleActivityDeleted}
        onOrganizationDataUpdate={handleOrganizationDataUpdate}
        onOpenModal={(type, props) => {
          modalManager.setSelectedActivity(props?.activity || null);
          modalManager.openModal(type, props);
        }}
        showToast={showToastMessage}
      />

      {/* Activity Analytics */}
      {showAnalytics && <ActivityAnalytics organizationId={claims?.npoId} />}

      {/* Floating Action Button */}
      <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50">
        {isFabOpen && (
          <div className="absolute bottom-16 right-0 flex flex-col items-end space-y-2 sm:space-y-3">
            {/* Online */}
            <div className="flex flex-col items-center">
              <button
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg hover:bg-blue-600 active:bg-blue-700 transition-colors touch-manipulation min-w-[56px] min-h-[56px]"
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
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg hover:bg-green-600 active:bg-green-700 transition-colors touch-manipulation min-w-[56px] min-h-[56px]"
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
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-lg hover:bg-purple-600 active:bg-purple-700 transition-colors touch-manipulation min-w-[56px] min-h-[56px]"
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
          className="bg-orange-500 text-white text-xl sm:text-2xl w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-lg hover:bg-orange-600 active:bg-orange-700 transition-colors touch-manipulation flex items-center justify-center min-w-[56px] min-h-[56px]"
          aria-label={isFabOpen ? t('closeMenu') : t('openMenu')}
        >
          {isFabOpen ? '×' : '+'}
        </button>
      </div>

      {/* Modal Manager */}
      <NPOModalManager
        modalType={modalManager.modalType}
        modalProps={modalManager.modalProps}
        selectedActivity={modalManager.selectedActivity}
        onClose={modalManager.closeModal}
        onActivityDeleted={handleActivityDeleted}
        onOrganizationDataUpdate={handleOrganizationDataUpdate}
        onStatusChange={handleStatusChange}
        onStatusUpdate={handleStatusUpdate}
        isUpdatingStatus={isUpdatingStatus}
        onValidationModalClose={handleValidationModalClose}
      />

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-16 sm:bottom-5 right-4 sm:right-5 left-4 sm:left-auto z-[60] max-w-sm sm:max-w-none">
          <Toast onClose={() => setShowToast(false)}>
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
            <div className="ml-3 text-sm font-normal break-words">{toastMessage.message}</div>
            <Toast.Toggle onClose={() => setShowToast(false)} />
          </Toast>
        </div>
      )}
    </div>
  );
}
