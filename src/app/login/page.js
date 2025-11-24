/*
 * LoginPage.js
 *
 * Purpose:
 * This component handles user login with Firebase Google Authentication in a Next.js environment.
 * When the user clicks the "Sign in with Google" button, they are prompted to sign in with their Google account.
 * If the user is a new user, their profile is saved to Firestore, and they are redirected to the profile completion page.
 * If the user is a returning user, they are redirected to the dashboard.
 *
 * Flow:
 * 1. User clicks "Sign in with Google" to initiate Google sign-in with Firebase.
 * 2. After successful login, the user data is checked in Firestore:
 *    - If new, the user is saved in Firestore and redirected to profile completion.
 *    - If returning, the user is redirected to the dashboard.
 * 3. Errors during sign-in are caught and logged to the console.
 *
 * Additional Feature:
 * - Displays the main logo above the sign-in block, centered on the page.
 *
 * Functions:
 * - handleGoogleSignIn: Handles the Google sign-in flow, checks Firestore for existing users,
 *   and manages the appropriate redirect based on user status (new or returning).
 *
 * Usage:
 * - This component is accessed at `/login`.
 * - Import this page as a route in your Next.js App Router.
 */

'use client'; // Marks this module for client-side rendering

import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider, db } from 'firebaseConfig';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FcGoogle } from "react-icons/fc";
import { Button, Checkbox, Label, TextInput, Modal } from "flowbite-react";
import { useState, useEffect } from 'react';
import { Dropdown, DropdownItem } from "flowbite-react";
import { useTranslations } from "use-intl"; // Import hook to handle translations
import { setUserLocale } from '@/utils/locale'; // Import function to set the user's preferred locale
import { useAuth } from '@/utils/auth/AuthContext';
import { handleReferralReward } from '@/utils/crudBadges';

/**
 * LoginPage - Renders the login UI, with logo and Google sign-in functionality.
 *
 * @returns JSX.Element - The login page UI with Google sign-in functionality.
 */
