import {FieldValue} from "firebase-admin/firestore";
import {db} from "../init.js";
import {findBadgeDefinition} from "./memberBadgeHelpers.js";

/**
 * Admin-only: remove a badge from a member and subtract configured badge XP.
 * @param {string} targetUserId Target member uid
 * @param {string} badgeId Badge document id
 * @return {Promise<Object>}
 */
export async function runAdminRemoveBadgeFromUser(targetUserId, badgeId) {
  const memberRef = db.collection("members").doc(targetUserId);
  const memberSnap = await memberRef.get();

  if (!memberSnap.exists) {
    return {success: false, error: "User not found"};
  }

  const existingBadges = memberSnap.data().badges || [];
  const badgeToRemove = existingBadges.find((b) => b.id === badgeId);
  if (!badgeToRemove) {
    return {success: false, error: "User does not have this badge"};
  }

  const found = await findBadgeDefinition(db, badgeId);
  const badgeXP = found?.badgeData?.xp || 0;
  const title = found?.badgeData?.title || badgeId;
  const description = found?.badgeData?.description || "";

  await memberRef.update({
    badges: FieldValue.arrayRemove(badgeToRemove),
  });

  if (badgeXP > 0) {
    await memberRef.update({
      xp: FieldValue.increment(-badgeXP),
    });
  }

  return {
    success: true,
    badge: {
      id: badgeId,
      title,
      description,
      xp: badgeXP,
    },
  };
}
