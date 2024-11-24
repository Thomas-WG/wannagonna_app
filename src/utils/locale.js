'use server';

import {cookies} from 'next/headers';
import {defaultLocale} from '@/i18n/config';

const COOKIE_NAME = 'NEXT_LOCALE';

export async function getUserLocale() {
    const cookieStore = await cookies();
    const localeCookie = await cookieStore.get('NEXT_LOCALE');
  
  return localeCookie?.value || defaultLocale;
}

export async function setUserLocale(locale) {
    const cookieStore = await cookies();
    await cookieStore.set(COOKIE_NAME, locale);
}