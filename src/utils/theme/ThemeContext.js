'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/utils/auth/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from 'firebaseConfig';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const { user } = useAuth();
  const [theme, setTheme] = useState('light');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check localStorage first
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
      setIsLoading(false);
      return;
    }

    // Fall back to system preference
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = systemPrefersDark ? 'dark' : 'light';
    setTheme(initialTheme);
    setIsLoading(false);
  }, []);

  // Load theme from user profile if authenticated
  useEffect(() => {
    const loadUserTheme = async () => {
      if (!user?.uid) return;

      try {
        const userRef = doc(db, 'members', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.themePreference && (userData.themePreference === 'light' || userData.themePreference === 'dark')) {
            setTheme(userData.themePreference);
            localStorage.setItem('theme', userData.themePreference);
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error loading user theme preference:', error);
        }
      }
    };

    loadUserTheme();
  }, [user]);

  // Apply theme to document
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Toggle theme function
  const toggleTheme = useCallback(async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    // Save to user profile if authenticated
    if (user?.uid) {
      try {
        const userRef = doc(db, 'members', user.uid);
        await setDoc(userRef, {
          themePreference: newTheme,
        }, { merge: true });
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error saving theme preference:', error);
        }
      }
    }
  }, [theme, user]);

  // Set theme function
  const setThemePreference = useCallback(async (newTheme) => {
    if (newTheme !== 'light' && newTheme !== 'dark') return;
    
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    // Save to user profile if authenticated
    if (user?.uid) {
      try {
        const userRef = doc(db, 'members', user.uid);
        await setDoc(userRef, {
          themePreference: newTheme,
        }, { merge: true });
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error saving theme preference:', error);
        }
      }
    }
  }, [user]);

  const value = {
    theme,
    toggleTheme,
    setTheme: setThemePreference,
    isLoading,
    isDark: theme === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
