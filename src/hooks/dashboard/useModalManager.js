'use client';

import { useState, useCallback } from 'react';

/**
 * Hook for managing modal state in NPO dashboard
 * Replaces multiple useState hooks with centralized management
 * 
 * @returns {Object} Modal state and control functions
 */
export function useModalManager() {
  const [modalState, setModalState] = useState({
    type: null, // 'activity-details' | 'activity-delete' | 'activity-review-applications' | etc.
    props: null, // Props to pass to the modal
  });

  const [selectedActivity, setSelectedActivity] = useState(null);

  // Open a modal with type and props
  const openModal = useCallback((type, props = null) => {
    setModalState({ type, props });
  }, []);

  // Close the current modal
  const closeModal = useCallback(() => {
    setModalState({ type: null, props: null });
    setSelectedActivity(null);
  }, []);

  // Open activity action overlay
  const openActivityActions = useCallback((activity) => {
    setSelectedActivity(activity);
    setModalState({ type: 'activity-actions', props: { activity } });
  }, []);

  // Close activity actions
  const closeActivityActions = useCallback(() => {
    setModalState((prev) => (prev.type === 'activity-actions' ? { type: null, props: null } : prev));
    setSelectedActivity(null);
  }, []);

  // Check if a specific modal is open
  const isModalOpen = useCallback((type) => {
    return modalState.type === type;
  }, [modalState.type]);

  return {
    modalType: modalState.type,
    modalProps: modalState.props,
    selectedActivity,
    openModal,
    closeModal,
    openActivityActions,
    closeActivityActions,
    isModalOpen,
    setSelectedActivity,
  };
}

