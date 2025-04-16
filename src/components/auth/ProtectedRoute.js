'use client';

import { useAuth } from '@/utils/AuthContext';
import { usePathname } from 'next/navigation';
import { useEffect, memo } from 'react';
import LoadingSpinner from '@/components/layout/LoadingSpinner';

// Using memo to prevent unnecessary re-renders
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  // Only show loading spinner when authentication is in progress
  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <LoadingSpinner />
      </div>
    );
  }

  // If not loading and no user, return null (AuthContext will handle redirect)
  // If user exists, render children
  return user ? children : null;
};

// Export the memoized component
export default memo(ProtectedRoute);
