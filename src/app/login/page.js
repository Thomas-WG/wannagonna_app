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

import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider, db } from 'firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FcGoogle } from "react-icons/fc";
import { Button, Checkbox, Label, TextInput } from "flowbite-react";
import { useState } from 'react';


/**
 * LoginPage - Renders the login UI, with logo and Google sign-in functionality.
 *
 * @returns JSX.Element - The login page UI with Google sign-in functionality.
 */
export default function LoginPage() {
  const router = useRouter(); // Initialize router for navigation
  const [email, setEmail] = useState(''); // State for email
  const [password, setPassword] = useState(''); // State for password
  const [errorMessage, setErrorMessage] = useState(''); // State for error message

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
        router.push('/dashboard');
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
    setErrorMessage(''); // Clear previous error messages
    try {
      await signInWithEmailAndPassword(auth, email, password); // Sign in with email and password
      router.push('/dashboard'); // Redirect to dashboard on successful login
    } catch (error) {
      // Set error message based on the error code
      if (error.code === 'auth/wrong-password') {
        setErrorMessage('Incorrect password. Please try again.');
      } else if (error.code === 'auth/user-not-found') {
        setErrorMessage('No user found with this email. Please check your email or sign up.');
      } else if (error.code === 'auth/invalid-credential') {
        setErrorMessage('Incorrect credential. Please check your email or sign up.');
      } else {
        setErrorMessage('An error occurred. Please try again later.');
      }
      console.error('Error logging in with email and password:', error); // Log any errors
    }
  };

  // Render the login UI
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      {/* Main Logo - Centered at the top */}
      <div className="mb-8">
        <Image
          src="/logo/Favicon.png" // Path to logo image in public folder
          alt="Main Logo"
          width={150} // Adjust size as needed
          height={150} // Adjust size as needed
          className="mx-auto"
        />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-semibold text-center mb-6">Log In</h2>
        <form className="flex max-w-md flex-col gap-4" onSubmit={handleEmailLogin}>
      <div>
        <div className="mb-2 block">
          <Label htmlFor="email1">Your email</Label>
        </div>
        <TextInput 
          id="email1" 
          type="email" 
          placeholder="name@flowbite.com" 
          required 
          value={email} // Bind email state
          onChange={(e) => setEmail(e.target.value)} // Update email state on change
        />
      </div>
      <div>
        <div className="mb-2 block">
          <Label htmlFor="password1">Your password</Label>
        </div>
        <TextInput 
          id="password1" 
          type="password" 
          required 
          value={password} // Bind password state
          onChange={(e) => setPassword(e.target.value)} // Update password state on change
        />
      </div>
      <Button type="submit" className="mb-4">Login</Button> {/* Submit button for email login */}
    </form>
    
    {/* Display error message if exists */}
    {errorMessage && (
      <div className="text-red-500 text-center mb-4">{errorMessage}</div>
    )}

    {/* Separator with "or" */}
    <div className="text-center my-4"> {/* Added margin for spacing */}
      <span className="text-gray-500">or</span>
    </div>

        <button
          onClick={handleGoogleSignIn}
          className="w-full max-w-xs mx-auto py-3 px-6 bg-white border border-gray-300 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors duration-200 text-gray-700 text-lg font-medium"
        >
          <FcGoogle className="text-2xl" />
          <span>Continue with Google</span>
        </button>

        {/* Registration prompt */}
        <div className="text-center mt-6"> {/* Added margin for spacing */}
          <span className="text-gray-500">Don't have an account? </span>
          <button 
            onClick={() => router.push('/signup')} // Redirect to signup page
            className="text-blue-500 hover:underline"
          >
            Register here!
          </button>
        </div>
      </div>
    </div>
  );
}
