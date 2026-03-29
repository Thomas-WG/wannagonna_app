import {db} from "../init.js";

const BATCH_SIZE = 500;

/**
 * Deletes all documents in a subcollection using batched writes.
 *
 * @param {FirebaseFirestore.CollectionReference} colRef
 * @return {Promise<number>} Number of documents deleted.
 */
export async function deleteSubcollectionDocuments(colRef) {
  let deleted = 0;
  let hasMore = true;
  while (hasMore) {
    const snap = await colRef.limit(BATCH_SIZE).get();
    if (snap.empty) {
      break;
    }
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    deleted += snap.size;
    hasMore = snap.size === BATCH_SIZE;
  }
  return deleted;
}

/**
 * Deletes canonical activity subcollections after the activity document is
 * removed. Applications are removed here so `onApplicationDeleted` clears
 * member/org mirrors. Validations and participations have no separate mirror
 * cleanup.
 *
 * @param {string} activityId
 * @return {Promise<void>}
 */
export async function cleanupActivitySubcollectionsAfterDelete(activityId) {
  if (!activityId || typeof activityId !== "string") {
    return;
  }

  const activityRef = db.collection("activities").doc(activityId);

  const applicationsDeleted = await deleteSubcollectionDocuments(
      activityRef.collection("applications"),
  );
  const validationsDeleted = await deleteSubcollectionDocuments(
      activityRef.collection("validations"),
  );
  const participationsDeleted = await deleteSubcollectionDocuments(
      activityRef.collection("participations"),
  );

  console.log(
      "[cleanupActivitySubcollectionsAfterDelete]",
      `activityId=${activityId}`,
      `applications=${applicationsDeleted}`,
      `validations=${validationsDeleted}`,
      `participations=${participationsDeleted}`,
  );
}
