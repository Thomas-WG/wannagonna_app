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
 * - Use `useAuth` in any component to access the current user's information.
 *   Example usage in a component:
 *      const { user } = useAuth();
 *      if (user) { console.log("User is logged in:", user); }
 */

'use client'; // Marks this component for client-side rendering

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth'; // Firebase function to track auth state changes
import { auth } from 'firebaseConfig'; // Firebase configuration and initialization
import { useRouter, usePathname } from 'next/navigation'; // Changed from next/router to next/navigation

// Create the AuthContext
const AuthContext = createContext();

// AuthProvider - Component that provides authentication context to its children
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [claims, setClaims] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Function to fetch and set user claims
  const fetchUserClaims = async (currentUser) => {
    try {
      const idTokenResult = await currentUser.getIdTokenResult(true); // Force refresh the token
      setClaims(idTokenResult.claims);
      return idTokenResult.claims;
    } catch (error) {
      // Only log errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching user claims:', error);
      }
      return null;
    }
  };

  // Function to check if token needs refresh (if it will expire in the next 5 minutes)
  const shouldRefreshToken = useCallback((expirationTime) => {
    if (!expirationTime) return false;
    const expirationDate = new Date(expirationTime * 1000);
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    return expirationDate < fiveMinutesFromNow;
  }, []);

  useEffect(() => {
    // Initialize auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Fetch claims and check if token needs refresh
        const userClaims = await fetchUserClaims(currentUser);
        
        // Set up token refresh if needed
        if (userClaims && shouldRefreshToken(userClaims.exp)) {
          // Set up a timer to refresh the token before it expires
          const timeUntilExpiry = (userClaims.exp * 1000) - Date.now() - (4 * 60 * 1000); // 4 minutes before expiry
          if (timeUntilExpiry > 0) {
            setTimeout(async () => {
              if (auth.currentUser) {
                await fetchUserClaims(auth.currentUser);
              }
            }, timeUntilExpiry);
          }
        }
      } else {
        setUser(null);
        setClaims(null);
        // Redirect to login if not on login page or root
        if (pathname !== '/login' && pathname !== '/') {
          router.push('/login');
        }
      }
      
      setLoading(false);
    }, (error) => {
      // Only log errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Auth state change error:', error);
      }
      setLoading(false);
    });

    // Cleanup subscription
    return () => {
      unsubscribe();
    };
  }, [pathname, router, shouldRefreshToken]); // Include router and shouldRefreshToken in dependency array

  // Wrap logout in useCallback
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
      setClaims(null);
      router.push('/login');
    } catch (error) {
      // Only log errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error logging out:', error);
      }
    }
  }, [router]); // Only depends on router

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    claims,
    loading,
    logout
  }), [user, claims, loading, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// useAuth - Custom hook for accessing the authentication context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
