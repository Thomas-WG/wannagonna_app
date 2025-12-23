import { collection, getDocs, addDoc, getDoc, doc, query, where, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from 'firebaseConfig';
import { fetchActivityById } from './crudActivities';
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
      const existingData = existingValidation.data();
      const updateData = {
        status: 'validated',
        validatedAt: Timestamp.now(),
        validatedBy: validatedBy || existingData.validatedBy || null,
        // Clear rejection fields if they exist
        rejectedAt: null,
        rejectedBy: null,
      };
      // Only include token if it exists in existing data or if we're providing a new token
      if (token) {
        updateData.token = token;
      } else if (existingData.token !== undefined) {
        updateData.token = existingData.token;
      }
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
 * Records validation - rewards (XP/badges) are processed by Cloud Function trigger
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

    // Record validation immediately - Cloud Function trigger will process rewards in background
    // This is the critical operation that must complete before showing success
    // Note: No application is created for QR validations - only validation document with status "validated"
    // History will be added by Cloud Function when rewards are processed
    await recordValidation(userId, activityId, token);

    // Return expected structure for backward compatibility
    // Note: Actual rewards are processed by Cloud Function in background
    const xpReward = activity.xp_reward || 0;
    return {
      success: true,
      xpReward,
      badges: [], // Will be populated by Cloud Function
      activityTitle: activity.title || '',
      message: 'Activity validated successfully! Rewards are being processed in the background.'
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
 * Initialize a validation document with pending status when an application is accepted
 * @param {string} activityId - Activity ID
 * @param {string} userId - User ID of the accepted volunteer
 * @returns {Promise<Object>} Result object with success status
 */
export async function initializeValidationDocument(activityId, userId) {
  try {
    const activityDoc = doc(db, 'activities', activityId);
    const validationsRef = collection(activityDoc, 'validations');
    
    // Check if validation already exists to avoid duplicates
    const q = query(validationsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Validation already exists, don't create duplicate
      console.log(`Validation document already exists for user ${userId} on activity ${activityId}`);
      return {
        success: true,
        message: 'Validation document already exists'
      };
    }
    
    // Create new validation document with pending status
    await addDoc(validationsRef, {
      userId,
      status: 'pending',
      createdAt: Timestamp.now(),
    });
    
    console.log(`Validation document initialized for user ${userId} on activity ${activityId} with status 'pending'`);
    return {
      success: true,
      message: 'Validation document initialized successfully'
    };
  } catch (error) {
    console.error('Error initializing validation document:', error);
    return {
      success: false,
      error: 'INITIALIZATION_ERROR',
      message: error.message || 'An error occurred while initializing validation document.'
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
 * Manually validate an applicant
 * Records validation - rewards (XP/badges) are processed by Cloud Function trigger
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

    // Fetch activity to verify it exists
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

    // Record validation - Cloud Function trigger will process rewards in background
    await recordValidation(userId, activityId, null, validatedBy);

    return {
      success: true,
      message: 'Applicant validated successfully! Rewards are being processed in the background.'
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
      const existingData = existingValidation.data();
      const updateData = {
        status: 'rejected',
        rejectedAt: Timestamp.now(),
        rejectedBy: rejectedBy,
        // Clear validation fields if they exist
        validatedAt: null,
        validatedBy: null,
      };
      // Only set token to null if it exists in the document (to clear it)
      // Don't set it if it doesn't exist to avoid undefined
      if (existingData.token !== undefined) {
        updateData.token = null;
      }
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

