/*
 * layout.js
 *
 * Purpose:
 * This layout component is responsible for setting up the structure of every page in the app.
 * It configures the global layout with font styling, internationalization, error boundaries, and providers.
 *
 * Key Functionalities:
 * - Sets up Roboto as the main font for the entire application.
 * - Configures internationalization (i18n) with NextIntlClientProvider.
 * - Wraps the app in ErrorBoundary for error handling (outermost catch-all).
 * - Uses consolidated Providers component that includes AuthProvider, ThemeProvider, and ModalProvider
 *   with individual error boundaries for each provider.
 *
 * Components:
 * - NextIntlClientProvider: Provides internationalization services.
 * - ErrorBoundary: Catches errors in the component tree (outermost).
 * - Providers: Consolidated component containing all app providers with individual error boundaries.
 *
 * Usage:
 * - This component should be used as the primary layout for the application.
 * - All pages in the app will have this layout as a wrapper.
 */

import '@/styles/globals.css'; // Global styles for the entire application
import Providers from '@/components/providers/Providers'; // Consolidated providers with error boundaries
import ErrorBoundary from '@/components/ErrorBoundary'; // Error boundary for error handling
import { Roboto } from 'next/font/google'; // Roboto font from Google Fonts
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { siteConfig } from '@/constant/config';

// Configure Roboto font settings for the app
const roboto = Roboto({
  weight: ['400', '500', '700'], // Font weights used in the app
  subsets: ['latin'], // Character subset to include
});

// PWA Metadata configuration
export const metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.title}`,
  },
  description: siteConfig.description,
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'WannaGonna',
  },
  icons: {
    icon: [
      { url: '/favicon/favicon.ico' },
      { url: '/favicon/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [
      { url: '/favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

// Viewport configuration for mobile app-like experience
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover', // Allows content to extend under notch/status bar
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f97316' },
    { media: '(prefers-color-scheme: dark)', color: '#f97316' },
  ],
};

/**
 * RootLayout - Main layout component for the app
 */
export default async function RootLayout({ children }) {
  //Get locale value and load the translations files
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={roboto.className} suppressHydrationWarning>
      <head>
        {/* Theme initialization script - must run before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        {/* iOS-specific PWA meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="WannaGonna" />
        <link rel="apple-touch-icon" href="/favicon/apple-touch-icon.png" />
        {/* iOS splash screens - add apple-touch-startup-image links here when splash images are generated */}
      </head>
      <body className='h-screen flex overflow-hidden' suppressHydrationWarning>
      {/* Wrap the entire app in NextIntlClientProvider for access to internationalization services */}
        <NextIntlClientProvider messages={messages}>
          {/* Wrap the entire app in ErrorBoundary for error handling (outermost catch-all) */}
          <ErrorBoundary>
            {/* Consolidated providers component with individual error boundaries for each provider */}
            <Providers>
              {/* Main content area, which displays the child components */}
              <main className='flex-1'>{children}</main>
            </Providers>
          </ErrorBoundary>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
