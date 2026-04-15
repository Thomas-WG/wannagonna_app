import {Timestamp} from "firebase-admin/firestore";
import {db} from "../init.js";
import {sendMailgunEmail} from "./emailService.js";
import {buildActivityAlertEmail} from "./emailTemplates.js";

/**
 * Alert schema for members/{userId}/alerts/{alertId}
 * {
 *   label: "",
 *   frequency: "daily" | "weekly",
 *   logic: "ANY" | "ALL",
 *   criteria: [
 *     {
 *       field: "type" | "organization_id" | "country" |
 *         "skills" | "sdg" | "languages",
 *       value: string | string[],
 *     },
 *   ],
 *   active: true,
 *   created_at: serverTimestamp(),
 *   last_run_at: null,
 * }
 */

/**
 * @param {string[]|undefined|null} arr
 * @param {string[]|undefined|null} values
 * @return {boolean}
 */
function hasAnyOverlap(arr, values) {
  if (!Array.isArray(arr) || !Array.isArray(values)) return false;
  return values.some((value) => arr.includes(value));
}

/**
 * @param {string|number|null|undefined} value
 * @return {string}
 */
function normalizeSdg(value) {
  if (value === null || value === undefined) return "";
  const asString = String(value).trim();
  if (asString.startsWith("Goal-")) {
    return asString.replace("Goal-", "").replace(/^0+/, "") || "0";
  }
  return asString.replace(/^0+/, "") || asString;
}

/**
 * @param {string|string[]|undefined|null} value
 * @return {string[]}
 */
function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined || value === "") return [];
  return [value];
}

/**
 * Pure criteria matcher for a single activity and alert.
 * @param {Object} activity
 * @param {Object} alert
 * @return {boolean}
 */
export function matchesAlertCriteria(activity, alert) {
  const criteria = Array.isArray(alert?.criteria) ? alert.criteria : [];
  if (criteria.length === 0) return false;

  const matchCriterion = (criterion) => {
    const field = criterion?.field;
    const value = criterion?.value;
    const valueList = toArray(value);

    switch (field) {
      case "type":
        return valueList.includes(activity?.type);
      case "organization_id":
        return valueList.includes(activity?.organization_id);
      case "country":
        return valueList.includes(activity?.country);
      case "sdg":
        return valueList
            .map((item) => normalizeSdg(item))
            .includes(normalizeSdg(activity?.sdg));
      case "skills":
        return hasAnyOverlap(activity?.skills, valueList);
      case "languages":
        return hasAnyOverlap(activity?.languages, valueList);
      default:
        return false;
    }
  };

  if (alert?.logic === "ALL") {
    return criteria.every(matchCriterion);
  }
  return criteria.some(matchCriterion);
}

/**
 * Process activity alerts and send member emails.
 * @param {"daily"|"weekly"} frequency
 * @return {Promise<void>}
 */
export async function processActivityAlerts(frequency) {
  const nowMs = Date.now();
  const sinceMs = frequency === "weekly" ?
    nowMs - 604800000 :
    nowMs - 86400000;
  const since = Timestamp.fromMillis(sinceMs);

  const activitiesSnap = await db.collection("activities")
      .where("status", "==", "Open")
      .where("created_at", ">=", since)
      .get();

  if (activitiesSnap.empty) {
    console.log(`[processActivityAlerts] No open ${frequency} activities found`);
    return;
  }

  const activities = activitiesSnap.docs.map((doc) => ({id: doc.id, ...doc.data()}));

  const alertsSnap = await db.collectionGroup("alerts")
      .where("frequency", "==", frequency)
      .where("active", "==", true)
      .get();

  if (alertsSnap.empty) {
    console.log(`[processActivityAlerts] No active ${frequency} alerts found`);
    return;
  }

  /** @type {Map<string, Array<{id:string, ref:any, data:Object}>>} */
  const alertsByUser = new Map();
  for (const alertDoc of alertsSnap.docs) {
    const userId = alertDoc.ref.parent.parent?.id;
    if (!userId) continue;
    if (!alertsByUser.has(userId)) {
      alertsByUser.set(userId, []);
    }
    alertsByUser.get(userId).push({
      id: alertDoc.id,
      ref: alertDoc.ref,
      data: alertDoc.data(),
    });
  }

  let totalAlertsProcessed = 0;
  let totalEmailsSent = 0;
  const runAt = Timestamp.now();

  for (const [userId, userAlerts] of alertsByUser.entries()) {
    try {
      const matchedById = new Map();
      for (const activity of activities) {
        const matched = userAlerts.some((alert) =>
          matchesAlertCriteria(activity, alert.data),
        );
        if (matched) {
          matchedById.set(activity.id, activity);
        }
      }

      const matchedActivities = Array.from(matchedById.values());
      if (matchedActivities.length > 0) {
        const memberDoc = await db.collection("members").doc(userId).get();
        if (!memberDoc.exists) {
          console.warn(
              `[processActivityAlerts] Missing member doc for user ${userId}`,
          );
        } else {
          const member = memberDoc.data() || {};
          if (member.email) {
            const email = buildActivityAlertEmail({
              displayName: member.display_name || "there",
              activities: matchedActivities,
              frequency,
            });
            await sendMailgunEmail({
              to: member.email,
              subject: email.subject,
              text: email.text,
              html: email.html,
            });
            totalEmailsSent++;
          } else {
            console.warn(
                `[processActivityAlerts] Missing email for user ${userId}`,
            );
          }
        }
      }

      await Promise.all(
          userAlerts.map((alert) => alert.ref.update({last_run_at: runAt})),
      );
      totalAlertsProcessed += userAlerts.length;
    } catch (error) {
      console.error(
          `[processActivityAlerts] Failed for user ${userId}:`,
          error,
      );
    }
  }

  console.log(
      `[processActivityAlerts] frequency=${frequency} ` +
      `processedAlerts=${totalAlertsProcessed} sentEmails=${totalEmailsSent}`,
  );
}
