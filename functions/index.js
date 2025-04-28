import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {onDocumentDeleted} from "firebase-functions/v2/firestore";
import {updateApplicantsCountOnAdd} from
  "./src/activity-mgt/onAddApplication.js";
import {updateApplicantsCountOnRemove} from
  "./src/activity-mgt/onRemoveApplication.js";
import {onCall} from "firebase-functions/v2/https";
import {setUserCustomClaims} from "./src/user-mgt/setCustomClaims.js";

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
      console.log("Activity ID:", activityId);

      // Call the imported function to update applicants count
      await updateApplicantsCountOnRemove(activityId);
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
