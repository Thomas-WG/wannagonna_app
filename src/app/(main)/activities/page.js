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
import ActivityCard from '@/components/activities/ActivityCard'; // Component to display each activity's data in card format
import { Modal, Button, Label, Textarea, Toast } from 'flowbite-react';
import { createApplication } from '@/utils/crudApplications';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/utils/auth/AuthContext';

// Main component to display activities
export default function ActivitiesPage() {
  // Destructure `user`, `claims`, and `loading` state from `useAuth` to manage access control
  const { user, claims, loading } = useAuth();

  // State variable to store the list of fetched activities
  const [activities, setActivities] = useState([]);
  const [openApplyModal, setOpenApplyModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [applyMessage, setApplyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ type: '', message: '' });

  const router = useRouter();

  // Handle status change from activity card
  const handleStatusChange = (activityId, newStatus) => {
    setActivities(prevActivities => 
      prevActivities.map(activity => 
        activity.id === activityId 
          ? { ...activity, status: newStatus }
          : activity
      )
    );
  };

  // Check if user has permission to manage activities
  const canManageActivities = claims && (claims.role === 'admin' || claims.role === 'npo-staff' || claims.role === 'ambassador');

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

  // Handle card click to open apply modal
  const handleOpenApply = (activity) => {
    setSelectedActivity(activity);
    setOpenApplyModal(true);
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    if (!selectedActivity || !user) return;
    setIsSubmitting(true);
    try {
      const result = await createApplication({
        activityId: selectedActivity.id,
        userId: user.uid,
        userEmail: user.email,
        message: applyMessage,
      });
      if (result.success) {
        setToastMessage({ type: 'success', message: 'Your application has been successfully submitted!' });
        setApplyMessage('');
        setOpenApplyModal(false);
      } else if (result.error === 'existing_application') {
        setToastMessage({ type: 'warning', message: 'You have already applied for this activity. Check your profile for the application status.' });
      }
    } catch (error) {
      setToastMessage({ type: 'error', message: 'An error occurred while submitting your application. Please try again.' });
    } finally {
      setShowToast(true);
      setIsSubmitting(false);
    }
  };


  // If there is no authenticated user, return null (no content rendered)
  if (!user) return null;
  return (
    <div className='flex flex-col items-center bg-gray-100 p-6'>
      {/* Flex layout for displaying activity cards with proper spacing */}
      <div className='flex flex-wrap justify-center gap-6 max-w-7xl'>
        {activities.map((activity, index) => (
          <ActivityCard
            key={index} // Unique key for each card
            id = {activity.id}
            organization_name={activity.organization_name} // Non-profit organization name
            organization_logo={activity.organization_logo} // Logo URL of the non-profit
            title={activity.title} // Title of the activity
            type={activity.type} // Type of the activity
            country={activity.country} // Country of the activity
            start_date={activity.start_date} // Start date of the activity
            end_date={activity.end_date} // End date of the activity
            sdg={activity.sdg} // Sustainable Development Goal of the activity
            applicants={activity.applicants} // Number of applicants
            xp_reward={activity.xp_reward} // Points awarded for participation
            description={activity.description} // Description of the activity
            city={activity.city} // City of the activity
            category={activity.category} // Category of the activity
            status={activity.status} // Status of the activity
            onStatusChange={handleStatusChange}
            onClick={() => handleOpenApply(activity)}
          />
        ))}
      </div>
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-5 right-5 z-[60]">
          <Toast duration={5000} onClose={() => setShowToast(false)}>
            {toastMessage.type === 'success' && <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-500">✓</div>}
            {toastMessage.type === 'warning' && <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-500">!</div>}
            {toastMessage.type === 'error' && <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-500">!</div>}
            <div className="ml-3 text-sm font-normal">{toastMessage.message}</div>
            <Toast.Toggle onClose={() => setShowToast(false)} />
          </Toast>
        </div>
      )}

      {/* Apply Modal */}
      <Modal show={openApplyModal} onClose={() => setOpenApplyModal(false)} className="z-50">
        <Modal.Header>Apply for {selectedActivity?.title}</Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            <div>
              <div className="mb-2 block">
                <Label htmlFor="description" value="Description" />
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">{selectedActivity?.description || 'No description provided.'}</p>
              </div>
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="message" value="Why do you want to help?" />
              </div>
              <Textarea
                id="message"
                placeholder="Tell us why you want to help"
                required
                rows={4}
                value={applyMessage}
                onChange={(e) => setApplyMessage(e.target.value)}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleSubmitApplication} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'I want to help'}
          </Button>
          <Button color="gray" onClick={() => setOpenApplyModal(false)} disabled={isSubmitting}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
      {canManageActivities && (
        <button onClick={goToManage} className="fixed bottom-4 right-4 bg-orange-500 text-white text-2xl w-12 h-12 rounded-full shadow-lg hover:bg-orange-600">
          +
        </button>
      )}
    </div>

  );
}
