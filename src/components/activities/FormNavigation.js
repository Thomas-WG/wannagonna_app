import { Button } from 'flowbite-react';
import { HiOutlineArrowLeft, HiOutlineArrowRight } from "react-icons/hi";
import { useTranslations } from 'use-intl';

export default function FormNavigation({ currentStep, prevStep, nextStep, formData, isEditMode, handleSubmit }) {
  const t = useTranslations('ManageActivities');

  return (
    <div className='flex justify-between mt-4'>
      {currentStep > 1 && (
        <Button outline type='button' onClick={prevStep} pill>
          <HiOutlineArrowLeft className="h-6 w-6" />
        </Button>
      )}
      {currentStep < 3 && (
        <Button 
          type='button' 
          onClick={nextStep} 
          pill 
          className='ml-auto' 
          disabled={
            (currentStep === 1 && !formData.category) || // Step 1: Category must be selected
            (currentStep === 2 && (!formData.title || !formData.description || !formData.frequency)) // Step 2: Title, Description, Frequency required
          }
        >
          <HiOutlineArrowRight className="h-6 w-6" />
        </Button>
      )}
      {currentStep === 3 && (
        <Button 
          type='submit' 
          pill 
          className='ml-auto' 
          disabled={!formData.sdg}
          onClick={handleSubmit}
        >
          {isEditMode ? t('update') : t('create')}
        </Button>
      )}
    </div>
  );
} 