'use client';
// Page Component: CreateUpdateActivityPage
// Description: This Next.js page component is used for creating or updating an activity. It has a form divided into three steps, allowing users to select the activity type, input activity details, and select relevant SDGs (Sustainable Development Goals). The page can handle both creation and editing of activities, depending on the presence of an activity ID. The data is managed via the useState hook and includes support for categories based on activity type, form validation, and step-by-step navigation.

import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import categories from '@/constant/categories';
import {
  createActivity,
  updateActivity,
  fetchActivityById,
  updateActivityStatus,
  deleteActivity,
} from '@/utils/crudActivities';
import { setActivityImpactParameters } from '@/utils/activityImpactService';
import { calculateActivityXP } from '@/utils/calculateActivityXP';
import {fetchOrganizationById} from '@/utils/crudOrganizations';
import ProgressStepper from '@/components/layout/ProgressStepper';
import { useAuth } from '@/utils/auth/AuthContext'; // Hook for accessing user authentication status
import { useTranslations } from 'use-intl';
import BackButton from '@/components/layout/BackButton';
import { countries } from 'countries-list';
import { convertTimestampToDate } from '@/utils/dateUtils';

// Import the new components
import CategorySelector from '@/components/activities/CategorySelector';
import ActivityDetailsForm from '@/components/activities/ActivityDetailsForm';
import SDGSelector from '@/components/activities/SDGSelector';
import ActivityImpactParametersStep from '@/components/activities/ActivityImpactParametersStep';
import FormNavigation from '@/components/activities/FormNavigation';
import PublishDraftModal from '@/components/activities/PublishDraftModal';

/**
 * Normalize country value to country code
 * Converts country names to codes (e.g., "Japan" -> "JP")
 * If already a code, returns it uppercase
 * @param {string} countryValue - Country code or name
 * @returns {string} Normalized country code
 */
function normalizeCountryToCode(countryValue) {
  if (!countryValue || typeof countryValue !== 'string') {
    return countryValue || '';
  }

  const trimmedValue = countryValue.trim();
  if (!trimmedValue) {
    return '';
  }

  // Check if it's already a valid country code (2 uppercase letters)
  const upperValue = trimmedValue.toUpperCase();
  if (upperValue.length === 2 && /^[A-Z]{2}$/.test(upperValue)) {
    // Check if it exists in countries list
    if (countries[upperValue]) {
      return upperValue;
    }
  }

  // Try to find by country name (case-insensitive)
  const foundEntry = Object.entries(countries).find(
    ([code, country]) => country.name.toLowerCase() === trimmedValue.toLowerCase()
  );

  if (foundEntry) {
    return foundEntry[0]; // Return the country code
  }

  // If not found, return the original value (might be a valid code we don't recognize)
  return upperValue.length === 2 ? upperValue : trimmedValue;
}

