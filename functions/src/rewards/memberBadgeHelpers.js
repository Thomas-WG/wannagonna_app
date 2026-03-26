import {FieldValue, Timestamp} from "firebase-admin/firestore";
import {sendUserNotification} from "../notifications/notificationService.js";

/**
 * Find badge document under badges/{categoryId}/badges/{badgeId}.
 * @param {Object} db Firestore instance
 * @param {string} badgeId Badge id
 * @return {Promise<Object|null>} badgeData and badgeCategoryId, or null
 */
export async function findBadgeDefinition(db, badgeId) {
  const categoriesSnapshot = await db.collection("badges").get();
  for (const categoryDoc of categoriesSnapshot.docs) {
    const badgeDoc = await db.collection("badges")
        .doc(categoryDoc.id)
        .collection("badges")
        .doc(badgeId)
        .get();
    if (badgeDoc.exists) {
      return {
        badgeData: badgeDoc.data(),
        badgeCategoryId: categoryDoc.id,
      };
    }
  }
  return null;
}

/**
 * Grant a badge with optional default "Badge earned" notification.
 * @param {Object} db Firestore instance
 * @param {string} userId Member uid
 * @param {string} badgeId Badge id
 * @param {Object} options Optional; sendRewardNotification defaults true
 * @return {Promise<Object>} ok, optional error, optional badge payload
 */
export async function grantBadgeToMemberAdmin(
    db, userId, badgeId, options = {},
) {
  const sendRewardNotification = options.sendRewardNotification !== false;

  const found = await findBadgeDefinition(db, badgeId);
  if (!found) {
    console.error(`[grantBadgeToMemberAdmin] Badge ${badgeId} not found`);
    return {ok: false, error: "Badge not found"};
  }
  const {badgeData, badgeCategoryId} = found;
  const badgeXP = badgeData.xp || 0;

  const memberRef = db.collection("members").doc(userId);
  const memberDoc = await memberRef.get();
  if (!memberDoc.exists) {
    console.error(`[grantBadgeToMemberAdmin] User ${userId} not found`);
    return {ok: false, error: "User not found"};
  }

  const memberData = memberDoc.data();
  const existingBadges = memberData.badges || [];
  const badgeExists = existingBadges.some((b) => b.id === badgeId);
  if (badgeExists) {
    console.log(
        `[grantBadgeToMemberAdmin] User ${userId} already has badge ` +
        badgeId,
    );
    return {ok: false, error: "User already has this badge"};
  }

  const updateData = {
    badges: FieldValue.arrayUnion({
      id: badgeId,
      earnedDate: Timestamp.now(),
    }),
  };
  if (badgeXP > 0) {
    updateData.xp = FieldValue.increment(badgeXP);
  }

  await memberRef.update(updateData);

  const historyTitle = `Badge Earned: ${badgeData.title}`;
  await memberRef.collection("xp_history").add({
    title: historyTitle,
    points: badgeXP,
    type: "badge",
    badge_id: badgeId,
    created_at: FieldValue.serverTimestamp(),
  });

  if (sendRewardNotification) {
    try {
      await sendUserNotification({
        userId,
        type: "REWARD",
        title: "Badge earned",
        body: `You earned the "${badgeData.title}" badge` +
          `${badgeXP > 0 ? ` and ${badgeXP} XP` : ""}!`,
        link: "/badges",
        metadata: {
          badge_id: badgeId,
          badge_xp: badgeXP,
        },
      });
    } catch (notifError) {
      console.error(
          "[grantBadgeToMemberAdmin] Failed to send notification:",
          notifError,
      );
    }
  }

  return {
    ok: true,
    badge: {
      id: badgeId,
      title: badgeData.title,
      description: badgeData.description || "",
      xp: badgeXP,
      category_id: badgeCategoryId,
    },
  };
}
