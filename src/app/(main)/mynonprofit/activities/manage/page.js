'use client';
// Page Component: CreateUpdateActivityPage
// Description: This Next.js page component is used for creating or updating an activity. It has a form divided into three steps, allowing users to select the activity type, input activity details, and select relevant SDGs (Sustainable Development Goals). The page can handle both creation and editing of activities, depending on the presence of an activity ID. The data is managed via the useState hook and includes support for categories based on activity type, form validation, and step-by-step navigation.

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import categories from '@/constant/categories';
import {
  createActivity,
  updateActivity,
  fetchActivityById,
  updateActivityStatus,
} from '@/utils/crudActivities';
import {fetchOrganizationById} from '@/utils/crudOrganizations';
import ProgressStepper from '@/components/layout/ProgressStepper';
import { useAuth } from '@/utils/auth/AuthContext'; // Hook for accessing user authentication status
import { useTranslations } from 'use-intl';

// Import the new components
import CategorySelector from '@/components/activities/CategorySelector';
import ActivityDetailsForm from '@/components/activities/ActivityDetailsForm';
import SDGSelector from '@/components/activities/SDGSelector';
import FormNavigation from '@/components/activities/FormNavigation';
import StatusUpdateModal from '@/components/activities/StatusUpdateModal';
import { createRecurringActivities, validateRecurrenceConfig } from '@/utils/recurrenceUtils';

