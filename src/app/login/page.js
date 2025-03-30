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
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FcGoogle } from "react-icons/fc";
import { Button, Checkbox, Label, TextInput, Modal } from "flowbite-react";
import { useState } from 'react';
import { Dropdown, DropdownItem } from "flowbite-react";
import { useTranslations } from "use-intl"; // Import hook to handle translations
import { setUserLocale } from '@/utils/locale'; // Import function to set the user's preferred locale



/**
 * LoginPage - Renders the login UI, with logo and Google sign-in functionality.
 *
 * @returns JSX.Element - The login page UI with Google sign-in functionality.
 */
export default function LoginPage() {
  const router = useRouter(); // Initialize router for navigation
  const [email, setEmail] = useState(''); // State for email
  const [password, setPassword] = useState(''); // State for password
  const [loginErrorMessage, setLoginErrorMessage] = useState(''); // State for login error message
  const [createErrorMessage, setCreateErrorMessage] = useState(''); // State for account creation error message
  const [modalOpen, setModalOpen] = useState(false); // State for modal visibility
  const [newEmail, setNewEmail] = useState(''); // State for new email
  const [newPassword, setNewPassword] = useState(''); // State for new password
  const [confirmPassword, setConfirmPassword] = useState(''); // State for confirm password

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
  /**
   * handleGoogleSignIn - Initiates Google sign-in and manages user data in Firestore.
   *
   * - Checks Firestore to see if the user is new or returning.
   * - Redirects new users to profile completion and returning users to the dashboard.
   */
  const handleGoogleSignIn = async () => {
    try {
      // Step 1: Sign in with Google
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Step 2: Check if the user already exists in Firestore
      const userDocRef = doc(db, 'members', user.uid); // Reference to user document
      const userDocSnap = await getDoc(userDocRef); // Retrieve user document

      if (userDocSnap.exists()) {
        // User exists - Redirect to dashboard for returning users
        router.push('/main/dashboard');
      } else {
        // New user - Save user data to Firestore
        await setDoc(userDocRef, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
        });
        // Redirect to profile completion page for new users
        router.push('/complete-profile');
      }
    } catch (error) {
      // Log any errors that occur during the sign-in process
      console.error('Error signing in:', error);
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

  // Function to handle account creation
  const handleCreateAccount = async (event) => {
    event.preventDefault(); // Prevent default form submission
    setCreateErrorMessage(''); // Clear previous creation error messages

    // Check if passwords match
    if (newPassword !== confirmPassword) {
        setCreateErrorMessage(t('passwordmatch')); // Set error message
        return; // Exit the function
    }

    try {
        // Create a new user with Firebase
        await createUserWithEmailAndPassword(auth, newEmail, newPassword);
        
        // Log the user in with the newly created credentials
        await signInWithEmailAndPassword(auth, newEmail, newPassword);
        
        // After successful account creation and login, close the modal
        setModalOpen(false);
        
        // Redirect the user to the dashboard
        router.push('/app/dashboard'); // Redirect to dashboard after login
    } catch (error) {
        // Handle errors (e.g., email already in use)
        if (error.code === 'auth/email-already-in-use') {
            setCreateErrorMessage(t('emailused')); // Set specific error message
        }
        else if (error.code === 'auth/weak-password') {
            setCreateErrorMessage(t('weakpwd')); // Set specific error message
        } else {
            setCreateErrorMessage(error.message); // Set error message based on Firebase error
        }
        console.error('Error creating account:', error); // Log any errors
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
