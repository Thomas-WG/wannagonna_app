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

import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, db } from 'firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Image from 'next/image'; // Import for displaying logo

/**
 * LoginPage - Renders the login UI, with logo and Google sign-in functionality.
 *
 * @returns JSX.Element - The login page UI with Google sign-in functionality.
 */
export default function LoginPage() {
  const router = useRouter(); // Initialize router for navigation

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
        <h2 className="text-2xl font-semibold text-center mb-4">Sign In</h2>
        <button
          onClick={handleGoogleSignIn} // Call handleGoogleSignIn on button click
          className="w-full py-2 bg-orange-500 text-white rounded-lg flex items-center justify-center hover:bg-orange-400"
        >
          <span>Sign in with Google</span>
        </button>
      </div>
    </div>
  );
}
