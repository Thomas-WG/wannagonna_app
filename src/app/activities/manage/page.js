'use client';
// Page Component: CreateUpdateActivityPage
// Description: This Next.js page component is used for creating or updating an activity. It has a form divided into three steps, allowing users to select the activity type, input activity details, and select relevant SDGs (Sustainable Development Goals). The page can handle both creation and editing of activities, depending on the presence of an activity ID. The data is managed via the useState hook and includes support for categories based on activity type, form validation, and step-by-step navigation.

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import {
  createActivity,
  updateActivity,
  fetchActivityById,
} from '@/utils/fetchActivities';
import ProgressStepper from '@/components/ProgressStepper';
import Image from 'next/image';
import {
  Label,
  Textarea,
  Radio,
  FloatingLabel,
  Datepicker,
  Button
} from 'flowbite-react';
import { HiOutlineArrowLeft, HiOutlineArrowRight } from "react-icons/hi";
import LoadingSpinner from '@/components/LoadingSpinner'; // Component to show the loading spinner
import { useAuth } from '@/hooks/useAuth'; // Hook for accessing user authentication status
import { useTranslations } from 'use-intl';


export default function CreateUpdateActivityPage() {
  // Retrieve query parameters from URL
  const searchParams = useSearchParams();
  const router = useRouter(); //for changing page
  const activityId = searchParams.get('activityId'); // Retrieve activity ID if present (edit mode)
  const isEditMode = Boolean(activityId); // Determine if the page is in edit mode
  const { user, loading } = useAuth(); // Get authenticated user information and loading status
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
    languages: ['English', 'Japanese'],
    organization_logo: '/logo/Favicon.png', // Default NPO logo path
    organization_name: 'Wanna Gonna',
    applicants: 0, //initialized to 0 applicants
    creation_date: new Date(),  // Current date and time as default
    start_date: new Date(),     // Default start date
    end_date: new Date(),        // Default end date
    status: 'created'
  });

  const [currentStep, setCurrentStep] = useState(1); // Track the current step

  // Categories for different types of activities
  const categories = {
  online: [
    { id: 'website', name: t('website') },
    { id: 'logo', name: t('logo') },
    { id: 'translation', name: t('translation') },
    { id: 'flyer', name: t('flyer') },
    { id: 'consulting', name: t('consulting') },
    { id: 'architecture', name: t('architecture') },
    { id: 'dataentry', name: t('dataentry') },
    { id: 'photovideo', name: t('photovideo') },
    { id: 'sns', name: t('sns') },
    { id: 'onlinesupport', name: t('onlinesupport') },
    { id: 'education', name: t('education') },
    { id: 'fundraising', name: t('fundraising') },
    { id: 'longtermrole', name: t('longtermrole') },
    { id: 'explainer', name: t('explainer') },
    { id: 'other', name: t('other') },
  ],
  local: [
    { id: 'cleaning', name: t('cleaning') },
    { id: 'teaching', name: t('teaching') },
    { id: 'food_distribution', name: t('food_distribution') },
    { id: 'elderly_support', name: t('elderly_support') },
    { id: 'animal_care', name: t('animal_care') },
    { id: 'environment', name: t('environment') },
    { id: 'community_events', name: t('community_events') },
    { id: 'childcare', name: t('childcare') },
    { id: 'manual_labor', name: t('manual_labor') },
    { id: 'administrative', name: t('administrative') },
    { id: 'other', name: t('other') }
  ],
  event: [
    { id: 'fundraising_event', name: t('fundraising_event') },
    { id: 'awareness_campaign', name: t('awareness_campaign') },
    { id: 'workshop', name: t('workshop') },
    { id: 'seminar_conference', name: t('seminar') },
    { id: 'charity_walk', name: t('charity_walk') },
    { id: 'networking', name: t('networking') },
    { id: 'arts_and_crafts', name: t('arts_and_crafts') },
    { id: 'food_fair', name: t('food_fair') },
    { id: 'other', name: t('other') }
  ],
};

  // Handle type change and reset category
const handleTypeChange = (type) => {
  setFormData((prev) => ({ ...prev, type, category: '' }));
};

