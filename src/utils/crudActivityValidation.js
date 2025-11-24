import { collection, getDocs, addDoc, getDoc, doc, query, where, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from 'firebaseConfig';
import { fetchActivityById } from './crudActivities';
import { grantActivityCompletionBadges, awardXpToUser } from './crudBadges';
import { createOrUpdateApplicationAsAccepted } from './crudApplications';

/**
 * Check if user has already validated this activity
 * @param {string} userId - User ID
 * @param {string} activityId - Activity ID
 * @returns {Promise<boolean>} True if already validated, false otherwise
 */
async function hasUserValidatedActivity(userId, activityId) {
  try {
    const activityDoc = doc(db, 'activities', activityId);
    const validationsRef = collection(activityDoc, 'validations');
    const q = query(validationsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return false;
    }
    
    // Check if any validation has status 'validated'
    // For backward compatibility, if no status field, assume validated (old QR validations)
    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      if (!data.status || data.status === 'validated') {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking validation status:', error);
    return false;
  }
}

/**
 * Record validation in Firestore
 * @param {string} userId - User ID
 * @param {string} activityId - Activity ID
 * @param {string} token - QR code token used
 * @param {string} validatedBy - User ID who performed validation (optional, for manual validation)
 * @returns {Promise<void>}
 */
async function recordValidation(userId, activityId, token, validatedBy = null) {
  try {
    const activityDoc = doc(db, 'activities', activityId);
    const validationsRef = collection(activityDoc, 'validations');
    
    // Check if validation already exists
    const q = query(validationsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Update existing validation
      const existingValidation = querySnapshot.docs[0];
      const updateData = {
        status: 'validated',
        validatedAt: Timestamp.now(),
        token: token || existingValidation.data().token,
        validatedBy: validatedBy || existingValidation.data().validatedBy,
        // Clear rejection fields if they exist
        rejectedAt: null,
        rejectedBy: null,
      };
      await updateDoc(existingValidation.ref, updateData);
    } else {
      // Create new validation
      await addDoc(validationsRef, {
        userId,
        token: token || null,
        status: 'validated',
        validatedAt: Timestamp.now(),
        validatedBy: validatedBy || null,
      });
    }
    
    console.log(`Validation recorded for user ${userId} on activity ${activityId}`);
  } catch (error) {
    console.error('Error recording validation:', error);
    throw error;
  }
}

/**
 * Check if current date matches activity date (same day)
 * @param {Date} activityDate - Activity start date
 * @returns {boolean} True if same day, false otherwise
 */
function isSameDay(date1, date2) {
  if (!date1 || !date2) return false;
  
  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);
  
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Validate activity by QR code scan
 * Grants XP and badges to the user
 * @param {string} userId - User ID
 * @param {string} activityId - Activity ID
 * @param {string} token - QR code token
 * @returns {Promise<Object>} Result object with success status and details
 */
export async function validateActivityByQR(userId, activityId, token) {
  try {
    // First check: Verify if user already validated this activity (prevent duplicates)
    const alreadyValidated = await hasUserValidatedActivity(userId, activityId);
    if (alreadyValidated) {
      return {
        success: false,
        error: 'ALREADY_VALIDATED',
        message: 'You have already validated this activity.'
      };
    }

    // Fetch activity
    const activity = await fetchActivityById(activityId);
    if (!activity) {
      return {
        success: false,
        error: 'ACTIVITY_NOT_FOUND',
        message: 'Activity not found.'
      };
    }

    // Verify token matches
    if (activity.qrCodeToken !== token) {
      return {
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid QR code token.'
      };
    }

    // Verify activity type is Event or Local
    if (activity.type !== 'event' && activity.type !== 'local') {
      return {
        success: false,
        error: 'INVALID_ACTIVITY_TYPE',
        message: 'QR code validation is only available for Event and Local activities.'
      };
    }

    // Check if validation is on the activity date
    const today = new Date();
    const activityDate = activity.start_date instanceof Date 
      ? activity.start_date 
      : activity.start_date?.toDate 
        ? activity.start_date.toDate() 
        : new Date(activity.start_date);
    
    if (!isSameDay(today, activityDate)) {
      return {
        success: false,
        error: 'INVALID_DATE',
        message: 'QR code validation is only available on the activity date.'
      };
    }

    // Add member as accepted applicant
    try {
      await createOrUpdateApplicationAsAccepted(activityId, userId);
      console.log(`Application created/updated for user ${userId} on activity ${activityId}`);
    } catch (appError) {
      console.error('Error creating/updating application:', appError);
      // Continue with validation even if application creation fails
      // This ensures validation still works if there's an issue with application creation
    }

    // Grant activity XP
    const xpReward = activity.xp_reward || 0;
    if (xpReward > 0) {
      await awardXpToUser(
        userId,
        xpReward,
        `Activity: ${activity.title}`,
        'activity'
      );
    }

    // Grant activity completion badges (SDG, continent, activity type)
    const grantedBadges = await grantActivityCompletionBadges(userId, activity);

    // Add activity to member history
    try {
      const memberRef = doc(db, 'members', userId);
      const historyRef = collection(memberRef, 'history');
      
      // Create a copy of the activity data for history
      const historyData = { ...activity };
      
      // Convert any Firestore Timestamp objects to Date objects
      Object.keys(historyData).forEach(key => {
        const value = historyData[key];
        if (value && typeof value.toDate === 'function') {
          historyData[key] = value.toDate();
        }
      });
      
      // Remove the document ID field if it exists
      delete historyData.id;
      
      // Add metadata
      historyData.activityId = activityId;
      historyData.addedToHistoryAt = new Date();
      historyData.validatedViaQR = true;
      
      await addDoc(historyRef, historyData);
      console.log(`Activity ${activityId} added to history for member ${userId}`);
    } catch (historyError) {
      console.error('Error adding activity to history:', historyError);
      // Continue even if history addition fails
    }

    // Record validation
    await recordValidation(userId, activityId, token);

    return {
      success: true,
      xpReward,
      badges: grantedBadges,
      activityTitle: activity.title || '',
      message: 'Activity validated successfully!'
    };
  } catch (error) {
    console.error('Error validating activity by QR:', error);
    return {
      success: false,
      error: 'VALIDATION_ERROR',
      message: error.message || 'An error occurred during validation.'
    };
  }
}

/**
 * Fetch all validations for an activity
 * @param {string} activityId - Activity ID
 * @returns {Promise<Array>} Array of validation objects with userId and status
 */
export async function fetchValidationsForActivity(activityId) {
  try {
    const activityDoc = doc(db, 'activities', activityId);
    const validationsRef = collection(activityDoc, 'validations');
    const querySnapshot = await getDocs(validationsRef);
    
    const validations = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      validations.push({
        id: doc.id,
        userId: data.userId,
        status: data.status || 'validated', // Default to 'validated' for backward compatibility
        validatedAt: data.validatedAt?.toDate ? data.validatedAt.toDate() : data.validatedAt,
        rejectedAt: data.rejectedAt?.toDate ? data.rejectedAt.toDate() : data.rejectedAt,
        validatedBy: data.validatedBy || null,
        token: data.token || null,
      });
    });
    
    return validations;
  } catch (error) {
    console.error('Error fetching validations for activity:', error);
    throw error;
  }
}

