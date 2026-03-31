/**
 * Impact parameter service — global and NPO custom parameters.
 * @module impactParameterService
 */

import { collection, doc, getDocs, addDoc, updateDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from 'firebaseConfig';

/**
 * @typedef {'output'|'reach'|'duration'|'environmental_output'|'organizational_capacity'} MeasurementTypeId
 */

/**
 * @typedef {Object} ImpactParameter
 * @property {string} id
 * @property {string} label
 * @property {string} unit
 * @property {string} category
 * @property {MeasurementTypeId} [measurementType]
 * @property {number[]} [sdg]
 * @property {boolean} isActive
 * @property {boolean} [isEstimated]
 * @property {"global"|"npo"} scope
 * @property {import('firebase/firestore').Timestamp} [created_at]
 */

/**
 * Group impact parameters by category. Items without a category go under 'other'.
 * @param {Array<{ category?: string }>} list - Array of impact parameters
 * @returns {Record<string, Array>} Object mapping category names to arrays of parameters
 */
export function groupImpactParametersByCategory(list) {
  const map = {};
  (list || []).forEach((p) => {
    const c = p.category || 'other';
    if (!map[c]) map[c] = [];
    map[c].push(p);
  });
  return map;
}

/**
 * Fetch all active global impact parameters.
 * @returns {Promise<ImpactParameter[]>}
 */
export async function getGlobalParameters() {
  const col = collection(db, 'impact_parameters');
  const q = query(col, where('scope', '==', 'global'), where('is_active', '==', true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Fetch all global parameters (active and inactive). For admin use.
 * @returns {Promise<ImpactParameter[]>}
 */
export async function getAllGlobalParameters() {
  const col = collection(db, 'impact_parameters');
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
  custom
    .filter((p) => p.is_active !== false)
    .forEach((p) => byId.set(p.id, { ...p, scope: 'npo' }));
  return Array.from(byId.values());
}

/**
 * Create a custom parameter for an organization.
 * @param {string} orgId
 * @param {{ label: string, unit: string, category: string, measurementType?: MeasurementTypeId, sdg?: number[] }} data
 * @returns {Promise<string>} New parameter document id
 */
export async function createCustomParameter(orgId, data) {
  const col = collection(db, 'organizations', orgId, 'customParameters');
  const docData = {
    label: data.label,
    unit: data.unit,
    category: data.category,
    is_active: true,
    scope: 'npo',
    created_at: Timestamp.now()
  };
  if (data.measurement_type != null) docData.measurement_type = data.measurement_type;
  if (Array.isArray(data.sdg)) docData.sdg = data.sdg;
  const docRef = await addDoc(col, docData);
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
  await updateDoc(ref, { is_active: isActive });
}

/**
 * Update a global parameter (admin only). Used by admin UI.
 * @param {string} parameterId
 * @param {Partial<Pick<ImpactParameter, 'label'|'unit'|'category'|'measurementType'|'isActive'|'isEstimated'|'sdg'>>} data
 */
export async function updateGlobalParameter(parameterId, data) {
  const ref = doc(db, 'impact_parameters', parameterId);
  const mapped = {};
  if (data.label != null) mapped.label = data.label;
  if (data.unit != null) mapped.unit = data.unit;
  if (data.category != null) mapped.category = data.category;
  if (data.measurement_type != null) mapped.measurement_type = data.measurement_type;
  if (data.is_active != null) mapped.is_active = data.is_active;
  if (data.is_estimated != null) mapped.is_estimated = data.is_estimated;
  if (data.sdg != null) mapped.sdg = data.sdg;
  await updateDoc(ref, mapped);
}

/**
 * Create a global parameter (admin only).
 * @param {{ label: string, unit: string, category: string, measurementType?: MeasurementTypeId, isActive?: boolean, isEstimated?: boolean, sdg?: number[] }} data
 * @returns {Promise<string>}
 */
export async function createGlobalParameter(data) {
  const col = collection(db, 'impact_parameters');
  const docData = {
    label: data.label,
    unit: data.unit,
    category: data.category,
    sdg: data.sdg || [],
    is_active: data.is_active !== false,
    is_estimated: data.is_estimated === true,
    scope: 'global',
    created_at: Timestamp.now()
  };
  if (data.measurement_type != null) docData.measurement_type = data.measurement_type;
  const docRef = await addDoc(col, docData);
  return docRef.id;
}

/**
 * Update a custom parameter (NPO or admin).
 * @param {string} orgId
 * @param {string} parameterId
 * @param {{ label?: string, unit?: string, category?: string, measurementType?: MeasurementTypeId, isActive?: boolean, sdg?: number[] }} data
 */
export async function updateCustomParameter(orgId, parameterId, data) {
  const ref = doc(db, 'organizations', orgId, 'customParameters', parameterId);
  const mapped = {};
  if (data.label != null) mapped.label = data.label;
  if (data.unit != null) mapped.unit = data.unit;
  if (data.category != null) mapped.category = data.category;
  if (data.measurement_type != null) mapped.measurement_type = data.measurement_type;
  if (data.is_active != null) mapped.is_active = data.is_active;
  if (data.sdg != null) mapped.sdg = data.sdg;
  await updateDoc(ref, mapped);
}

/**
 * Seed or update global parameters from predefined seed data.
 * Idempotent: uses seedKey to find existing params and update; creates if not found.
 * Admin only.
 * @returns {Promise<{ created: number, updated: number }>}
 */
export async function seedGlobalParameters() {
  const { GLOBAL_PARAMETERS_SEED } = await import('@/constant/globalParametersSeed');
  const existing = await getAllGlobalParameters();
  const bySeedKey = new Map();
  const byLabel = new Map();
  existing.forEach((p) => {
    if (p.seedKey) bySeedKey.set(p.seedKey, p);
    if (p.label) byLabel.set(p.label.trim().toLowerCase(), p);
  });

  let created = 0;
  let updated = 0;
  const col = collection(db, 'impact_parameters');

  for (const item of GLOBAL_PARAMETERS_SEED) {
    const data = {
      label: item.label,
      unit: item.unit,
      category: item.category,
      measurement_type: item.measurement_type,
      sdg: item.sdg || [],
      seedKey: item.seedKey,
      is_active: true,
      scope: 'global',
    };

    let existingParam = bySeedKey.get(item.seedKey) || byLabel.get(item.label.trim().toLowerCase());
    if (existingParam) {
      await updateDoc(doc(db, 'impact_parameters', existingParam.id), {
        label: data.label,
        unit: data.unit,
        category: data.category,
        measurement_type: data.measurement_type,
        sdg: data.sdg,
        seedKey: item.seedKey,
      });
      updated++;
    } else {
      await addDoc(col, {
        ...data,
        created_at: Timestamp.now(),
      });
      created++;
    }
  }

  return { created, updated };
}
