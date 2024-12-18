/*
 * layout.js
 *
 * Purpose:
 * This layout component is responsible for setting up the structure of every page in the app.
 * It configures the global layout with a sidebar (Navbar), font styling, and user authentication context.
 * The layout also conditionally renders the Navbar based on specific routes.
 *
 * Key Functionalities:
 * - Sets up Roboto as the main font for the entire application.
 * - Wraps all children components with the AuthProvider for authentication handling.
 * - Conditionally displays the Navbar, hiding it on the login page.
 *
 * Components:
 * - AuthProvider: Provides authentication context for all pages within the layout.
 * - Navbar: Sidebar navigation that is conditionally displayed based on the current route.
 *
 * Usage:
 * - This component should be used as the primary layout for the application.
 * - All pages in the app will have this layout as a wrapper.
 * - To exclude Navbar on specific pages, add those routes to the `noNavbarRoutes` array.
 */

'use client'; // Marks this component for client-side rendering

import Navbar from '@/components/Sidebar'; // Navbar component for sidebar navigation
import '@/styles/globals.css'; // Global styles for the entire application
import { AuthProvider } from '@/app/context/AuthContext'; // Authentication context provider
import { usePathname } from 'next/navigation'; // Hook to get the current path

import { Roboto } from 'next/font/google'; // Roboto font from Google Fonts

// Configure Roboto font settings for the app
const roboto = Roboto({
  weight: ['400', '500', '700'], // Font weights used in the app
  subsets: ['latin'], // Character subset to include
});

/**
 * RootLayout - Main layout component for the app
 *
 * @param {Object} props - The component props
 * @param {React.ReactNode} props.children - The nested children components wrapped by the layout
 *
 * @returns {JSX.Element} - The main layout structure
 */
export default function RootLayout({ children }) {
  const pathname = usePathname(); // Retrieve the current URL path

  // Define an array of routes where the Navbar should not be displayed
  const noNavbarRoutes = ['/login'];

  return (
    <html lang='en' className={roboto.className}>
      <body className='h-screen flex overflow-hidden'>
        {/* Wrap the entire app in AuthProvider for access to authentication context */}
        <AuthProvider>
          {/* Conditionally render the Navbar based on the current route */}
          {!noNavbarRoutes.includes(pathname) && <Navbar />}
          
          {/* Main content area, which displays the child components */}
          <main className='flex-1 overflow-y-auto p-4'>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
