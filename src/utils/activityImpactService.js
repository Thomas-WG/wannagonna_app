/**
 * Activity impact service — attach parameters and close with results.
 * @module activityImpactService
 */

import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from 'firebaseConfig';

/**
 * Set impact parameters on an activity (overwrites existing).
 * @param {string} activityId
 * @param {Array<{ parameterId: string, scope: string, label: string, unit: string, targetValue?: number|null }>} params
 */
export async function setActivityImpactParameters(activityId, params) {
  const ref = doc(db, 'activities', activityId);
  await updateDoc(ref, { impactParameters: params });
}

/**
 * Close an activity with impact results and set status to Closed.
 * Cloud Function onActivityClosed will then aggregate participations and update org/member impactSummary.
 * @param {string} activityId
 * @param {{ totalHours: number, parameters?: Record<string, number> }} results
 * @param {string} closedBy User id of NPO admin who closed
 */
export async function closeActivityWithResults(activityId, results, closedBy) {
  const ref = doc(db, 'activities', activityId);
  const impactResults = {
    totalHours: results.totalHours ?? 0,
    parameters: results.parameters ?? {},
    closedAt: Timestamp.now(),
    closedBy
  };
  await updateDoc(ref, {
    impactResults,
    status: 'Closed',
    last_updated: new Date()
  });
}
