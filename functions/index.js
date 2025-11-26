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
  createNotification,
  markNotificationAsRead as markNotificationAsReadService,
  markAllUserNotificationsAsRead as markAllUserNotificationsAsReadService,
} from "./src/notifications/notificationService.js";
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

      // Only notify for accepted / rejected transitions
      if (afterStatus !== "accepted" && afterStatus !== "rejected") {
        return;
      }

      const userId = after.userId;
      if (!userId) {
        console.error(
            "onApplicationStatusChangedNotifyUser: missing userId in application",
        );
        return;
      }

      const activityId = event.params.activityId;
      const applicationId = event.params.applicationId;

      const title = afterStatus === "accepted" ?
        "Application accepted" :
        "Application rejected";

      const body = afterStatus === "accepted" ?
        "Your application has been accepted. Check your dashboard for details." :
        "Your application has been rejected. You can review the details on your dashboard.";

      try {
        await createNotification({
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
      } catch (error) {
        console.error(
            "Failed to create application status notification:",
            error,
        );
      }
    },
);

export const setCustomClaims = onCall(async (request) => {
  // Verify authentication
  if (!request.auth) {
    throw new Error("Unauthorized");
  }

  const {uid, claims} = request.data;

  // Optional: Add additional authorization checks here
  // For example, only allow admins to set claims

  try {
    await setUserCustomClaims(uid, claims);
    return {success: true};
  } catch (error) {
    console.error("Error in setCustomClaims:", error);
    throw new Error("Failed to set custom claims");
  }
});

/**
 * Callable function to mark a single notification as read.
 * The authenticated user can only modify their own notifications.
 */
export const markNotificationAsRead = onCall(async (request) => {
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
export const markAllNotificationsAsRead = onCall(async (request) => {
  if (!request.auth) {
    throw new Error("Unauthorized");
  }

  const userId = request.auth.uid;
  const updatedCount = await markAllUserNotificationsAsReadService(userId);
  return {success: true, updatedCount};
});

// Export validation reward triggers
export {onValidationCreated, onValidationUpdated};
