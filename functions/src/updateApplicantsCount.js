// const functions = require("firebase-functions");
const admin = require("firebase-admin");

/**
 * This Cloud Function triggers when a new application document is added
 * under an activity. It updates the parent activity's `applicants` counter.
 * @param {Object} change The database change that triggered the function
 * @param {Object} context Contains the parameters and auth of the function call
 */
const updateApplicantsCount = async (change, context) => {
  const {activityId} = context.params;
  const activityRef = admin.firestore()
      .collection("activities")
      .doc(activityId);

  // Safely increment the "applicants" field by 1
  await activityRef.update({
    applicants: admin.firestore.FieldValue.increment(1),
  });

  return null;
};

module.exports = {updateApplicantsCount};
