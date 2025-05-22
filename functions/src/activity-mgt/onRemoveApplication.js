import {db} from "../init.js";

export const updateApplicantsCountOnRemove = async (activityId) => {
  return db.runTransaction(async (transaction) => {
    // Get activity document
    const activityRef = db.collection("activities").doc(activityId);
    const activitySnap = await transaction.get(activityRef);

    if (!activitySnap.exists) {
      throw new Error("Activity document does not exist!");
    }

    const activity = activitySnap.data();
    const newApplicantCount = (activity.applicants || 0) - 1;

    // Get organization document
    const organizationId = activity.organizationId;
    if (!organizationId) {
      throw new Error("Activity is missing organizationId!");
    }

    const organizationRef = db.collection("organizations").doc(organizationId);
    const orgSnap = await transaction.get(organizationRef);

    if (!orgSnap.exists) {
      throw new Error("Organization document does not exist!");
    }

    const organization = orgSnap.data();
    const newApplicationCount = (organization.totalNewApplications || 0) - 1;

    // Update both documents
    transaction.update(activityRef, {applicants: newApplicantCount});
    transaction.update(organizationRef,
        {totalNewApplications: newApplicationCount});

    console.log("Updated applicants count:", newApplicantCount);
    return {
      activityApplicants: newApplicantCount,
      orgApplications: newApplicationCount,
    };
  });
};
