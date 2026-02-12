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

  console.log(`[createNotification] Creating notification for user ${userId}`, {
    type,
    title,
    hasLink: !!link,
    hasMetadata: Object.keys(metadata || {}).length > 0,
  });

  try {
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

    console.log(
        `[createNotification] Notification created successfully: ` +
        `${docRef.id} for user ${userId}`,
    );
    return docRef.id;
  } catch (error) {
    console.error(
        `[createNotification] Failed to create notification for user ` +
        `${userId}:`,
        error,
    );
    console.error(`[createNotification] Error details:`, {
      message: error.message,
      stack: error.stack,
      code: error.code,
      userId,
      type,
      title,
    });
    throw error; // Re-throw so caller can handle
  }
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

  console.log(
      `[sendUserNotification] Starting notification for user ${userId}`,
      {
        type,
        category,
        title,
      });

  // Load user document for preferences and tokens
  const userRef = db.collection("members").doc(userId);
  let userSnap;
  let userData = {};
  try {
    userSnap = await userRef.get();
    userData = userSnap.exists ? userSnap.data() : {};
    console.log(
        `[sendUserNotification] Loaded user data for ${userId}, ` +
        `exists: ${userSnap.exists}`,
    );
  } catch (userLoadError) {
    console.error(
        `[sendUserNotification] Failed to load user data for ${userId}:`,
        userLoadError,
    );
    throw new Error(
        `Failed to load user data: ${userLoadError.message}`,
    );
  }

  const prefsRoot = userData.notificationPreferences || {};
  const categoryPrefs = prefsRoot[category] || {
    inApp: true,
    push: false,
    email: false,
  };

  const shouldInApp = categoryPrefs.inApp !== false;
  const shouldPush = categoryPrefs.push === true;
  const shouldEmail = categoryPrefs.email === true;

  console.log(
      `[sendUserNotification] User preferences for ${userId}`,
      {
        category,
        categoryPrefs,
        shouldInApp,
        shouldPush,
        hasFcmTokens: Array.isArray(userData.fcmTokens) &&
          userData.fcmTokens.length > 0,
        fcmTokensCount: Array.isArray(userData.fcmTokens) ?
          userData.fcmTokens.length : 0,
      },
  );

  let notificationId = null;

  if (shouldInApp) {
    try {
      console.log(
          `[sendUserNotification] Creating in-app notification for ` +
          `user ${userId}`,
      );
      notificationId = await createNotification({
        userId,
        type,
        title,
        body,
        link,
        metadata,
      });
      console.log(
          `[sendUserNotification] In-app notification created ` +
          `successfully: ${notificationId}`,
      );
    } catch (error) {
      // Log error but continue to try push notification if enabled
      console.error(
          `[sendUserNotification] Failed to create in-app notification ` +
          `for user ${userId}:`,
          error,
      );
      console.error(
          `[sendUserNotification] Create notification error details:`,
          {
            message: error.message,
            stack: error.stack,
            code: error.code,
            userId,
            type,
            title,
          },
      );
    }
  }

  if (shouldPush) {
    const tokens = Array.isArray(userData.fcmTokens) ? userData.fcmTokens : [];
    console.log(
        `[sendUserNotification] Push notification requested for user ` +
        `${userId}, tokens count: ${tokens.length}`,
    );

    if (tokens.length > 0) {
      try {
        console.log(
            `[sendUserNotification] Sending push notification to ` +
            `${tokens.length} token(s) for user ${userId}`,
        );
        // Data-only message: SW displays the notification (avoids duplicate)
        const message = {
          tokens,
          data: {
            type: String(type || ""),
            category,
            link: String(link || ""),
            notificationId: String(notificationId || ""),
            title: String(title || ""),
            body: String(body || ""),
          },
        };

        const response = await messaging.sendEachForMulticast(message);
        console.log(
            `[sendUserNotification] Push notification response for ` +
            `user ${userId}:`,
            {
              successCount: response.successCount,
              failureCount: response.failureCount,
            },
        );

        // Remove invalid tokens
        const invalidTokens = [];
        response.responses.forEach((res, idx) => {
          if (!res.success) {
            const code = res.error?.code || "";
            console.error(
                `[sendUserNotification] Push notification failed for ` +
                `token ${idx}:`,
                {
                  code,
                  message: res.error?.message,
                },
            );
            if (
              code.includes("registration-token-not-registered") ||
              code.includes("invalid-registration-token")
            ) {
              invalidTokens.push(tokens[idx]);
            }
          }
        });

        if (invalidTokens.length > 0) {
          console.log(
              `[sendUserNotification] Removing ${invalidTokens.length} ` +
              `invalid token(s) for user ${userId}`,
          );
          const remaining = tokens.filter((t) => !invalidTokens.includes(t));
          await userRef.update({fcmTokens: remaining});
        }
      } catch (error) {
        console.error(
            `[sendUserNotification] Failed to send push notification ` +
            `for user ${userId}:`,
            error,
        );
        console.error(
            `[sendUserNotification] Push notification error details:`,
            {
              message: error.message,
              stack: error.stack,
              code: error.code,
              userId,
              tokensCount: tokens.length,
            },
        );
      }
    } else {
      console.log(
          `[sendUserNotification] No FCM tokens found for user ` +
          `${userId}, skipping push notification`,
      );
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