export default function CreateUpdateActivityPage() {
  // Retrieve query parameters from URL
  const searchParams = useSearchParams();
  const router = useRouter(); //for changing page
  const activityId = searchParams.get('activityId'); // Retrieve activity ID if present (edit mode)
  const prefillType = searchParams.get('type'); // Prefill type when coming from NPO radial menu
  const isEditMode = Boolean(activityId); // Determine if the page is in edit mode
  const { user, claims, loading } = useAuth(); // Get authenticated user information and loading status
  const t = useTranslations('ManageActivities'); // Internationalization function for translations

  // State to manage form data
  const [formData, setFormData] = useState({
    type: 'online', // Default activity type is 'online'
    title: '', 
    category: '', 
    description: '',
    skills: [], //skills (to be implemented)
    frequency: '',// once or regular activity
    country: '', // Default country
    city: '', // Default city
    xp_reward: 20, // Default XP points
    sdg: '', // Sustainable Development Goal
    languages: ['English'],
    organization_logo: '/logo/Favicon.png', // Default NPO logo path
    organization_name: 'Wanna Gonna',
    applicants: 0, //initialized to 0 applicants
    creation_date: new Date(),  // Current date and time as default
    start_date: new Date(),     // Default start date
    end_date: new Date(),        // Default end date
    status: 'created'
  });

  const [currentStep, setCurrentStep] = useState(1); // Track the current step
  const [organizationData, setOrganizationData] = useState(null); // Store organization data
  const [showStatusModal, setShowStatusModal] = useState(false); // Status update modal
  const [savedActivityId, setSavedActivityId] = useState(null); // Store the saved activity ID
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false); // Status update loading

  // Render categories based on selected type
  const availableCategories = formData.type ? categories[formData.type] : [];

  // Fetch organization data if user has npoId in claims
  useEffect(() => {
    const fetchOrgData = async () => {
      if (claims && claims.npoId) {
        try {
          const orgData = await fetchOrganizationById(claims.npoId);
          if (orgData) {
            setOrganizationData(orgData);
            // Update form data with organization information (preserve date fields)
            setFormData(prev => ({
              ...prev,
              organizationId: claims.npoId,
              organization_name: orgData.name || prev.organization_name,
              organization_logo: orgData.logo || prev.organization_logo,
              country: orgData.country || prev.country,
              city: orgData.city || prev.city,
              languages: orgData.languages || prev.languages,
              sdg: orgData.sdg || prev.sdg,
              // Explicitly preserve date fields to prevent them from being overwritten
              start_date: prev.start_date,
              end_date: prev.end_date,
              creation_date: prev.creation_date
            }));
          }
        } catch (error) {
          console.error("Error fetching organization data:", error);
        }
      }
    };

    fetchOrgData();
  }, [claims]);

  // Fetch existing activity for editing
  useEffect(() => {
    if (activityId) {
      async function fetchData() {
        try {
        const data = await fetchActivityById(activityId);
          console.log('Raw activity data from Firestore:', data);
          
          if (data) {
            // Convert Firestore timestamps to Date objects
            const processedData = {
          ...data,
              start_date: data.start_date ? (() => {
                console.log('Processing start_date:', data.start_date, 'Type:', typeof data.start_date);
                try {
                  // Handle Firestore Timestamp objects
                  if (data.start_date && typeof data.start_date === 'object' && 'seconds' in data.start_date) {
                    return new Date(data.start_date.seconds * 1000);
                  }
                  // Handle regular Date objects or strings
                  return new Date(data.start_date);
                } catch (error) {
                  console.error('Error converting start_date:', error);
                  return new Date();
                }
              })() : new Date(),
              end_date: data.end_date ? (() => {
                console.log('Processing end_date:', data.end_date, 'Type:', typeof data.end_date);
                try {
                  // Handle Firestore Timestamp objects
                  if (data.end_date && typeof data.end_date === 'object' && 'seconds' in data.end_date) {
                    return new Date(data.end_date.seconds * 1000);
                  }
                  // Handle regular Date objects or strings
                  return new Date(data.end_date);
                } catch (error) {
                  console.error('Error converting end_date:', error);
                  return new Date();
                }
              })() : new Date(),
              creation_date: data.creation_date ? (() => {
                console.log('Processing creation_date:', data.creation_date, 'Type:', typeof data.creation_date);
                try {
                  // Handle Firestore Timestamp objects
                  if (data.creation_date && typeof data.creation_date === 'object' && 'seconds' in data.creation_date) {
                    return new Date(data.creation_date.seconds * 1000);
                  }
                  // Handle regular Date objects or strings
                  return new Date(data.creation_date);
                } catch (error) {
                  console.error('Error converting creation_date:', error);
                  return new Date();
                }
              })() : new Date(),
            };
            console.log('Processed form data:', processedData);
            setFormData(processedData);
          }
        } catch (error) {
          console.error('Error in fetchData:', error);
        }
      }
      fetchData();
    }
  }, [activityId, isEditMode]);

  // Prefill activity type when not editing and type is provided in query
  useEffect(() => {
    if (!isEditMode && prefillType) {
      const allowed = ['online', 'local', 'event'];
      if (allowed.includes(prefillType)) {
        setFormData((prev) => ({ ...prev, type: prefillType }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillType, isEditMode]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Navigation between steps
  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Ensure dates are valid Date objects before comparing
    const creationDate = formData.creation_date instanceof Date ? formData.creation_date : new Date(formData.creation_date);
    const endDate = formData.end_date instanceof Date ? formData.end_date : new Date(formData.end_date);
    
    if (creationDate.getTime() === endDate.getTime()) {
      formData.end_date = null;
    }

    const baseDataToSave = {
      ...formData,
      // Add automatic attributes here if needed (e.g., organizationId, creatorId)
      organizationId: claims?.npoId || formData.organizationId, // Ensure organizationId is set
      creatorId: user?.uid // Add the creator's ID
    };
    
    try {
        // Handle single activity
    if (isEditMode) {
          await updateActivity(activityId, baseDataToSave);
          setSavedActivityId(activityId);
    } else {
          const activityId = await createActivity(baseDataToSave);
          setSavedActivityId(activityId);
        }

    // Show status update modal instead of navigating back
    setShowStatusModal(true);
    } catch (error) {
      console.error('Error saving activity:', error);
      alert('Error saving activity. Please try again.');
    }
  };

  // Handle status update
  const handleStatusUpdate = async (newStatus) => {
    console.log('handleStatusUpdate called with:', newStatus, 'savedActivityId:', savedActivityId);
    if (!savedActivityId) {
      console.error('No savedActivityId available');
      return;
    }
    
    try {
      setIsUpdatingStatus(true);
      console.log('Updating activity status...');
      await updateActivityStatus(savedActivityId, newStatus);
      console.log('Activity status updated successfully');
      setShowStatusModal(false);
      // Navigate back after successful status update
      router.back();
    } catch (error) {
      console.error('Error updating activity status:', error);
      alert('Error updating activity status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // If there is no authenticated user, return null (no content rendered)
  if (!user) return null;

  return (
    <div className='p-4 max-w-full mx-auto'>
      <h1 className='text-2xl font-bold mb-4 text-center'>
        {isEditMode ? t('update-activity') : t('create-activity')}
      </h1>
      {loading && <p>Loading...</p>}
      <div className='max-w-full'>
        <ProgressStepper currentStep={currentStep} />
      </div>
      <form onSubmit={handleSubmit} className='space-y-4 mt-4'>
        {/* Step 1 */}
        {currentStep === 1 && (
          <>
            <CategorySelector 
              availableCategories={availableCategories}
              formData={formData}
              setFormData={setFormData}
              nextStep={nextStep}
            />
          </>
        )}

        {/* Step 2 */}
        {currentStep === 2 && (
          <ActivityDetailsForm 
            formData={formData}
            handleChange={handleChange}
            setFormData={setFormData}
            availableCategories={availableCategories}
          />
        )}

        {/* Step 3 */}
        {currentStep === 3 && (
          <SDGSelector 
            formData={formData}
            setFormData={setFormData}
            organizationData={organizationData}
          />
        )}

        {/* Navigation Buttons */}
        <FormNavigation 
          currentStep={currentStep}
          prevStep={prevStep}
          nextStep={nextStep}
          formData={formData}
          isEditMode={isEditMode}
          handleSubmit={handleSubmit}
        />
      </form>
      
      {/* Status Update Modal */}
      <StatusUpdateModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        currentStatus={formData.status}
        onStatusUpdate={handleStatusUpdate}
        isUpdating={isUpdatingStatus}
      />
    </div>
  );
}
