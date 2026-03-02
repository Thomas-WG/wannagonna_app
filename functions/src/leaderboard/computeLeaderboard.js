import {onSchedule} from "firebase-functions/v2/scheduler";
import {FieldValue} from "firebase-admin/firestore";
import {db} from "../init.js";
import {getContinent, CONTINENT_LABELS} from "./continentMap.js";
import {SDG_LABELS, normalizeSdgId, sdgDimensionId} from "./sdgMap.js";

const THRESHOLD = 1;
const WINDOW_DAYS = 30;
const CHUNK_SIZE = 30;
const MAX_BATCH = 400;

/**
 * Core logic to compute leaderboard scores from validated participations.
 * Used by both the nightly scheduler and the admin trigger.
 */
export async function runComputeLeaderboard() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - WINDOW_DAYS);

  const participationsSnap = await db
      .collectionGroup("participations")
      .where("status", "==", "validated")
      .where("hours.validatedAt", ">=", cutoff)
      .get();

  if (participationsSnap.empty) {
    console.log("No validated participations in window. Skipping.");
    return {dimensions: 0, users: 0, notifications: 0};
  }

  const activityIds = new Set();
  participationsSnap.forEach((doc) => {
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
    if (activity.organizationId) orgIds.add(activity.organizationId);
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
  participationsSnap.forEach((doc) => {
    const data = doc.data();
    userIds.add(data.memberId || doc.id);
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

  participationsSnap.forEach((doc) => {
    const p = doc.data();
    const userId = p.memberId || doc.id;
    const xp = p.xpAwarded || 0;
    const validatedAt = p.hours?.validatedAt || null;
    const activityId = doc.ref.parent.parent.id;
    const activity = activityCache[activityId];

    if (!activity || xp === 0) return;
    if (!scores[userId]) scores[userId] = {};

    const addScore = (dimensionId) => {
      if (!scores[userId][dimensionId]) {
        scores[userId][dimensionId] = {xp: 0, lastValidatedAt: null};
      }
      scores[userId][dimensionId].xp += xp;
      const prev = scores[userId][dimensionId].lastValidatedAt;
      if (
        !prev ||
          (validatedAt && validatedAt.toMillis?.() > prev.toMillis?.())
      ) {
        scores[userId][dimensionId].lastValidatedAt = validatedAt;
      }
    };

    addScore("global");

    const sdgNum = normalizeSdgId(activity.sdg);
    if (sdgNum) addScore(sdgDimensionId(sdgNum));

    const org = orgCache[activity.organizationId];
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

  const notifications = [];

  let batch = db.batch();
  let batchCount = 0;

  const commitBatchIfNeeded = async () => {
    if (batchCount >= MAX_BATCH) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  };

  for (const dimensionId of allDimensions) {
    const meta = getDimensionMeta(dimensionId);

    const entries = Object.entries(scores)
        .filter(([, dims]) => dims[dimensionId] !== undefined)
        .map(([userId, dims]) => ({userId, ...dims[dimensionId]}))
        .sort((a, b) => b.xp - a.xp);

    const meetsThreshold = entries.length >= THRESHOLD;

    for (let i = 0; i < entries.length; i++) {
      const {userId, xp, lastValidatedAt} = entries[i];
      const rank = meetsThreshold ? i + 1 : 0;
      const isCurrentChampion = meetsThreshold && rank === 1;
      const docId = `${userId}_${dimensionId}`;
      const ref = db.collection("leaderboard_scores").doc(docId);

      const existing = await ref.get();
      const prev = existing.data();

      const member = memberCache[userId] || {};

      if (prev) {
        if (prev.isCurrentChampion && !isCurrentChampion) {
          const newChampion = memberCache[entries[0].userId];
          notifications.push({
            userId,
            type: "LEADERBOARD_CHAMPION_LOST",
            title: `Your ${meta.label} Champion status was taken!`,
            body:
                  `${newChampion?.displayName || "Someone"} is now ` +
                  `leading ${meta.label}. You're ${entries[0].xp - xp} ` +
                  "Activity Score behind — jump back in!",
            link: "/leaderboard",
            metadata: {
              dimension: dimensionId,
              dimensionLabel: meta.label,
              xpGap: entries[0].xp - xp,
              newChampionName: newChampion?.displayName || null,
            },
          });
        } else if (!prev.isCurrentChampion && isCurrentChampion) {
          notifications.push({
            userId,
            type: "LEADERBOARD_CHAMPION_GAINED",
            title: `You're the ${meta.label} Champion! 🏆`,
            body:
                  `You're now #1 in ${meta.label}. ` +
                  "Hold your ground — someone might be close behind.",
            link: "/leaderboard",
            metadata: {
              dimension: dimensionId,
              dimensionLabel: meta.label,
              xpGap: null,
              newChampionName: null,
            },
          });
        }
      }

      const justGainedChampion =
          isCurrentChampion && (!prev || !prev.isCurrentChampion);

      batch.set(
          ref,
          {
            userId,
            displayName: member.displayName || "",
            profilePicture: member.profilePicture || null,
            country: member.country || null,
            dimension: dimensionId,
            dimensionType: meta.type,
            dimensionLabel: meta.label,
            activityScore: xp,
            currentRank: rank,
            isCurrentChampion,
            championSince: isCurrentChampion ?
              prev?.championSince || FieldValue.serverTimestamp() :
              null,
            totalChampionships: justGainedChampion ?
              FieldValue.increment(1) :
              prev?.totalChampionships || 0,
            lastValidatedAt: lastValidatedAt || null,
            updatedAt: FieldValue.serverTimestamp(),
          },
          {merge: true},
      );

      batchCount++;
      await commitBatchIfNeeded();
    }
  }

  if (batchCount > 0) await batch.commit();

  for (const notif of notifications) {
    const member = memberCache[notif.userId];
    const prefs = member?.notificationPreferences?.GAMIFICATION;

    const inAppEnabled = prefs?.inApp !== false;
    if (!inAppEnabled) continue;

    await db.collection("notifications").add({
      userId: notif.userId,
      type: notif.type,
      title: notif.title,
      body: notif.body,
      link: notif.link,
      createdAt: FieldValue.serverTimestamp(),
      readAt: null,
      metadata: notif.metadata,
    });
  }

  console.log(
      `✅ Leaderboard computed. Dimensions: ${allDimensions.size}. ` +
      `Users: ${Object.keys(scores).length}. ` +
      `Notifications: ${notifications.length}.`,
  );

  return {
    dimensions: allDimensions.size,
    users: Object.keys(scores).length,
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
