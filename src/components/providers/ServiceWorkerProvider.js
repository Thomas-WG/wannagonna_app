'use client';

import { useEffect } from 'react';

/**
 * ServiceWorkerProvider
 * 
 * Registers the service worker for PWA functionality.
 * This component should be included in the app's provider tree.
 */
export default function ServiceWorkerProvider() {
  useEffect(() => {
    // Only register service worker in production or if explicitly enabled
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_SW === 'true')
    ) {
      // Register service worker
      navigator.serviceWorker
        .register('/service-worker.js', {
          scope: '/',
        })
        .then((registration) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('Service Worker registered:', registration);
          }

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // Check every hour
        })
        .catch((error) => {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Service Worker registration failed:', error);
          }
        });
    }
  }, []);

  return null; // This component doesn't render anything
}
