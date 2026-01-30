import {db} from "../init.js";
import {sendUserNotification} from "../notifications/notificationService.js";


export const updateApplicantsCountOnAdd = async (activityId) => {
  // First, run the transaction to update counts and gather data
  const result = await db.runTransaction(async (transaction) => {
    // Get activity document
    const activityRef = db.collection("activities").doc(activityId);
    const activitySnap = await transaction.get(activityRef);

    if (!activitySnap.exists) {
      throw new Error("Activity document does not exist!");
    }

    const activity = activitySnap.data();
    const newApplicantCount = (activity.applicants || 0) + 1;

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
    const newApplicationCount = (organization.totalNewApplications || 0) + 1;

    // Update both documents
    transaction.update(activityRef, {applicants: newApplicantCount});
    transaction.update(organizationRef,
        {totalNewApplications: newApplicationCount});

    console.log("Updated applicants count:", newApplicantCount);

    // Return everything needed for notifications outside the transaction
    return {
      activityApplicants: newApplicantCount,
      orgApplications: newApplicationCount,
      organizationId,
      activityTitle: activity.title || "an activity",
    };
  });

  // After transaction completes, send a notification to all NPO members
  const {organizationId, activityTitle} = result;
  try {
    console.log(
        `[updateApplicantsCountOnAdd] Sending notifications to NPO ` +
        `members for organization ${organizationId}`,
    );
    // Find all members whose npoId matches the organizationId
    const membersSnap = await db.collection("members")
        .where("npoId", "==", organizationId)
        .get();

    console.log(
        `[updateApplicantsCountOnAdd] Found ${membersSnap.size} NPO ` +
        `member(s) for organization ${organizationId}`,
    );

    if (!membersSnap.empty) {
      const promises = membersSnap.docs.map(async (memberDoc) => {
        try {
          console.log(
              `[updateApplicantsCountOnAdd] Sending notification to ` +
              `NPO member ${memberDoc.id}`,
          );
          await sendUserNotification({
            userId: memberDoc.id,
            type: "APPLICATION",
            title: "New application received",
            body: `A volunteer applied to "${activityTitle}".`,
            link: "/mynonprofit/activities/applications",
            metadata: {
              activityId,
              organizationId,
            },
          });
          console.log(
              `[updateApplicantsCountOnAdd] Notification sent successfully ` +
              `to NPO member ${memberDoc.id}`,
          );
        } catch (memberNotifError) {
          // Log error for this member but continue with others
          console.error(
              `[updateApplicantsCountOnAdd] Failed to send notification ` +
              `to NPO member ${memberDoc.id}:`,
              memberNotifError,
          );
          console.error(
              `[updateApplicantsCountOnAdd] Member notification error details:`,
              {
                message: memberNotifError.message,
                stack: memberNotifError.stack,
                code: memberNotifError.code,
                userId: memberDoc.id,
                activityId,
                organizationId,
              },
          );
        }
      });
      await Promise.all(promises);
      console.log(
          `[updateApplicantsCountOnAdd] Completed sending notifications ` +
          `to all NPO members`,
      );
    } else {
      console.log(
          `[updateApplicantsCountOnAdd] No NPO members found for ` +
          `organization ${organizationId}`,
      );
    }
  } catch (notifError) {
    console.error(
        `[updateApplicantsCountOnAdd] Failed to create new application ` +
        `notifications:`,
        notifError,
    );
    console.error(
        `[updateApplicantsCountOnAdd] Notification error details:`,
        {
          message: notifError.message,
          stack: notifError.stack,
          code: notifError.code,
          activityId,
          organizationId,
        },
    );
  }

  return result;
};
