'use client';

import {useEffect} from 'react';

const PushInitializer = () => {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((registration) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('Service worker registered:', registration.scope);
          }
        })
        .catch((error) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('Service worker registration failed:', error);
          }
        });
  }, []);

  return null;
};

export default PushInitializer;