/**
 * Add activity to member history (reusable helper)
 * @param {string} activityId - Activity ID
 * @param {Object} activityData - Activity data
 * @param {string} userId - User ID
 * @param {boolean} validatedViaManual - Whether validated manually by NPO
 * @returns {Promise<void>}
 */
async function addActivityToMemberHistory(activityId, activityData, userId, validatedViaManual = false) {
  try {
    const memberRef = doc(db, 'members', userId);
    const historyRef = collection(memberRef, 'history');
    
    // Create a copy of the activity data for history
    const historyData = { ...activityData };
    
    // Convert any Firestore Timestamp objects to Date objects
    Object.keys(historyData).forEach(key => {
      const value = historyData[key];
      if (value && typeof value.toDate === 'function') {
        historyData[key] = value.toDate();
      }
    });
    
    // Remove the document ID field if it exists
    delete historyData.id;
    
    // Add metadata
    historyData.activityId = activityId;
    historyData.addedToHistoryAt = new Date();
    historyData.validatedViaQR = !validatedViaManual;
    historyData.validatedViaManual = validatedViaManual;
    
    await addDoc(historyRef, historyData);
    console.log(`Activity ${activityId} added to history for member ${userId}`);
  } catch (error) {
    console.error('Error adding activity to history:', error);
    throw error;
  }
}

