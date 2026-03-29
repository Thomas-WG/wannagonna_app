import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import {db} from "../init.js";
import {FieldValue, Timestamp} from "firebase-admin/firestore";

// 4 writes per member (member, participation, participant_record, xp_history)
const BATCH_SIZE = 100; // 100*4 < 500

/**
 * Convert a value to a Date object.
 * @param {*} value - Timestamp, Date, or date-like value.
 * @return {Date|null}
 */
function toDate(value) {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  if (value instanceof Date) return value;
  return new Date(value);
}

/**
 * Combine a date with a time string (HH:mm).
 * @param {*} date - Date-like value.
 * @param {string} timeStr - Time as "HH:mm".
 * @return {Date|null}
 */
function combineDateAndTime(date, timeStr) {
  if (!date || !timeStr) return null;
  const d = toDate(date);
  if (!d) return null;
  const [hours, minutes] = String(timeStr).split(":").map((n) => Number(n));
  const out = new Date(d);
  const h = Number.isFinite(hours) ? hours : 0;
  const m = Number.isFinite(minutes) ? minutes : 0;
  out.setHours(h, m, 0, 0);
  return out;
}

/**
 * Get activity duration in hours from start/end date and time.
 * @param {Object} activity - Activity document.
 * @return {number|null}
 */
function getActivityDurationHours(activity) {
  if (!activity) return null;
  const hasTime = activity.start_time || activity.end_time;
  const startDate = toDate(activity.start_date);
  if (!startDate || !hasTime) return null;

  const start = combineDateAndTime(
      activity.start_date,
      activity.start_time || "00:00",
  );
  const endDateRaw = activity.end_date || activity.start_date;
  const end = combineDateAndTime(
      endDateRaw,
      activity.end_time || activity.start_time || "00:00",
  );

  if (!start || !end) return null;
  const ms = end.getTime() - start.getTime();
  if (!(ms > 0)) return null;
  const hours = ms / (1000 * 60 * 60);
  return Number.isFinite(hours) ? hours : null;
}

/**
 * When an activity's status changes to Closed:
 * - Sum participations hours.validated -> impact_results.total_hours
 * - Update org impact_summary (total_hours, total_activities, parameters)
 * - For each participation: update member impact_summary. Skip XP/xp_history
 *   for participants already rewarded by processActivityValidationRewards (on
 *   validation); award XP only to those not yet validated.
 * @param {string} activityId - Activity document ID.
 * @param {Object} activityBefore - Snapshot before update.
 * @param {Object} activityAfter - Snapshot after update.
 */
