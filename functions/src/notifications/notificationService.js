import {db, messaging, auth} from "../init.js";
import {FieldValue} from "firebase-admin/firestore";
import {sendMailgunEmail} from "./emailService.js";
import {generateNotificationEmail} from "./emailTemplates.js";

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
    throw new Error(
        "markNotificationAsRead: userId and notificationId are required",
    );
  }

  const notifRef = db.collection("notifications").doc(notificationId);
  const snap = await notifRef.get();

  if (!snap.exists) {
    throw new Error("Notification not found");
  }

  const data = snap.data();
  if (data.userId !== userId) {
    throw new Error(
        "Permission denied: cannot modify another user's notification",
    );
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

/**
 * Delete all notifications for a user.
 * @param {string} userId - Auth UID
 * @return {Promise<number>} Number of notifications deleted
 */
export async function deleteAllUserNotifications(userId) {
  if (!userId) {
    throw new Error("deleteAllUserNotifications: userId is required");
  }

  const querySnap = await db
      .collection("notifications")
      .where("userId", "==", userId)
      .get();

  if (querySnap.empty) {
    return 0;
  }

  const batch = db.batch();
  querySnap.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  return querySnap.docs.length;
}

/**
 * Helper to map notification type to category
 * GAMIFICATION vs ACTIVITY
 * @param {string} type
 * @return {string} category
 */
function getCategoryFromType(type) {
  const gamificationTypes = ["REWARD", "REFERRAL"];
  if (gamificationTypes.includes(type)) {
    return "GAMIFICATION";
  }
  return "ACTIVITY";
}

/**
 * Send a notification to a user, respecting their preferences
 * and optionally sending a push via FCM.
 * This always creates the Firestore notification when inApp is enabled.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.type
 * @param {string} params.title
 * @param {string} params.body
 * @param {string|null} [params.link]
 * @param {Object} [params.metadata]
 * @return {Promise<void>}
 */
export async function sendUserNotification({
  userId,
  type,
  title,
  body,
  link = null,
  metadata = {},
}) {
  if (!userId) {
    throw new Error("sendUserNotification: userId is required");
  }

  const category = getCategoryFromType(type);

  // Load user document for preferences and tokens
  const userRef = db.collection("members").doc(userId);
  const userSnap = await userRef.get();
  const userData = userSnap.exists ? userSnap.data() : {};

  const prefsRoot = userData.notificationPreferences || {};
  const categoryPrefs = prefsRoot[category] || {
    inApp: true,
    push: false,
    email: false,
  };

  const shouldInApp = categoryPrefs.inApp !== false;
  const shouldPush = categoryPrefs.push === true;
  const shouldEmail = categoryPrefs.email === true;

  let notificationId = null;

  if (shouldInApp) {
    notificationId = await createNotification({
      userId,
      type,
      title,
      body,
      link,
      metadata,
    });
  }

  if (shouldPush) {
    const tokens = Array.isArray(userData.fcmTokens) ? userData.fcmTokens : [];

    if (tokens.length > 0) {
      try {
        const message = {
          tokens,
          notification: {
            title,
            body,
          },
          data: {
            type: String(type || ""),
            category,
            link: String(link || ""),
            notificationId: String(notificationId || ""),
          },
        };

        const response = await messaging.sendEachForMulticast(message);

        // Remove invalid tokens
        const invalidTokens = [];
        response.responses.forEach((res, idx) => {
          if (!res.success) {
            const code = res.error?.code || "";
            if (
              code.includes("registration-token-not-registered") ||
              code.includes("invalid-registration-token")
            ) {
              invalidTokens.push(tokens[idx]);
            }
          }
        });

        if (invalidTokens.length > 0) {
          const remaining = tokens.filter((t) => !invalidTokens.includes(t));
          await userRef.update({fcmTokens: remaining});
        }
      } catch (error) {
        console.error("Failed to send push notification:", error);
      }
    }
  }

  if (shouldEmail) {
    try {
      const userRecord = await auth.getUser(userId);
      const userEmail = userRecord.email;
      if (userEmail) {
        const email = generateNotificationEmail({
          title,
          body,
          link: link || null,
        });
        await sendMailgunEmail({
          to: userEmail,
          subject: email.subject,
          text: email.text,
          html: email.html,
        });
      }
    } catch (error) {
      console.error("Failed to send notification email:", error);
    }
  }
}
