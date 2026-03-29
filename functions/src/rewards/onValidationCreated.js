import {onDocumentCreated, onDocumentDeleted, onDocumentUpdated} from
  "firebase-functions/v2/firestore";
import {processActivityValidationRewards} from
  "./processActivityValidationRewards.js";
import {syncActivityAggregateCounts} from
  "../activity-mgt/syncActivityAggregateCounts.js";
import {db} from "../init.js";
import {FieldValue} from "firebase-admin/firestore";

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

  const status = validationData?.status;
  if (status !== "validated") {
    console.log(
        `Skipping reward processing - status is '${String(status)}', ` +
        `expected 'validated'`,
    );
    return;
  }

  const userId = validationData?.user_id;
  if (!userId) {
    console.error("Validation document missing user_id");
    return;
  }

  const validatedBy = validationData?.validated_by ?? null;

  try {
    // Check if rewards have already been processed
    // For update events, use event.data.after.ref,
    // for create events use event.data.ref
    const validationRef = validationSnapshot?.ref;
    if (!validationRef) {
      throw new Error("Validation reference not found");
    }

    // Check if already processed
    const validationSnap = await validationRef.get();
    const validationDataCheck = validationSnap.data();
    if (validationDataCheck?.rewards_processed === true) {
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
      rewards_processed: true,
      rewards_processed_at: FieldValue.serverTimestamp(),
      rewards_result: {
        xp_reward: result.xpReward,
        badge_xp: result.badgeXP,
        total_xp: result.totalXP,
        badges_granted: result.badgesGranted,
      },
    });

    console.log(
        `Rewards processed successfully for validation ${validationId}:`,
        result,
    );
  } catch (error) {
    // Log error but don't fail - validation is already recorded
    console.error(
        `Error processing rewards for validation ${validationId}:`,
        error,
    );

    // Write to error collection for monitoring/retry
    try {
      await db.collection("reward_errors").add({
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
      const activityId = event.params.activityId;
      try {
        await processValidationRewards(event, false);
      } finally {
        try {
          await syncActivityAggregateCounts(activityId);
        } catch (syncErr) {
          console.error(
              "[onValidationCreated] syncActivityAggregateCounts failed:",
              syncErr,
          );
        }
      }
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
      const activityId = event.params.activityId;
      try {
        const beforeData = event.data?.before?.data();
        const afterData = event.data?.after?.data();

        const beforeStatus = beforeData?.status;
        const afterStatus = afterData?.status;

        if (afterStatus === "validated" && beforeStatus !== "validated") {
          await processValidationRewards(event, true);
        } else {
          console.log(
              `Skipping reward processing - status change from ` +
              `'${beforeStatus}' to '${afterStatus}' doesn't require ` +
              `reward processing`,
          );
        }
      } finally {
        try {
          await syncActivityAggregateCounts(activityId);
        } catch (syncErr) {
          console.error(
              "[onValidationUpdated] syncActivityAggregateCounts failed:",
              syncErr,
          );
        }
      }
    },
);

/**
 * Keep activity aggregate counters in sync when a validation is removed.
 */
export const onValidationDeleted = onDocumentDeleted(
    {
      document: "activities/{activityId}/validations/{validationId}",
      memory: "256MiB",
      timeoutSeconds: 120,
    },
    async (event) => {
      const activityId = event.params.activityId;
      try {
        await syncActivityAggregateCounts(activityId);
      } catch (syncErr) {
        console.error(
            "[onValidationDeleted] syncActivityAggregateCounts failed:",
            syncErr,
        );
      }
    },
);

