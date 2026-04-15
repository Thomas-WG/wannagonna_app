/**
 * Custom hook for Google sign-in functionality
 * Handles authentication, member document creation, and referral validation
 */

'use client';

import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, db } from 'firebaseConfig';
import { doc, getDoc, setDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'use-intl';
import { validateReferralCode, generateUserCode } from '@/utils/referralCode';

/**
 * Custom hook for Google sign-in
 * @returns {Object} { signInWithGoogle, isLoading, error, setError }
 */
export function useGoogleSignIn() {
  const router = useRouter();
  const t = useTranslations('Login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const cleanupNewGoogleUser = async (user, reason) => {
    if (!user) return;
    try {
      await user.delete();
      console.warn('Cleaned up Google auth user:', { uid: user.uid, reason });
    } catch (deleteError) {
      console.error('Failed to delete Google auth user during cleanup:', deleteError);
      try {
        await auth.signOut();
      } catch (signOutError) {
        console.error('Failed to sign out after Google cleanup error:', signOutError);
      }
    }
  };

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
          await cleanupNewGoogleUser(user, 'missing_referral_code');
          const errorMsg = t('referralCodeRequired') || 'Referral code is required for new accounts.';
          setError(errorMsg);
          console.error('New user sign-in failed: Referral code required');
          return;
        }

        // Validate the referral code exists in the database
        const codeValidation = await validateReferralCode(referralCode, t);
        if (!codeValidation.valid) {
          await cleanupNewGoogleUser(user, 'invalid_referral_code');
          setError(codeValidation.error);
          console.error('New user sign-in failed: Invalid referral code', referralCode);
          return;
        }

        // Referral code is valid - create member document
        const userCode = await generateUserCode(user.email || '', user.displayName || '');

        // Save user data to Firestore with generated code
        const userData = {
          display_name: user.displayName || '',
          email: user.email || '',
          bio: '',
          country: '',
          languages: [],
          skills: [],
          badges: [],
          cause: '',
          hobbies: '',
          website: '',
          linkedin: '',
          facebook: '',
          instagram: '',
          profile_picture: user.photoURL || '', // Use Google photo if available, otherwise empty string
          code: userCode, // Add generated code
          referred_by: referralCode.toUpperCase().trim(), // Store who referred them
          xp: 0, // Initialize XP to 0
          impact_summary: {
            total_hours: 0,
            total_activities: 0,
            parameters: {},
            parameter_meta: {},
          },
          time_commitment: {
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
          created_at: Timestamp.now(),
          terms_accepted: true,
          guidelines_accepted: true,
          terms_accepted_at: serverTimestamp(),
        };

        try {
          await setDoc(userDocRef, userData, { merge: true });
        } catch (writeError) {
          await cleanupNewGoogleUser(user, 'member_write_failed');
          console.error('Failed to create member document for Google sign-up:', writeError);
          setError('Failed to create your profile. Please try again.');
          return;
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

