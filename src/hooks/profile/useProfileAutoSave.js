import { useEffect, useState, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { updateMember } from '@/utils/crudMemberProfile';

// Helper function to clean data (remove internal React/Flowbite properties)
function cleanData(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(cleanData);
  }

  return Object.keys(obj).reduce((acc, key) => {
    if (!key.startsWith('__') && !key.endsWith('__')) {
      acc[key] = cleanData(obj[key]);
    }
    return acc;
  }, {});
}

const AUTO_SAVE_DELAY = 2000; // 2 seconds debounce
const LOCAL_STORAGE_KEY = 'profile_autosave';

/**
 * Custom hook for auto-saving profile form data
 * - Debounces form changes
 * - Saves to localStorage as backup
 * - Saves to Firestore
 * - Returns auto-save status
 */
export function useProfileAutoSave(formValues, userId, enabled = true) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const debouncedValues = useDebounce(formValues, AUTO_SAVE_DELAY);
  const lastSavedRef = useRef(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }

    // Skip auto-save on initial mount
    if (isInitialMount.current) {
      lastSavedRef.current = JSON.stringify(debouncedValues);
      // Allow one render cycle before enabling auto-save
      const timer = setTimeout(() => {
        isInitialMount.current = false;
      }, 100);
      return () => clearTimeout(timer);
    }

    // Check if values have actually changed
    const valuesString = JSON.stringify(debouncedValues);
    if (valuesString === lastSavedRef.current) {
      return;
    }

    const saveProfile = async () => {
      try {
        setStatus('saving');

        // Save to localStorage as backup
        try {
          const dataToSave = {
            data: debouncedValues,
            timestamp: Date.now(),
          };
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
        } catch (localStorageError) {
          console.warn('Failed to save to localStorage:', localStorageError);
          // Continue with Firestore save even if localStorage fails
        }

        // Prepare data for Firestore (clean and normalize)
        const cleanedData = cleanData(debouncedValues);

        // Normalize URL fields
        const { normalizeUrl } = await import('@/utils/urlUtils');
        if (cleanedData.website) {
          cleanedData.website = normalizeUrl(cleanedData.website);
        }
        if (cleanedData.linkedin) {
          cleanedData.linkedin = normalizeUrl(cleanedData.linkedin);
        }
        if (cleanedData.facebook) {
          cleanedData.facebook = normalizeUrl(cleanedData.facebook);
        }
        if (cleanedData.instagram) {
          cleanedData.instagram = normalizeUrl(cleanedData.instagram);
        }

        // Save to Firestore
        await updateMember(userId, cleanedData);

        lastSavedRef.current = valuesString;
        setStatus('saved');

        // Reset to idle after 3 seconds
        setTimeout(() => {
          setStatus('idle');
        }, 3000);
      } catch (error) {
        console.error('Auto-save failed:', error);
        setStatus('error');

        // Reset to idle after 5 seconds on error
        setTimeout(() => {
          setStatus('idle');
        }, 5000);
      }
    };

    saveProfile();
  }, [debouncedValues, userId, enabled]);

  // Function to restore from localStorage (can be called on mount)
  const restoreFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const { data, timestamp } = JSON.parse(saved);
        // Only restore if saved within last 24 hours
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        if (timestamp > oneDayAgo) {
          return data;
        }
      }
    } catch (error) {
      console.warn('Failed to restore from localStorage:', error);
    }
    return null;
  };

  return { status, restoreFromLocalStorage };
}

