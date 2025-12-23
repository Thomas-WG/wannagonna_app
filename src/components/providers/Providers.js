'use client';

/*
 * Providers.js
 *
 * Purpose:
 * Consolidated provider component that organizes all application providers with error boundaries.
 * This component extracts provider logic from the root layout for better code organization.
 * Each provider is wrapped with its own ErrorBoundary to isolate failures.
 *
 * Key Functionalities:
 * - Wraps AuthProvider with ErrorBoundary for isolated error handling
 * - Wraps ThemeProvider with ErrorBoundary for isolated error handling
 * - Wraps ModalProviderWrapper with ErrorBoundary for isolated error handling
 * - Maintains proper provider nesting order (AuthProvider → ThemeProvider → ModalProvider)
 *
 * Components:
 * - ErrorBoundary: Isolates provider failures to prevent one provider from crashing the entire app
 * - AuthProvider: Provides authentication context (required by ThemeProvider)
 * - ThemeProvider: Provides theme context (requires AuthProvider for user context)
 * - ModalProviderWrapper: Provides modal context and global handlers
 *
 * Usage:
 * - Import and use in the root layout (layout.js)
 * - Replaces nested provider structure for better maintainability
 */

import ErrorBoundary from '@/components/ErrorBoundary';
import { AuthProvider } from '@/utils/auth/AuthContext';
import { ThemeProvider } from '@/utils/theme/ThemeContext';
import ModalProviderWrapper from '@/components/modal/ModalProviderWrapper';

/**
 * Providers - Consolidated provider component with error boundaries
 * 
 * Wraps all application providers with individual error boundaries to isolate failures.
 * This prevents one provider failure from crashing the entire application.
 */
export default function Providers({ children }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ErrorBoundary>
          <ThemeProvider>
            <ErrorBoundary>
              <ModalProviderWrapper>
                {children}
              </ModalProviderWrapper>
            </ErrorBoundary>
          </ThemeProvider>
        </ErrorBoundary>
      </AuthProvider>
    </ErrorBoundary>
  );
}

