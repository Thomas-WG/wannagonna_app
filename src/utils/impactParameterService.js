/**
 * Impact parameter service — global and NPO custom parameters.
 * @module impactParameterService
 */

import { collection, doc, getDocs, getDoc, addDoc, updateDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from 'firebaseConfig';

/**
 * @typedef {Object} ImpactParameter
 * @property {string} id
 * @property {string} label
 * @property {string} unit
 * @property {string} category
 * @property {number[]} [sdg]
 * @property {boolean} isActive
 * @property {boolean} [isEstimated]
 * @property {"global"|"npo"} scope
 * @property {import('firebase/firestore').Timestamp} [createdAt]
 */

/**
 * Fetch all active global impact parameters.
 * @returns {Promise<ImpactParameter[]>}
 */
export async function getGlobalParameters() {
  const col = collection(db, 'impactParameters');
  const q = query(col, where('scope', '==', 'global'), where('isActive', '==', true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Fetch all global parameters (active and inactive). For admin use.
 * @returns {Promise<ImpactParameter[]>}
 */
export async function getAllGlobalParameters() {
  const col = collection(db, 'impactParameters');
  const q = query(col, where('scope', '==', 'global'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Fetch custom parameters for an organization.
 * @param {string} orgId
 * @returns {Promise<ImpactParameter[]>}
 */
export async function getNpoCustomParameters(orgId) {
  const col = collection(db, 'organizations', orgId, 'customParameters');
  const snapshot = await getDocs(col);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Merge global and NPO custom parameters, deduplicated by id (custom overrides).
 * @param {string} orgId
 * @returns {Promise<ImpactParameter[]>}
 */
export async function getAllParametersForNpo(orgId) {
  const [global, custom] = await Promise.all([
    getGlobalParameters(),
    getNpoCustomParameters(orgId)
  ]);
  const byId = new Map();
  global.forEach((p) => byId.set(p.id, { ...p, scope: 'global' }));
  custom.forEach((p) => byId.set(p.id, { ...p, scope: 'npo' }));
  return Array.from(byId.values());
}

/**
 * Create a custom parameter for an organization.
 * @param {string} orgId
 * @param {{ label: string, unit: string, category: string }} data
 * @returns {Promise<string>} New parameter document id
 */
export async function createCustomParameter(orgId, data) {
  const col = collection(db, 'organizations', orgId, 'customParameters');
  const docRef = await addDoc(col, {
    label: data.label,
    unit: data.unit,
    category: data.category,
    isActive: true,
    scope: 'npo',
    createdAt: Timestamp.now()
  });
  return docRef.id;
}

/**
 * Toggle active state of a custom parameter.
 * @param {string} orgId
 * @param {string} parameterId
 * @param {boolean} isActive
 */
export async function toggleCustomParameter(orgId, parameterId, isActive) {
  const ref = doc(db, 'organizations', orgId, 'customParameters', parameterId);
  await updateDoc(ref, { isActive });
}

/**
 * Update a global parameter (admin only). Used by admin UI.
 * @param {string} parameterId
 * @param {Partial<Pick<ImpactParameter, 'label'|'unit'|'category'|'isActive'|'isEstimated'|'sdg'>>} data
 */
export async function updateGlobalParameter(parameterId, data) {
  const ref = doc(db, 'impactParameters', parameterId);
  await updateDoc(ref, data);
}

/**
 * Create a global parameter (admin only).
 * @param {{ label: string, unit: string, category: string, isActive?: boolean, isEstimated?: boolean, sdg?: number[] }} data
 * @returns {Promise<string>}
 */
export async function createGlobalParameter(data) {
  const col = collection(db, 'impactParameters');
  const docRef = await addDoc(col, {
    label: data.label,
    unit: data.unit,
    category: data.category,
    sdg: data.sdg || [],
    isActive: data.isActive !== false,
    isEstimated: data.isEstimated === true,
    scope: 'global',
    createdAt: Timestamp.now()
  });
  return docRef.id;
}

/**
 * Update a custom parameter (NPO or admin).
 * @param {string} orgId
 * @param {string} parameterId
 * @param {{ label?: string, unit?: string, category?: string, isActive?: boolean }} data
 */
export async function updateCustomParameter(orgId, parameterId, data) {
  const ref = doc(db, 'organizations', orgId, 'customParameters', parameterId);
  await updateDoc(ref, data);
}
