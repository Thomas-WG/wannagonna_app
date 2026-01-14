/*
 * route.js - Logo API Route
 *
 * Purpose:
 * Server-side API route for fetching the logo URL from Firebase Storage.
 * This route handles caching using cookies for better SSR support.
 *
 * Key Functionalities:
 * - Fetches logo URL from Firebase Storage
 * - Caches URL in cookies (24 hour expiration)
 * - Returns cached URL if available and valid
 * - Handles errors gracefully
 *
 * Usage:
 * - GET /api/logo - Returns logo URL or error
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from 'firebaseConfig';

const COOKIE_NAME = 'wannagonnaLogoUrl';
const COOKIE_TIMESTAMP_NAME = 'wannagonnaLogoTimestamp';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export async function GET() {
  try {
    const cookieStore = await cookies();
    const cachedUrl = cookieStore.get(COOKIE_NAME)?.value;
    const cachedTimestamp = cookieStore.get(COOKIE_TIMESTAMP_NAME)?.value;

    // Check if we have a valid cached URL
    if (cachedUrl && cachedTimestamp) {
      const timestamp = parseInt(cachedTimestamp, 10);
      const age = Date.now() - timestamp;
      
      if (age < CACHE_DURATION) {
        // Return cached URL if it's still valid
        return NextResponse.json({ url: cachedUrl, cached: true });
      }
    }

    // Fetch fresh URL from Firebase Storage
    const logoRef = ref(storage, 'logo/Favicon.png');
    const url = await getDownloadURL(logoRef);

    // Cache the URL and timestamp in cookies
    cookieStore.set(COOKIE_NAME, url, {
      path: '/',
      maxAge: 86400, // 24 hours in seconds
      httpOnly: false, // Allow client-side access if needed
      sameSite: 'lax',
    });

    cookieStore.set(COOKIE_TIMESTAMP_NAME, Date.now().toString(), {
      path: '/',
      maxAge: 86400, // 24 hours in seconds
      httpOnly: false,
      sameSite: 'lax',
    });

    return NextResponse.json({ url, cached: false });
  } catch (error) {
    console.error('Error fetching logo URL:', error);
    
    // Try to return cached URL even if it's old, as a fallback
    const cookieStore = await cookies();
    const cachedUrl = cookieStore.get(COOKIE_NAME)?.value;
    
    if (cachedUrl) {
      return NextResponse.json({ url: cachedUrl, cached: true, error: 'Using cached URL due to fetch error' });
    }

    // If no cached URL available, return error
    return NextResponse.json(
      { error: 'Failed to fetch logo URL' },
      { status: 500 }
    );
  }
}

