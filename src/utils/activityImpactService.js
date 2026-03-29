/**
 * Activity impact service — attach parameters and close with results.
 * @module activityImpactService
 */

import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from 'firebaseConfig';

/**
 * Set impact parameters on an activity (overwrites existing).
 * @param {string} activityId
 * @param {Array<{ parameter_id: string, scope: string, label: string, unit: string, target_value?: number|null }>} params
 */
export async function setActivityImpactParameters(activityId, params) {
  const ref = doc(db, 'activities', activityId);
  await updateDoc(ref, { impact_parameters: params });
}

/**
 * Close an activity with impact results and set status to Closed.
 * Cloud Function onActivityClosed will then aggregate participations and update org/member impact_summary.
 * @param {string} activityId
 * @param {{ total_hours: number, parameters?: Record<string, number> }} results
 * @param {string} closedBy User id of NPO admin who closed
 */
export async function closeActivityWithResults(activityId, results, closedBy) {
  const ref = doc(db, 'activities', activityId);
  const totalHours = results.total_hours ?? 0;
  const impact_results = {
    total_hours: totalHours,
    parameters: results.parameters ?? {},
    closed_at: Timestamp.now(),
    closed_by: closedBy
  };
  await updateDoc(ref, {
    impact_results,
    status: 'Closed',
    updated_at: new Date()
  });
}
