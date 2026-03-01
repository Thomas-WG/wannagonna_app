/**
 * Participation service — activity participations (hours, status, check-in/out).
 * Document ID for participations is always userId.
 * @module participationService
 */

import { collection, doc, getDoc, getDocs, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from 'firebaseConfig';

/**
 * @typedef {Object} ParticipationHours
 * @property {number} reported
 * @property {number} validated
 * @property {import('firebase/firestore').Timestamp} [reportedAt]
 * @property {import('firebase/firestore').Timestamp} [validatedAt]
 */

/**
 * @typedef {Object} Participation
 * @property {string} memberId
 * @property {string} status
 * @property {ParticipationHours} hours
 * @property {import('firebase/firestore').Timestamp|null} [checkedInAt]
 * @property {import('firebase/firestore').Timestamp|null} [checkedOutAt]
 * @property {number} [xpAwarded]
 * @property {import('firebase/firestore').Timestamp} [joinedAt]
 */

/**
 * Create or update a participation document. Uses userId as document id.
 * @param {string} activityId
 * @param {string} userId
 * @param {Partial<Participation>} data
 */
export async function createOrUpdateParticipation(activityId, userId, data) {
  const ref = doc(db, 'activities', activityId, 'participations', userId);
  const existing = await getDoc(ref);
  const now = Timestamp.now();
  if (existing.exists()) {
    const updates = { ...data };
    if (updates.status !== undefined) updates.status = updates.status;
    if (updates.hours !== undefined) updates.hours = updates.hours;
    await updateDoc(ref, updates);
  } else {
    await setDoc(ref, {
      memberId: userId,
      status: data.status ?? 'registered',
      hours: data.hours ?? {
        reported: 0,
        validated: 0,
        reportedAt: null,
        validatedAt: null
      },
      checkedInAt: data.checkedInAt ?? null,
      checkedOutAt: data.checkedOutAt ?? null,
      xpAwarded: data.xpAwarded ?? 0,
      joinedAt: data.joinedAt ?? now
    });
  }
}

/**
 * Get a single participation.
 * @param {string} activityId
 * @param {string} userId
 * @returns {Promise<Participation|null>}
 */
export async function getParticipation(activityId, userId) {
  const ref = doc(db, 'activities', activityId, 'participations', userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Get all participations for an activity.
 * @param {string} activityId
 * @returns {Promise<Participation[]>}
 */
export async function getActivityParticipations(activityId) {
  const col = collection(db, 'activities', activityId, 'participations');
  const snapshot = await getDocs(col);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Volunteer reports hours. Creates minimal participation if missing.
 * @param {string} activityId
 * @param {string} userId
 * @param {number} hours
 */
export async function reportHours(activityId, userId, hours) {
  const ref = doc(db, 'activities', activityId, 'participations', userId);
  const snap = await getDoc(ref);
  const now = Timestamp.now();
  const num = Number(hours);
  if (!snap.exists()) {
    await setDoc(ref, {
      memberId: userId,
      status: 'registered',
      hours: {
        reported: num,
        validated: 0,
        reportedAt: now,
        validatedAt: null
      },
      checkedInAt: null,
      checkedOutAt: null,
      xpAwarded: 0,
      joinedAt: now
    });
    return;
  }
  const current = snap.data();
  const hoursData = {
    ...(current.hours || {}),
    reported: num,
    reportedAt: now
  };
  await updateDoc(ref, { hours: hoursData });
}

/**
 * NPO validates/adjusts hours for a participation.
 * Creates the participation document if it does not exist (e.g. pre-existing activities
 * where participations were not created during application acceptance).
 * @param {string} activityId
 * @param {string} userId
 * @param {number} validatedHours
 */
export async function validateHours(activityId, userId, validatedHours) {
  const ref = doc(db, 'activities', activityId, 'participations', userId);
  const now = Timestamp.now();
  const snap = await getDoc(ref);
  const num = Number(validatedHours) || 0;
  if (!snap.exists()) {
    // Create with validated==0 (Firestore rules enforce this on create).
    // Then update to set validated hours (NPO staff/admin permitted via update rule).
    await setDoc(ref, {
      memberId: userId,
      status: 'validated',
      hours: {
        reported: num,
        validated: 0,
        reportedAt: null,
        validatedAt: null
      },
      checkedInAt: null,
      checkedOutAt: null,
      xpAwarded: 0,
      joinedAt: now
    });
    if (num > 0) {
      await updateDoc(ref, {
        hours: {
          reported: num,
          validated: num,
          reportedAt: null,
          validatedAt: now
        }
      });
    }
    return;
  }
  const current = snap.data();
  const hoursData = {
    ...(current.hours || {}),
    validated: num,
    validatedAt: now
  };
  await updateDoc(ref, { hours: hoursData });
}
