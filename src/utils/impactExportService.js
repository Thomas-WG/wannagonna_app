/**
 * Impact export service — calls Firebase function to generate Excel report.
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from 'firebaseConfig';

/**
 * Request an impact report export for the given date range.
 * @param {{ startDate: string, endDate: string, locale: string }} params - ISO date strings and locale
 * @returns {Promise<{ success: boolean, base64?: string, filename?: string, error?: string }>}
 */
export async function exportImpactReport(params) {
  const fn = httpsCallable(functions, 'exportImpactReport');
  const result = await fn(params);
  const data = result.data;
  if (!data) return { success: false, error: 'generic' };
  return data;
}
