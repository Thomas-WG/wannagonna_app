/**
 * Utility functions for referral code validation and user code generation
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from 'firebaseConfig';

/**
 * Validate referral code by calling a Cloud Function that securely checks
 * if the code exists in the members collection using Admin SDK privileges.
 * This prevents unauthenticated users from querying the members database.
 * 
 * @param {string} code - The referral code to validate
 * @param {Function} t - Translation function for error messages
 * @returns {Promise<{valid: boolean, error?: string}>} Validation result
 */
export async function validateReferralCode(code, t) {
  if (!code || code.trim().length === 0) {
    return { valid: false, error: t('referralCodeRequired') };
  }
  
  try {
    const validateCodeFn = httpsCallable(functions, 'validateReferralCode');
    const result = await validateCodeFn({ code }); 
    const { valid, error } = result.data || {};
    
    if (valid === undefined) {
      return { valid: false, error: t('errorValidatingCode') };
    }
    
    return {
      valid,
      error: error ? t(error) : undefined
    };
  } catch (error) {
    console.error('[validateReferralCode] Error calling Cloud Function:', error);
    console.error('[validateReferralCode] Error details:', {
      code: error.code,
      message: error.message,
      details: error.details
    });
    return { valid: false, error: t('errorValidatingCode') };
  }
}

/**
 * Generate a unique 5-character code based on user email
 * Uses Cloud Function to check code uniqueness securely
 * @param {string} email - User's email address
 * @param {string} displayName - User's display name (optional)
 * @returns {Promise<string>} Generated unique code
 */
export async function generateUserCode(email, displayName = '') {
  // Extract first 3 characters from email (before @) and make uppercase
  const emailPrefix = email.split('@')[0].substring(0, 3).toUpperCase().padEnd(3, 'A');
  
  // Get first letter of display name or random letter
  let nameLetter = 'X';
  if (displayName && displayName.length > 0) {
    nameLetter = displayName.charAt(0).toUpperCase();
    if (!/[A-Z0-9]/.test(nameLetter)) {
      nameLetter = 'X';
    }
  }
  
  // Generate last character from email hash
  const emailHash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const lastChar = chars[emailHash % chars.length];
  
  // Combine: 3 from email + 1 from name + 1 from hash = 5 characters
  let generatedCode = emailPrefix.substring(0, 3) + nameLetter + lastChar;
  
  // Ensure uniqueness by checking via Cloud Function
  let attempts = 0;
  const checkCodeUniquenessFn = httpsCallable(functions, 'checkCodeUniqueness');
  
  while (attempts < 10) {
    try {
      console.log(`[generateUserCode] Checking uniqueness of code: "${generatedCode}" (attempt ${attempts + 1})`);
      const result = await checkCodeUniquenessFn({ code: generatedCode });
      const { isUnique } = result.data || {};
      
      if (isUnique === true) {
        console.log(`[generateUserCode] Code "${generatedCode}" is unique`);
        return generatedCode; // Code is unique
      }
      
      if (isUnique === false) {
        console.log(`[generateUserCode] Code "${generatedCode}" is not unique, trying next variation`);
      } else {
        console.warn(`[generateUserCode] Unexpected response format, isUnique: ${isUnique}`);
      }
    } catch (error) {
      console.error('[generateUserCode] Error checking code uniqueness:', error);
      console.error('[generateUserCode] Error details:', {
        code: error.code,
        message: error.message,
        details: error.details
      });
      // If check fails, try modifying the code and continue to next attempt
    }
    
    // If not unique or check failed, modify last character and try again
    const newIndex = (emailHash + attempts) % chars.length;
    generatedCode = generatedCode.substring(0, 4) + chars[newIndex];
    attempts++;
  }
  
  // Fallback: use timestamp-based code if all attempts fail
  const timestamp = Date.now().toString(36).toUpperCase().slice(-5);
  return timestamp.padStart(5, 'A');
}

