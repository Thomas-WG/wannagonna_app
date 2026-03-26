import {onSchedule} from "firebase-functions/v2/scheduler";
import {FieldValue} from "firebase-admin/firestore";
import {db} from "../init.js";
import {getContinent, CONTINENT_LABELS} from "./continentMap.js";
import {SDG_LABELS, normalizeSdgId, sdgDimensionId} from "./sdgMap.js";

// Must match src/components/leaderboard/leaderboardConstants.js THRESHOLD
const THRESHOLD = 1;
const WINDOW_DAYS = 30;
const CHUNK_SIZE = 30;
const MAX_BATCH = 400;
const LEADERBOARD_SCORES_STAGING = "leaderboard_scores_staging";

/**
 * Swap staging data into leaderboard_scores: copy new docs, delete orphans.
 * Avoids clearing leaderboard_scores wholesale and reduces empty-window period.
 * @param {Record<string, object>} stagingDataMap - docId -> data to write
 */
async function swapStagingToScores(stagingDataMap) {
  const scoresCol = db.collection("leaderboard_scores");
  const stagingCol = db.collection(LEADERBOARD_SCORES_STAGING);
  const newDocIds = new Set(Object.keys(stagingDataMap));

  // Read old doc IDs from leaderboard_scores (paginated)
  const {FieldPath} = await import("firebase-admin/firestore");
  const oldDocIds = new Set();
  let snap = await scoresCol
      .orderBy(FieldPath.documentId())
      .limit(MAX_BATCH)
      .get();
  while (!snap.empty) {
    snap.docs.forEach((d) => oldDocIds.add(d.id));
    const lastDoc = snap.docs[snap.docs.length - 1];
    snap = await scoresCol.orderBy(FieldPath.documentId())
        .startAfter(lastDoc)
        .limit(MAX_BATCH)
        .get();
  }

  // Batch: set new docs into leaderboard_scores
  let batch = db.batch();
  let batchCount = 0;
  for (const docId of newDocIds) {
    batch.set(scoresCol.doc(docId), stagingDataMap[docId], {merge: true});
    batchCount++;
    if (batchCount >= MAX_BATCH) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }

  // Batch: delete orphan docs (in old but not in new)
  const orphanIds = [...oldDocIds].filter((id) => !newDocIds.has(id));
  for (const docId of orphanIds) {
    batch.delete(scoresCol.doc(docId));
    batchCount++;
    if (batchCount >= MAX_BATCH) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }
  if (batchCount > 0) await batch.commit();

  // Clear staging collection
  let stagingSnap = await stagingCol.limit(MAX_BATCH).get();
  while (!stagingSnap.empty) {
    const delBatch = db.batch();
    stagingSnap.docs.forEach((d) => delBatch.delete(d.ref));
    await delBatch.commit();
    stagingSnap = await stagingCol.limit(MAX_BATCH).get();
  }
}

/**
 * Core logic to compute leaderboard scores from validated validations.
 * Uses activities/{activityId}/validations (single source of truth).
 * All Time rank is based on total XP from members (no validation window).
 * Used by both the nightly scheduler and the admin trigger.
 */
