import {onCall} from "firebase-functions/v2/https";
import {db} from "../init.js";
import {Timestamp} from "firebase-admin/firestore";

/**
 * One-time backfill: for each NPO, merge all validated participations into
 * organizations/{npoId}/participant_records (one doc per userId with
 * online/local/event booleans, createdAt, lastValidatedAt) and set
 * totalParticipants on the org.
 * Callable (e.g. from admin or script); no auth check for flexibility.
 * @return {Promise<{success: boolean, message: string, stats?: Object}>}
 */
export const backfillParticipantRecords = onCall(async () => {
  const activitiesSnap = await db.collection("activities").get();
  const orgToActivities = new Map(); // organizationId -> [{ id, type }]
  for (const doc of activitiesSnap.docs) {
    const data = doc.data();
    const organizationId = data.organizationId;
    if (!organizationId) continue;
    if (!orgToActivities.has(organizationId)) {
      orgToActivities.set(organizationId, []);
    }
    orgToActivities.get(organizationId).push({
      id: doc.id,
      type: data.type || "online",
    });
  }

  let totalOrgs = 0;
  let totalParticipants = 0;

  for (const [organizationId, activities] of orgToActivities) {
    const userToValidations = new Map();
    // userId -> { online, local, event, validatedAts: [timestamp] }

    for (const {id: activityId, type: activityType} of activities) {
      const validationsSnap = await db
          .collection("activities")
          .doc(activityId)
          .collection("validations")
          .get();

      for (const vDoc of validationsSnap.docs) {
        const v = vDoc.data();
        if (v.status !== "validated") continue;
        const userId = v.userId;
        if (!userId) continue;
        const validatedAt = v.validatedAt?.toDate ?
          v.validatedAt.toDate() :
          (v.validatedAt ? new Date(v.validatedAt) : null);
        if (!validatedAt) continue;

        if (!userToValidations.has(userId)) {
          userToValidations.set(userId, {
            online: false,
            local: false,
            event: false,
            validatedAts: [],
          });
        }
        const rec = userToValidations.get(userId);
        if (activityType === "online") rec.online = true;
        if (activityType === "local") rec.local = true;
        if (activityType === "event") rec.event = true;
        rec.validatedAts.push(validatedAt);
      }
    }

    const orgRef = db.collection("organizations").doc(organizationId);
    const batch = db.batch();
    for (const [userId, rec] of userToValidations) {
      const validatedAts = rec.validatedAts;
      const minT = Math.min(...validatedAts.map((d) => d.getTime()));
      const maxT = Math.max(...validatedAts.map((d) => d.getTime()));
      const createdAt = new Date(minT);
      const lastValidatedAt = new Date(maxT);
      const participantRef = orgRef
          .collection("participant_records")
          .doc(userId);
      batch.set(participantRef, {
        userId,
        online: rec.online,
        local: rec.local,
        event: rec.event,
        createdAt: Timestamp.fromDate(createdAt),
        lastValidatedAt: Timestamp.fromDate(lastValidatedAt),
      });
    }
    const count = userToValidations.size;
    if (count > 0) {
      batch.update(orgRef, {totalParticipants: count});
      await batch.commit();
      totalOrgs += 1;
      totalParticipants += count;
    }
  }

  return {
    success: true,
    message: "Backfill completed",
    stats: {organizationsProcessed: totalOrgs, totalParticipants},
  };
});
