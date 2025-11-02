import {db} from "../init.js";


export const updateActivityCountOnAdd = async (activityId) => {
  return db.runTransaction(async (transaction) => {
    // Get activity document
    const activityRef = db.collection("activities").doc(activityId);
    const activitySnap = await transaction.get(activityRef);

    if (!activitySnap.exists) {
      throw new Error("Activity document does not exist!");
    }

    const activity = activitySnap.data();

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
        (organization.totalOnlineActivities || 0) + 1;
      transaction.update(organizationRef, {
        totalOnlineActivities: totalOnlineActivities,
      });
    } else if (type === "local") {
      const totalLocalActivities =
        (organization.totalLocalActivities || 0) + 1;
      transaction.update(organizationRef, {
        totalLocalActivities: totalLocalActivities,
      });
    } else if (type === "event") {
      const totalEvents = (organization.totalEvents || 0) + 1;
      transaction.update(organizationRef, {totalEvents: totalEvents});
    }

    console.log("Updated activity count:");
    return {
      activity: activity,
    };
  });
};
