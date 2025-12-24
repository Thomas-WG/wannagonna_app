'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Toast } from 'flowbite-react';
import { HiQrcode } from 'react-icons/hi';
import { useAuth } from '@/utils/auth/AuthContext';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { updateApplicationStatus } from '@/utils/crudApplications';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useDashboardData } from '@/hooks/dashboard/useDashboardData';
import { useValidationResult } from '@/hooks/dashboard/useValidationResult';
import ProfileSection from '@/components/dashboard/ProfileSection';
import StatsSection from '@/components/dashboard/StatsSection';
import ActivitiesSection from '@/components/dashboard/ActivitiesSection';
import ApplicationsSection from '@/components/dashboard/ApplicationsSection';
import DashboardModals from '@/components/dashboard/DashboardModals';
import DashboardErrorBoundary from '@/components/dashboard/DashboardErrorBoundary';
import BadgeList from '@/components/badges/BadgeList';

export default function DashboardPage() {
  const t = useTranslations('Dashboard');
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Local state for filters and sorting
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    status: 'all',
  });
  const [sortBy, setSortBy] = useState('newest');

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ type: '', message: '' });

  // Cancel application state
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState('');

  // Zustand store for UI state
  const {
    showApplications,
    setShowApplications,
    cancelApplication,
    setCancelMessage: setStoreCancelMessage,
    setCancelApplication,
    closeCancelModal,
    setShowApplicationModal,
  } = useDashboardStore();

  // Handle toast message from validation
  const handleValidationToast = useCallback((toast) => {
    setToastMessage(toast);
    setShowToast(true);
  }, []);

  // Validation result hook
  const { showValidationModal, validationResult, closeValidationModal } =
    useValidationResult(handleValidationToast);

  // Dashboard data hook
  const {
    profileData,
    applicationsWithActivities,
    allActivitiesForView,
    allApplications,
    stats,
    gamificationData,
    isLoading,
    refetchAll,
  } = useDashboardData(user?.uid);

  // Available categories for filters
  const availableCategories = useMemo(() => {
    const cats = new Set();
    allActivitiesForView.forEach((activity) => {
      if (activity.category) cats.add(activity.category);
    });
    return Array.from(cats).sort();
  }, [allActivitiesForView]);

  // Activities to display based on view mode
  const activitiesToDisplay = useMemo(() => {
    if (showApplications) {
      // When showing applications, convert applications to activity format
      return allApplications;
    }
    return allActivitiesForView;
  }, [showApplications, allApplications, allActivitiesForView]);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Handle copy code success
  const handleCopyCodeSuccess = useCallback(() => {
    setToastMessage({
      type: 'success',
      message: t('codeCopied') || 'Code copied to clipboard!',
    });
    setShowToast(true);
  }, [t]);

  // Handle copy code error
  const handleCopyCodeError = useCallback(() => {
    setToastMessage({
      type: 'error',
      message: t('codeCopyFailed') || 'Failed to copy code',
    });
    setShowToast(true);
  }, [t]);

  // Handle application updated (after cancellation or status change)
  const handleApplicationUpdated = useCallback(
    async (applicationId, newStatus) => {
      // Invalidate and refetch applications
      await queryClient.invalidateQueries(['applications', user?.uid]);
      await queryClient.invalidateQueries(['volunteerActivities', user?.uid]);
      refetchAll();
    },
    [user?.uid, queryClient, refetchAll]
  );

  // Handle cancel application
  const handleConfirmCancel = useCallback(async () => {
    if (!cancelApplication) return;
    const { application, activity } = cancelApplication;

    if (!application.activityId || !application.applicationId || !application.id) return;

    setIsCancelling(true);
    try {
      await updateApplicationStatus(
        application.activityId,
        application.applicationId,
        'cancelled',
        application.npoResponse || '',
        application.userId || null,
        cancelMessage.trim() || ''
      );

      handleApplicationUpdated(application.id, 'cancelled');
      closeCancelModal();
      setCancelMessage('');
      setStoreCancelMessage('');
      setCancelApplication(null);

      setToastMessage({
        type: 'success',
        message: t('applicationCancelled') || 'Application cancelled successfully',
      });
      setShowToast(true);
    } catch (error) {
      console.error('Error cancelling application:', error);
      setToastMessage({
        type: 'error',
        message:
          t('errorCancellingApplication') ||
          'Failed to cancel application. Please try again.',
      });
      setShowToast(true);
    } finally {
      setIsCancelling(false);
    }
  }, [
    cancelApplication,
    cancelMessage,
    closeCancelModal,
    setStoreCancelMessage,
    setCancelApplication,
    handleApplicationUpdated,
    t,
  ]);

  // Handle clicking on Applications card to toggle view
  const handleApplicationsCardClick = useCallback(() => {
    setShowApplications(!showApplications);
    // Reset filters when switching views
    setFilters({ type: 'all', category: 'all', status: 'all' });
  }, [showApplications, setShowApplications]);

  // Handle QR scan success
  const handleQRScanSuccess = useCallback(
    ({ activityId, token, url }) => {
      // Use replace instead of push to avoid adding to history
      router.replace(`/validate-activity?activityId=${activityId}&token=${token}`);
    },
    [router]
  );

  // Handle view application from ActivitiesSection
  const handleViewApplication = useCallback(() => {
    setShowApplicationModal(true);
  }, [setShowApplicationModal]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 bg-background-page dark:bg-background-page min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 dark:border-primary-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 bg-background-page dark:bg-background-page min-h-screen">
      {/* Profile Section with Gamification */}
      <DashboardErrorBoundary>
        <ProfileSection
          profileData={profileData}
          gamificationData={gamificationData}
          user={user}
          onCopyCodeSuccess={handleCopyCodeSuccess}
          onCopyCodeError={handleCopyCodeError}
        />
      </DashboardErrorBoundary>

      {/* Stats Section */}
      <DashboardErrorBoundary>
        <StatsSection stats={stats} />
      </DashboardErrorBoundary>

      {/* Activities Section */}
      <DashboardErrorBoundary>
        <ActivitiesSection
          activities={activitiesToDisplay}
          applicationsWithActivities={applicationsWithActivities}
          showApplications={showApplications}
          filters={filters}
          onFiltersChange={setFilters}
          sortBy={sortBy}
          onSortChange={setSortBy}
          availableCategories={availableCategories}
          onViewApplication={handleViewApplication}
        />
      </DashboardErrorBoundary>

      {/* Applications Sub-section - Show all applications when not in applications view */}
      {!showApplications && (
        <DashboardErrorBoundary>
          <ApplicationsSection
            allApplications={allApplications}
            applicationsWithActivities={applicationsWithActivities}
            user={user}
            displayName={
              profileData?.displayName || user?.displayName || user?.email || 'Volunteer'
            }
            profilePicture={
              profileData?.profilePicture || user?.photoURL || null
            }
            onApplicationUpdated={handleApplicationUpdated}
          />
        </DashboardErrorBoundary>
      )}

      {/* Badges Section */}
      <DashboardErrorBoundary>
        <div className="mb-6 sm:mb-10">
          <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 px-1">
            {t('yourBadges') || 'Your Badges'}
          </h2>
          <BadgeList userId={user?.uid} />
        </div>
      </DashboardErrorBoundary>

      {/* Dashboard Modals */}
      <DashboardModals
        applicationsWithActivities={applicationsWithActivities}
        validationResult={validationResult}
        user={user}
        onApplicationUpdated={handleApplicationUpdated}
        onCancelApplication={handleConfirmCancel}
        isCancelling={isCancelling}
        cancelMessage={cancelMessage}
        onCancelMessageChange={setCancelMessage}
        onQRScanSuccess={handleQRScanSuccess}
        showValidationModal={showValidationModal}
        closeValidationModal={closeValidationModal}
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
      <QRScannerButton />
    </div>
  );
}

// QR Scanner Button Component
function QRScannerButton() {
  const { setShowQRScanner } = useDashboardStore();

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50">
      <button
        onClick={() => setShowQRScanner(true)}
        className="bg-blue-500 text-white text-xl sm:text-2xl w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg hover:bg-blue-600 active:bg-blue-700 transition-colors touch-manipulation flex items-center justify-center"
        aria-label="Scan QR Code"
      >
        <HiQrcode className="h-6 w-6 sm:h-7 sm:w-7" />
      </button>
    </div>
  );
}
