'use client';

import ErrorBoundary from '@/components/ErrorBoundary';

/**
 * DashboardErrorBoundary
 * Wrapper around ErrorBoundary with dashboard-specific styling
 */
export default function DashboardErrorBoundary({ children }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

