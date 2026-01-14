/**
 * Custom hook for Google sign-in functionality
 * Handles authentication, member document creation, and referral validation
 */

'use client';

import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, db } from 'firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'use-intl';
import { validateReferralCode, generateUserCode } from '@/utils/referralCode';
import { handleReferralReward } from '@/utils/crudBadges';

/**
 * Custom hook for Google sign-in
 * @returns {Object} { signInWithGoogle, isLoading, error, setError }
 */
export function useGoogleSignIn() {
  const router = useRouter();
  const t = useTranslations('Login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Sign in with Google and handle new/returning user logic
   * @param {string} referralCode - Referral code (required for new users)
   */
  const signInWithGoogle = async (referralCode = '') => {
    try {
      setIsLoading(true);
      setError('');

      // Proceed with Google sign-in first (referral code validation happens after, only for new users)
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userDocRef = doc(db, 'members', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        // Returning user - No referral code needed, just redirect to dashboard
        router.push('/dashboard');
      } else {
        // New user - Validate referral code is required
        if (!referralCode || referralCode.trim().length === 0) {
          // Sign out the user since referral code is missing
          await auth.signOut();
          const errorMsg = t('referralCodeRequired') || 'Referral code is required for new accounts.';
          setError(errorMsg);
          console.error('New user sign-in failed: Referral code required');
          return;
        }

        // Validate the referral code exists in the database
        const codeValidation = await validateReferralCode(referralCode, t);
        if (!codeValidation.valid) {
          // Sign out the user since validation failed
          await auth.signOut();
          setError(codeValidation.error);
          console.error('New user sign-in failed: Invalid referral code', referralCode);
          return;
        }

        // Referral code is valid - create member document
        const userCode = await generateUserCode(user.email || '', user.displayName || '');

        // Save user data to Firestore with generated code
        const userData = {
          displayName: user.displayName || '',
          email: user.email || '',
          bio: '',
          country: '',
          languages: [],
          skills: [],
          profilePicture: user.photoURL || '', // Use Google photo if available, otherwise empty string
          code: userCode, // Add generated code
          referredBy: referralCode.toUpperCase().trim(), // Store who referred them
          xp: 0, // Initialize XP to 0
          timeCommitment: {
            daily: false,
            weekly: false,
            biweekly: false,
            monthly: false,
            occasional: false,
            flexible: false
          },
          availabilities: {
            weekdays: false,
            weekends: false,
            mornings: false,
            afternoons: false,
            evenings: false,
            flexible: false
          },
          createdAt: new Date().toISOString(),
        };

        await setDoc(userDocRef, userData, { merge: true });

        // Reward the referrer (non-blocking - account creation succeeds even if reward fails)
        try {
          await handleReferralReward(referralCode);
        } catch (rewardError) {
          console.error('Error rewarding referrer (non-blocking):', rewardError);
        }

        router.push('/complete-profile');
      }
    } catch (error) {
      // Handle specific error types
      let errorMessage = 'An error occurred during sign-in.';

      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in was cancelled.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Pop-up was blocked by your browser. Please enable pop-ups for this site.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'An account already exists with the same email address but different sign-in credentials.';
      }

      // Only log errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error signing in:', error);
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return { signInWithGoogle, isLoading, error, setError };
}

