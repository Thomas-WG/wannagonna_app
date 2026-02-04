'use client';

import {useEffect, useMemo, useState} from 'react';
import {app, db, functions} from 'firebaseConfig';
import {
  collection,
  query,
  where,
  orderBy,
  limit as fsLimit,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';
import {httpsCallable} from 'firebase/functions';
import {getMessaging, isSupported, getToken} from 'firebase/messaging';

const DEFAULT_LIMIT = 20;
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

/**
 * React hook to listen to the current user's notifications in realtime.
 * @param {string|null} userId - Firebase Auth UID
 * @param {number} [limitCount=DEFAULT_LIMIT] - Max number of notifications
 * @return {{notifications: Array, unreadCount: number, loading: boolean, error: Error|null}}
 */
export function useNotificationsListener(userId, limitCount = DEFAULT_LIMIT) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(!!userId);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return undefined;
    }

    const notificationsRef = collection(db, "notifications");
    const q = query(
        notificationsRef,
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        fsLimit(limitCount || DEFAULT_LIMIT),
    );

    setLoading(true);

    const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }));
          setNotifications(items);
          setError(null);
          setLoading(false);
        },
        (err) => {
          // Log in all environments so production failures (e.g. missing index) are visible in console
          console.error("Notifications listener error:", err);
          setError(err);
          setLoading(false);
        },
    );

    return () => {
      unsubscribe();
    };
  }, [userId, limitCount]);

  const unreadCount = useMemo(
      () => notifications.filter((n) => !n.readAt).length,
      [notifications],
  );

  return {notifications, unreadCount, loading, error};
}

/**
 * Mark a single notification as read via Cloud Functions callable.
 * @param {string} notificationId
 * @return {Promise<any>}
 */
export async function markNotificationAsReadClient(notificationId) {
  if (!notificationId) {
    throw new Error("notificationId is required");
  }
  const fn = httpsCallable(functions, "markNotificationAsRead");
  const result = await fn({notificationId});
  return result.data;
}

/**
 * Mark all notifications for the current user as read via Cloud Functions callable.
 * @return {Promise<any>}
 */
export async function markAllNotificationsAsReadClient() {
  const fn = httpsCallable(functions, "markAllNotificationsAsRead");
  const result = await fn();
  return result.data;
}

/**
 * Delete all notifications for the current user via Cloud Functions callable.
 * @return {Promise<any>}
 */
export async function clearAllNotificationsClient() {
  const fn = httpsCallable(functions, "clearAllNotifications");
  const result = await fn();
  return result.data;
}

/**
 * Ensure push notifications are enabled for the current user:
 * - Requests browser notification permission
 * - Obtains FCM token and saves it under members/{uid}.fcmTokens
 * Returns the token or null if not available.
 * @param {string} userId
 * @return {Promise<string|null>}
 */
export async function enablePushForUser(userId) {
  if (!userId) {
    throw new Error("enablePushForUser: userId is required");
  }

  if (typeof window === "undefined") {
    return null;
  }

  if (!("Notification" in window)) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Notifications are not supported in this browser.");
    }
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return null;
  }

  if (!VAPID_KEY) {
    if (process.env.NODE_ENV === "development") {
      console.warn("VAPID key is missing.");
    }
    return null;
  }

  const supported = await isSupported().catch(() => false);
  if (!supported) {
    if (process.env.NODE_ENV === "development") {
      console.warn("FCM is not supported in this browser.");
    }
    return null;
  }

  const messaging = getMessaging(app);
  const token = await getToken(messaging, {vapidKey: VAPID_KEY});
  if (!token) {
    return null;
  }

  const userRef = doc(db, "members", userId);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      fcmTokens: [token],
    }, {merge: true});
  } else {
    await updateDoc(userRef, {
      fcmTokens: arrayUnion(token),
    });
  }

  return token;
}

/**
 * Update notification preferences for a user.
 * @param {string} userId
 * @param {Object} newPrefs
 * @return {Promise<void>}
 */
export async function updateNotificationPreferences(userId, newPrefs) {
  if (!userId) {
    throw new Error("updateNotificationPreferences: userId is required");
  }

  const userRef = doc(db, "members", userId);
  await setDoc(userRef, {
    notificationPreferences: newPrefs,
  }, {merge: true});
}
