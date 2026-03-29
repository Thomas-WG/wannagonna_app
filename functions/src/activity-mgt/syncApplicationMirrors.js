import {FieldValue} from "firebase-admin/firestore";
import {db} from "../init.js";

/**
 * Upserts member and organization mirror docs for a canonical application.
 * Mirror doc IDs match the canonical application ID.
 *
 * @param {string} activityId
 * @param {string} applicationId
 * @param {FirebaseFirestore.DocumentData} data
 * @return {Promise<void>}
 */
export async function upsertApplicationMirrors(
    activityId,
    applicationId,
    data,
) {
  const userId = data.user_id;
  const organizationId = data.organization_id;
  if (!userId || !organizationId) {
    console.warn(
        "[upsertApplicationMirrors] missing user_id or organization_id",
        {activityId, applicationId},
    );
    return;
  }

  const payload = {
    ...data,
    application_id: applicationId,
    activity_id: activityId,
  };

  const memberRef = db
      .collection("members")
      .doc(userId)
      .collection("applications")
      .doc(applicationId);
  const orgRef = db
      .collection("organizations")
      .doc(organizationId)
      .collection("applications")
      .doc(applicationId);

  const batch = db.batch();
  batch.set(memberRef, payload, {merge: true});
  batch.set(orgRef, payload, {merge: true});
  await batch.commit();
}

/**
 * Deletes member and org mirror docs when the canonical application is removed.
 *
 * @param {string} applicationId
 * @param {Object|undefined} applicationData
 * @return {Promise<void>}
 */
export async function deleteApplicationMirrors(
    applicationId,
    applicationData,
) {
  if (!applicationData) {
    console.warn(
        "[deleteApplicationMirrors] no application data",
        {applicationId},
    );
    return;
  }
  const userId = applicationData.user_id;
  const organizationId = applicationData.organization_id;
  if (!userId || !organizationId) {
    console.warn(
        "[deleteApplicationMirrors] missing user_id or organization_id",
        {applicationId},
    );
    return;
  }

  const memberRef = db
      .collection("members")
      .doc(userId)
      .collection("applications")
      .doc(applicationId);
  const orgRef = db
      .collection("organizations")
      .doc(organizationId)
      .collection("applications")
      .doc(applicationId);

  const batch = db.batch();
  batch.delete(memberRef);
  batch.delete(orgRef);
  await batch.commit();
}

const RESOLVED_STATUSES = ["accepted", "rejected", "cancelled"];

/**
 * Decrements org total_new_applications when leaving pending via update.
 *
 * @param {Object|undefined} before
 * @param {Object|undefined} after
 * @return {Promise<void>}
 */
export async function maybeDecrementOrgPendingApplications(
    before,
    after,
) {
  if (!before || !after) {
    return;
  }
  if (before.status !== "pending") {
    return;
  }
  if (!RESOLVED_STATUSES.includes(after.status)) {
    return;
  }
  const orgId = after.organization_id;
  if (!orgId) {
    return;
  }

  await db.collection("organizations").doc(orgId).update({
    total_new_applications: FieldValue.increment(-1),
  });
}