/**
 * Manually validate an applicant (grants badges/XP, adds to history, records validation)
 * Reuses the same logic as QR validation but without token checks
 * @param {string} activityId - Activity ID
 * @param {string} userId - User ID to validate
 * @param {string} validatedBy - NPO user ID who performed validation
 * @returns {Promise<Object>} Result object with success status
 */
export async function validateApplicant(activityId, userId, validatedBy) {
  try {
    // Check if already validated
    const alreadyValidated = await hasUserValidatedActivity(userId, activityId);
    if (alreadyValidated) {
      // Check if it's already validated (not rejected)
      const validations = await fetchValidationsForActivity(activityId);
      const existingValidation = validations.find(v => v.userId === userId);
      if (existingValidation && existingValidation.status === 'validated') {
        return {
          success: false,
          error: 'ALREADY_VALIDATED',
          message: 'This applicant has already been validated.'
        };
      }
    }

    // Fetch activity
    const activity = await fetchActivityById(activityId);
    if (!activity) {
      return {
        success: false,
        error: 'ACTIVITY_NOT_FOUND',
        message: 'Activity not found.'
      };
    }

    // Ensure user has accepted application
    try {
      await createOrUpdateApplicationAsAccepted(activityId, userId);
      console.log(`Application created/updated for user ${userId} on activity ${activityId}`);
    } catch (appError) {
      console.error('Error creating/updating application:', appError);
      // Continue with validation even if application creation fails
    }

    // Grant activity XP
    const xpReward = activity.xp_reward || 0;
    if (xpReward > 0) {
      await awardXpToUser(
        userId,
        xpReward,
        `Activity: ${activity.title}`,
        'activity'
      );
    }

    // Grant activity completion badges (SDG, continent, activity type)
    await grantActivityCompletionBadges(userId, activity);

    // Add activity to member history
    await addActivityToMemberHistory(activityId, activity, userId, true);

    // Record validation
    await recordValidation(userId, activityId, null, validatedBy);

    return {
      success: true,
      message: 'Applicant validated successfully!'
    };
  } catch (error) {
    console.error('Error validating applicant:', error);
    return {
      success: false,
      error: 'VALIDATION_ERROR',
      message: error.message || 'An error occurred during validation.'
    };
  }
}

/**
 * Reject an applicant (record rejected status)
 * @param {string} activityId - Activity ID
 * @param {string} userId - User ID to reject
 * @param {string} rejectedBy - NPO user ID who performed rejection
 * @returns {Promise<Object>} Result object with success status
 */
