import {db} from "../init.js";
import {FieldValue} from "firebase-admin/firestore";

const VALID_ACTIVITY_TYPES = ["online", "local", "event"];

/**
 * Upserts a participant record for an NPO when a volunteer is validated.
 * Creates the record and increments totalParticipants on first participation;
 * updates only type flags and lastValidatedAt on subsequent validations.
 *
 * @param {string} organizationId - Organization (NPO) ID
 * @param {string} userId - Volunteer user ID
 * @param {string} activityType - Activity type: "online" | "local" | "event"
 * @param {FirebaseFirestore.Timestamp} [validationTime] - Optional; defaults to
 *     serverTimestamp()
 * @return {Promise<void>}
 */
export async function upsertParticipantRecord(
    organizationId,
    userId,
    activityType,
    validationTime = null,
) {
  if (!organizationId || !userId) {
    console.warn(
        "[upsertParticipantRecord] Skipping: missing organizationId or userId",
    );
    return;
  }

  const normalizedType = activityType && activityType.toLowerCase();
  if (!VALID_ACTIVITY_TYPES.includes(normalizedType)) {
    console.warn(
        "[upsertParticipantRecord] Skipping: invalid activityType \"" +
        activityType + "\"",
    );
    return;
  }

  const now = validationTime || FieldValue.serverTimestamp();
  const participantRef = db
      .collection("organizations")
      .doc(organizationId)
      .collection("participant_records")
      .doc(userId);

  const participantSnap = await participantRef.get();

  if (!participantSnap.exists) {
    const initialData = {
      userId,
      online: normalizedType === "online",
      local: normalizedType === "local",
      event: normalizedType === "event",
      createdAt: now,
      lastValidatedAt: now,
    };
    const batch = db.batch();
    batch.set(participantRef, initialData);
    const orgRef = db.collection("organizations").doc(organizationId);
    batch.update(orgRef, {
      totalParticipants: FieldValue.increment(1),
    });
    await batch.commit();
    console.log(
        "[upsertParticipantRecord] Created participant_record for user " +
        userId + " in org " + organizationId + " (type: " + normalizedType +
        ")",
    );
    return;
  }

  const updates = {
    [normalizedType]: true,
    lastValidatedAt: now,
  };
  await participantRef.update(updates);
  console.log(
      "[upsertParticipantRecord] Updated participant_record for user " +
      userId + " in org " + organizationId + " (set " + normalizedType +
      ": true)",
  );
}
