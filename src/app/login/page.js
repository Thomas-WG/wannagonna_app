/*
 * LoginPage.js
 *
 * Purpose:
 * This component handles user login with Firebase Google Authentication and email/password authentication.
 * It orchestrates the login flow by composing smaller, focused components and hooks.
 *
 * Flow:
 * 1. User can sign in with email/password (for existing accounts)
 * 2. User can sign in with Google (for new or existing accounts)
 * 3. New users must provide a valid referral code to create an account
 * 4. Returning users can log in without a referral code
 *
 * Usage:
 * - This component is accessed at `/login`.
 * - Import this page as a route in your Next.js App Router.
 */

'use client';

import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from 'firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FcGoogle } from "react-icons/fc";
import { useState, useEffect } from 'react';
import { useTranslations } from "use-intl";
import { setUserLocale } from '@/utils/locale';
import { useAuth } from '@/utils/auth/AuthContext';
import { handleReferralReward } from '@/utils/crudBadges';
import { useModal } from '@/utils/modal/useModal';
import { validateReferralCode, generateUserCode } from '@/utils/referralCode';
import { useGoogleSignIn } from '@/hooks/useGoogleSignIn';
import EmailPasswordLogin from '@/components/auth/EmailPasswordLogin';
import ReferralCodeInput from '@/components/auth/ReferralCodeInput';
import LanguageSelector from '@/components/auth/LanguageSelector';
import CreateAccountModal from '@/components/auth/CreateAccountModal';

/**
 * LoginPage - Renders the login UI, orchestrating authentication components.
 *
 * @returns JSX.Element - The login page UI with authentication functionality.
 */
