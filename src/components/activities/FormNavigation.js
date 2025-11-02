import { Button } from 'flowbite-react';
import { HiOutlineArrowLeft, HiOutlineArrowRight } from "react-icons/hi";
import { useTranslations } from 'use-intl';

export default function FormNavigation({ currentStep, prevStep, nextStep, formData, isEditMode, handleSubmit }) {
  const t = useTranslations('ManageActivities');

  const canProceed = 
    (currentStep === 1 && formData.category) ||
    (currentStep === 2 && formData.title && formData.description && formData.frequency) ||
    (currentStep === 3 && formData.sdg);

  const getValidationMessage = () => {
    if (currentStep === 1 && !formData.category) {
      return 'Please select a category';
    }
    if (currentStep === 2) {
      if (!formData.title) return 'Please enter a title';
      if (!formData.description) return 'Please enter a description';
      if (!formData.frequency) return 'Please select frequency';
    }
    if (currentStep === 3 && !formData.sdg) {
      return 'Please select an SDG';
    }
    return null;
  };

  const validationMessage = getValidationMessage();

  return (
    <div className='w-full space-y-3'>
      {/* Validation Message - Always reserve space */}
      <div className="min-h-[24px] flex items-center">
        {validationMessage && (
          <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium w-full text-center sm:text-left">
            {validationMessage}
          </p>
        )}
      </div>
      
      {/* Button Container - Stable layout */}
      <div className='flex justify-between items-center gap-3 w-full'>
        {/* Left side - Previous Button or Spacer */}
        <div className="min-w-[140px] flex items-center">
          {currentStep > 1 ? (
            <Button 
              outline 
              type='button' 
              onClick={prevStep} 
              pill
              className="min-w-[140px] h-11 sm:h-12 text-sm sm:text-base font-medium touch-manipulation"
            >
              <HiOutlineArrowLeft className="h-5 w-5 mr-2" />
              {t('previous')}
            </Button>
          ) : (
            <div className="min-w-[140px]"></div>
          )}
        </div>
        
        {/* Right side - Next/Submit Button */}
        <div className="flex items-center">
          {currentStep < 3 ? (
            <Button 
              type='button' 
              onClick={nextStep} 
              pill 
              className={`min-w-[140px] h-11 sm:h-12 text-sm sm:text-base font-medium touch-manipulation ${
                !canProceed ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={!canProceed}
            >
              {t('next')}
              <HiOutlineArrowRight className="h-5 w-5 ml-2" />
            </Button>
          ) : (
            <Button 
              type='submit' 
              pill 
              className={`min-w-[140px] h-11 sm:h-12 text-sm sm:text-base font-medium touch-manipulation ${
                !canProceed ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={!canProceed}
              onClick={handleSubmit}
            >
              {isEditMode ? t('update') : t('create')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 