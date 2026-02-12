import {onDocumentCreated, onDocumentUpdated} from
  "firebase-functions/v2/firestore";
import {processActivityValidationRewards} from
  "./processActivityValidationRewards.js";
import {db} from "../init.js";
import {FieldValue, Timestamp} from "firebase-admin/firestore";

/**
 * Upsert a participant record under the NPO so the participants list can query
 * one doc per user per org with online/local/event booleans and timestamps.
 * @param {string} activityId - Activity ID
 * @param {string} userId - User ID of the validated volunteer
 * @return {Promise<void>}
 */
async function upsertParticipantRecord(activityId, userId) {
  const activityRef = db.collection("activities").doc(activityId);
  const activitySnap = await activityRef.get();
  if (!activitySnap.exists) {
    console.warn("upsertParticipantRecord: activity not found", activityId);
    return;
  }
  const activity = activitySnap.data();
  const organizationId = activity.organizationId;
  const activityType = activity.type; // 'online' | 'local' | 'event'
  if (!organizationId || !activityType) {
    console.warn(
        "upsertParticipantRecord: missing organizationId or type",
        {activityId, organizationId, activityType},
    );
    return;
  }
  const orgRef = db.collection("organizations").doc(organizationId);
  const participantRef = orgRef.collection("participant_records").doc(userId);
  const now = Timestamp.now();
  const typeField = activityType === "online" ?
    "online" : activityType === "local" ? "local" : "event";

  const participantSnap = await participantRef.get();
  if (!participantSnap.exists) {
    const data = {
      userId,
      online: activityType === "online",
      local: activityType === "local",
      event: activityType === "event",
      createdAt: now,
      lastValidatedAt: now,
    };
    await db.runTransaction(async (transaction) => {
      transaction.set(participantRef, data);
      transaction.update(orgRef, {
        totalParticipants: FieldValue.increment(1),
      });
    });
    console.log(
        "Participant record created for org",
        organizationId,
        "user",
        userId,
    );
  } else {
    const updates = {
      [typeField]: true,
      lastValidatedAt: now,
    };
    await participantRef.update(updates);
    console.log(
        "Participant record updated for org",
        organizationId,
        "user",
        userId,
    );
  }
}

/**
 * Helper function to process rewards for a validation
 * @param {Object} event - Firestore event object
 * @param {boolean} isUpdate - Whether this is an update event (vs create)
 * @return {Promise<void>}
 */
async function processValidationRewards(event, isUpdate = false) {
  // For update events, use event.data.after, for create events use event.data
  const validationSnapshot = isUpdate ? event.data?.after : event.data;
  const validationData = validationSnapshot?.data();
  const activityId = event.params.activityId;
  const validationId = event.params.validationId;

  console.log(
      `Validation trigger fired (${isUpdate ? "update" : "create"}): ` +
      `${validationId} for activity ${activityId}`,
  );

  // Only process if status is 'validated'
  // For backward compatibility, also process if status is undefined/null
  // (old QR validations didn't have status field)
  const status = validationData?.status;
  if (status && status !== "validated") {
    console.log(
        `Skipping reward processing - status is '${status}', not 'validated'`,
    );
    return;
  }

  const userId = validationData?.userId;
  if (!userId) {
    console.error("Validation document missing userId");
    return;
  }

  const validatedBy = validationData?.validatedBy || null;

  try {
    // Check if rewards have already been processed.
    // Update: event.data.after.ref; create: event.data.ref
    const validationRef = validationSnapshot?.ref;
    if (!validationRef) {
      throw new Error("Validation reference not found");
    }

    // Check if already processed
    const validationSnap = await validationRef.get();
    const validationDataCheck = validationSnap.data();
    if (validationDataCheck?.rewardsProcessed === true) {
      console.log(
          `Rewards already processed for validation ${validationId}`,
      );
      return;
    }

    // Process rewards
    const result = await processActivityValidationRewards(
        activityId,
        userId,
        validatedBy,
    );

    // Mark as processed to prevent duplicate processing
    await validationRef.update({
      rewardsProcessed: true,
      rewardsProcessedAt: FieldValue.serverTimestamp(),
      rewardsResult: {
        xpReward: result.xpReward,
        badgeXP: result.badgeXP,
        totalXP: result.totalXP,
        badgesGranted: result.badgesGranted,
      },
    });

    console.log(
        `Rewards processed successfully for validation ${validationId}:`,
        result,
    );

    // Upsert NPO participant record for participants list
    try {
      await upsertParticipantRecord(activityId, userId);
    } catch (participantError) {
      console.error(
          "Error upserting participant record (non-fatal):",
          participantError,
      );
    }
  } catch (error) {
    // Log error but don't fail - validation is already recorded
    console.error(
        `Error processing rewards for validation ${validationId}:`,
        error,
    );

    // Write to error collection for monitoring/retry
    try {
      await db.collection("rewardErrors").add({
        validationId,
        activityId,
        userId,
        error: error.message,
        stack: error.stack,
        timestamp: FieldValue.serverTimestamp(),
      });
    } catch (errorLogError) {
      console.error("Failed to log error:", errorLogError);
    }
  }
}

/**
 * Triggered when a validation document is created with 'validated' status
 * Processes rewards (XP + badges) asynchronously in the background
 */
export const onValidationCreated = onDocumentCreated(
    {
      document: "activities/{activityId}/validations/{validationId}",
      memory: "512MiB",
      timeoutSeconds: 540,
    },
    async (event) => {
      await processValidationRewards(event, false);
    },
);

/**
 * Triggered when a validation document is updated to 'validated' status
 * Processes rewards (XP + badges) asynchronously in the background
 */
export const onValidationUpdated = onDocumentUpdated(
    {
      document: "activities/{activityId}/validations/{validationId}",
      memory: "512MiB",
      timeoutSeconds: 540,
    },
    async (event) => {
      // Only process if status changed to 'validated'
      const beforeData = event.data?.before?.data();
      const afterData = event.data?.after?.data();

      const beforeStatus = beforeData?.status;
      const afterStatus = afterData?.status;

      // Only process if status changed to 'validated' (wasn't validated before)
      if (afterStatus === "validated" && beforeStatus !== "validated") {
        await processValidationRewards(event, true);
      } else {
        console.log(
            `Skipping reward processing - status change from ` +
            `'${beforeStatus}' to '${afterStatus}' doesn't require ` +
            `reward processing`,
        );
      }
    },
);

