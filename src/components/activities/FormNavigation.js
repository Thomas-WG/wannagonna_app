import { Button } from 'flowbite-react';
import { HiOutlineArrowLeft, HiOutlineArrowRight } from "react-icons/hi";
import { useTranslations } from 'use-intl';

export default function FormNavigation({ currentStep, prevStep, nextStep, formData, isEditMode, handleSubmit }) {
  const t = useTranslations('ManageActivities');

  // Check if external link is required but missing
  const externalLink = formData.externalPlatformLink || formData.activity_url || '';
  const isExternalLinkRequired = formData.type === 'local' && formData.acceptApplicationsWG === false;
  const hasRequiredExternalLink = !isExternalLinkRequired || (isExternalLinkRequired && externalLink.trim() !== '');

  // Step 2 date/time: required for events and local once/regular; validate end >= start when set
  const isEvent = formData.type === 'event';
  const isLocalOnceOrRegular = formData.type === 'local' && formData.frequency !== 'role';
  const hasEventDateTime = formData.start_date && formData.start_time && formData.end_time;
  const hasLocalStartDate = formData.start_date;
  const endNotBeforeStart = (() => {
    if (!formData.start_date) return true;
    const end = formData.end_date || formData.start_date;
    const startD = formData.start_date instanceof Date ? formData.start_date : new Date(formData.start_date);
    const endD = end instanceof Date ? end : new Date(end);
    if (endD.getTime() < startD.getTime()) return false;
    const sameDay = startD.toDateString() === endD.toDateString();
    if (sameDay && formData.start_time && formData.end_time) {
      return formData.start_time <= formData.end_time;
    }
    return true;
  })();

  const step2Base = formData.title && formData.description && formData.frequency && hasRequiredExternalLink;
  const step2DateTime =
    (isEvent && hasEventDateTime && endNotBeforeStart) ||
    (isLocalOnceOrRegular && hasLocalStartDate && endNotBeforeStart) ||
    ((formData.type === 'online' || (formData.type === 'local' && formData.frequency === 'role')) && endNotBeforeStart);

  const canProceed =
    (currentStep === 1 && formData.category) ||
    (currentStep === 2 && step2Base && step2DateTime) ||
    (currentStep === 3 && formData.sdg);



  return (
    <div className='w-full space-y-3'>

      
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
              type='button' 
              pill 
              className={`min-w-[140px] h-11 sm:h-12 text-sm sm:text-base font-medium touch-manipulation ${
                !canProceed ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={!canProceed}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (canProceed) {
                  handleSubmit(e);
                }
              }}
            >
              {isEditMode ? t('update') : t('create')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 