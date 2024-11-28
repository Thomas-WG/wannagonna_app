'use client';

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
import { Dropdown, Label, TextInput, Textarea, Radio, FloatingLabel } from 'flowbite-react';
import LoadingSpinner from '@/components/LoadingSpinner'; // Component to show the loading spinner
import { useAuth } from '@/hooks/useAuth'; // Hook for accessing user authentication status
import { useTranslations } from "use-intl";

export default function CreateUpdateActivityPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activityId = searchParams.get('activityId');
  const isEditMode = Boolean(activityId);
  const { user, loading } = useAuth();
  const t = useTranslations("ManageActivities");

  const [formData, setFormData] = useState({
    type: '',
    title: '',
    category: '',
    description: '',
    skills: [],
    frequency: '',
    country: '',
    sdg: '',
    languages: [],
    otherComments: '',
    npoLogo: '/logo/Favicon.png',
    applicants: 0
  });

  const [currentStep, setCurrentStep] = useState(1); // Track the current step

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

  // Navigation between steps
  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const dataToSave = {
      ...formData,
      // Add automatic attributes here if needed (e.g., organizationId, creatorId)
    };

    if (isEditMode) {
      await updateActivity(activityId, dataToSave);
    } else {
      await createActivity(dataToSave);
    }

    router.push('/activities');
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
      <h1 className='text-2xl font-bold mb-4 text-center' >
        {isEditMode ? t("update-activity") : t("create-activity")}
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
              <label className='block font-medium mb-1'>
              {t("type-label")}
              </label>
              <Dropdown
                label={formData.type ? t(`type-${formData.type}`) : t("type-title")}
                dismissOnClick={true}
                style={{ backgroundColor: 'rgb(255 138 76)' }}
              >
                <Dropdown.Item
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, type: 'online' }))
                  }
                >
                  {t("type-online")}
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, type: 'local' }))
                  }
                >
                  {t("type-local")}
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, type: 'event' }))
                  }
                >
                  {t("type-event")}
                </Dropdown.Item>
              </Dropdown>
            </div>
            <div>
              <label className='block font-medium mb-2'>
              {t("category-label")}
              </label>
              <ul className='grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-4'>
                {[
                  { id: 'website', name: t("website") },
                  { id: 'logo', name: t("logo") },
                  { id: 'translation', name: t('translation') },
                  { id: 'flyer', name: t("flyer") },
                  { id: 'consulting', name: t("consulting") },
                  { id: 'architecture', name: t("architecture") },
                  { id: 'dataentry', name: t("dataentry") },
                  { id: 'photovideo', name: t("photovideo") },
                  { id: 'sns', name: t("sns") },
                  { id: 'onlinesupport', name: t("onlinesupport") },
                  { id: 'education', name: t("education") },
                  { id: 'fundraising', name: t("fundraising") },
                  { id: 'longtermrole', name: t("longtermrole") },
                  { id: 'explainer', name: t("explainer") },
                  { id: 'other', name: t("other") },
                ].map(({ id, name }) => (
                  <li
                    key={id}
                    className={`flex flex-col items-center justify-center p-1 border rounded-lg cursor-pointer ${
                      formData.category === id
                        ? 'border-orange-400 bg-orange-400 text-white'
                        : 'border-white bg-white'
                    }`}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, category: id }))
                    }
                  >
                    <Image
                      src={
                        formData.category === id
                          ? `/icons/activities/w_${id}.png`
                          : `/icons/activities/o_${id}.png`
                      }
                      alt={name}
                      width={40} // Same as w-6
                      height={40} // Same as h-6
                      priority={true} // Optional for improved performance
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
              <div>
              <FloatingLabel
      variant="filled"
      label={t("activity-title-label")}
      helperText={t("activity-title-helper")}
      name='title'
                  value={formData.title}
                  onChange={handleChange}
    />
              
              </div>
              <div>
                <Textarea
                  id='activityDescription'
                  placeholder={t("activity-description-label")}
                  required
                  rows={4}
                  name='description'
                  value={formData.description}
                  onChange={handleChange}
                  helperText={t("activity-description-helper")}
                />
              </div>
              <fieldset className='flex max-w-md flex-col gap-4'>
                <Label htmlFor='frequency'>{t("frequency-label")}</Label>
                <div className='flex items-center gap-2'>
                  <Radio
                    id='once'
                    name='frequency'
                    value='once'
                    checked={formData.frequency === 'once'}
                    onChange={handleChange}
                  />
                  <Label htmlFor='once' name='frequency' value='once' onClick={handleChange}>{t("frequency-once")}</Label>
                </div>
                <div className='flex items-center gap-2'>
                  <Radio
                    id='regular'
                    name='frequency'
                    value='regular'
                    checked={formData.frequency === 'regular'}
                    onChange={handleChange}
                  />
                  <Label htmlFor='regular' name='frequency' value='regular' onClick={handleChange}>{t("frequency-regular")}</Label>
                </div>
              </fieldset>
            </div>
            {/* Add other information fields as needed */}
          </>
        )}

        {/* Step 3 */}
        {currentStep === 3 && (
          <>
            <div>
            <label className='block font-medium mb-2'>
            {t("sdg-label")}
              </label>
              <p>{t("sdg-helper")}</p>
              <ul className='grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-4'>
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
                    className={`flex flex-col items-center justify-center p-1 cursor-pointer `}
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
                      width={80} // Same as w-6
                      height={80} // Same as h-6
                      priority={true} // Optional for improved performance
                    />
                  </li>
                ))}
              </ul>
            </div>
            {/* Add any additional attributes */}
          </>
        )}

        {/* Navigation Buttons */}
        <div className='flex justify-between mt-4'>
          {currentStep > 1 && (
            <button
              type='button'
              onClick={prevStep}
              className='px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300'
            >
              {t("previous")}
            </button>
          )}
          {currentStep < 3 && (
            <button
              type='button'
              onClick={nextStep}
              className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ml-auto'
            >
              {t("next")}
            </button>
          )}
          {currentStep === 3 && (
            <button
              type='submit'
              className='px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 ml-auto'
            >
              {isEditMode ? t("update") : t("create")}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

const skillsOptions = ['Skill 1', 'Skill 2', 'Skill 3']; // Define your skills options
