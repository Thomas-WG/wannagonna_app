/*
 * AuthContext.js
 *
 * Purpose:
 * This file defines the authentication context for the application, enabling all components within
 * the app to access the user's authentication state (logged-in or logged-out) globally.
 * The context is managed through Firebase authentication and provides real-time updates on user state.
 *
 * Key Functionalities:
 * - Tracks and provides the current user's authentication state throughout the application.
 * - Automatically updates the user state when they log in or out.
 * - Provides a custom hook, `useAuth`, that allows easy access to the authentication context.
 *
 * Components:
 * - AuthProvider: Wraps the application to provide global access to the user's auth state.
 * - useAuth: A custom hook for accessing the user data anywhere in the app.
 *
 * Usage:
 * - Wrap the entire app in `<AuthProvider>` in the main layout (usually in layout.js).
 * - Use `useAuth` in any component to access the current user’s information.
 *   Example usage in a component:
 *      const { user } = useAuth();
 *      if (user) { console.log("User is logged in:", user); }
 */

'use client'; // Marks this component for client-side rendering

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth'; // Firebase function to track auth state changes
import { auth } from 'firebaseConfig'; // Firebase configuration and initialization

// Create the AuthContext
const AuthContext = createContext();

// AuthProvider - Component that provides authentication context to its children
export function AuthProvider({ children }) {
  // Local state to hold the current user data
  const [user, setUser] = useState(null);

  // useEffect to listen to authentication state changes when the component mounts
  useEffect(() => {
    // Subscribe to Firebase's onAuthStateChanged to detect login/logout
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Update user state with the current user or null if logged out
    });

    // Clean up the subscription when the component unmounts
    return () => unsubscribe();
  }, []);

  return (
    // Provide the user state to all children components that are wrapped in this context
    <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
  );
}

// useAuth - Custom hook for accessing the authentication context
export const useAuth = () => useContext(AuthContext);
