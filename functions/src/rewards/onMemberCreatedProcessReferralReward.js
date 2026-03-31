import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {runProcessReferralRewardOnSignup} from
  "./processReferralRewardOnSignup.js";

/**
 * Process referral reward asynchronously when a new member profile is created.
 * This keeps signup responsive by removing reward processing from the client
 * critical path.
 */
export const onMemberCreatedProcessReferralReward = onDocumentCreated(
    "members/{userId}",
    async (event) => {
      const userId = event.params.userId;
      console.log(
          "[onMemberCreatedProcessReferralReward] Triggered for member:",
          userId,
      );

      try {
        const result = await runProcessReferralRewardOnSignup(userId);
        console.log(
            "[onMemberCreatedProcessReferralReward] Completed:",
            {
              userId,
              result,
            },
        );
      } catch (error) {
        console.error(
            "[onMemberCreatedProcessReferralReward] Failed:",
            {
              userId,
              error: error?.message || String(error),
            },
        );
      }
    },
);
