/*
 * useAuth.js
 * 
 * Purpose:
 * This custom hook provides authentication functionality for Firebase Auth in a Next.js environment. 
 * It allows any component to easily check if a user is authenticated, retrieve the user object, 
 * handle loading states, and perform logout operations. This hook ensures users are redirected 
 * to the login page if they are not logged in.
 *
 * Usage:
 * Import and call the `useAuth` hook in any client-side component to access user information 
 * or handle authentication states. For example:
 *
 * import { useAuth } from '@/hooks/useAuth';
 *
 * function MyComponent() {
 *   const { user, loading, logout } = useAuth();
 *
 *   if (loading) return <p>Loading...</p>;
 *
 *   return (
 *     <div>
 *       {user ? <p>Welcome, {user.displayName}</p> : <p>Please log in</p>}
 *       <button onClick={logout}>Logout</button>
 *     </div>
 *   );
 * }
 *
 * Functions:
 * - useAuth: Initializes authentication state, listens to authentication status changes, 
 *   and provides helper functions (e.g., logout) to manage user authentication.
 */

'use client'; // Marks this module for client-side rendering

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';

/**
 * useAuth - Custom hook to manage Firebase authentication state.
 * 
 * @returns {Object} - Returns an object containing:
 *   - user: The current authenticated user object or null if not authenticated.
 *   - loading: Boolean representing if the authentication status is loading.
 *   - logout: Function to log out the user and redirect to the login page.
 */
export function useAuth() {
  // State to hold the current authenticated user
  const [user, setUser] = useState(null);
  // State to indicate if the authentication state is still loading
  const [loading, setLoading] = useState(true);
  // Router instance for handling client-side navigation
  const router = useRouter();
  // Firebase authentication instance
  const auth = getAuth();

  /**
   * useEffect - Runs once on component mount to set up Firebase Auth state listener.
   * Listens for changes in the authentication status and updates the `user` state
   * accordingly. Redirects to the login page if no user is found.
   */
  useEffect(() => {
    // Set up listener to track authentication state
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // User is signed in, update the `user` state
        setUser(currentUser);
      } else if (!loading) {
        // No user signed in and loading is complete, redirect to login page
        router.push('/login');
      }
      // Mark loading as complete to allow components to use the auth state
      setLoading(false);
    });

    // Clean up the listener on unmount
    return () => unsubscribe();
  }, [auth, router, loading]);

  /**
   * logout - Function to log out the current user.
   * 
   * - Clears the `user` state, calls Firebase `signOut` to log out, 
   *   and redirects to the login page.
   */
  const logout = async () => {
    try {
      await signOut(auth); // Calls Firebase to sign out the user
      setUser(null); // Clear the user state upon logout
      router.push('/login'); // Redirect to login page after logout
    } catch (error) {
      // Log any errors that occur during the logout process
      console.error('Error logging out:', error);
    }
  };

  // Return user data, loading status, and logout function for use in components
  return { user, loading, logout };
}