export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [loginErrorMessage, setLoginErrorMessage] = useState('');
  const [createErrorMessage, setCreateErrorMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [googleReferralCode, setGoogleReferralCode] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false); // Track if user started a login/signup flow

  // Register modal with global modal manager
  const wrappedModalOnClose = useModal(modalOpen, () => setModalOpen(false), 'login-create-account-modal');

  // Use Google sign-in hook
  const { signInWithGoogle, isLoading: googleIsLoading, error: googleError, setError: setGoogleError } = useGoogleSignIn();

  const t = useTranslations('Login');

  const languageOptions = [
    { label: 'English', value: 'en' },
    { label: 'Español', value: 'es' },
    { label: 'Français', value: 'fr' },
    { label: '日本語', value: 'ja' },
  ];

  // Function to handle language change
  const handleLanguageChange = (locale) => {
    setUserLocale(locale);
    console.log(`Language changed to: ${locale}`);
  };

  useEffect(() => {
    // Only auto-redirect users who arrive already authenticated,
    // not users who are in the middle of an interactive login flow.
    if (user && !loading && !hasInteracted) {
      console.log('Login page: User already authenticated, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [user, loading, hasInteracted, router]);

  // Fetch logo URL from API route (server-side)
  useEffect(() => {
    const fetchLogoUrl = async () => {
      try {
        // Check if we have a cached URL in cookies (client-side check for immediate display)
        const getCookie = (name) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) {
            const cookieValue = parts.pop().split(';').shift();
            // Decode the cookie value (cookies are URL-encoded)
            return cookieValue ? decodeURIComponent(cookieValue) : null;
          }
          return null;
        };

        const cachedUrl = getCookie('wannagonnaLogoUrl');
        const cachedTimestamp = getCookie('wannagonnaLogoTimestamp');
        
        // If we have a cached URL less than 24 hours old, use it immediately
        if (cachedUrl && cachedTimestamp) {
          const timestamp = parseInt(cachedTimestamp, 10);
          const age = Date.now() - timestamp;
          if (age < 24 * 60 * 60 * 1000) {
          setLogoUrl(cachedUrl);
            // Still fetch fresh URL in background to update cache
            fetch('/api/logo').catch(() => {
              // Silently fail background fetch
            });
          return;
          }
        }

        // Fetch from API route
        const response = await fetch('/api/logo');
        if (!response.ok) {
          throw new Error('Failed to fetch logo');
        }

        const data = await response.json();
        if (data.url) {
          setLogoUrl(data.url);
        } else {
          throw new Error('No URL in response');
        }
      } catch (error) {
        console.error('Error fetching logo URL:', error);
        // Try to use cookie cache as fallback
        const getCookie = (name) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) {
            const cookieValue = parts.pop().split(';').shift();
            // Decode the cookie value (cookies are URL-encoded)
            return cookieValue ? decodeURIComponent(cookieValue) : null;
          }
          return null;
        };
        const cachedUrl = getCookie('wannagonnaLogoUrl');
        if (cachedUrl) {
          setLogoUrl(cachedUrl);
        }
      }
    };

    fetchLogoUrl();
  }, []);

  /**
   * Handle Google sign-in button click
   */
  const handleGoogleSignInClick = () => {
    setHasInteracted(true);
    signInWithGoogle(googleReferralCode);
  };

  // Function to handle email/password login
  const handleEmailLogin = async (email, password) => {
    setHasInteracted(true);
    setLoginErrorMessage('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error) {
      // Set error message based on the error code
      if (error.code === 'auth/wrong-password') {
        setLoginErrorMessage(t('incorrectpwd'));
      } else if (error.code === 'auth/user-not-found') {
        setLoginErrorMessage(t('nouserfound'));
      } else if (error.code === 'auth/invalid-credential') {
        setLoginErrorMessage(t('invalidcredential'));
      } else {
        setLoginErrorMessage(t('errordefault'));
      }
      console.error('Error logging in with email and password:', error);
    }
  };

  // Function to handle account creation - Updated to validate referral code
  const handleCreateAccount = async ({ email, password, confirmPassword, referralCode }) => {
    setCreateErrorMessage('');

    // Check if passwords match
    if (password !== confirmPassword) {
      setCreateErrorMessage(t('passwordmatch'));
      return;
    }

    // Validate referral code (required for new accounts)
    const codeValidation = await validateReferralCode(referralCode, t);
    if (!codeValidation.valid) {
      setCreateErrorMessage(codeValidation.error);
      return;
    }

    try {
      // Create a new user with Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Extract display name from email (first part before @)
      const emailPrefix = email.split('@')[0];
      
      // Generate unique code for the new user
      const userCode = await generateUserCode(email, emailPrefix);
      
      // New user - Save user data to Firestore with generated code BEFORE logging in
      // This ensures the document exists even if something goes wrong during login
      const memberData = {
        displayName: emailPrefix,
        email: user.email,
        bio: '',
        country: '',
        languages: [],
        skills: [],
        profilePicture: '', // Empty string by default for email/password accounts
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
      
      console.log('Creating member document with data:', { ...memberData, profilePicture: memberData.profilePicture ? 'URL set' : 'empty' });
      
      await setDoc(doc(db, 'members', user.uid), memberData);
      console.log('Member document created successfully for user:', user.uid);
      
      // Reward the referrer (non-blocking - account creation succeeds even if reward fails)
      try {
        await handleReferralReward(referralCode);
      } catch (rewardError) {
        console.error('Error rewarding referrer (non-blocking):', rewardError);
      }
      
      // Log the user in with the newly created credentials
      await signInWithEmailAndPassword(auth, email, password);
      
      // After successful account creation and login, close the modal
      setModalOpen(false);
      setHasInteracted(false);
      
      router.push('/complete-profile');
    } catch (error) {
      // Handle errors (e.g., email already in use, Firestore errors)
      console.error('Error creating account:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      if (error.code === 'auth/email-already-in-use') {
        setCreateErrorMessage(t('emailused'));
      } else if (error.code === 'auth/weak-password') {
        setCreateErrorMessage(t('weakpwd'));
      } else if (error.code?.startsWith('permission-denied') || error.message?.includes('Firestore')) {
        setCreateErrorMessage('Failed to create user profile. Please check your permissions or try again.');
      } else {
        setCreateErrorMessage(error.message || 'An error occurred while creating your account. Please try again.');
      }
    }
  };

  // Render the login UI
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-page dark:bg-background-page">
      <LanguageSelector 
        options={languageOptions} 
        onChangeLocale={handleLanguageChange}
        t={t}
      />
      
      {/* Logo */}
      {logoUrl && (
        <div className="mb-8 flex justify-center">
          <Image 
            src={logoUrl} 
            alt="Wannagonna Logo" 
            width={120} 
            height={120} 
            className="object-contain"
            priority
            quality={75}
            sizes="(max-width: 640px) 100px, 120px"
          />
        </div>
      )}
      
      <div className="bg-background-card dark:bg-background-card p-6 rounded-lg shadow-lg max-w-md w-full border border-border-light dark:border-border-dark">
        <h2 className="text-2xl font-semibold text-center mb-6 text-text-primary dark:text-text-primary">{t('login')}</h2>
        
        <EmailPasswordLogin 
          onSubmit={handleEmailLogin}
          errorMessage={loginErrorMessage}
          t={t}
        />

        {/* Separator with "or" */}
        <div className="text-center my-4">
          <span className="text-text-tertiary dark:text-text-tertiary">{t('or')}</span>
        </div>

        {/* Referral Code Input - Optional for returning users, required for new accounts */}
        <ReferralCodeInput
          value={googleReferralCode}
          onChange={(value) => {
            setGoogleReferralCode(value);
            // Clear error when user starts typing
            if (googleError) setGoogleError('');
          }}
          error={googleError}
          helperText={`${t('referralCodeHelper')} Required for new accounts.`}
          label={t('referralCode')}
          requiredNote="optional for returning users"
          t={t}
        />

        <button
          onClick={handleGoogleSignInClick}
          disabled={googleIsLoading}
          className="w-full max-w-xs mx-auto py-3 px-6 bg-background-card dark:bg-background-card border border-border-light dark:border-border-dark rounded-lg flex items-center justify-center gap-3 hover:bg-background-hover dark:hover:bg-background-hover transition-colors duration-200 text-text-primary dark:text-text-primary text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FcGoogle className="text-2xl" />
          <span>{googleIsLoading ? 'Signing in...' : t('google')}</span>
        </button>

        {/* Registration prompt */}
        <div className="text-center mt-6">
          <span className="text-text-tertiary dark:text-text-tertiary">{t('noaccount')} </span>
          <button 
            onClick={() => setModalOpen(true)}
            className="text-semantic-info-600 dark:text-semantic-info-400 hover:text-semantic-info-700 dark:hover:text-semantic-info-300 hover:underline"
          >
            {t('register')}
          </button>
        </div>
      </div>

      {/* Modal for account creation */}
      <CreateAccountModal
        show={modalOpen}
        onClose={wrappedModalOnClose}
        onSubmit={handleCreateAccount}
        errorMessage={createErrorMessage}
        t={t}
      />
    </div>
  );
}
