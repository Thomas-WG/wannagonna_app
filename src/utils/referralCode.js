/**
 * Utility functions for referral code validation and user code generation
 */

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from 'firebaseConfig';

/**
 * Validate referral code by checking if it exists in members collection
 * @param {string} code - The referral code to validate
 * @param {Function} t - Translation function for error messages
 * @returns {Promise<{valid: boolean, error?: string}>} Validation result
 */
export async function validateReferralCode(code, t) {
  if (!code || code.trim().length === 0) {
    return { valid: false, error: t('referralCodeRequired') };
  }
  
  try {
    const membersRef = collection(db, 'members');
    const q = query(membersRef, where('code', '==', code.toUpperCase().trim()));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { valid: false, error: t('invalidReferralCode') };
    }
    
    return { valid: true };
  } catch (error) {
    console.error('Error validating referral code:', error);
    return { valid: false, error: t('errorValidatingCode') };
  }
}

/**
 * Generate a unique 5-character code based on user email
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
  
  // Ensure uniqueness by checking and modifying if needed
  let attempts = 0;
  while (attempts < 10) {
    const membersRef = collection(db, 'members');
    const q = query(membersRef, where('code', '==', generatedCode));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return generatedCode; // Code is unique
    }
    
    // If not unique, modify last character
    const newIndex = (emailHash + attempts) % chars.length;
    generatedCode = generatedCode.substring(0, 4) + chars[newIndex];
    attempts++;
  }
  
  // Fallback: use timestamp-based code if all attempts fail
  const timestamp = Date.now().toString(36).toUpperCase().slice(-5);
  return timestamp.padStart(5, 'A');
}