export async function runComputeLeaderboard() {
  let totalDimensions = 0;
  let totalUsers = 0;
  const notifications = [];
  let alltimeMemberCache = {};
  const stagingDataMap = {};
  const stagingCol = db.collection(LEADERBOARD_SCORES_STAGING);
  let batch = db.batch();
  let batchCount = 0;

  const commitBatchIfNeeded = async () => {
    if (batchCount >= MAX_BATCH) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  };

  // 1. All Time: rank by total XP from members (no validation window)
  const alltimeSnap = await db.collection("members")
      .where("xp", ">", 0)
      .orderBy("xp", "desc")
      .limit(500)
      .get();

  if (!alltimeSnap.empty) {
    const alltimeEntries = alltimeSnap.docs.map((doc, i) => {
      const d = doc.data();
      return {
        user_id: doc.id,
        xp: Number(d.xp) || 0,
        last_validated_at: null,
      };
    });

    alltimeMemberCache = {};
    alltimeSnap.docs.forEach((doc) => {
      alltimeMemberCache[doc.id] = doc.data();
    });

    let currentRank = 0;
    const meetsThreshold = alltimeEntries.length >= THRESHOLD;

    for (let i = 0; i < alltimeEntries.length; i++) {
      const {user_id: uid, xp} = alltimeEntries[i];
      if (i === 0 || xp < alltimeEntries[i - 1].xp) {
        currentRank = i + 1;
      }
      const rank = meetsThreshold ? currentRank : 0;
      const isCurrentChampion = meetsThreshold && rank === 1;
      const docId = `${uid}_alltime`;
      const scoresCol = db.collection("leaderboard_scores");
      const existing = await scoresCol.doc(docId).get();
      const prev = existing.data();

      const member = alltimeMemberCache[uid] || {};

      if (prev) {
        if (prev.is_current_champion && !isCurrentChampion) {
          const newChampion = alltimeMemberCache[alltimeEntries[0].user_id];
          notifications.push({
            user_id: uid,
            type: "LEADERBOARD_CHAMPION_LOST",
            title: "Your All Time Champion status was taken!",
            body:
                  `${newChampion?.display_name || "Someone"} is now ` +
                  `leading All Time. You're ${alltimeEntries[0].xp - xp} ` +
                  "Activity Score behind — jump back in!",
            link: "/leaderboard",
            metadata: {
              dimension: "alltime",
              dimension_label: "All Time",
              xp_gap: alltimeEntries[0].xp - xp,
              new_champion_name: newChampion?.display_name || null,
            },
          });
        } else if (!prev.is_current_champion && isCurrentChampion) {
          notifications.push({
            user_id: uid,
            type: "LEADERBOARD_CHAMPION_GAINED",
            title: "You're the All Time Champion! 🏆",
            body:
                  "You're now #1 in All Time. " +
                  "Hold your ground — someone might be close behind.",
            link: "/leaderboard",
            metadata: {
              dimension: "alltime",
              dimension_label: "All Time",
              xp_gap: null,
              new_champion_name: null,
            },
          });
        }
      }

      const justGainedChampion =
          isCurrentChampion && (!prev || !prev.is_current_champion);

      const docData = {
        user_id: uid,
        display_name: member.display_name || "",
        profile_picture: member.profile_picture || null,
        country: member.country || null,
        dimension: "alltime",
        dimension_type: "alltime",
        dimension_label: "All Time",
        activity_score: xp,
        current_rank: rank,
        is_current_champion: isCurrentChampion,
        champion_since: isCurrentChampion ?
          prev?.champion_since || FieldValue.serverTimestamp() :
          null,
        total_championships: justGainedChampion ?
          FieldValue.increment(1) :
          prev?.total_championships || 0,
        last_validated_at: null,
        updated_at: FieldValue.serverTimestamp(),
      };
      batch.set(stagingCol.doc(docId), docData, {merge: true});
      stagingDataMap[docId] = docData;

      batchCount++;
      await commitBatchIfNeeded();
    }

    totalDimensions += 1;
    totalUsers += alltimeEntries.length;
  }

  // 2. Validation-based dimensions (global, sdg_*, continent)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - WINDOW_DAYS);

  const validationsSnap = await db
      .collectionGroup("validations")
      .where("status", "==", "validated")
      .where("rewards_processed", "==", true)
      .where("validated_at", ">=", cutoff)
      .get();

  if (validationsSnap.empty) {
    if (batchCount > 0) await batch.commit();
    await swapStagingToScores(stagingDataMap);
    await db.doc("leaderboard_meta/dimensions").set(
        {sdg: [], continent: [], updated_at: FieldValue.serverTimestamp()},
        {merge: true},
    );
    for (const notif of notifications) {
      const member = alltimeMemberCache[notif.user_id] || {};
      const prefs = member?.notification_preferences?.GAMIFICATION;
      const inAppEnabled = prefs?.inApp !== false;
      if (!inAppEnabled) continue;
      await db.collection("notifications").add({
        user_id: notif.user_id,
        type: notif.type,
        title: notif.title,
        body: notif.body,
        link: notif.link,
        created_at: FieldValue.serverTimestamp(),
        read_at: null,
        metadata: notif.metadata,
      });
    }
    console.log(
        "No validated validations in window. All Time written.",
    );
    return {
      dimensions: totalDimensions,
      users: totalUsers,
      notifications: notifications.length,
    };
  }

  const activityIds = new Set();
  validationsSnap.forEach((doc) => {
    const activityId = doc.ref.parent.parent.id;
    activityIds.add(activityId);
  });

  const activityCache = {};
  const activityIdArray = Array.from(activityIds);
  for (let i = 0; i < activityIdArray.length; i += CHUNK_SIZE) {
    const chunk = activityIdArray.slice(i, i + CHUNK_SIZE);
    const refs = chunk.map((id) => db.collection("activities").doc(id));
    const docs = await db.getAll(...refs);
    docs.forEach((doc) => {
      if (doc.exists) activityCache[doc.id] = doc.data();
    });
  }

  const orgIds = new Set();
  Object.values(activityCache).forEach((activity) => {
    if (activity.organization_id) orgIds.add(activity.organization_id);
  });

  const orgCache = {};
  const orgIdArray = Array.from(orgIds);
  for (let i = 0; i < orgIdArray.length; i += CHUNK_SIZE) {
    const chunk = orgIdArray.slice(i, i + CHUNK_SIZE);
    const refs = chunk.map((id) => db.collection("organizations").doc(id));
    const docs = await db.getAll(...refs);
    docs.forEach((doc) => {
      if (doc.exists) orgCache[doc.id] = doc.data();
    });
  }

  const userIds = new Set();
  validationsSnap.forEach((doc) => {
    const data = doc.data();
    userIds.add(data.user_id);
  });

  const memberCache = {};
  const userIdArray = Array.from(userIds);
  for (let i = 0; i < userIdArray.length; i += CHUNK_SIZE) {
    const chunk = userIdArray.slice(i, i + CHUNK_SIZE);
    const refs = chunk.map((id) => db.collection("members").doc(id));
    const docs = await db.getAll(...refs);
    docs.forEach((doc) => {
      if (doc.exists) memberCache[doc.id] = doc.data();
    });
  }

  const scores = {};

  validationsSnap.forEach((doc) => {
    const v = doc.data();
    const userId = v.user_id;
    const rewardsResult = v.rewards_result ?? {};
    const xp = Number(rewardsResult.total_xp) || 0;
    const validatedAt = v.validated_at || null;
    const activityId = doc.ref.parent.parent.id;
    const activity = activityCache[activityId];

    if (!activity || xp === 0) return;
    if (!scores[userId]) scores[userId] = {};

    const addScore = (dimensionId) => {
      if (!scores[userId][dimensionId]) {
        scores[userId][dimensionId] = {xp: 0, last_validated_at: null};
      }
      scores[userId][dimensionId].xp += xp;
      const prev = scores[userId][dimensionId].last_validated_at;
      if (
        !prev ||
          (validatedAt && validatedAt.toMillis?.() > prev.toMillis?.())
      ) {
        scores[userId][dimensionId].last_validated_at = validatedAt;
      }
    };

    addScore("global");

    const sdgNum = normalizeSdgId(activity.sdg);
    if (sdgNum) addScore(sdgDimensionId(sdgNum));

    const org = orgCache[activity.organization_id];
    if (org?.country) {
      const continent = getContinent(org.country);
      if (continent) addScore(continent.id);
    }
  });

  const getDimensionMeta = (dimensionId) => {
    if (dimensionId === "global") return {type: "global", label: "Global"};
    if (dimensionId.startsWith("sdg_")) {
      const num = dimensionId.replace("sdg_", "");
      return {type: "sdg", label: SDG_LABELS[num] || dimensionId};
    }
    return {
      type: "continent",
      label: CONTINENT_LABELS[dimensionId] || dimensionId,
    };
  };

  const allDimensions = new Set();
  Object.values(scores).forEach((dims) => {
    Object.keys(dims).forEach((d) => allDimensions.add(d));
  });

  for (const dimensionId of allDimensions) {
    const meta = getDimensionMeta(dimensionId);

    const entries = Object.entries(scores)
        .filter(([, dims]) => dims[dimensionId] !== undefined)
        .map(([uid, dims]) => ({user_id: uid, ...dims[dimensionId]}))
        .sort((a, b) => b.xp - a.xp);

    const meetsThreshold = entries.length >= THRESHOLD;

    let currentRank = 0;
    for (let i = 0; i < entries.length; i++) {
      const {user_id: uid, xp, last_validated_at: lastValidatedAt} = entries[i];
      if (i === 0 || xp < entries[i - 1].xp) {
        currentRank = i + 1;
      }
      const rank = meetsThreshold ? currentRank : 0;
      const isCurrentChampion = meetsThreshold && rank === 1;
      const docId = `${uid}_${dimensionId}`;
      const scoresCol = db.collection("leaderboard_scores");
      const existing = await scoresCol.doc(docId).get();
      const prev = existing.data();

      const member = memberCache[uid] || {};

      if (prev) {
        if (prev.is_current_champion && !isCurrentChampion) {
          const newChampion = memberCache[entries[0].user_id];
          notifications.push({
            user_id: uid,
            type: "LEADERBOARD_CHAMPION_LOST",
            title: `Your ${meta.label} Champion status was taken!`,
            body:
                  `${newChampion?.display_name || "Someone"} is now ` +
                  `leading ${meta.label}. You're ${entries[0].xp - xp} ` +
                  "Activity Score behind — jump back in!",
            link: "/leaderboard",
            metadata: {
              dimension: dimensionId,
              dimension_label: meta.label,
              xp_gap: entries[0].xp - xp,
              new_champion_name: newChampion?.display_name || null,
            },
          });
        } else if (!prev.is_current_champion && isCurrentChampion) {
          notifications.push({
            user_id: uid,
            type: "LEADERBOARD_CHAMPION_GAINED",
            title: `You're the ${meta.label} Champion! 🏆`,
            body:
                  `You're now #1 in ${meta.label}. ` +
                  "Hold your ground — someone might be close behind.",
            link: "/leaderboard",
            metadata: {
              dimension: dimensionId,
              dimension_label: meta.label,
              xp_gap: null,
              new_champion_name: null,
            },
          });
        }
      }

      const justGainedChampion =
          isCurrentChampion && (!prev || !prev.is_current_champion);

      const docData = {
        user_id: uid,
        display_name: member.display_name || "",
        profile_picture: member.profile_picture || null,
        country: member.country || null,
        dimension: dimensionId,
        dimension_type: meta.type,
        dimension_label: meta.label,
        activity_score: xp,
        current_rank: rank,
        is_current_champion: isCurrentChampion,
        champion_since: isCurrentChampion ?
          prev?.champion_since || FieldValue.serverTimestamp() :
          null,
        total_championships: justGainedChampion ?
          FieldValue.increment(1) :
          prev?.total_championships || 0,
        last_validated_at: lastValidatedAt || null,
        updated_at: FieldValue.serverTimestamp(),
      };
      batch.set(stagingCol.doc(docId), docData, {merge: true});
      stagingDataMap[docId] = docData;

      batchCount++;
      await commitBatchIfNeeded();
    }
  }

  if (batchCount > 0) await batch.commit();
  await swapStagingToScores(stagingDataMap);

  const sdgIds = [...allDimensions].filter((d) => d.startsWith("sdg_"));
  const continentIds = [...allDimensions].filter((d) =>
    ["africa", "america", "asia", "europe", "oceania"].includes(d),
  );
  await db.doc("leaderboard_meta/dimensions").set(
      {
        sdg: sdgIds,
        continent: continentIds,
        updated_at: FieldValue.serverTimestamp(),
      },
      {merge: true},
  );

  for (const notif of notifications) {
    const member =
      memberCache[notif.user_id] || alltimeMemberCache[notif.user_id];
    const prefs = member?.notification_preferences?.GAMIFICATION;

    const inAppEnabled = prefs?.inApp !== false;
    if (!inAppEnabled) continue;

    await db.collection("notifications").add({
      user_id: notif.user_id,
      type: notif.type,
      title: notif.title,
      body: notif.body,
      link: notif.link,
      created_at: FieldValue.serverTimestamp(),
      read_at: null,
      metadata: notif.metadata,
    });
  }

  totalDimensions += allDimensions.size;

  // Match early-return semantics: include all-time users plus
  // validation-only users
  const alltimeUserIds = new Set(Object.keys(alltimeMemberCache));
  let reportedUsers = totalUsers;
  for (const uid of Object.keys(scores)) {
    if (!alltimeUserIds.has(uid)) reportedUsers++;
  }

  console.log(
      `✅ Leaderboard computed. Dimensions: ${totalDimensions}. ` +
      `Users: ${reportedUsers}. ` +
      `Notifications: ${notifications.length}.`,
  );

  return {
    dimensions: totalDimensions,
    users: reportedUsers,
    notifications: notifications.length,
  };
}

export const computeLeaderboard = onSchedule(
    {
      schedule: "0 2 * * *",
      timeZone: "Asia/Tokyo",
      timeoutSeconds: 540,
      memory: "512MiB",
    },
    runComputeLeaderboard,
);
