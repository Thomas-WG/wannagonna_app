'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useModalContext } from './ModalContext';

/**
 * useModal hook
 * 
 * Hook for components to register/unregister modals with the global modal manager.
 * Automatically handles registration when modal opens and unregistration when it closes.
 * Returns a wrapped onClose function that should be passed to the Modal component.
 * 
 * @param {boolean} isOpen - Whether the modal is currently open
 * @param {Function} onClose - Callback function to close the modal
 * @param {string} modalId - Optional unique identifier for the modal (auto-generated if not provided)
 * @returns {Function} - Wrapped onClose function to pass to Modal component
 * 
 * @example
 * ```jsx
 * function MyModal({ isOpen, onClose }) {
 *   const wrappedOnClose = useModal(isOpen, onClose, 'my-modal');
 *   
 *   return (
 *     <Modal show={isOpen} onClose={wrappedOnClose}>
 *       ...
 *     </Modal>
 *   );
 * }
 * ```
 */
export function useModal(isOpen, onClose, modalId = null) {
  const { registerModal, unregisterModal, closeTopModal } = useModalContext();
  const idRef = useRef(modalId || `modal-${Date.now()}-${Math.random()}`);
  const onCloseRef = useRef(onClose);
  const isRegisteredRef = useRef(false);

  // Update onClose ref when it changes
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Create wrapped onClose that goes through our system
  const wrappedOnClose = useMemo(() => {
    return () => {
      // Call the original onClose
      if (onCloseRef.current) {
        onCloseRef.current();
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Register modal immediately when it opens
      // Use a small delay to avoid React render warnings, but keep it minimal
      const timeoutId = setTimeout(() => {
        if (!isRegisteredRef.current) {
          registerModal(idRef.current, wrappedOnClose);
          isRegisteredRef.current = true;
        }
      }, 0);
      
      return () => {
        clearTimeout(timeoutId);
        if (isRegisteredRef.current) {
          unregisterModal(idRef.current);
          isRegisteredRef.current = false;
        }
      };
    } else {
      // Unregister modal when it closes
      if (isRegisteredRef.current) {
        unregisterModal(idRef.current);
        isRegisteredRef.current = false;
      }
    }
  }, [isOpen, registerModal, unregisterModal, wrappedOnClose]);

  // Return wrapped onClose to use in Modal component
  return wrappedOnClose;
}
