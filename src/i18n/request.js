// This code configures the request for setting up the locale for the Next.js application

import { getRequestConfig } from 'next-intl/server'; // Import getRequestConfig to handle internationalization server-side
import { getUserLocale } from '@/utils/locale'; // Import function to get the user's preferred locale

export default getRequestConfig(async () => {
  // Fetch the user's locale preference, falling back to a default if none is set
  const locale = await getUserLocale();

  return {
    // Return the user's locale
    locale,
    // Load the corresponding locale messages for the user's locale
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