export default function CreateUpdateActivityPage() {
  // Retrieve query parameters from URL
  const searchParams = useSearchParams();
  const router = useRouter(); //for changing page
  const activityId = searchParams.get('activityId'); // Retrieve activity ID if present (edit mode)
  const prefillType = searchParams.get('type'); // Prefill type when coming from NPO radial menu
  const isEditMode = Boolean(activityId); // Determine if the page is in edit mode
  const { user, claims, loading } = useAuth(); // Get authenticated user information and loading status
  const queryClient = useQueryClient();
  const t = useTranslations('ManageActivities'); // Internationalization function for translations

  /** Keeps NPO dashboard activity list and KPIs in sync after create/update/publish (cache is refetched because refetchOnMount is off). */
  const refreshNpoActivityListAndRelated = useCallback(async () => {
    const orgId = claims?.npo_id;
    if (!orgId) return;
    await queryClient.refetchQueries({ queryKey: ['npoDashboardActivities', orgId] });
    await queryClient.invalidateQueries({ queryKey: ['npoOrganization', orgId] });
    await queryClient.invalidateQueries({ queryKey: ['npoPendingApplications', orgId] });
  }, [claims?.npo_id, queryClient]);

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
    location: '', // Specific location/venue for local and event activities
    address_id: null, // Reference to saved address
    coordinates: null, // { latitude, longitude } for map display
    xp_reward: 20, // Default XP points (will be auto-calculated)
    time_commitment: 50, // Time commitment slider value (0-100, default: 50 for standard)
    complexity: 50, // Complexity slider value (0-100, default: 50 for moderate)
    sdg: '', // Sustainable Development Goal
    languages: ['English'],
    organization_logo: '/logo/Favicon.png', // Default NPO logo path
    organization_name: 'Wanna Gonna',
    applicants: 0, //initialized to 0 applicants
    created_at: new Date(),  // Current date and time as default
    start_date: new Date(),     // Default start date
    end_date: null,              // Set when "several days"; null = single-day (no persisted end_date)
    start_time: null,            // "HH:mm" or null – optional for online/local, required for events
    end_time: null,              // "HH:mm" or null
    showDateTimeOnCalendar: false, // For online / local role: true when user opts in to show on calendar
    spansSeveralDays: false,       // When true, show end date (multi-day); when false, single day, no end_date
    status: 'Draft',
    external_platform_link: '',
    participant_target: null,
    accept_applications_wg: true,
    auto_accept_applications: false,
  });

  const [currentStep, setCurrentStep] = useState(1); // Track the current step
  const [organizationData, setOrganizationData] = useState(null); // Store organization data
  const [showStatusModal, setShowStatusModal] = useState(false); // Status update modal
  const [savedActivityId, setSavedActivityId] = useState(null); // Store the saved activity ID
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false); // Status update loading
  const [selectedImpactParameters, setSelectedImpactParameters] = useState([]);

  // Render categories based on selected type
  const availableCategories = formData.type ? categories[formData.type] : [];

  // Fetch organization data if user has npoId in claims
  useEffect(() => {
    const fetchOrgData = async () => {
      if (claims && claims.npo_id) {
        try {
          const orgData = await fetchOrganizationById(claims.npo_id);
          if (orgData) {
            setOrganizationData(orgData);
            // Update form data with organization information (preserve date fields)
            setFormData(prev => ({
              ...prev,
              organization_id: claims.npo_id,
              organization_name: orgData.name || prev.organization_name,
              organization_logo: orgData.logo || prev.organization_logo,
              country: orgData.country ? normalizeCountryToCode(orgData.country) : prev.country,
              city: orgData.city || prev.city,
              languages: orgData.languages || prev.languages,
              sdg: orgData.sdg || prev.sdg,
              // Explicitly preserve date/time fields to prevent them from being overwritten
              start_date: prev.start_date,
              end_date: prev.end_date,
              start_time: prev.start_time,
              end_time: prev.end_time,
              showDateTimeOnCalendar: prev.showDateTimeOnCalendar,
              spansSeveralDays: prev.spansSeveralDays,
              created_at: prev.created_at
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
            // Convert Firestore timestamps to Date objects; same structure as create (same day first, optional multi-day)
            const startDate = convertTimestampToDate(data.start_date) || new Date();
            const endDateRaw = data.end_date ? convertTimestampToDate(data.end_date) : null;
            const isMultiDay = endDateRaw != null && startDate.toDateString() !== endDateRaw.toDateString();
            const processedData = {
              ...data,
              start_date: startDate,
              // Single-day: no end date in form; multi-day: keep end date so form shows same info as saved
              end_date: isMultiDay ? endDateRaw : null,
              created_at: convertTimestampToDate(data.created_at) || new Date(),
              external_platform_link: data.external_platform_link || '',
              participant_target: data.participant_target ?? null,
              accept_applications_wg:
                data.accept_applications_wg !== undefined
                  ? data.accept_applications_wg
                  : data.type === 'local'
                    ? true
                    : undefined,
              auto_accept_applications: data.auto_accept_applications || false,
              location: data.location || '',
              address_id: data.address_id ?? null,
              coordinates: data.coordinates || null,
              // Ensure frequency is 'once' for events
              frequency: data.type === 'event' ? 'once' : (data.frequency || ''),
              // Default sliders when editing an activity missing these fields
              time_commitment: data.time_commitment !== undefined ? data.time_commitment : 50,
              complexity: data.complexity !== undefined ? data.complexity : 50,
              // Date/time – store as "HH:mm" or null (same as create)
              start_time: data.start_time ?? null,
              end_time: data.end_time ?? null,
              showDateTimeOnCalendar: !!(data.start_date != null),
              spansSeveralDays: isMultiDay,
            };
            console.log('Processed form data:', processedData);
            setFormData(processedData);
            setSelectedImpactParameters(Array.isArray(data.impact_parameters) ? data.impact_parameters : []);
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
        setFormData((prev) => ({ 
          ...prev, 
          type: prefillType,
          // Auto-set frequency to 'once' for events
          frequency: prefillType === 'event' ? 'once' : prev.frequency
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillType, isEditMode]);

  // Auto-set frequency to 'once' for events
  useEffect(() => {
    if (formData.type === 'event' && formData.frequency !== 'once') {
      setFormData((prev) => ({ ...prev, frequency: 'once' }));
    }
  }, [formData.type, formData.frequency]);

  // Auto-calculate XP when relevant fields change
  useEffect(() => {
    // For events, always set XP to 15
    if (formData.type === 'event') {
      setFormData((prev) => ({ ...prev, xp_reward: 15 }));
      return;
    }

    // For online and local activities, calculate XP
    if (formData.type === 'online' || formData.type === 'local') {
      // Only calculate if we have a category selected
      if (formData.category) {
        const calculatedXP = calculateActivityXP({
          type: formData.type,
          category: formData.category,
          time_commitment: formData.time_commitment ?? 50,
          complexity: formData.complexity ?? 50,
          frequency: formData.frequency || 'once',
        });
        setFormData((prev) => ({ ...prev, xp_reward: calculatedXP }));
      }
    }
  }, [formData.type, formData.category, formData.time_commitment, formData.complexity, formData.frequency]);

  // Reset sliders to defaults when activity type changes
  useEffect(() => {
    if (formData.type === 'event') {
      // Events don't use sliders, but we can reset them anyway
      setFormData((prev) => ({ 
        ...prev, 
        time_commitment: 50, 
        complexity: 50 
      }));
    } else if (formData.type === 'online' || formData.type === 'local') {
      // Only reset if they're not already set (to preserve values when editing)
      if (formData.time_commitment === undefined) {
        setFormData((prev) => ({ ...prev, time_commitment: 50 }));
      }
      if (formData.complexity === undefined) {
        setFormData((prev) => ({ ...prev, complexity: 50 }));
      }
    }
  }, [formData.type]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Impact parameters only for Local (volunteering); Events are gamification, not impact-tracked
  const hasImpactStep = formData.type === 'local';
  const maxStep = hasImpactStep ? 4 : 3;

  // Navigation between steps
  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, maxStep));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Same as create/edit: single day = no end_date; multi-day = use end_date when "Spans several days" is checked
    const finalEndDate = formData.spansSeveralDays ? formData.end_date : null;

    // For online and local long-term role: if user did not opt in to show on calendar, clear date/time
    const isOnlineOrLocalRole = formData.type === 'online' || (formData.type === 'local' && formData.frequency === 'role');
    const clearDateTime = isOnlineOrLocalRole && !formData.showDateTimeOnCalendar;

    // Normalize skills to store only values (IDs) for consistency
    // This prevents storing full react-select objects which can't be rendered directly
    const normalizedSkills = formData.skills && Array.isArray(formData.skills)
      ? formData.skills.map(skill => {
          // Extract value from react-select object format, or use string as-is
          if (typeof skill === 'object' && skill !== null) {
            return skill.value || skill.id || skill.label || skill;
          }
          return skill;
        }).filter(Boolean) // Remove any null/undefined values
      : [];

    const baseDataToSave = {
      ...formData,
      end_date: finalEndDate,
      ...(clearDateTime && {
        start_date: null,
        end_date: null,
        start_time: null,
        end_time: null,
      }),
      organization_id: claims?.npo_id || formData.organization_id,
      creator_id: user?.uid,
      frequency: formData.type === 'event' ? 'once' : formData.frequency,
      external_platform_link: formData.external_platform_link || '',
      // Normalize skills to store only values
      skills: normalizedSkills,
      // Normalize country to ensure it's always a country code (e.g., "JP" not "Japan")
      country: formData.country ? normalizeCountryToCode(formData.country) : formData.country
    };
    delete baseDataToSave.showDateTimeOnCalendar; // UI-only, do not persist
    delete baseDataToSave.spansSeveralDays; // UI-only, do not persist

    try {
        // Handle single activity
    if (isEditMode) {
          await updateActivity(activityId, baseDataToSave);
          if (hasImpactStep) {
            await setActivityImpactParameters(activityId, selectedImpactParameters ?? []);
          }
          await refreshNpoActivityListAndRelated();
          router.back();
    } else {
          const newActivityId = await createActivity(baseDataToSave);
          if (hasImpactStep) {
            await setActivityImpactParameters(newActivityId, selectedImpactParameters ?? []);
          }
          await refreshNpoActivityListAndRelated();
          setSavedActivityId(newActivityId);
          setShowStatusModal(true);
        }
    } catch (error) {
      console.error('Error saving activity:', error);
      alert('Error saving activity. Please try again.');
    }
  };

  // Handle publish action - sets status to 'Open'
  const handlePublish = async () => {
    console.log('handlePublish called, savedActivityId:', savedActivityId);
    if (!savedActivityId) {
      console.error('No savedActivityId available');
      return;
    }
    
    try {
      setIsUpdatingStatus(true);
      console.log('Updating activity status to: Open');
      await updateActivityStatus(savedActivityId, 'Open');
      console.log('Activity status updated successfully');
      setShowStatusModal(false);
      await refreshNpoActivityListAndRelated();
      // Redirect to NPO dashboard after successful status update
      router.push('/mynonprofit');
    } catch (error) {
      console.error('Error updating activity status:', error);
      alert('Error updating activity status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle draft action - sets status to 'Draft'
  const handleDraft = async () => {
    console.log('handleDraft called, savedActivityId:', savedActivityId);
    if (!savedActivityId) {
      console.error('No savedActivityId available');
      return;
    }
    
    try {
      setIsUpdatingStatus(true);
      console.log('Updating activity status to: Draft');
      await updateActivityStatus(savedActivityId, 'Draft');
      console.log('Activity status updated successfully');
      setShowStatusModal(false);
      await refreshNpoActivityListAndRelated();
      // Navigate back after successful status update
      router.back();
    } catch (error) {
      console.error('Error updating activity status:', error);
      alert('Error updating activity status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle cancel action - delete the activity if it was just created
  const handleCancel = async () => {
    if (savedActivityId && !isEditMode) {
      // Only delete if this was a new activity (not an update)
      try {
        await deleteActivity(savedActivityId);
        console.log('Activity deleted after cancel');
        await refreshNpoActivityListAndRelated();
      } catch (error) {
        console.error('Error deleting activity:', error);
        // Still close the modal even if deletion fails
      }
    }
    setShowStatusModal(false);
    // Reset saved activity ID
    setSavedActivityId(null);
  };

  // If there is no authenticated user, return null (no content rendered)
  if (!user) return null;

  return (
    <div className='min-h-dvh bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'>
        {/* Header Section */}
        <div className='mb-6 sm:mb-8'>
          <h1 className='page-title text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white text-center mb-2'>
            {isEditMode ? t('update-activity') : t('create-activity')}
          </h1>
          <p className='text-sm sm:text-base text-gray-600 dark:text-gray-400 text-center'>
            {currentStep === 1 && 'Select the category that best describes your activity'}
            {currentStep === 2 && 'Provide details about your activity'}
            {currentStep === 3 && 'Choose a Sustainable Development Goal'}
            {currentStep === 4 && 'Select impact parameters to track for this activity'}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className='flex justify-center items-center py-12'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500'></div>
          </div>
        )}

        {/* Back Button */}
        {!loading && (
          <BackButton fallbackPath="/mynonprofit" />
        )}

        {/* Progress Stepper */}
        {!loading && (
          <div className='mb-6 sm:mb-8'>
            <ProgressStepper
              currentStep={currentStep}
              steps={hasImpactStep ? [
                { number: 1, label: 'Category' },
                { number: 2, label: 'Details' },
                { number: 3, label: 'SDG' },
                { number: 4, label: 'Impact' }
              ] : undefined}
            />
          </div>
        )}

        {/* Form Content */}
        {!loading && (
          <form onSubmit={handleSubmit} className='space-y-4 sm:space-y-6 pb-safe-bottom pb-20 sm:pb-24'>
            {/* Step 1 */}
            {currentStep === 1 && (
              <div className='animate-fadeIn'>
                <CategorySelector 
                  availableCategories={availableCategories}
                  formData={formData}
                  setFormData={setFormData}
                  nextStep={nextStep}
                />
              </div>
            )}

            {/* Step 2 */}
            {currentStep === 2 && (
              <div className='animate-fadeIn'>
                <ActivityDetailsForm 
                  formData={formData}
                  handleChange={handleChange}
                  setFormData={setFormData}
                  availableCategories={availableCategories}
                />
              </div>
            )}

            {/* Step 3 */}
            {currentStep === 3 && (
              <div className='animate-fadeIn'>
                <SDGSelector 
                  formData={formData}
                  setFormData={setFormData}
                  organizationData={organizationData}
                />
              </div>
            )}

            {/* Step 4 - Impact parameters (local/event only) */}
            {hasImpactStep && currentStep === 4 && (
              <div className='animate-fadeIn'>
                <ActivityImpactParametersStep
                  orgId={claims?.npo_id}
                  initialSelected={selectedImpactParameters}
                  onChange={setSelectedImpactParameters}
                />
              </div>
            )}

            {/* Navigation Buttons */}
            <div className='sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 shadow-lg sm:shadow-xl'>
              <FormNavigation 
                currentStep={currentStep}
                prevStep={prevStep}
                nextStep={nextStep}
                formData={formData}
                isEditMode={isEditMode}
                handleSubmit={handleSubmit}
                maxStep={maxStep}
              />
            </div>
          </form>
        )}
      </div>
      
      {/* Publish/Draft Modal */}
      <PublishDraftModal
        isOpen={showStatusModal}
        onClose={handleCancel}
        onPublish={handlePublish}
        onDraft={handleDraft}
        isUpdating={isUpdatingStatus}
      />
    </div>
  );
}
