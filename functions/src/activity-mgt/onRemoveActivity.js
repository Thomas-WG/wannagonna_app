import {db} from "../init.js";


export const updateActivityCountOnRemove = async (activityId, activityData) => {
  return db.runTransaction(async (transaction) => {
    // Use the activity data passed from the event instead of trying to read the
    // deleted document
    const activity = activityData;

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
    const type = activity.type;
    if (type === "online") {
      const totalOnlineActivities =
        (organization.totalOnlineActivities || 0) - 1;
      transaction.update(organizationRef, {
        totalOnlineActivities: totalOnlineActivities,
      });
    } else if (type === "local") {
      const totalLocalActivities =
        (organization.totalLocalActivities || 0) - 1;
      transaction.update(organizationRef, {
        totalLocalActivities: totalLocalActivities,
      });
    } else if (type === "event") {
      const totalEvents = (organization.totalEvents || 0) - 1;
      transaction.update(organizationRef, {totalEvents: totalEvents});
    }

    console.log("Updated activity count:");
    return {
      activity: activity,
    };
  });
};
