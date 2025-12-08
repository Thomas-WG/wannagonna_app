// next-intl.config.js
import {defineConfig} from 'next-intl/config';

export default defineConfig({
  locales: ['en', 'fr', 'ja', 'es'],
  defaultLocale: 'en',
  localePrefix: 'as-needed', // or 'always' if you prefer
  messagesDir: './messages'
});