import { create } from 'zustand';

/**
 * Dashboard Store (Zustand)
 * 
 * Manages UI state for the dashboard page including:
 * - Modal visibility states
 * - Selected items (activities, applications, organizations, profiles)
 * - View toggles (showApplications)
 * - Cancel application modal state
 */
export const useDashboardStore = create((set) => ({
  // Modal states
  showActivityModal: false,
  showApplicationModal: false,
  showActionModal: false,
  showQRScanner: false,
  showValidationModal: false,
  showProfileModal: false,
  showOrgModal: false,
  showCancelModal: false,

  // Selected items
  selectedActivityId: null,
  selectedApplicationActivity: null,
  selectedOrganization: null,
  selectedProfileUserId: null,
  cancelApplication: null,
  cancelMessage: '',

  // View state
  showApplications: false,

  // Actions
  setShowActivityModal: (show) => set({ showActivityModal: show }),
  setShowApplicationModal: (show) => set({ showApplicationModal: show }),
  setShowActionModal: (show) => set({ showActionModal: show }),
  setShowQRScanner: (show) => set({ showQRScanner: show }),
  setShowValidationModal: (show) => set({ showValidationModal: show }),
  setShowProfileModal: (show) => set({ showProfileModal: show }),
  setShowOrgModal: (show) => set({ showOrgModal: show }),
  setShowCancelModal: (show) => set({ showCancelModal: show }),

  setSelectedActivityId: (id) => set({ selectedActivityId: id }),
  setSelectedApplicationActivity: (activity) => set({ selectedApplicationActivity: activity }),
  setSelectedOrganization: (org) => set({ selectedOrganization: org }),
  setSelectedProfileUserId: (userId) => set({ selectedProfileUserId: userId }),
  setCancelApplication: (app) => set({ cancelApplication: app }),
  setCancelMessage: (message) => set({ cancelMessage: message }),

  setShowApplications: (show) => set({ showApplications: show }),

  // Helper: Reset all modals
  resetModals: () =>
    set({
      showActivityModal: false,
      showApplicationModal: false,
      showActionModal: false,
      showQRScanner: false,
      showValidationModal: false,
      showProfileModal: false,
      showOrgModal: false,
      showCancelModal: false,
      selectedActivityId: null,
      selectedApplicationActivity: null,
      selectedOrganization: null,
      selectedProfileUserId: null,
      cancelApplication: null,
      cancelMessage: '',
    }),

  // Helper: Close activity modal and reset selection
  closeActivityModal: () =>
    set({
      showActivityModal: false,
      selectedActivityId: null,
    }),

  // Helper: Close application modal and reset selection
  closeApplicationModal: () =>
    set({
      showApplicationModal: false,
      selectedApplicationActivity: null,
    }),

  // Helper: Close profile modal and reset selection
  closeProfileModal: () =>
    set({
      showProfileModal: false,
      selectedProfileUserId: null,
    }),

  // Helper: Close org modal and reset selection
  closeOrgModal: () =>
    set({
      showOrgModal: false,
      selectedOrganization: null,
    }),

  // Helper: Close cancel modal and reset state
  closeCancelModal: () =>
    set({
      showCancelModal: false,
      cancelApplication: null,
      cancelMessage: '',
    }),
}));

