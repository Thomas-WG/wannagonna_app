/*
 * page.js
 *
 * Purpose:
 * This is the landing page for the Wanna Gonna platform. It welcomes visitors,
 * introduces the platform, and provides a link to login. If a user is already
 * authenticated, they are automatically redirected to the dashboard.
 *
 * Key Functionalities:
 * - Displays welcome message and platform introduction
 * - Provides call-to-action button to access the app (login)
 * - Automatically redirects authenticated users to dashboard
 * - Shows loading state while checking authentication
 *
 * Components:
 * - Uses useAuth hook to check authentication state
 * - Uses useRouter for navigation
 * - Displays logo from Firebase Storage (if available)
 *
 * Usage:
 * - This component is accessed at the root URL `/`.
 */

'use client'; // Marks this module for client-side rendering

import { useAuth } from '@/utils/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from 'flowbite-react';
import Image from 'next/image';
import { siteConfig } from '@/constant/config';

/**
 * Home - Landing page component
 *
 * @returns JSX.Element - The landing page UI with welcome message and CTA button.
 */
export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [logoUrl, setLogoUrl] = useState('');
  const [logoError, setLogoError] = useState(false);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

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
          setLogoError(false);
        } else {
          throw new Error('No URL in response');
        }
      } catch (error) {
        console.error('Error fetching logo URL:', error);
        setLogoError(true);
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

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-page dark:bg-background-page">
        <div className="text-text-primary dark:text-text-primary">Loading...</div>
      </div>
    );
  }

  // Don't render landing page if user is authenticated (will redirect)
  if (user) {
    return null;
  }

  // Render the landing page
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-page dark:bg-background-page p-4 sm:p-8">
      {/* Logo */}
      {logoUrl && !logoError && (
        <div className="mb-8 flex justify-center">
          <Image 
            src={logoUrl} 
            alt="Wannagonna Logo" 
            width={120} 
            height={120} 
            className="object-contain"
            priority
            onError={() => setLogoError(true)}
            quality={75}
            sizes="(max-width: 640px) 100px, 120px"
          />
        </div>
      )}

      {/* Main Content Card */}
      <div className="bg-background-card dark:bg-background-card p-8 rounded-lg shadow-lg max-w-2xl w-full border border-border-light dark:border-border-dark">
        {/* Welcome Heading */}
        <h1 className="text-4xl font-bold text-center mb-6 text-text-primary dark:text-text-primary">
          Welcome to Wanna Gonna
        </h1>

        {/* Platform Title */}
        <h2 className="text-2xl font-semibold text-center mb-4 text-primary-600 dark:text-primary-400">
          {siteConfig.title}
        </h2>

        {/* Platform Description */}
        <p className="text-lg text-center mb-8 text-text-secondary dark:text-text-secondary leading-relaxed">
          {siteConfig.description}
        </p>

        {/* Value Proposition */}
        <div className="mb-8 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center mt-1">
              <span className="text-white text-sm font-bold">✓</span>
            </div>
            <p className="text-text-primary dark:text-text-primary">
              Connect your skills with NGOs and NPOs worldwide
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center mt-1">
              <span className="text-white text-sm font-bold">✓</span>
            </div>
            <p className="text-text-primary dark:text-text-primary">
              Make a meaningful difference through volunteering
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center mt-1">
              <span className="text-white text-sm font-bold">✓</span>
            </div>
            <p className="text-text-primary dark:text-text-primary">
              Free platform for volunteers and organizations
            </p>
          </div>
        </div>

        {/* Call to Action Button */}
        <div className="flex justify-center">
          <Button
            onClick={() => router.push('/login')}
            className="bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-white px-8 py-3 text-lg font-semibold"
            size="lg"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}
