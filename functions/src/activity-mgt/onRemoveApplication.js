import {db} from "../init.js";

export const updateApplicantsCountOnRemove = async (activityId) => {
  return db.runTransaction(async (transaction) => {
    const activityRef = db.collection("activities").doc(activityId);
    const snap = await transaction.get(activityRef);
    const activity = snap.data();
    activity.applicants = (activity.applicants || 0) - 1;
    console.log("update of applicants :", activity.applicants);
    transaction.set(activityRef, activity);
  });
};
