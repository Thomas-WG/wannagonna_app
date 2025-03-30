/*
 * Purpose:
 * This file defines the main Activities Page, displaying a list of activities that users can view.
 * It checks if a user is authenticated and then retrieves and displays activity data from Firestore.
 *
 * Key Functionalities:
 * - Ensures only authenticated users can view the activity content.
 * - Fetches activity data from Firestore.
 * - Renders each activity as a card in a responsive grid layout.
 *
 * Dependencies:
 * - `useAuth` hook to manage user authentication and redirect if not logged in.
 * - `fetchActivities` utility function to fetch activities from the database.
 * - `ActivityCard` component for displaying individual activity details.
 *
 * Usage:
 * - This component can be rendered within the main app layout to provide a view of available activities.
 */

'use client'; // Enable client-side rendering for this page

import { subscribeToActivities } from '@/utils/crudActivities';
import { useEffect, useState } from 'react';
import { fetchActivities } from '@/utils/crudActivities'; // Utility function to fetch activities data
import ActivityCard from '@/components/ActivityCard'; // Component to display each activity's data in card format
import { useAuth } from '@/hooks/useAuth'; // Hook for accessing user authentication status
import LoadingSpinner from '@/components/LoadingSpinner'; // Component to show the loading spinner
import { useRouter } from 'next/navigation';

// Main component to display activities
export default function ActivitiesPage() {
  // Destructure `user` and `loading` state from `useAuth` to manage access control
  const { user, loading } = useAuth();

  // State variable to store the list of fetched activities
  const [activities, setActivities] = useState([]);

  const router = useRouter();

  //This listens to live changes in the activities collection
  useEffect(() => {
    let unsubscribe;
    if (user) {
      unsubscribe = subscribeToActivities((updatedActivities) => {
        setActivities(updatedActivities);
      });
    }
     // Cleanup subscription when component unmounts or user changes
     return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const goToManage = () => {
    router.push('/activities/manage'); 
  };

  /*
   * useEffect to fetch activities data
   * - Runs after the component mounts and when `user` state changes
   * - Only triggers data fetch if user is authenticated
   */
  useEffect(() => {
    async function getData() {
      if (user) {
        // Ensure data fetching only happens if a user is authenticated
        const data = await fetchActivities(); // Fetch data from Firestore
        setActivities(data); // Set the fetched data to `activities` state
      }
    }
    getData();
  }, [user]); // Re-run the effect when `user` changes (e.g., when logging in or out)

  // Display loading spinner while user authentication status is being determined
  if (loading)
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <LoadingSpinner />
      </div>
    );

  // If there is no authenticated user, return null (no content rendered)
  if (!user) return null;
  return (
    <div className='p-4'>
      {/* Responsive grid layout for displaying activity cards */}
      <div className='grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
        {activities.map((activity, index) => (
          <ActivityCard
            key={index} // Unique key for each card
            id = {activity.id}
            organization_name={activity.organization_name} // Non-profit organization name
            organization_logo={activity.organization_logo} // Logo URL of the non-profit
            title={activity.title} // Title of the activity
            location={activity.location} // Location of the activity
            applicants={activity.applicants} // Number of applicants
            xp_reward={activity.xp_reward} // Points awarded for participation
            description={activity.description} // Description of the activity
          />
        ))}
      </div>
      <button onClick={goToManage} className="fixed bottom-4 right-4 bg-orange-500 text-white text-2xl w-12 h-12 rounded-full shadow-lg hover:bg-orange-600">
        +
      </button>
    </div>

  );
}