export async function rejectApplicant(activityId, userId, rejectedBy) {
  try {
    const activityDoc = doc(db, 'activities', activityId);
    const validationsRef = collection(activityDoc, 'validations');
    
    // Check if validation already exists
    const q = query(validationsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Update existing validation
      const existingValidation = querySnapshot.docs[0];
      const updateData = {
        status: 'rejected',
        rejectedAt: Timestamp.now(),
        rejectedBy: rejectedBy,
        // Clear validation fields if they exist
        validatedAt: null,
        validatedBy: null,
        token: null,
      };
      await updateDoc(existingValidation.ref, updateData);
    } else {
      // Create new rejection record
      await addDoc(validationsRef, {
        userId,
        status: 'rejected',
        rejectedAt: Timestamp.now(),
        rejectedBy: rejectedBy,
      });
    }
    
    console.log(`Rejection recorded for user ${userId} on activity ${activityId}`);
    return {
      success: true,
      message: 'Applicant rejected successfully!'
    };
  } catch (error) {
    console.error('Error rejecting applicant:', error);
    return {
      success: false,
      error: 'REJECTION_ERROR',
      message: error.message || 'An error occurred during rejection.'
    };
  }
}

/**
 * Batch validate multiple applicants
 * @param {string} activityId - Activity ID
 * @param {Array<string>} userIds - Array of user IDs to validate
 * @param {string} validatedBy - NPO user ID who performed validation
 * @returns {Promise<Object>} Result object with success count and errors
 */
export async function validateAllApplicants(activityId, userIds, validatedBy) {
  const results = {
    success: true,
    validated: 0,
    errors: []
  };

  for (const userId of userIds) {
    try {
      const result = await validateApplicant(activityId, userId, validatedBy);
      if (result.success) {
        results.validated++;
      } else {
        results.errors.push({ userId, error: result.message || result.error });
      }
    } catch (error) {
      results.errors.push({ userId, error: error.message || 'Unknown error' });
    }
  }

  if (results.errors.length > 0) {
    results.success = false;
  }

  return results;
}

/**
 * Batch reject multiple applicants
 * @param {string} activityId - Activity ID
 * @param {Array<string>} userIds - Array of user IDs to reject
 * @param {string} rejectedBy - NPO user ID who performed rejection
 * @returns {Promise<Object>} Result object with success count and errors
 */
export async function rejectAllApplicants(activityId, userIds, rejectedBy) {
  const results = {
    success: true,
    rejected: 0,
    errors: []
  };

  for (const userId of userIds) {
    try {
      const result = await rejectApplicant(activityId, userId, rejectedBy);
      if (result.success) {
        results.rejected++;
      } else {
        results.errors.push({ userId, error: result.message || result.error });
      }
    } catch (error) {
      results.errors.push({ userId, error: error.message || 'Unknown error' });
    }
  }

  if (results.errors.length > 0) {
    results.success = false;
  }

  return results;
}

/**
 * Check if user can validate an activity (for UI purposes)
 * @param {string} userId - User ID
 * @param {string} activityId - Activity ID
 * @returns {Promise<Object>} Status object
 */
export async function canUserValidateActivity(userId, activityId) {
  try {
    const alreadyValidated = await hasUserValidatedActivity(userId, activityId);
    
    if (alreadyValidated) {
      return {
        canValidate: false,
        reason: 'ALREADY_VALIDATED',
        message: 'You have already validated this activity.'
      };
    }

    const activity = await fetchActivityById(activityId);
    if (!activity) {
      return {
        canValidate: false,
        reason: 'ACTIVITY_NOT_FOUND',
        message: 'Activity not found.'
      };
    }

    if (activity.type !== 'event' && activity.type !== 'local') {
      return {
        canValidate: false,
        reason: 'INVALID_TYPE',
        message: 'QR validation is only for Event and Local activities.'
      };
    }

    const today = new Date();
    const activityDate = activity.start_date instanceof Date 
      ? activity.start_date 
      : activity.start_date?.toDate 
        ? activity.start_date.toDate() 
        : new Date(activity.start_date);
    
    if (!isSameDay(today, activityDate)) {
      return {
        canValidate: false,
        reason: 'INVALID_DATE',
        message: 'QR validation is only available on the activity date.'
      };
    }

    return {
      canValidate: true
    };
  } catch (error) {
    console.error('Error checking validation eligibility:', error);
    return {
      canValidate: false,
      reason: 'ERROR',
      message: 'Unable to check validation eligibility.'
    };
  }
}

