'use client';

import { useEffect, useState, useCallback } from 'react';

/**
 * useVisualViewport Hook
 * 
 * Manages viewport height adjustments when the keyboard opens/closes on mobile devices.
 * This is particularly useful for chat-like screens or forms with heavy input usage.
 * 
 * The Visual Viewport API provides information about the visual viewport (the visible
 * portion of the page, excluding UI elements like the keyboard).
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.targetId - ID of the element to adjust height (default: 'viewport-container')
 * @param {boolean} options.enabled - Whether the hook is enabled (default: true)
 * @param {number} options.minHeight - Minimum height in pixels (default: 0)
 * @param {number} options.offset - Additional offset in pixels (default: 0)
 * 
 * @returns {Object} Viewport state and utilities
 * @returns {number} returns.height - Current visual viewport height
 * @returns {number} returns.width - Current visual viewport width
 * @returns {number} returns.scale - Current scale factor
 * @returns {Function} returns.setHeight - Manually set container height
 * 
 * @example
 * // Basic usage
 * const { height } = useVisualViewport();
 * 
 * @example
 * // With custom target element
 * const viewport = useVisualViewport({ targetId: 'chat-container' });
 * 
 * @example
 * // Apply to a container
 * const viewport = useVisualViewport({ targetId: 'form-container' });
 * 
 * // In JSX:
 * <div id="form-container" style={{ height: `${viewport.height}px` }}>
 *   {/* form content */}
 * </div>
 */
export default function useVisualViewport(options = {}) {
  const {
    targetId = 'viewport-container',
    enabled = true,
    minHeight = 0,
    offset = 0,
  } = options;

  const [viewport, setViewport] = useState({
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    scale: 1,
  });

  const updateViewport = useCallback(() => {
    if (typeof window === 'undefined' || !enabled) return;

    // Check if Visual Viewport API is supported
    if (window.visualViewport) {
      setViewport({
        height: window.visualViewport.height,
        width: window.visualViewport.width,
        scale: window.visualViewport.scale,
      });

      // Update target element height if it exists
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        const newHeight = Math.max(
          minHeight,
          window.visualViewport.height - offset
        );
        targetElement.style.height = `${newHeight}px`;
        targetElement.style.maxHeight = `${newHeight}px`;
      }
    } else {
      // Fallback to window.innerHeight for browsers without Visual Viewport API
      const height = window.innerHeight;
      setViewport({
        height,
        width: window.innerWidth,
        scale: 1,
      });

      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        const newHeight = Math.max(minHeight, height - offset);
        targetElement.style.height = `${newHeight}px`;
        targetElement.style.maxHeight = `${newHeight}px`;
      }
    }
  }, [targetId, enabled, minHeight, offset]);

  const setHeight = useCallback((height) => {
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      const newHeight = Math.max(minHeight, height - offset);
      targetElement.style.height = `${newHeight}px`;
      targetElement.style.maxHeight = `${newHeight}px`;
    }
  }, [targetId, minHeight, offset]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Initial update
    updateViewport();

    // Listen to visual viewport changes
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewport);
      window.visualViewport.addEventListener('scroll', updateViewport);
    } else {
      // Fallback for browsers without Visual Viewport API
      window.addEventListener('resize', updateViewport);
      window.addEventListener('orientationchange', updateViewport);
    }

    // Cleanup
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewport);
        window.visualViewport.removeEventListener('scroll', updateViewport);
      } else {
        window.removeEventListener('resize', updateViewport);
        window.removeEventListener('orientationchange', updateViewport);
      }
    };
  }, [enabled, updateViewport]);

  return {
    height: viewport.height,
    width: viewport.width,
    scale: viewport.scale,
    setHeight,
  };
}
