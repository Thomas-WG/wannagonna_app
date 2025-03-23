import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {onDocumentDeleted} from "firebase-functions/v2/firestore";
import {updateApplicantsCountOnAdd} from
  "./src/activity-mgt/onAddApplication.js";
import {updateApplicantsCountOnRemove} from
  "./src/activity-mgt/onRemoveApplication.js";

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
