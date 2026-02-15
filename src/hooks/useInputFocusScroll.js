'use client';

import { useCallback } from 'react';

/**
 * useInputFocusScroll Hook
 * 
 * Provides an onFocus handler that automatically scrolls an input element into view
 * when it receives focus. This improves mobile UX by ensuring focused inputs
 * are visible above the keyboard.
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.behavior - Scroll behavior: 'smooth' | 'auto' (default: 'smooth')
 * @param {string} options.block - Vertical alignment: 'start' | 'center' | 'end' | 'nearest' (default: 'center')
 * @param {string} options.inline - Horizontal alignment: 'start' | 'center' | 'end' | 'nearest' (default: 'nearest')
 * @param {number} options.delay - Delay in ms before scrolling (default: 100) - helps with keyboard animation
 * 
 * @returns {Function} An onFocus handler function that can be passed to input components
 * 
 * @example
 * const handleFocus = useInputFocusScroll();
 * 
 * <TextInput
 *   onFocus={handleFocus}
 *   // ... other props
 * />
 * 
 * @example
 * // Combine with existing onFocus handler
 * const handleFocus = useInputFocusScroll({ block: 'start', delay: 200 });
 * 
 * <Textarea
 *   onFocus={(e) => {
 *     handleFocus(e);
 *     // your other focus logic
 *   }}
 *   // ... other props
 * />
 */
export default function useInputFocusScroll(options = {}) {
  const {
    behavior = 'smooth',
    block = 'center',
    inline = 'nearest',
    delay = 100,
  } = options;

  return useCallback((event) => {
    if (!event || !event.target) return;

    const element = event.target;
    
    // Small delay to allow keyboard animation to start
    setTimeout(() => {
      try {
        element.scrollIntoView({
          behavior,
          block,
          inline,
        });
      } catch (error) {
        // Fallback for browsers that don't support scrollIntoView options
        try {
          element.scrollIntoView();
        } catch (fallbackError) {
          console.warn('scrollIntoView not supported:', fallbackError);
        }
      }
    }, delay);
  }, [behavior, block, inline, delay]);
}
