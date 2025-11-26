import {db} from "../init.js";
import {FieldValue} from "firebase-admin/firestore";

/**
 * Notification schema (Firestore collection: notifications)
 * {
 *   userId: string;               // UID of the recipient
 *   type: string;                 // e.g. 'REWARD' | 'REMINDER' | 'SYSTEM'
 *   title: string;
 *   body: string;
 *   link?: string | null;         // optional deep-link path in the app
 *   createdAt: Timestamp;         // server-generated
 *   readAt?: Timestamp | null;    // null when unread
 *   metadata?: object;            // optional, small JSON payload
 * }
 */

/**
 * Create a notification document for a user.
 * @param {Object} params
 * @param {string} params.userId - Firebase Auth UID of recipient
 * @param {string} params.type - Notification type key
 * @param {string} params.title - Short title
 * @param {string} params.body - Description/body
 * @param {string|null} [params.link] - Optional deep link path
 * @param {Object} [params.metadata] - Optional extra payload
 * @return {Promise<string>} Newly created notification ID
 */
export async function createNotification({
  userId,
  type,
  title,
  body,
  link = null,
  metadata = {},
}) {
  if (!userId) {
    throw new Error("createNotification: userId is required");
  }

  const docRef = await db.collection("notifications").add({
    userId,
    type,
    title,
    body,
    link: link || null,
    createdAt: FieldValue.serverTimestamp(),
    readAt: null,
    metadata: metadata || {},
  });

  return docRef.id;
}

/**
 * Mark a single notification as read for a given user.
 * Ensures the notification belongs to the user.
 * @param {string} userId - Auth UID
 * @param {string} notificationId - Notification document ID
 * @return {Promise<void>}
 */
export async function markNotificationAsRead(userId, notificationId) {
  if (!userId || !notificationId) {
    throw new Error("markNotificationAsRead: userId and notificationId are required");
  }

  const notifRef = db.collection("notifications").doc(notificationId);
  const snap = await notifRef.get();

  if (!snap.exists) {
    throw new Error("Notification not found");
  }

  const data = snap.data();
  if (data.userId !== userId) {
    throw new Error("Permission denied: cannot modify another user's notification");
  }

  await notifRef.update({
    readAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Mark all notifications for a user as read.
 * Uses a batched write for safety; assumes a reasonably small
 * number of unread notifications per user.
 * @param {string} userId - Auth UID
 * @return {Promise<number>} Number of notifications updated
 */
export async function markAllUserNotificationsAsRead(userId) {
  if (!userId) {
    throw new Error("markAllUserNotificationsAsRead: userId is required");
  }

  const querySnap = await db
    .collection("notifications")
    .where("userId", "==", userId)
    .where("readAt", "==", null)
    .get();

  if (querySnap.empty) {
    return 0;
  }

  const batch = db.batch();
  querySnap.docs.forEach((doc) => {
    batch.update(doc.ref, {
      readAt: FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();
  return querySnap.docs.length;
}


