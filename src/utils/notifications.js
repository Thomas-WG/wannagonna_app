'use client';

import {useEffect, useMemo, useState} from 'react';
import {db, functions} from 'firebaseConfig';
import {
  collection,
  query,
  where,
  orderBy,
  limit as fsLimit,
  onSnapshot,
} from 'firebase/firestore';
import {httpsCallable} from 'firebase/functions';

const DEFAULT_LIMIT = 20;

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
          const items = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setNotifications(items);
          setError(null);
          setLoading(false);
        },
        (err) => {
          if (process.env.NODE_ENV === "development") {
            console.error("Notifications listener error:", err);
          }
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


