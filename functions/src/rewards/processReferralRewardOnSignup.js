import {FieldValue} from "firebase-admin/firestore";
import {db} from "../init.js";
import {sendUserNotification} from "../notifications/notificationService.js";
import {
  findBadgeDefinition,
  grantBadgeToMemberAdmin,
} from "./memberBadgeHelpers.js";

const BUDDY_BADGE_ID = "buddyBuilder";
const PROCESSED_FIELD = "referral_reward_processed_at";

/**
 * @param {string|undefined|null} value Raw referral code
 * @return {string} Normalized code or empty string
 */
function normalizeReferralCode(value) {
  if (value === undefined || value === null) {
    return "";
  }
  const trimmed = String(value).trim();
  return trimmed ? trimmed.toUpperCase() : "";
}

/**
 * Rewards referrer when a new member has referred_by on their member doc.
 * If referred_by is missing, persists optional clientReferralCode.
 * Idempotent via referral_reward_processed_at on the new member.
 * @param {string} newUserId Firebase Auth uid (caller)
 * @param {string} [clientReferralCode] From signup; used only if doc lacks code
 * @return {Promise<Object>}
 */
export async function runProcessReferralRewardOnSignup(
    newUserId,
    clientReferralCode,
) {
  const newMemberRef = db.collection("members").doc(newUserId);
  const newSnap = await newMemberRef.get();

  if (!newSnap.exists) {
    return {success: false, error: "member_not_found"};
  }

  let newData = newSnap.data();
  if (newData[PROCESSED_FIELD]) {
    return {success: true, skipped: true, reason: "already_processed"};
  }

  const docNorm = normalizeReferralCode(newData.referred_by);
  const clientNorm = normalizeReferralCode(clientReferralCode);

  if (!docNorm && clientNorm) {
    await newMemberRef.update({referred_by: clientNorm});
    newData = {...newData, referred_by: clientNorm};
  }

  const referredByRaw = newData.referred_by;
  if (!referredByRaw || String(referredByRaw).trim() === "") {
    await newMemberRef.update({
      [PROCESSED_FIELD]: FieldValue.serverTimestamp(),
    });
    return {success: true, skipped: true, reason: "no_referral"};
  }

  const referredBy = String(referredByRaw).toUpperCase().trim();

  const referrerQuery = await db.collection("members")
      .where("code", "==", referredBy)
      .limit(1)
      .get();

  if (referrerQuery.empty) {
    await newMemberRef.update({
      [PROCESSED_FIELD]: FieldValue.serverTimestamp(),
    });
    return {success: true, skipped: true, reason: "referrer_not_found"};
  }

  const referrerId = referrerQuery.docs[0].id;
  if (referrerId === newUserId) {
    await newMemberRef.update({
      [PROCESSED_FIELD]: FieldValue.serverTimestamp(),
    });
    return {success: true, skipped: true, reason: "self_referral"};
  }

  const referrerRef = db.collection("members").doc(referrerId);
  const referrerSnap = await referrerRef.get();
  if (!referrerSnap.exists) {
    await newMemberRef.update({
      [PROCESSED_FIELD]: FieldValue.serverTimestamp(),
    });
    return {success: true, skipped: true, reason: "referrer_doc_missing"};
  }

  const referrerBadges = referrerSnap.data().badges || [];
  const hasBuddy = referrerBadges.some((b) => b.id === BUDDY_BADGE_ID);

  if (!hasBuddy) {
    const grant = await grantBadgeToMemberAdmin(
        db, referrerId, BUDDY_BADGE_ID, {sendRewardNotification: false},
    );

    if (grant.ok) {
      await sendUserNotification({
        userId: referrerId,
        type: "REFERRAL",
        title: "Referral reward earned",
        body: "You earned a badge and XP because someone joined " +
          `using your code (${referredBy}).`,
        link: "/xp-history",
        metadata: {
          referral_code: referredBy,
          mode: "first",
          badge_xp: grant.badge?.xp || 0,
        },
      });
      await newMemberRef.update({
        [PROCESSED_FIELD]: FieldValue.serverTimestamp(),
      });
      return {success: true, mode: "first"};
    }

    if (grant.error !== "User already has this badge") {
      console.error(
          "[processReferralRewardOnSignup] Grant buddyBuilder failed:",
          grant.error,
      );
      return {success: false, error: grant.error || "grant_failed"};
    }
  }

  const def = await findBadgeDefinition(db, BUDDY_BADGE_ID);
  if (!def) {
    console.error(
        "[processReferralRewardOnSignup] buddyBuilder definition missing",
    );
    return {success: false, error: "buddy_badge_definition_missing"};
  }

  const badgeXP = def.badgeData.xp || 0;
  if (badgeXP > 0) {
    await referrerRef.update({xp: FieldValue.increment(badgeXP)});
    await referrerRef.collection("xp_history").add({
      title: "Referred member",
      points: badgeXP,
      type: "referral",
      referrer_id: referrerId,
      created_at: FieldValue.serverTimestamp(),
    });
  }

  const body = badgeXP > 0 ?
    `You earned ${badgeXP} XP because someone joined ` +
      `using your code (${referredBy}).` :
    `You earned XP because someone joined ` +
      `using your code (${referredBy}).`;

  await sendUserNotification({
    userId: referrerId,
    type: "REFERRAL",
    title: "Referral XP earned",
    body,
    link: "/xp-history",
    metadata: {
      referral_code: referredBy,
      mode: "xp",
      badge_xp: badgeXP,
    },
  });

  await newMemberRef.update({
    [PROCESSED_FIELD]: FieldValue.serverTimestamp(),
  });
  return {success: true, mode: "xp"};
}