export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState(''); // State for email
  const [password, setPassword] = useState(''); // State for password
  const [loginErrorMessage, setLoginErrorMessage] = useState(''); // State for login error message
  const [createErrorMessage, setCreateErrorMessage] = useState(''); // State for account creation error message
  const [modalOpen, setModalOpen] = useState(false); // State for modal visibility
  const [newEmail, setNewEmail] = useState(''); // State for new email
  const [newPassword, setNewPassword] = useState(''); // State for new password
  const [confirmPassword, setConfirmPassword] = useState(''); // State for confirm password
  const [isLoading, setIsLoading] = useState(false); // State for loading
  const [error, setError] = useState(''); // State for error
  const [referralCode, setReferralCode] = useState(''); // Add state for referral code
  const [googleReferralCode, setGoogleReferralCode] = useState(''); // Add state for Google sign-in referral code

  const t = useTranslations('Login');

  const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'Español', value: 'es' },
  { label: 'Français', value: 'fr' },
  { label: '日本語', value: 'ja' },
];

  // Function to handle language change
  const handleLanguageChange = (locale) => {
    setUserLocale(locale); // Set the new locale using the setUserLocale utility
    console.log(`Language changed to: ${locale}`);
    // You might want to store the selected language in local storage or context
  };

  useEffect(() => {
    if (user && !loading) {
      console.log('Login page: User already authenticated, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  /**
   * Validate referral code by checking if it exists in members collection
   */
  const validateReferralCode = async (code) => {
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
  };

  /**
   * Generate a unique 5-character code based on user email
   */
  const generateUserCode = async (email, displayName = '') => {
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
  };

 
  /**
   * handleGoogleSignIn - Validate referral code only for new users after sign-in
   */
  const handleGoogleSignIn = async () => {
    try {
      if (setIsLoading) setIsLoading(true);
      
      // Clear any previous errors
      if (setError) setError('');
      
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
        if (!googleReferralCode || googleReferralCode.trim().length === 0) {
          // Sign out the user since referral code is missing
          await auth.signOut();
          const errorMsg = t('referralCodeRequired') || 'Referral code is required for new accounts.';
          setError(errorMsg);
          console.error('New user sign-in failed: Referral code required');
          return;
        }
        
        // Validate the referral code exists in the database
        const codeValidation = await validateReferralCode(googleReferralCode);
        if (!codeValidation.valid) {
          // Sign out the user since validation failed
          await auth.signOut();
          setError(codeValidation.error);
          console.error('New user sign-in failed: Invalid referral code', googleReferralCode);
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
          referredBy: googleReferralCode.toUpperCase().trim(), // Store who referred them
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
          await handleReferralReward(googleReferralCode);
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
      
      // Set error state if you have one
      if (setError) setError(errorMessage);
    } finally {
      if (setIsLoading) setIsLoading(false);
    }
  };

  // Function to handle email/password login
  const handleEmailLogin = async (event) => {
    event.preventDefault(); // Prevent default form submission
    setLoginErrorMessage(''); // Clear previous login error messages
    try {
      await signInWithEmailAndPassword(auth, email, password); // Sign in with email and password
      router.push('/dashboard'); // Redirect to dashboard on successful login
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
      console.error('Error logging in with email and password:', error); // Log any errors
    }
  };

  // Function to handle account creation - Updated to validate referral code
  const handleCreateAccount = async (event) => {
    event.preventDefault();
    setCreateErrorMessage('');

    // Check if passwords match
    if (newPassword !== confirmPassword) {
        setCreateErrorMessage(t('passwordmatch'));
        return;
    }

    // Validate referral code
    const codeValidation = await validateReferralCode(referralCode);
    if (!codeValidation.valid) {
        setCreateErrorMessage(codeValidation.error);
        return;
    }

    try {
        // Create a new user with Firebase
        const userCredential = await createUserWithEmailAndPassword(auth, newEmail, newPassword);
        const user = userCredential.user;
        
        // Extract display name from email (first part before @)
        const emailPrefix = newEmail.split('@')[0];
        
        // Generate unique code for the new user
        const userCode = await generateUserCode(newEmail, emailPrefix);
        
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
        await signInWithEmailAndPassword(auth, newEmail, newPassword);
        
        // After successful account creation and login, close the modal
        setModalOpen(false);
        
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
            setCreateErrorMessage(t('emailused')); // Set specific error message
        } else if (error.code === 'auth/weak-password') {
            setCreateErrorMessage(t('weakpwd')); // Set specific error message
        } else if (error.code?.startsWith('permission-denied') || error.message?.includes('Firestore')) {
            setCreateErrorMessage('Failed to create user profile. Please check your permissions or try again.');
        } else {
            setCreateErrorMessage(error.message || 'An error occurred while creating your account. Please try again.'); // Set error message based on Firebase error
        }
    }
  };

  // Render the login UI
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="absolute top-4 right-4"> {/* Positioning the dropdown */}
        <Dropdown label={t('select')} inline={true}>
          {languageOptions.map((option) => (
            <Dropdown.Item key={option.value} onClick={() => handleLanguageChange(option.value)}>
              {option.label}
            </Dropdown.Item>
          ))}
        </Dropdown>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-semibold text-center mb-6">{t('login')}</h2>
        <form className="flex max-w-md flex-col gap-4" onSubmit={handleEmailLogin}>
          <div>
            <div className="mb-2 block">
              <Label htmlFor="email1">{t('email')}</Label>
            </div>
            <TextInput 
              id="email1" 
              type="email" 
              placeholder="name@wannagonna.org" 
              required 
              value={email} // Bind email state
              onChange={(e) => setEmail(e.target.value)} // Update email state on change
              autoComplete="username" // Added autocomplete attribute
            />
          </div>
          <div>
            <div className="mb-2 block">
              <Label htmlFor="password1">{t('password')}</Label>
            </div>
            <TextInput 
              id="password1" 
              type="password" 
              required 
              value={password} // Bind password state
              onChange={(e) => setPassword(e.target.value)} // Update password state on change
              autoComplete="current-password" // Added autocomplete attribute
            />
          </div>
          <Button type="submit" className="mb-4">{t('login')}</Button> {/* Submit button for email login */}
        </form>
        
        {/* Display login error message if exists */}
        {loginErrorMessage && (
          <div className="text-red-500 text-center mb-4">{loginErrorMessage}</div>
        )}

        {/* Separator with "or" */}
        <div className="text-center my-4"> {/* Added margin for spacing */}
          <span className="text-gray-500">{t('or')}</span>
        </div>

        {/* Referral Code Input - Optional for returning users, required for new accounts */}
        <div className="mb-4">
          <Label htmlFor="googleReferralCode">{t('referralCode')} <span className="text-gray-400 text-xs">(optional for returning users)</span></Label>
          <TextInput 
            id="googleReferralCode" 
            type="text" 
            placeholder={t('referralCodePlaceholder')}
            value={googleReferralCode}
            onChange={(e) => {
              setGoogleReferralCode(e.target.value.toUpperCase());
              // Clear error when user starts typing
              if (error) setError('');
            }}
            maxLength={5}
            className="uppercase"
          />
          <p className="text-xs text-gray-500 mt-1">{t('referralCodeHelper')} Required for new accounts.</p>
          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
              <p className="font-medium">{error}</p>
            </div>
          )}
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="w-full max-w-xs mx-auto py-3 px-6 bg-white border border-gray-300 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors duration-200 text-gray-700 text-lg font-medium"
        >
          <FcGoogle className="text-2xl" />
          <span>{t('google')}</span>
        </button>

        {/* Registration prompt */}
        <div className="text-center mt-6"> {/* Added margin for spacing */}
          <span className="text-gray-500">{t('noaccount')} </span>
          <button 
            onClick={() => setModalOpen(true)} // Open modal on click
            className="text-blue-500 hover:underline"
          >
            {t('register')}
          </button>
        </div>
      </div>

      {/* Modal for account creation */}
      <Modal show={modalOpen} onClose={() => setModalOpen(false)} size="md" className="flex items-center justify-center h-full">
        <Modal.Header>{t('createtitle')}</Modal.Header>
        <Modal.Body>
          <form className="flex flex-col gap-4 w-full max-w-sm mx-auto" onSubmit={handleCreateAccount}>
            <div>
              <Label htmlFor="referralCode">{t('referralCode')}</Label>
              <TextInput 
                id="referralCode" 
                type="text" 
                required 
                placeholder={t('referralCodePlaceholder')}
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                maxLength={5}
                className="uppercase"
              />
              <p className="text-xs text-gray-500 mt-1">{t('referralCodeHelper')}</p>
            </div>
            <div>
              <Label htmlFor="newEmail">{t('email')}</Label>
              <TextInput 
                id="newEmail" 
                type="email" 
                required 
                value={newEmail} // Bind newEmail state
                onChange={(e) => setNewEmail(e.target.value)} // Update newEmail state on change
              />
            </div>
            <div>
              <Label htmlFor="newPassword">{t('password')}</Label>
              <TextInput 
                id="newPassword" 
                type="password" 
                required 
                value={newPassword} // Bind newPassword state
                onChange={(e) => setNewPassword(e.target.value)} // Update newPassword state on change
                autoComplete="new-password" // Added autocomplete attribute
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">{t('confirmpassword')}</Label>
              <TextInput 
                id="confirmPassword" 
                type="password" 
                required 
                value={confirmPassword} // Bind confirmPassword state
                onChange={(e) => setConfirmPassword(e.target.value)} // Update confirmPassword state on change
                autoComplete="new-password" // Added autocomplete attribute
              />
            </div>
            {/* Display creation error message if exists */}
            {createErrorMessage && (
              <div className="text-red-500 text-center mb-4">{createErrorMessage}</div>
            )}
            <Button type="submit">{t('create')}</Button>
          </form>
        </Modal.Body>
      </Modal>
    </div>
  );
}
