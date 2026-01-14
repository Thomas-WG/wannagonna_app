'use client';

import { useEffect, useRef } from 'react';
import { useModalContext } from '@/utils/modal/ModalContext';

/**
 * GlobalModalHandler
 * 
 * Component that handles global keyboard and browser navigation events for modals.
 * - ESC key: Closes the topmost modal
 * - Browser back button: Closes the topmost modal or navigates back if no modals are open
 * 
 * This component should be placed in the root layout to work globally.
 */
export default function GlobalModalHandler() {
  const { closeTopModal, hasOpenModals, modalStack } = useModalContext();
  const historyStatePushedRef = useRef(false);
  const previousModalCountRef = useRef(0);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only handle ESC key
      if (event.key === 'Escape' || event.keyCode === 27) {
        // Check if any modals are open
        if (hasOpenModals()) {
          // Use capture phase to intercept before Flowbite Modal handles it
          // Flowbite Modal handles ESC internally, but we want to ensure our handler runs first
          // Stop propagation to prevent Flowbite from also handling it
          event.stopImmediatePropagation();
          event.stopPropagation();
          event.preventDefault();
          // Close the topmost modal (this will call the registered onClose)
          closeTopModal();
        }
      }
    };

    // Use capture phase (true) to intercept before Flowbite Modal handles it
    // Listen on document for better coverage
    document.addEventListener('keydown', handleKeyDown, true);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [closeTopModal, hasOpenModals]);

  // Handle browser back button / mobile back gesture
  useEffect(() => {
    const handlePopState = (event) => {
      // Check if any modals are open and we pushed a history state
      if (hasOpenModals() && historyStatePushedRef.current) {
        // Push current state back to maintain URL
        window.history.pushState({ modalOpen: true }, '', window.location.href);
        // Close the topmost modal
        closeTopModal();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [closeTopModal, hasOpenModals]);

  // Manage history state based on modal stack changes
  useEffect(() => {
    const currentModalCount = modalStack.length;
    const previousModalCount = previousModalCountRef.current;

    // When a modal opens (count increases from 0)
    if (currentModalCount > previousModalCount && currentModalCount === 1 && !historyStatePushedRef.current) {
      // Push a history state to enable back button handling
      window.history.pushState({ modalOpen: true }, '', window.location.href);
      historyStatePushedRef.current = true;
    }
    // When all modals close (count goes to 0)
    else if (currentModalCount === 0 && historyStatePushedRef.current) {
      // Reset the flag - the history state will remain but that's okay
      // It will be overwritten when the next modal opens
      historyStatePushedRef.current = false;
    }

    previousModalCountRef.current = currentModalCount;
  }, [modalStack.length]);

  // This component doesn't render anything
  return null;
}
