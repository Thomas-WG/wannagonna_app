// This code manages user locale settings in a Next.js project using server-side cookies

'use server';

import { cookies } from 'next/headers'; // Importing cookies utility from Next.js to manage HTTP cookies
import { defaultLocale } from '@/i18n/config'; // Importing the default locale configuration

const COOKIE_NAME = 'NEXT_LOCALE'; // Constant representing the name of the cookie used for storing locale preferences

// Function to get the user's locale from cookies, or return the default locale if none is found
export async function getUserLocale() {
  const cookieStore = await cookies(); // Getting the cookie store to interact with user cookies
  const localeCookie = await cookieStore.get('NEXT_LOCALE'); // Attempting to retrieve the 'NEXT_LOCALE' cookie

  return localeCookie?.value || defaultLocale; // Returning the value of the cookie if available, otherwise the default locale
}

// Function to set the user's locale in a cookie
export async function setUserLocale(locale) {
  const cookieStore = await cookies(); // Getting the cookie store to interact with user cookies
  await cookieStore.set(COOKIE_NAME, locale); // Setting the 'NEXT_LOCALE' cookie with the provided locale value
}
