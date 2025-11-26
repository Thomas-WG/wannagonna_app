import {onDocumentCreated, onDocumentUpdated} from
  "firebase-functions/v2/firestore";
import {processActivityValidationRewards} from
  "./processActivityValidationRewards.js";
import {db} from "../init.js";
import {FieldValue} from "firebase-admin/firestore";

/**
 * Helper function to process rewards for a validation
 * @param {Object} event - Firestore event object
 * @param {boolean} isUpdate - Whether this is an update event (vs create)
 * @return {Promise<void>}
 */
async function processValidationRewards(event, isUpdate = false) {
  const validationData = event.data?.data();
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
    // Check if rewards have already been processed
    const validationRef = event.data?.ref;
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

