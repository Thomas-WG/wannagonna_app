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

export default function CreateUpdateActivityPage() {
  // Retrieve query parameters from URL
  const searchParams = useSearchParams();
  const router = useRouter(); //for changing page
  const activityId = searchParams.get('activityId'); // Retrieve activity ID if present (edit mode)
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
    country: 'Japan', // Default country
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
            // Update form data with organization information
            setFormData(prev => ({
              ...prev,
              organizationId: claims.npoId,
              organization_name: orgData.name || prev.organization_name,
              organization_logo: orgData.logo || prev.organization_logo,
              country: orgData.country || prev.country,
              languages: orgData.languages || prev.languages,
              sdg: orgData.sdg || prev.sdg
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
        const data = await fetchActivityById(activityId);
        if (data) setFormData({
          ...data,
        });
      }
      fetchData();
    }
  }, [activityId, isEditMode]);

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
    if (formData.creation_date.getTime() === formData.end_date.getTime()){formData.end_date = null}

    const dataToSave = {
      ...formData,
      // Add automatic attributes here if needed (e.g., organizationId, creatorId)
      organizationId: claims?.npoId || formData.organizationId, // Ensure organizationId is set
      creatorId: user?.uid // Add the creator's ID
    };
    
    // Update or create activity based on the mode
    if (isEditMode) {
      await updateActivity(activityId, dataToSave);
    } else {
      await createActivity(dataToSave);
    }

    // Use router.back() to go back to the previous page
    router.back();
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
    </div>
  );
}
