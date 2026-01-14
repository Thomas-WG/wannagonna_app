'use client';

import { createContext, useContext, useState, useCallback, useMemo } from 'react';

/**
 * ModalContext
 * 
 * Provides a global context for managing modal states across the application.
 * Tracks open modals in a stack to handle ESC key and browser back button behavior.
 */
const ModalContext = createContext(null);

/**
 * ModalProvider
 * 
 * Provider component that manages modal state globally.
 * Maintains a stack of open modals to determine which modal should be closed.
 */
export function ModalProvider({ children }) {
  const [modalStack, setModalStack] = useState([]);

  /**
   * Register a modal as open
   * @param {string} modalId - Unique identifier for the modal
   * @param {Function} onClose - Callback function to close the modal
   */
  const registerModal = useCallback((modalId, onClose) => {
    setModalStack((prev) => {
      // Remove if already exists (to avoid duplicates)
      const filtered = prev.filter((m) => m.id !== modalId);
      // Add to the top of the stack
      return [...filtered, { id: modalId, onClose }];
    });
  }, []);

  /**
   * Unregister a modal when it closes
   * @param {string} modalId - Unique identifier for the modal
   */
  const unregisterModal = useCallback((modalId) => {
    setModalStack((prev) => prev.filter((m) => m.id !== modalId));
  }, []);

  /**
   * Close the topmost modal (most recently opened)
   * @returns {boolean} - True if a modal was closed, false otherwise
   */
  const closeTopModal = useCallback(() => {
    let wasClosed = false;
    let topModalOnClose = null;
    
    setModalStack((prev) => {
      if (prev.length === 0) return prev;
      
      wasClosed = true;
      const topModal = prev[prev.length - 1];
      topModalOnClose = topModal.onClose;
      // Remove from stack
      return prev.slice(0, -1);
    });
    
    // Call the onClose callback after state update
    if (wasClosed && topModalOnClose) {
      // Defer to ensure state update completes first
      queueMicrotask(() => {
        topModalOnClose();
      });
    }
    
    return wasClosed;
  }, []);

  /**
   * Get the current topmost modal
   * @returns {Object|null} - The topmost modal or null if no modals are open
   */
  const getTopModal = useCallback(() => {
    return modalStack.length > 0 ? modalStack[modalStack.length - 1] : null;
  }, [modalStack]);

  /**
   * Check if any modals are open
   * @returns {boolean}
   */
  const hasOpenModals = useCallback(() => {
    return modalStack.length > 0;
  }, [modalStack]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    registerModal,
    unregisterModal,
    closeTopModal,
    getTopModal,
    hasOpenModals,
    modalStack,
  }), [registerModal, unregisterModal, closeTopModal, getTopModal, hasOpenModals, modalStack]);

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

/**
 * useModalContext hook
 * 
 * Hook to access the modal context
 * @returns {Object} - Modal context value
 */
export function useModalContext() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModalContext must be used within a ModalProvider');
  }
  return context;
}