async function processActivityClosed(
    activityId, activityBefore, activityAfter) {
  const activity = activityAfter;
  const organizationId = activity.organization_id;
  if (!organizationId) {
    console.warn("[onActivityClosed] No organizationId:", activityId);
    return;
  }

  // Events are gamification (attendance), not volunteering — skip impact/hours
  if (activity.type === "event") {
    const activityRef = db.collection("activities").doc(activityId);
    const activityDoc = await activityRef.get();
    const current = activityDoc?.data();
    const ir = current?.impact_results || {};
    if (ir.last_aggregation) {
      console.log("[onActivityClosed] Event already processed, skipping:",
          activityId);
      return;
    }
    await activityRef.update({
      "impact_results.total_hours": 0,
      "impact_results.last_aggregation": {event: true},
    });
    console.log("[onActivityClosed] Event closed (no impact):", activityId);
    return;
  }

  // Idempotency: skip if already processed (prevents double-count)
  // Re-read from Firestore; event snapshot is stale on retry.
  const activityDoc = await db.collection("activities").doc(activityId).get();
  const currentActivity = activityDoc?.data();
  const currIr = currentActivity?.impact_results || {};
  if (currIr.last_aggregation) {
    console.log("[onActivityClosed] Already processed, skipping:", activityId);
    return;
  }

  const actsRef = db.collection("activities").doc(activityId);
  const [participationsSnap, validationsSnap] = await Promise.all([
    actsRef.collection("participations").get(),
    actsRef.collection("validations").get(),
  ]);

  const rejectedUserIds = new Set(
      validationsSnap.docs
          .map((d) => d.data())
          .filter((v) => v.status === "rejected")
          .map((v) => v.user_id)
          .filter(Boolean),
  );

  // Users with validated status — only these earn impact (participations are
  // created on acceptance; pending/rejected users must not get impact or XP).
  const validatedUserIds = new Set(
      validationsSnap.docs
          .map((d) => d.data())
          .filter((v) => v.status === "validated")
          .map((v) => v.user_id)
          .filter(Boolean),
  );

  // Users already rewarded via processActivityValidationRewards (on validation)
  const alreadyRewardedUserIds = validatedUserIds;

  // Participations from Firestore (may be empty for QR-only users)
  const participationDocs = participationsSnap.docs
      .map((d) => ({id: d.id, ...d.data()}))
      .filter((p) =>
        !rejectedUserIds.has(p.id) && validatedUserIds.has(p.id),
      );

  // Include validated users who have no participation doc (QR-only, walk-ins).
  // Use durationHours for local/event, otherwise 0.
  const partByUser = new Map();
  participationDocs.forEach((p) => partByUser.set(p.id, p));
  const durationHours = getActivityDurationHours(activity);
  const participations = [];
  for (const uid of validatedUserIds) {
    if (rejectedUserIds.has(uid)) continue;
    const p = partByUser.get(uid);
    if (p) {
      participations.push(p);
    } else {
      // No participation doc — QR-only user. Use duration or 0 for local/event.
      const isLocalOrEvent =
          activity.type === "local" || activity.type === "event";
      const effective = isLocalOrEvent && durationHours ? durationHours : 0;
      participations.push({
        id: uid,
        status: "validated",
        hours: {validated: effective, reported: 0},
      });
    }
  }

  // Build parameter meta map from the activity's configured impact parameters
  // so we can persist human-readable labels/units alongside summaries.
  const activityParamMeta = {};
  const activityImpactParameters = Array.isArray(activity.impact_parameters) ?
    activity.impact_parameters :
    [];
  for (const p of activityImpactParameters) {
    const paramId = p?.parameter_id;
    if (p && paramId) {
      activityParamMeta[paramId] = {
        label: p.label || "",
        unit: p.unit || "",
        category: p.category || "",
        scope: p.scope || "",
      };
    }
  }

  const hoursByUser = {};
  let totalHours = 0;
  for (const p of participations) {
    const hours = p.hours || {};
    const validatedExplicitlySet = "validated" in hours;
    let effective = 0;

    if (validatedExplicitlySet) {
      effective = Number(hours.validated) || 0;
    } else if (durationHours && p.status === "validated") {
      effective = durationHours;
    }

    hoursByUser[p.id] = effective;
    totalHours += effective;
  }

  const impactResultsDoc = activity.impact_results || {};
  const parameters = impactResultsDoc.parameters || {};
  const closedAt = impactResultsDoc.closed_at ?? Timestamp.now();

  const activityRef = db.collection("activities").doc(activityId);

  // Build last_aggregation for future recalculations
  const memberDeltasForAgg = {};
  for (const p of participations) {
    const validatedHours = Number(hoursByUser[p.id]) || 0;
    memberDeltasForAgg[p.id] = {
      total_hours: validatedHours,
      total_activities: 1,
      parameters: {...parameters},
    };
  }
  const lastAggregation = {
    orgDelta: {
      total_hours: totalHours,
      total_activities: 1,
      parameters: {...parameters},
    },
    memberDeltas: memberDeltasForAgg,
  };

  // Perform org and member updates first. Write last_aggregation (idempotency
  // guard) only after all succeed so retries can recover from partial failures.
  const orgRef = db.collection("organizations").doc(organizationId);
  const orgUpdates = {
    "impact_summary.total_hours": FieldValue.increment(totalHours),
    "impact_summary.total_activities": FieldValue.increment(1),
  };
  for (const [paramId, value] of Object.entries(parameters)) {
    const num = Number(value) || 0;
    orgUpdates["impact_summary.parameters." + paramId] =
        FieldValue.increment(num);
    orgUpdates["impact_summary.parameter_meta." + paramId] =
        activityParamMeta[paramId] || {label: paramId};
  }
  const batch2 = db.batch();
  batch2.update(orgRef, orgUpdates);
  await batch2.commit();

  const activityXP = Number(activity.xp_reward) || 0;
  const activityTitle = activity.title || "Unknown Activity";

  // Skip member updates when no participations (getAll requires ≥1 ref)
  let processed = 0;
  let xpAwardedCount = 0;
  if (participations.length > 0) {
    for (let i = 0; i < participations.length; i += BATCH_SIZE) {
      const chunk = participations.slice(i, i + BATCH_SIZE);
      const batch = db.batch();

      for (let j = 0; j < chunk.length; j++) {
        const p = chunk[j];
        const userId = p.id;
        const validatedHours = Number(hoursByUser[userId]) || 0;

        const userRef = db.collection("members").doc(userId);
        const memberUpdates = {
          "impact_summary.total_hours": FieldValue.increment(validatedHours),
          "impact_summary.total_activities": FieldValue.increment(1),
        };
        // Skip XP for users already rewarded on validation
        if (!alreadyRewardedUserIds.has(userId)) {
          memberUpdates.xp = FieldValue.increment(activityXP);
          xpAwardedCount++;
        }
        for (const [paramId, value] of Object.entries(parameters)) {
          const num = Number(value) || 0;
          memberUpdates["impact_summary.parameters." + paramId] =
              FieldValue.increment(num);
          memberUpdates["impact_summary.parameter_meta." + paramId] =
          activityParamMeta[paramId] || {label: paramId};
        }
        batch.update(userRef, memberUpdates);

        const participationRef = db.collection("activities").doc(activityId)
            .collection("participations").doc(userId);
        batch.update(participationRef, {xp_awarded: activityXP});

        // Accumulate in participant_record
        if (validatedHours > 0) {
          const participantRecordRef = db
              .collection("organizations")
              .doc(organizationId)
              .collection("participant_records")
              .doc(userId);
          const prUpdates = {
            user_id: userId,
            total_hours: FieldValue.increment(validatedHours),
            total_activities: FieldValue.increment(1),
            last_validated_at: closedAt,
          };
          for (const [paramId, value] of Object.entries(parameters)) {
            const key = "parameters." + paramId;
            prUpdates[key] = FieldValue.increment(Number(value) || 0);
          }
          batch.set(participantRecordRef, prUpdates, {merge: true});
        }

        // Skip xp_history for users already rewarded on validation
        if (!alreadyRewardedUserIds.has(userId) && activityXP > 0) {
          const xpHistoryRef = userRef.collection("xp_history");
          batch.set(xpHistoryRef.doc(), {
            title: `Activity: ${activityTitle}`,
            points: activityXP,
            type: "activity",
            activity_id: activityId,
            created_at: FieldValue.serverTimestamp(),
          });
        }
      }

      await batch.commit();
      processed += chunk.length;
    }
  }

  // Write activity impact_results + idempotency guard last, so retries
  // recover from any earlier batch failure (org/member updates).
  const finalBatch = db.batch();
  finalBatch.update(activityRef, {
    "impact_results.total_hours": totalHours,
    "impact_results.last_aggregation": lastAggregation,
  });
  await finalBatch.commit();

  const msg = `[onActivityClosed] ${activityId}: totalHours=${totalHours}, ` +
      `participations=${processed}, XP awarded to ${xpAwardedCount} members`;
  console.log(msg);
}

/**
 * Firestore trigger when an activity document is updated.
 * Runs only when status changes to "Closed".
 */
export const onActivityClosed = onDocumentUpdated(
    {
      document: "activities/{activityId}",
      memory: "512MiB",
      timeoutSeconds: 540,
    },
    async (event) => {
      const before = event.data?.before?.data();
      const after = event.data?.after?.data();
      const activityId = event.params.activityId;

      if (!before || !after) return;

      const beforeStatus = before.status;
      const afterStatus = after.status;

      if (beforeStatus === "Closed" || afterStatus !== "Closed") {
        return;
      }

      try {
        await processActivityClosed(activityId, before, after);
      } catch (error) {
        console.error("[onActivityClosed] Error:", error);
        try {
          await db.collection("reward_errors").add({
            activityId,
            error: error.message,
            stack: error.stack,
            timestamp: FieldValue.serverTimestamp(),
          });
        } catch (logErr) {
          console.error("[onActivityClosed] Failed to log error:", logErr);
        }
      }
    },
);
