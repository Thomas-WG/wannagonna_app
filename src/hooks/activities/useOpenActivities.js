import { useQuery, useQueryClient } from '@tanstack/react-query';
import { subscribeToOpenActivities } from '@/utils/crudActivities';
import { useEffect, useState } from 'react';

/**
 * React Query hook for fetching open activities with real-time updates
 * Wraps subscribeToOpenActivities with React Query caching
 * 
 * @returns {Object} Query result with activities, loading, and error states
 */
export function useOpenActivities() {
  const queryClient = useQueryClient();
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use React Query to manage the subscription and cache
  const query = useQuery({
    queryKey: ['openActivities'],
    queryFn: () => {
      // This function won't be called directly, but we use it for cache management
      return new Promise((resolve) => {
        // The actual data comes from the subscription below
        resolve([]);
      });
    },
    staleTime: Infinity, // Real-time data is always fresh
    gcTime: 10 * 60 * 1000, // Cache for 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    let unsubscribe;

    const setupSubscription = () => {
      setIsLoading(true);
      setError(null);

      unsubscribe = subscribeToOpenActivities((updatedActivities) => {
        setActivities(updatedActivities);
        setIsLoading(false);
        setError(null);
        
        // Update React Query cache
        queryClient.setQueryData(['openActivities'], updatedActivities);
      });
    };

    setupSubscription();

    // Cleanup subscription when component unmounts
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [queryClient]);

  return {
    activities,
    isLoading,
    error,
    refetch: query.refetch,
  };
}

