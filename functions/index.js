import {
  onDocumentCreated,
  onDocumentDeleted,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import {updateApplicantsCountOnAdd} from
  "./src/activity-mgt/onAddApplication.js";
import {updateApplicantsCountOnRemove} from
  "./src/activity-mgt/onRemoveApplication.js";
import {syncActivityAggregateCounts} from
  "./src/activity-mgt/syncActivityAggregateCounts.js";
import {updateActivityCountOnAdd} from
  "./src/activity-mgt/onAddActivity.js";
import {updateActivityCountOnRemove} from
  "./src/activity-mgt/onRemoveActivity.js";
import {onCall} from "firebase-functions/v2/https";
import {setUserCustomClaims} from "./src/user-mgt/setCustomClaims.js";
import {
  markNotificationAsRead as markNotificationAsReadService,
  markAllUserNotificationsAsRead as markAllUserNotificationsAsReadService,
  sendUserNotification,
  deleteAllUserNotifications as deleteAllUserNotificationsService,
} from "./src/notifications/notificationService.js";
import {sendMailgunEmail} from "./src/notifications/emailService.js";
import {generateApplicationApprovalEmail} from
  "./src/notifications/emailTemplates.js";
import {db, auth} from "./src/init.js";
import {FieldValue} from "firebase-admin/firestore";
import {onActivityClosed} from "./src/impact/onActivityClosed.js";
import {exportImpactReport} from "./src/impact/exportImpactReport.js";
import {
  computeLeaderboard,
  runComputeLeaderboard,
} from "./src/leaderboard/computeLeaderboard.js";
import {grantBadgeToMemberAdmin} from "./src/rewards/memberBadgeHelpers.js";
import {runProcessReferralRewardOnSignup} from
  "./src/rewards/processReferralRewardOnSignup.js";
import {runAdminRemoveBadgeFromUser} from
  "./src/rewards/adminRemoveBadgeFromUser.js";

export const onActivityCreatedUpdateActivityCount = onDocumentCreated(
    "activities/{activityId}",
    async (event) => {
      const activityId = event.params.activityId;
      console.log("Activity ID:", activityId);
      await updateActivityCountOnAdd(activityId);
    },
);

export const onActivityDeletedUpdateActivityCount = onDocumentDeleted(
    "activities/{activityId}",
    async (event) => {
      const activityId = event.params.activityId;
      const activityData = event.data?.data();
      console.log("Activity ID:", activityId);
      console.log("Activity data:", activityData);
      await updateActivityCountOnRemove(activityId, activityData);
    },
);

export const onApplicationCreatedUpdateApplicantsCount = onDocumentCreated(
    "activities/{activityId}/applications/{applicationId}",
    async (event) => {
      const activityId = event.params.activityId;
      console.log("Activity ID:", activityId);

      await updateApplicantsCountOnAdd(activityId);
      try {
        await syncActivityAggregateCounts(activityId);
      } catch (syncErr) {
        console.error(
            "[onApplicationCreatedUpdateApplicantsCount] " +
            "syncActivityAggregateCounts failed:",
            syncErr,
        );
      }
    },
);

export const onApplicationDeletedUpdateApplicantsCount = onDocumentDeleted(
    "activities/{activityId}/applications/{applicationId}",
    async (event) => {
      const activityId = event.params.activityId;
      const applicationData = event.data?.data();
      console.log("Activity ID:", activityId);

      await updateApplicantsCountOnRemove(activityId, applicationData);
      try {
        await syncActivityAggregateCounts(activityId);
      } catch (syncErr) {
        console.error(
            "[onApplicationDeletedUpdateApplicantsCount] " +
            "syncActivityAggregateCounts failed:",
            syncErr,
        );
      }
    },
);

export const onParticipationCreatedSyncAggregates = onDocumentCreated(
    "activities/{activityId}/participations/{userId}",
    async (event) => {
      try {
        await syncActivityAggregateCounts(event.params.activityId);
      } catch (syncErr) {
        console.error(
            "[onParticipationCreatedSyncAggregates] " +
            "syncActivityAggregateCounts failed:",
            syncErr,
        );
      }
    },
);

export const onParticipationUpdatedSyncAggregates = onDocumentUpdated(
    "activities/{activityId}/participations/{userId}",
    async (event) => {
      try {
        await syncActivityAggregateCounts(event.params.activityId);
      } catch (syncErr) {
        console.error(
            "[onParticipationUpdatedSyncAggregates] " +
            "syncActivityAggregateCounts failed:",
            syncErr,
        );
      }
    },
);

export const onParticipationDeletedSyncAggregates = onDocumentDeleted(
    "activities/{activityId}/participations/{userId}",
    async (event) => {
      try {
        await syncActivityAggregateCounts(event.params.activityId);
      } catch (syncErr) {
        console.error(
            "[onParticipationDeletedSyncAggregates] " +
            "syncActivityAggregateCounts failed:",
            syncErr,
        );
      }
    },
);

/**
 * Notify volunteer when their application status is changed
 * (accepted or rejected) by the NPO.
 */
export const onApplicationStatusChangedNotifyUser = onDocumentUpdated(
    "activities/{activityId}/applications/{applicationId}",
    async (event) => {
      const before = event.data?.before?.data();
      const after = event.data?.after?.data();

      if (!before || !after) {
        return;
      }

      const activityId = event.params.activityId;
      try {
        await syncActivityAggregateCounts(activityId);
      } catch (syncErr) {
        console.error(
            "[onApplicationStatusChangedNotifyUser] " +
            "syncActivityAggregateCounts failed:",
            syncErr,
        );
      }

      const beforeStatus = before.status;
      const afterStatus = after.status;

      if (beforeStatus === afterStatus) {
        return;
      }

      const userId = after.user_id;
      if (!userId) {
        console.error(
            "onApplicationStatusChangedNotifyUser: missing userId",
        );
        return;
      }

      const applicationId = event.params.applicationId;

      try {
        // Handle cancelled status separately - notify NPO members
        if (afterStatus === "cancelled" && after.organization_id) {
          const organizationId = after.organization_id;

          const membersSnap = await db.collection("members")
              .where("npo_id", "==", organizationId)
              .get();

          console.log(
              `[onApplicationStatusChangedNotifyUser] Found ` +
              `${membersSnap.size} NPO member(s) for cancelled ` +
              `application notification`,
          );

          if (!membersSnap.empty) {
            const promises = membersSnap.docs.map(async (memberDoc) => {
              try {
                console.log(
                    `[onApplicationStatusChangedNotifyUser] Sending ` +
                    `cancelled notification to NPO member ${memberDoc.id}`,
                );
                await sendUserNotification({
                  userId: memberDoc.id,
                  type: "APPLICATION",
                  title: "Application cancelled",
                  body: "A volunteer cancelled their application. " +
                    "Review updates in your applications list.",
                  link: "/mynonprofit/activities/applications",
                  metadata: {
                    activity_id: activityId,
                    application_id: applicationId,
                    organization_id: organizationId,
                    status: "cancelled",
                    cancelled_by_user_id: userId,
                  },
                });
                console.log(
                    `[onApplicationStatusChangedNotifyUser] Cancelled ` +
                    `notification sent successfully to NPO member ` +
                    `${memberDoc.id}`,
                );
              } catch (memberNotifError) {
                // Log error for this member but continue with others
                console.error(
                    `[onApplicationStatusChangedNotifyUser] Failed to send ` +
                    `cancelled notification to NPO member ${memberDoc.id}:`,
                    memberNotifError,
                );
                console.error(
                    `[onApplicationStatusChangedNotifyUser] Member ` +
                    `notification error details:`,
                    {
                      message: memberNotifError.message,
                      stack: memberNotifError.stack,
                      code: memberNotifError.code,
                      userId: memberDoc.id,
                      activityId,
                      applicationId,
                      organizationId,
                    },
                );
              }
            });
            await Promise.all(promises);
            console.log(
                `[onApplicationStatusChangedNotifyUser] Completed sending ` +
                `cancelled notifications to all NPO members`,
            );
          }
          return; // Exit early after handling cancelled status
        }

        // Only notify for accepted / rejected transitions
        if (afterStatus !== "accepted" && afterStatus !== "rejected") {
          return;
        }

        const title = afterStatus === "accepted" ?
          "Application accepted" :
          "Application rejected";

        const body = afterStatus === "accepted" ?
          "Your application has been accepted. " +
            "Check your dashboard for details." :
          "Your application has been rejected. " +
            "You can review the details on your dashboard.";

        try {
          console.log(
              `[onApplicationStatusChangedNotifyUser] Sending ` +
              `${afterStatus} notification to user ${userId}`,
          );
          await sendUserNotification({
            userId,
            type: "APPLICATION_STATUS",
            title,
            body,
            link: "/dashboard",
            metadata: {
              activity_id: activityId,
              application_id: applicationId,
              status: afterStatus,
            },
          });
          console.log(
              `[onApplicationStatusChangedNotifyUser] ${afterStatus} ` +
              `notification sent successfully to user ${userId}`,
          );
        } catch (notifError) {
          // Log error but don't fail the entire function
          console.error(
              `[onApplicationStatusChangedNotifyUser] Failed to send ` +
              `${afterStatus} notification to user ${userId}:`,
              notifError,
          );
          console.error(
              `[onApplicationStatusChangedNotifyUser] Notification ` +
              `error details:`,
              {
                message: notifError.message,
                stack: notifError.stack,
                code: notifError.code,
                userId,
                activityId,
                applicationId,
                status: afterStatus,
              },
          );
        }

        // Send Mailgun emails for approved online activities
        const lastStatusUpdatedBy = after.last_status_updated_by;
        console.log("Checking email conditions:", {
          afterStatus,
          hasLastStatusUpdatedBy: !!lastStatusUpdatedBy,
          lastStatusUpdatedBy,
          activityId,
          applicationId,
          updated_at: after.updated_at,
        });

        if (afterStatus === "accepted" && lastStatusUpdatedBy) {
          console.log("Email conditions met, fetching activity...");
          try {
            // Fetch activity to check if it's online
            const activityDoc = await db.collection("activities")
                .doc(activityId)
                .get();

            console.log("Activity document exists:", activityDoc.exists);

            if (activityDoc.exists) {
              const activity = activityDoc.data();
              console.log("Activity data:", {
                type: activity.type,
                title: activity.title,
              });

              // Only send emails for online activities
              if (activity.type === "online") {
                console.log("Activity is online, fetching user emails...");

                // Get participant email and name
                let participantEmail = null;
                let participantName = null;
                try {
                  const participantUser = await auth.getUser(userId);
                  participantEmail = participantUser.email;
                  participantName = participantUser.displayName ||
                    participantUser.email?.split("@")[0] ||
                    "the volunteer";
                  console.log("Participant email retrieved:", participantEmail);
                } catch (error) {
                  console.error(
                      "Failed to get participant email:",
                      error,
                  );
                }

                // Get NPO validator email and name
                let validatorEmail = null;
                let validatorName = null;
                try {
                  const validatorUser = await auth.getUser(
                      lastStatusUpdatedBy,
                  );
                  validatorEmail = validatorUser.email;
                  validatorName = validatorUser.displayName ||
                    validatorUser.email?.split("@")[0] ||
                    "the organization representative";
                  console.log("Validator email retrieved:", validatorEmail);
                } catch (error) {
                  console.error(
                      "Failed to get validator email:",
                      error,
                  );
                }

                // Build recipient list: users who have ACTIVITY.email enabled
                const participantPrefs = (await db.collection("members")
                    .doc(userId).get())
                    .data()?.notification_preferences?.ACTIVITY;
                const validatorPrefs = (await db.collection("members")
                    .doc(lastStatusUpdatedBy).get())
                    .data()?.notification_preferences?.ACTIVITY;
                const recipientList = [];
                if (participantEmail && participantPrefs?.email === true) {
                  recipientList.push(participantEmail);
                }
                if (validatorEmail && validatorPrefs?.email === true) {
                  recipientList.push(validatorEmail);
                }

                if (recipientList.length > 0) {
                  console.log("Sending introduction email to recipients:", {
                    recipientList,
                  });

                  const activityTitle = activity.title || "the activity";

                  const email = generateApplicationApprovalEmail({
                    activityTitle,
                    participantName,
                    participantEmail,
                    validatorName,
                    validatorEmail,
                    npoResponse:
                      after.npo_response ?? null,
                    locale: "en", // TODO: Get from user preferences for i18n
                  });

                  await sendMailgunEmail({
                    to: recipientList,
                    subject: email.subject,
                    text: email.text,
                    html: email.html,
                  });
                } else {
                  if (!participantEmail) {
                    console.log(
                        "Skipping email - participant email not available",
                    );
                  }
                  if (!validatorEmail) {
                    console.log(
                        "Skipping email - validator email not available",
                    );
                  }
                  if (recipientList.length === 0 && (participantEmail ||
                    validatorEmail)) {
                    console.log(
                        "Skipping email - no recipient has ACTIVITY.email on",
                    );
                  }
                }
              } else {
                console.log(
                    "Activity is not online, skipping email. Type:",
                    activity.type,
                );
              }
            } else {
              console.log(
                  "Activity document does not exist for activityId:",
                  activityId,
              );
            }
          } catch (emailError) {
            // Log email errors but don't fail the notification
            console.error(
                "Failed to send approval emails via Mailgun:",
                emailError,
            );
          }
        } else {
          console.log("Email conditions not met:", {
            isAccepted: afterStatus === "accepted",
            hasLastStatusUpdatedBy: !!lastStatusUpdatedBy,
            lastStatusUpdatedBy,
          });
        }
      } catch (error) {
        console.error(
            "Failed to create application status notification:",
            error,
        );
      }
    },
);

export const setCustomClaims = onCall(
    {invoker: "public"},
    async (request) => {
      // Verify authentication
      if (!request.auth) {
        throw new Error("Unauthorized");
      }

      // Only allow admins to set custom claims
      const userRole = request.auth.token?.role;
      if (userRole !== "admin") {
        throw new Error("Forbidden: Only admins can set custom claims");
      }

      const {uid, claims} = request.data || {};

      if (!uid || !claims) {
        throw new Error("uid and claims are required");
      }

      try {
        await setUserCustomClaims(uid, claims);
        return {success: true};
      } catch (error) {
        console.error("Error in setCustomClaims:", error);
        throw new Error(`Failed to set custom claims: ${error.message}`);
      }
    });

/**
 * Callable function to mark a single notification as read.
 * The authenticated user can only modify their own notifications.
 */
export const markNotificationAsRead = onCall(
    {invoker: "public"},
    async (request) => {
      if (!request.auth) {
        throw new Error("Unauthorized");
      }

      const userId = request.auth.uid;
      const {notificationId} = request.data || {};

      if (!notificationId) {
        throw new Error("notificationId is required");
      }

      await markNotificationAsReadService(userId, notificationId);
      return {success: true};
    });

/**
 * Callable function to mark all notifications as read for the
 * authenticated user.
 */
export const markAllNotificationsAsRead = onCall(
    {invoker: "public"},
    async (request) => {
      if (!request.auth) {
        throw new Error("Unauthorized");
      }

      const userId = request.auth.uid;
      const updatedCount = await markAllUserNotificationsAsReadService(userId);
      return {success: true, updatedCount};
    });

/**
 * Callable function to clear (delete) all notifications
 * for the authenticated user.
 */
export const clearAllNotifications = onCall(
    {invoker: "public"},
    async (request) => {
      if (!request.auth) {
        throw new Error("Unauthorized");
      }

      const userId = request.auth.uid;
      const deletedCount = await deleteAllUserNotificationsService(userId);
      return {success: true, deletedCount};
    });

const CONTACT_EMAIL_TO = "contact@wannagonna.org";

/**
 * Callable function to send the landing-page contact form as an email to
 * contact@wannagonna.org. Does not require authentication.
 */
export const sendContactEmail = onCall(
    {invoker: "public"},
    async (request) => {
      const {name, email, message} = request.data || {};

      if (!name || typeof name !== "string" || !name.trim()) {
        throw new Error("Name is required");
      }
      if (!email || typeof email !== "string" || !email.trim()) {
        throw new Error("Email is required");
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        throw new Error("Invalid email address");
      }
      if (!message || typeof message !== "string" || !message.trim()) {
        throw new Error("Message is required");
      }
      if (message.trim().length < 10) {
        throw new Error("Message must be at least 10 characters");
      }

      const n = name.trim();
      const e = email.trim().toLowerCase();
      const m = message.trim();

      const subject = `Contact form: ${n}`;
      const text = `Name: ${n}\nEmail: ${e}\n\nMessage:\n${m}`;
      const msgHtml = m.replace(/\n/g, "<br>");
      const html =
        `<p><strong>Name:</strong> ${n}</p><p><strong>Email:</strong> ${e}` +
        `</p><p><strong>Message:</strong></p><p>${msgHtml}</p>`;

      await sendMailgunEmail({
        to: CONTACT_EMAIL_TO,
        subject,
        text,
        html,
      });

      try {
        await db.collection("contact_submissions").add({
          name: n,
          email: e,
          message: m,
          created_at: FieldValue.serverTimestamp(),
        });
      } catch (firestoreErr) {
        console.warn(
            "Contact form: email sent but Firestore write failed",
            firestoreErr,
        );
      }

      return {success: true};
    });

/**
 * Callable used by the client to send referral notifications
 * to the referrer (who owns the referral code).
 *
 * This wraps sendUserNotification so it can also send push
 * based on user preferences.
 */
export const notifyReferralReward = onCall(
    {invoker: "public"},
    async (request) => {
      if (!request.auth) {
        throw new Error("Unauthorized");
      }

      const {referrerId, mode, badgeXP, referralCode} = request.data || {};

      if (!referrerId || !mode || !referralCode) {
        throw new Error("referrerId, mode and referralCode are required");
      }

      let title;
      let body;

      if (mode === "first") {
        title = "Referral reward earned";
        body = `You earned a badge and XP because someone joined ` +
          `using your code (${referralCode}).`;
      } else {
        const points = Number(badgeXP) || 0;
        title = "Referral XP earned";
        body = points > 0 ?
          `You earned ${points} XP because someone joined ` +
            `using your code (${referralCode}).` :
          `You earned XP because someone joined ` +
            `using your code (${referralCode}).`;
      }

      await sendUserNotification({
        userId: referrerId,
        type: "REFERRAL",
        title,
        body,
        link: "/xp-history",
        metadata: {
          referral_code: referralCode,
          mode,
          badge_xp: Number(badgeXP) || 0,
        },
      });

      return {success: true};
    });

/**
 * Callable used by the client to send badge earned notifications.
 * This wraps sendUserNotification so it can also send push
 * based on user preferences.
 */
export const notifyBadgeEarned = onCall(
    {invoker: "public"},
    async (request) => {
      if (!request.auth) {
        throw new Error("Unauthorized");
      }

      const {userId, badgeTitle, badgeXP, badgeId} = request.data || {};

      if (!userId || !badgeTitle) {
        throw new Error("userId and badgeTitle are required");
      }

      const xpPart = badgeXP > 0 ? ` and ${badgeXP} XP` : "";
      const title = "Badge earned";
      const body = `You earned the "${badgeTitle}" badge${xpPart}!`;

      await sendUserNotification({
        userId,
        type: "REWARD",
        title,
        body,
        link: "/badges",
        metadata: {
          badge_id: badgeId || null,
          badge_xp: Number(badgeXP) || 0,
        },
      });

      return {success: true};
    });

/**
 * Callable function to validate referral codes.
 * This function uses Admin SDK privileges to securely check if a referral code
 * exists in the members collection without exposing member data to
 * unauthenticated users.
 *
 * Note: This function does not require authentication since users don't exist
 * yet when they're trying to sign up with a referral code.
 */
export const validateReferralCode = onCall(
    {invoker: "public"},
    async (request) => {
      const {code} = request.data || {};

      // Validate input - ensure code is a non-empty string
      if (!code || typeof code !== "string" || code.trim().length === 0) {
        console.log("[validateReferralCode] Missing or empty code");
        return {valid: false, error: "referralCodeRequired"};
      }

      try {
        const normalizedCode = code.toUpperCase().trim();
        console.log(`[validateReferralCode] Validating code: 
          "${normalizedCode}"`);

        const membersRef = db.collection("members");
        const querySnapshot = await membersRef
            .where("code", "==", normalizedCode)
            .limit(1)
            .get();

        const resultMsg = querySnapshot.empty ?
      "empty" :
      `found ${querySnapshot.docs.length} document(s)`;
        console.log(`[validateReferralCode] Query result: ${resultMsg}`);

        if (querySnapshot.empty) {
          console.log(
              `[validateReferralCode] Code "${normalizedCode}" not found`,
          );
          return {valid: false, error: "invalidReferralCode"};
        }

        console.log(`[validateReferralCode] Code "${normalizedCode}" is valid`);
        return {valid: true};
      } catch (error) {
        console.error(
            "[validateReferralCode] Error validating referral code:",
            error,
        );
        return {valid: false, error: "errorValidatingCode"};
      }
    });

/**
 * Callable function to check if a user code is unique.
 * This function uses Admin SDK privileges to securely check if a code
 * already exists in the members collection.
 *
 * Note: This function does not require authentication since it only returns
 * a boolean indicating uniqueness and doesn't expose sensitive member data.
 */
export const checkCodeUniqueness = onCall(
    {invoker: "public"},
    async (request) => {
      const {code} = request.data || {};

      if (!code || typeof code !== "string" || code.trim().length === 0) {
        return {isUnique: false};
      }

      try {
        const normalizedCode = code.toUpperCase().trim();
        console.log(
            `[checkCodeUniqueness] Checking uniqueness of code: ` +
      `"${normalizedCode}"`,
        );

        const membersRef = db.collection("members");
        const querySnapshot = await membersRef
            .where("code", "==", normalizedCode)
            .limit(1)
            .get();

        const isUnique = querySnapshot.empty;
        const statusMsg = isUnique ? "unique" : "already exists";
        console.log(
            `[checkCodeUniqueness] Code "${normalizedCode}" is ${statusMsg}`,
        );

        return {isUnique};
      } catch (error) {
        console.error(
            "[checkCodeUniqueness] Error checking code uniqueness:",
            error,
        );
        return {isUnique: false};
      }
    });

/**
 * Callable function to find a user by their referral code.
 * This function uses Admin SDK privileges to securely find a user
 * without exposing member data unnecessarily.
 *
 * Note: This function requires authentication since it's called
 * after a user has signed up to reward their referrer.
 */
export const findUserByCode = onCall(
    {invoker: "public"},
    async (request) => {
      if (!request.auth) {
        throw new Error("Unauthorized");
      }

      const {code} = request.data || {};

      if (!code || typeof code !== "string" || code.trim().length === 0) {
        return {user: null};
      }

      try {
        const normalizedCode = code.toUpperCase().trim();
        console.log(
            `[findUserByCode] Looking up user with code: "${normalizedCode}"`,
        );

        const membersRef = db.collection("members");
        const querySnapshot = await membersRef
            .where("code", "==", normalizedCode)
            .limit(1)
            .get();

        if (querySnapshot.empty) {
          console.log(
              `[findUserByCode] No user found with code: "${normalizedCode}"`,
          );
          return {user: null};
        }

        const userDoc = querySnapshot.docs[0];
        console.log(`[findUserByCode] Found user: ${userDoc.id}`);

        // Return only necessary data (id is needed for rewards)
        return {
          user: {
            id: userDoc.id,
            // Only return fields needed for referral rewards
            // Don't expose sensitive data unnecessarily
          },
        };
      } catch (error) {
        console.error("[findUserByCode] Error finding user by code:", error);
        return {user: null};
      }
    });

/**
 * Callable function to grant a badge to a user.
 * Uses Admin SDK to bypass Firestore security rules.
 * This is needed for cross-user operations like referral rewards.
 */
export const grantBadgeToUser = onCall(
    {invoker: "public"},
    async (request) => {
      if (!request.auth) {
        throw new Error("Unauthorized");
      }

      const {userId, badgeId} = request.data || {};

      if (!userId || !badgeId) {
        throw new Error("userId and badgeId are required");
      }

      try {
        const result = await grantBadgeToMemberAdmin(db, userId, badgeId, {
          sendRewardNotification: true,
        });
        if (!result.ok) {
          return {success: false, error: result.error};
        }
        return {success: true, badge: result.badge};
      } catch (error) {
        console.error("[grantBadgeToUser] Error granting badge:", error);
        return {success: false, error: error.message};
      }
    });

/**
 * Process referral reward from the new member doc (referred_by + idempotency).
 * Caller must be the new member (auth uid).
 */
export const processReferralRewardOnSignup = onCall(
    {invoker: "public"},
    async (request) => {
      if (!request.auth) {
        throw new Error("Unauthorized");
      }
      const referralCode = request.data?.referral_code;
      return runProcessReferralRewardOnSignup(
          request.auth.uid,
          referralCode,
      );
    });

/**
 * Admin only: remove a badge from a member (and subtract badge XP).
 */
export const adminRemoveBadgeFromUser = onCall(
    {invoker: "public"},
    async (request) => {
      if (!request.auth) {
        throw new Error("Unauthorized");
      }
      const userRole = request.auth.token?.role;
      if (userRole !== "admin") {
        throw new Error(
            "Forbidden: Only admins can remove badges from members",
        );
      }
      const {userId, badgeId} = request.data || {};
      if (!userId || !badgeId) {
        throw new Error("userId and badgeId are required");
      }
      try {
        return await runAdminRemoveBadgeFromUser(userId, badgeId);
      } catch (error) {
        console.error("[adminRemoveBadgeFromUser] Error:", error);
        return {success: false, error: error.message};
      }
    });

/**
 * Admin only: recompute activity aggregate counters (optional activity_id).
 */
export const adminBackfillActivityAggregateCounts = onCall(
    {invoker: "public"},
    async (request) => {
      if (!request.auth) {
        throw new Error("Unauthorized");
      }
      if (request.auth.token?.role !== "admin") {
        throw new Error(
            "Forbidden: Only admins can backfill activity aggregate counts",
        );
      }
      const activityId = request.data?.activity_id;
      if (activityId) {
        await syncActivityAggregateCounts(activityId);
        return {success: true, updated: 1};
      }
      const snap = await db.collection("activities").get();
      let updated = 0;
      for (const doc of snap.docs) {
        await syncActivityAggregateCounts(doc.id);
        updated++;
      }
      return {success: true, updated};
    });

// Validation rewards + aggregate sync (including on delete)
export {
  onValidationCreated,
  onValidationDeleted,
  onValidationUpdated,
} from "./src/rewards/onValidationCreated.js";

// Impact: run when activity status changes to Closed
export {onActivityClosed};

// Impact: export impact report as Excel
export {exportImpactReport};

// Members: sanitized list for public members page (no PII)
export {getMembersList} from "./src/members/getMembersList.js";

// Leaderboard: nightly scheduled job + admin manual trigger
export {computeLeaderboard};

/**
 * Callable to manually trigger leaderboard computation.
 * Admin only. For testing and on-demand refresh.
 */
export const triggerComputeLeaderboard = onCall(
    {invoker: "public"},
    async (request) => {
      if (!request.auth) {
        throw new Error("Unauthorized");
      }
      const userRole = request.auth.token?.role;
      if (userRole !== "admin") {
        throw new Error("Forbidden: Only admins can trigger leaderboard " +
          "computation");
      }
      const result = await runComputeLeaderboard();
      return {success: true, ...result};
    });
