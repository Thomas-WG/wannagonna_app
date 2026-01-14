'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/utils/auth/AuthContext';
import { validateActivityByQR } from '@/utils/crudActivityValidation';
import { Spinner } from 'flowbite-react';

/**
 * Simplified validation page:
 * 1. User scans QR code → navigates here
 * 2. Check if already validated → redirect to dashboard with message
 * 3. If not, validate (grant points/badges) → redirect to dashboard with success
 * 4. Dashboard shows modal (not this page)
 */
export default function ValidateActivityPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  // Use ref to ensure we only process once per unique activityId+token combination
  const processedRef = useRef(new Set());
  const isProcessingRef = useRef(false);

  // Extract params as stable values using useMemo
  const activityId = useMemo(() => searchParams.get('activityId'), [searchParams]);
  const token = useMemo(() => searchParams.get('token'), [searchParams]);
  const validationKey = useMemo(() => {
    return activityId && token ? `${activityId}-${token}` : null;
  }, [activityId, token]);

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) {
      return;
    }

    // Redirect to login if not authenticated
    if (!user) {
      router.replace('/login');
      return;
    }

    // If no params, redirect to dashboard
    if (!activityId || !token || !validationKey) {
      router.replace('/dashboard');
      return;
    }

    // Only process once per unique key
    if (processedRef.current.has(validationKey) || isProcessingRef.current) {
      return;
    }

    // Mark as processing and add to processed set
    isProcessingRef.current = true;
    processedRef.current.add(validationKey);

    // Process validation
    const processValidation = async () => {
      try {
        // Validate activity - this function handles all checks (already validated, activity exists, token, type, date)
        const validationResult = await validateActivityByQR(user.uid, activityId, token);

        if (validationResult.success) {
          // Success - redirect to dashboard with success params
          // Badges are processed in background by Cloud Function, so we don't include them here
          const params = new URLSearchParams({
            validation: 'success',
            xp: validationResult.xpReward?.toString() || '0',
            activityTitle: validationResult.activityTitle || '',
            activityId: activityId || ''
          });
          
          router.replace(`/dashboard?${params.toString()}`);
        } else {
          // Handle specific error cases
          if (validationResult.error === 'ALREADY_VALIDATED') {
            router.replace('/dashboard?validation=already-validated');
          } else {
            // Other errors - redirect to dashboard with error message
            const errorMsg = encodeURIComponent(validationResult.message || 'Validation failed');
            router.replace(`/dashboard?validation=error&message=${errorMsg}`);
          }
        }
      } catch (error) {
        console.error('Error processing validation:', error);
        const errorMsg = encodeURIComponent(error.message || 'An error occurred');
        router.replace(`/dashboard?validation=error&message=${errorMsg}`);
      } finally {
        // Reset processing flag after a delay to allow navigation
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 1000);
      }
    };

    processValidation();
  }, [user?.uid, authLoading, activityId, token, validationKey, router]);

  // Show loading spinner while processing
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Spinner size="xl" className="mx-auto mb-4" />
        <p className="text-gray-600">Validating activity...</p>
      </div>
    </div>
  );
}
