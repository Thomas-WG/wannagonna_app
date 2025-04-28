'use client';

import { useAuth } from '@/utils/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, memo } from 'react';
import LoadingSpinner from '@/components/layout/LoadingSpinner';

// Using memo to prevent unnecessary re-renders
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, claims, loading } = useAuth();
  const router = useRouter();

  // Only show loading spinner when authentication is in progress
  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <LoadingSpinner />
      </div>
    );
  }

  // If not loading and no user, return null (AuthContext will handle redirect)
  if (!user) return null;

  // Role-based protection
  if (requiredRole) {
    // Check if requiredRole is an array
    if (Array.isArray(requiredRole)) {
      // User must have at least one of the roles in the array
      if (!claims || !requiredRole.includes(claims.role)) {
        if (typeof window !== "undefined") {
          router.replace("/403");
        }
        return null;
      }
    } else {
      // Single role check (existing behavior)
      if (!claims || claims.role !== requiredRole) {
        if (typeof window !== "undefined") {
          router.replace("/403");
        }
        return null;
      }
    }
  }

  // If user exists, render children
  return children;
};

// Export the memoized component
export default memo(ProtectedRoute);