// Render categories based on selected type
const availableCategories = formData.type ? categories[formData.type] : [];

  // Fetch existing activity for editing
  useEffect(() => {
    if (isEditMode) {
      async function fetchData() {
        const data = await fetchActivityById(activityId);
        if (data) setFormData(data);
      }
      fetchData();
    }
  }, [activityId]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle skills multi-select (assuming it's an array)
  const handleSkillsChange = (selectedSkills) => {
    setFormData((prev) => ({ ...prev, skills: selectedSkills }));
  };

  // Handle date changes separately from other form inputs
const handleDateChange = (name, date) => {
  setFormData((prev) => ({ ...prev, [name]: date }));
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
    };
    
      // Update or create activity based on the mode
    if (isEditMode) {
      await updateActivity(activityId, dataToSave);
    } else {
      await createActivity(dataToSave);
    }

    router.push('/activities');// Redirect to activities page after submission
  };

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
            <div>
            <fieldset className='flex max-w-md flex-col gap-2'>
            <label className='block font-medium mb-1'>
                {t('type-label')}
              </label>
              <div className='grid grid-cols-3'>
                <div className='flex items-center gap-2'>
                  <Radio
                    id='online'
                    name='activityType'
                    value='online'
                    checked={formData.type === 'online'}
                    onChange={() => handleTypeChange('online')}
                  />
                  <Label htmlFor='online'>{t('type-online')}</Label>
                </div>
                <div className='flex items-center gap-2'>
                  <Radio
                    id='local'
                    name='activityType'
                    value='local'
                    checked={formData.type === 'local'}
                    onChange={() => handleTypeChange('local')}
                  />
                  <Label htmlFor='local'>{t('type-local')}</Label>
                </div>
                <div className='flex items-center gap-2'>
                  <Radio
                    id='event'
                    name='activityType'
                    value='event'
                    checked={formData.type === 'event'}
                    onChange={() => handleTypeChange('event')}
                  />
                  <Label htmlFor='event'>{t('type-event')}</Label>
                </div>
                </div>
              </fieldset>
            </div>
            <div>
              <label className='block font-medium mb-2'>
                {t('category-label')}
              </label>
              <ul className='grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-1'>
                {availableCategories.map(({ id, name }) => (
                  <li
                    key={id}
                    className={`flex flex-col items-center justify-center p-1 border rounded-lg cursor-pointer ${
                      formData.category === id
                        ? 'border-orange-400 bg-orange-400 text-white'
                        : 'border-white bg-white'
                    }`}
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, category: id }));
                      nextStep();
                    }}
                    
                  >
                    <Image
                      src={
                        formData.category === id
                          ? `/icons/activities/w_${id}.png`
                          : `/icons/activities/o_${id}.png`
                      }
                      alt={name}
                      style={{ width: '40%', height: 'auto' }}
                      width={40} 
                      height={40} 
                      priority={true} 
                    />
                    <span className='mt-2 text-sm text-center font-medium'>
                      {name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Step 2 */}
        {currentStep === 2 && (
          <>
            <div className='flex max-w-md flex-col gap-4'>
            <label className='block font-medium mb-1'>
            {`${t('info-label')} ${formData.category ? `(${availableCategories.find(category => category.id === formData.category)?.name || ''})` : ''}`}
              </label>
              <div>
                <FloatingLabel
                  variant='filled'
                  label={t('activity-title-label')}
                  helperText={t('activity-title-helper')}
                  name='title'
                  value={formData.title}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Textarea
                  id='activityDescription'
                  placeholder={t('activity-description-label')}
                  required
                  rows={4}
                  name='description'
                  value={formData.description}
                  onChange={handleChange}
                  helperText={t('activity-description-helper')}
                />
              </div>
              <fieldset className='flex max-w-md flex-col gap-4'>
                <Label htmlFor='frequency'>{t('frequency-label')}</Label>
                <div className='flex items-center gap-2'>
                  <Radio
                    id='once'
                    name='frequency'
                    value='once'
                    checked={formData.frequency === 'once'}
                    onChange={handleChange}
                  />
                  <Label htmlFor='once'>{t('frequency-once')}</Label>
                </div>
                <div className='flex items-center gap-2'>
                  <Radio
                    id='regular'
                    name='frequency'
                    value='regular'
                    checked={formData.frequency === 'regular'}
                    onChange={handleChange}
                  />
                  <Label htmlFor='regular'>{t('frequency-regular')}</Label>
                </div>
              </fieldset>
              <div>
              <Label htmlFor='start_date'>{t('start_date')}</Label>
                <Datepicker 
              weekStart={1}
              value={formData.start_date}
              name='start_date'
              onChange={(date) => handleDateChange('start_date', date)}
            />
              </div>
              <div>
              <Label htmlFor='end_date'>{t('end_date')}</Label>
                <Datepicker 
              weekStart={1}
              name='end_date'
              value={formData.end_date}
              onChange={(date) => handleDateChange('end_date', date)}
            />
              </div>
            
            </div>
            
          </>
        )}

        {/* Step 3 */}
        {currentStep === 3 && (
          <>
            <div>
              <label className='block font-medium mb-2'>{t('sdg-label')}</label>
              <p>{t('sdg-helper')}</p>
              <ul className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1'>
                {[
                  { id: '1', name: 1 },
                  { id: '2', name: 2 },
                  { id: '3', name: 3 },
                  { id: '4', name: 4 },
                  { id: '5', name: 5 },
                  { id: '6', name: 6 },
                  { id: '7', name: 7 },
                  { id: '8', name: 8 },
                  { id: '9', name: 9 },
                  { id: '10', name: 10 },
                  { id: '11', name: 11 },
                  { id: '12', name: 12 },
                  { id: '13', name: 13 },
                  { id: '14', name: 14 },
                  { id: '15', name: 15 },
                  { id: '16', name: 16 },
                  { id: '17', name: 17 },
                ].map(({ id, name }) => (
                  <li
                    key={id}
                    className={`flex flex-col items-center justify-center p-1 cursor-pointer`}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, sdg: name }))
                    }
                  >
                    <Image
                      src={
                        formData.sdg === name
                          ? `/icons/sdgs/c-${id}.png`
                          : `/icons/sdgs/w-${id}.png`
                      }
                      alt={name}
                      style={{ width: '80%', height: 'auto', maxWidth: '90px', maxHeight: '90px' }}
                      width={80} 
                      height={80} 
                      priority={true} // Optional for improved performance
                    />
                  </li>
                ))}
              </ul>
            </div>
           
          </>
        )}

        {/* Navigation Buttons */}
        <div className='flex justify-between mt-4'>
          {currentStep > 1 && (
            <Button outline type='button' onClick={prevStep} pill>
            <HiOutlineArrowLeft className="h-6 w-6" />
          </Button>
          )}
          {currentStep < 3 && (
            <Button type='button' onClick={nextStep} pill className='ml-auto' disabled={
              (currentStep === 1 && !formData.category) || // Step 1: Category must be selected
              (currentStep === 2 && (!formData.title || !formData.description || !formData.frequency)) // Step 2: Title, Description, Frequency required
            }>
              <HiOutlineArrowRight className="h-6 w-6" />
            </Button>

          )}
          {currentStep === 3 && (
            <Button type='submit' pill className='ml-auto' disabled={!formData.sdg}>
            {isEditMode ? t('update') : t('create')}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
