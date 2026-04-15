import {db} from "../init.js";
import {
  findBadgeDefinition,
  grantBadgeToMemberAdmin,
} from "./memberBadgeHelpers.js";

const FIRST_ALERT_BADGE_ID = "firstAlert";

/**
 * Ensure firstAlert badge definition exists so grants do not fail.
 * @return {Promise<void>}
 */
async function ensureFirstAlertBadgeDefinition() {
  const existing = await findBadgeDefinition(db, FIRST_ALERT_BADGE_ID);
  if (existing) return;

  const generalCategoryRef = db.collection("badges").doc("general");
  await generalCategoryRef.set({
    title: "General",
    description: "General badges",
    order: 0,
  }, {merge: true});

  await generalCategoryRef.collection("badges").doc(FIRST_ALERT_BADGE_ID).set({
    title: "First alert",
    description: "Created your first activity alert.",
    xp: 25,
  }, {merge: true});

  console.log(
      "[onAlertCreatedGrantFirstAlertBadge] Created missing badge definition",
  );
}

/**
 * Trigger handler for members/{userId}/alerts/{alertId} creation.
 * Grants firstAlert badge when a member creates alerts for the first time.
 * @param {Object} event Firestore create event.
 * @return {Promise<void>}
 */
export async function runOnAlertCreatedGrantFirstAlertBadge(event) {
  const userId = event.params.userId;
  const alertId = event.params.alertId;
  if (!userId || !alertId) return;

  try {
    await ensureFirstAlertBadgeDefinition();

    const memberRef = db.collection("members").doc(userId);
    const memberDoc = await memberRef.get();
    if (!memberDoc.exists) {
      console.warn(
          "[onAlertCreatedGrantFirstAlertBadge] Missing member for alert:",
          userId,
      );
      return;
    }

    const existingBadges = memberDoc.data()?.badges || [];
    const alreadyHasFirstAlert = existingBadges.some(
        (badge) => badge?.id === FIRST_ALERT_BADGE_ID,
    );
    if (alreadyHasFirstAlert) return;

    // Keep the first-alert intent explicit and allow recovery if
    // concurrent creates race this trigger.
    const alertsSnap = await memberRef.collection("alerts").limit(2).get();
    if (alertsSnap.empty) return;

    if (alertsSnap.size > 1) {
      console.log(
          "[onAlertCreatedGrantFirstAlertBadge] " +
          "Alert count > 1 before grant; applying recovery grant for user:",
          userId,
      );
    }

    const result = await grantBadgeToMemberAdmin(
        db,
        userId,
        FIRST_ALERT_BADGE_ID,
        {sendRewardNotification: true},
    );

    if (!result.ok && result.error !== "User already has this badge") {
      console.error(
          "[onAlertCreatedGrantFirstAlertBadge] Failed to grant firstAlert:",
          {
            userId,
            alertId,
            error: result.error,
          },
      );
    }
  } catch (error) {
    console.error(
        "[onAlertCreatedGrantFirstAlertBadge] Unexpected failure:",
        {
          userId,
          alertId,
          error: error?.message || String(error),
        },
    );
  }
}
