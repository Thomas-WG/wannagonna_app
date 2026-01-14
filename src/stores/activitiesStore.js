import { create } from 'zustand';

/**
 * Activities Store (Zustand)
 * 
 * Manages UI state for the activities page including:
 * - Modal visibility states
 * - Selected items (activities)
 * - Filter, search, and sort state
 * - Pagination state
 */
export const useActivitiesStore = create((set) => ({
  // Modal states
  showDetailsModal: false,
  openApplyModal: false,

  // Selected items
  selectedActivityId: null,
  selectedActivity: null,

  // Filter state
  filters: {
    type: 'all',
    category: 'all',
    country: 'all',
    sdg: 'all',
    skill: 'all',
    startDate: 'all',
  },
  searchQuery: '',
  sortBy: 'newest',

  // Pagination state
  currentPage: 1,
  itemsPerPage: 12,

  // Actions - Modal management
  setShowDetailsModal: (show) => set({ showDetailsModal: show }),
  setOpenApplyModal: (show) => set({ openApplyModal: show }),

  // Actions - Selection management
  setSelectedActivityId: (id) => set({ selectedActivityId: id }),
  setSelectedActivity: (activity) => set({ selectedActivity: activity }),

  // Actions - Filter management
  setFilters: (filters) =>
    set((state) => ({
      filters: typeof filters === 'function' ? filters(state.filters) : filters,
      currentPage: 1, // Reset to first page when filter changes
    })),
  updateFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
      currentPage: 1, // Reset to first page when filter changes
    })),
  resetFilters: () =>
    set({
      filters: {
        type: 'all',
        category: 'all',
        country: 'all',
        sdg: 'all',
        skill: 'all',
        startDate: 'all',
      },
      currentPage: 1,
    }),

  // Actions - Search management
  setSearchQuery: (query) =>
    set({ searchQuery: query, currentPage: 1 }), // Reset to first page when search changes

  // Actions - Sort management
  setSortBy: (sortBy) =>
    set({ sortBy, currentPage: 1 }), // Reset to first page when sort changes

  // Actions - Pagination management
  setCurrentPage: (page) => set({ currentPage: page }),
  setItemsPerPage: (itemsPerPage) =>
    set({ itemsPerPage, currentPage: 1 }), // Reset to first page when items per page changes
  nextPage: () =>
    set((state) => ({ currentPage: state.currentPage + 1 })),
  previousPage: () =>
    set((state) => ({
      currentPage: Math.max(1, state.currentPage - 1),
    })),

  // Helper: Open details modal
  openDetailsModal: (activityId) =>
    set({
      showDetailsModal: true,
      selectedActivityId: activityId,
    }),

  // Helper: Open apply modal
  openApplyModalWithActivity: (activity) =>
    set({
      openApplyModal: true,
      selectedActivity: activity,
      showDetailsModal: false, // Close details modal when opening apply modal
    }),

  // Helper: Close details modal
  closeDetailsModal: () =>
    set({
      showDetailsModal: false,
      selectedActivityId: null,
    }),

  // Helper: Close apply modal
  closeApplyModal: () =>
    set({
      openApplyModal: false,
      selectedActivity: null,
    }),

  // Helper: Reset all modals
  resetModals: () =>
    set({
      showDetailsModal: false,
      openApplyModal: false,
      selectedActivityId: null,
      selectedActivity: null,
    }),
}));

