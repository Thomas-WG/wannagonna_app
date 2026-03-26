import {db} from "../init.js";


export const updateActivityCountOnRemove = async (activityId, activityData) => {
  return db.runTransaction(async (transaction) => {
    // Use the activity data passed from the event instead of trying to read the
    // deleted document
    const activity = activityData;

    // Get organization document
    const organizationId = activity.organization_id;
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
        (organization.total_online_activities || 0) - 1;
      transaction.update(organizationRef, {
        total_online_activities: totalOnlineActivities,
      });
    } else if (type === "local") {
      const totalLocalActivities =
        (organization.total_local_activities || 0) - 1;
      transaction.update(organizationRef, {
        total_local_activities: totalLocalActivities,
      });
    } else if (type === "event") {
      const totalEvents = (organization.total_events || 0) - 1;
      transaction.update(organizationRef, {total_events: totalEvents});
    }

    console.log("Updated activity count:");
    return {
      activity: activity,
    };
  });
};
