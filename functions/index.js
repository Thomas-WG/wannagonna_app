import {
  onDocumentCreated,
  onDocumentDeleted,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import {updateApplicantsCountOnAdd} from
  "./src/activity-mgt/onAddApplication.js";
import {updateApplicantsCountOnRemove} from
  "./src/activity-mgt/onRemoveApplication.js";
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
import {FieldValue, Timestamp} from "firebase-admin/firestore";
import {
  onValidationCreated,
  onValidationUpdated,
} from "./src/rewards/onValidationCreated.js";

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

      // Call the imported function to update applicants count
      await updateApplicantsCountOnAdd(activityId);
    },
);

export const onApplicationDeletedUpdateApplicantsCount = onDocumentDeleted(
    "activities/{activityId}/applications/{applicationId}",
    async (event) => {
      const activityId = event.params.activityId;
      const applicationData = event.data?.data();
      console.log("Activity ID:", activityId);

      // Call the imported function to update applicants count
      await updateApplicantsCountOnRemove(activityId, applicationData);
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

      const beforeStatus = before.status;
      const afterStatus = after.status;

      // Only act when status actually changes
      if (beforeStatus === afterStatus) {
        return;
      }

      const userId = after.userId;
      if (!userId) {
        console.error(
            "onApplicationStatusChangedNotifyUser: missing userId",
        );
        return;
      }

      const activityId = event.params.activityId;
      const applicationId = event.params.applicationId;

      try {
        // Handle cancelled status separately - notify NPO members
        if (afterStatus === "cancelled" && after.organizationId) {
          const organizationId = after.organizationId;

          // Decrement applicants count if previous status was NOT cancelled
          if (beforeStatus !== "cancelled") {
            try {
              await db.runTransaction(async (transaction) => {
                const activityRef = db.collection("activities").doc(activityId);
                const activitySnap = await transaction.get(activityRef);

                if (activitySnap.exists) {
                  const activity = activitySnap.data();
                  const newApplicantCount =
                    Math.max((activity.applicants || 0) - 1, 0);
                  transaction.update(activityRef, {
                    applicants: newApplicantCount,
                  });
                  console.log(
                      "Decremented applicants count to:",
                      newApplicantCount,
                  );
                }
              });
            } catch (countError) {
              console.error(
                  "Failed to decrement applicants count:",
                  countError,
              );
              // Don't fail the entire function if count update fails
            }
          }

          const membersSnap = await db.collection("members")
              .where("npoId", "==", organizationId)
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
                    activityId,
                    applicationId,
                    organizationId,
                    status: "cancelled",
                    cancelledByUserId: userId,
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
              activityId,
              applicationId,
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
        console.log("Checking email conditions:", {
          afterStatus,
          hasLastStatusUpdatedBy: !!after.lastStatusUpdatedBy,
          lastStatusUpdatedBy: after.lastStatusUpdatedBy,
          activityId,
          applicationId,
          updatedAt: after.updatedAt,
        });

        if (afterStatus === "accepted" && after.lastStatusUpdatedBy) {
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
                      after.lastStatusUpdatedBy,
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

                // Build recipient list: only users who have ACTIVITY.email enabled
                const participantPrefs = (await db.collection("members")
                  .doc(userId).get()).data()?.notificationPreferences?.ACTIVITY;
                const validatorPrefs = (await db.collection("members")
                  .doc(after.lastStatusUpdatedBy).get())
                  .data()?.notificationPreferences?.ACTIVITY;
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
                    npoResponse: after.npoResponse || null,
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
            hasLastStatusUpdatedBy: !!after.lastStatusUpdatedBy,
            lastStatusUpdatedBy: after.lastStatusUpdatedBy,
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
          referralCode,
          mode,
          badgeXP: Number(badgeXP) || 0,
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
          badgeId: badgeId || null,
          badgeXP: Number(badgeXP) || 0,
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
        // Find badge by searching through all categories
        const categoriesSnapshot = await db.collection("badges").get();
        let badgeData = null;
        let badgeCategoryId = null;

        for (const categoryDoc of categoriesSnapshot.docs) {
          const badgeDoc = await db.collection("badges")
              .doc(categoryDoc.id)
              .collection("badges")
              .doc(badgeId)
              .get();

          if (badgeDoc.exists) {
            badgeData = badgeDoc.data();
            badgeCategoryId = categoryDoc.id;
            break;
          }
        }

        if (!badgeData) {
          console.error(`[grantBadgeToUser] Badge ${badgeId} not found`);
          return {success: false, error: "Badge not found"};
        }

        const badgeXP = badgeData.xp || 0;
        console.log(
            `[grantBadgeToUser] Granting badge ${badgeId} to user ${userId} ` +
            `with ${badgeXP} XP`,
        );

        // Check if user exists
        const memberDoc = await db.collection("members").doc(userId).get();
        if (!memberDoc.exists) {
          console.error(`[grantBadgeToUser] User ${userId} not found`);
          return {success: false, error: "User not found"};
        }

        // Check if user already has this badge
        const memberData = memberDoc.data();
        const existingBadges = memberData.badges || [];
        const badgeExists = existingBadges.some((b) => b.id === badgeId);

        if (badgeExists) {
          console.log(
              `[grantBadgeToUser] User ${userId} already has badge ${badgeId}`,
          );
          return {success: false, error: "User already has this badge"};
        }

        // Grant badge using Admin SDK (bypasses Firestore rules)
        const updateData = {
          badges: FieldValue.arrayUnion({
            id: badgeId,
            earnedDate: Timestamp.now(),
          }),
        };

        if (badgeXP > 0) {
          updateData.xp = FieldValue.increment(badgeXP);
        }

        await db.collection("members").doc(userId).update(updateData);
        console.log(
            `[grantBadgeToUser] Badge ${badgeId} granted to user ${userId}`,
        );

        // Log XP history (always log badge earning, even if XP is 0)
        const historyTitle = `Badge Earned: ${badgeData.title}`;
        await db.collection("members").doc(userId)
            .collection("xpHistory")
            .add({
              title: historyTitle,
              points: badgeXP,
              type: "badge",
              badgeId: badgeId,
              timestamp: Timestamp.now(),
            });

        // Send notification (wrapped in try-catch so badge grant succeeds
        // even if notification fails)
        try {
          console.log(
              `[grantBadgeToUser] Attempting to send notification for ` +
              `badge ${badgeId} to user ${userId}`,
          );
          await sendUserNotification({
            userId,
            type: "REWARD",
            title: "Badge earned",
            body: `You earned the "${badgeData.title}" badge` +
              `${badgeXP > 0 ? ` and ${badgeXP} XP` : ""}!`,
            link: "/badges",
            metadata: {
              badgeId,
              badgeXP,
            },
          });
          console.log(
              `[grantBadgeToUser] Notification sent successfully for ` +
              `badge ${badgeId} to user ${userId}`,
          );
        } catch (notifError) {
          // Log error but don't fail badge grant
          console.error(
              `[grantBadgeToUser] Failed to send notification for ` +
              `badge ${badgeId} to user ${userId}:`,
              notifError,
          );
          console.error(
              `[grantBadgeToUser] Notification error details:`,
              {
                message: notifError.message,
                stack: notifError.stack,
                code: notifError.code,
                userId,
                badgeId,
              },
          );
        }

        return {
          success: true,
          badge: {
            id: badgeId,
            title: badgeData.title,
            description: badgeData.description || "",
            xp: badgeXP,
            categoryId: badgeCategoryId,
          },
        };
      } catch (error) {
        console.error("[grantBadgeToUser] Error granting badge:", error);
        return {success: false, error: error.message};
      }
    });

// Export validation reward triggers
export {onValidationCreated, onValidationUpdated};
