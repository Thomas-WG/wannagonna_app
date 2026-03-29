import {db} from "../init.js";
import {FieldValue} from "firebase-admin/firestore";

/**
 * Recomputes denormalized participant/application counters on the activity doc
 * from subcollections (Admin SDK; bypasses security rules).
 *
 * @param {string} activityId Firestore activity document id
 * @return {Promise<void>}
 */
export async function syncActivityAggregateCounts(activityId) {
  if (!activityId || typeof activityId !== "string") {
    return;
  }

  const activityRef = db.collection("activities").doc(activityId);
  const activitySnap = await activityRef.get();
  if (!activitySnap.exists) {
    return;
  }

  const [applicationsSnap, validationsSnap, participationsSnap] =
    await Promise.all([
      activityRef.collection("applications").get(),
      activityRef.collection("validations").get(),
      activityRef.collection("participations").get(),
    ]);

  const applications = applicationsSnap.docs.map((d) => d.data());
  const nonCancelled = applications.filter(
      (a) => a && a.status !== "cancelled",
  );
  const accepted = applications.filter(
      (a) => a && a.status === "accepted",
  );

  const rejectedUserIds = new Set();
  const validatedDocCount = validationsSnap.docs.reduce((acc, docSnap) => {
    const v = docSnap.data();
    if (!v) {
      return acc;
    }
    if (v.status === "rejected" && v.user_id) {
      rejectedUserIds.add(v.user_id);
    }
    if (v.status === "validated") {
      return acc + 1;
    }
    return acc;
  }, 0);

  const effectiveParticipants = accepted.filter(
      (app) => app.user_id && !rejectedUserIds.has(app.user_id),
  );

  const applicantsCount = nonCancelled.length;
  const acceptedCount = accepted.length;
  const effectiveCount = effectiveParticipants.length;
  const participationsCount = participationsSnap.size;

  await activityRef.update({
    applicants: applicantsCount,
    applicants_count: applicantsCount,
    accepted_applicants_count: acceptedCount,
    effective_participants_count: effectiveCount,
    validated_count: validatedDocCount,
    participations_count: participationsCount,
    aggregate_counts_updated_at: FieldValue.serverTimestamp(),
  });
}
