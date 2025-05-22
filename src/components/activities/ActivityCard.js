import { Modal, Button, Label, Textarea, Toast, Badge } from 'flowbite-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/utils/auth/AuthContext';
import { createApplication } from '@/utils/crudApplications';
import { HiCheck, HiExclamation, HiLocationMarker, HiUserGroup, HiStar } from 'react-icons/hi';

// Main component for displaying an activity card
export default function ActivityCard({
  id,
  organization_name,
  organization_logo,
  title,
  location,
  country,
  category,
  skills,
  applicants,
  xp_reward,
  description,
}) {
  // State variables for managing component behavior
  const [isExpanded, setIsExpanded] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ type: '', message: '' });
  const { user } = useAuth();
  const t = useTranslations('ActivityCard');

  // Effect to handle toast visibility timeout
  useEffect(() => {
    let timeoutId;
    if (showToast) {
      timeoutId = setTimeout(() => {
        setShowToast(false);
      }, 5000);
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [showToast]);

  // Function to handle application submission
  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const result = await createApplication({
        activityId: id,
        userId: user.uid,
        userEmail: user.email,
        message,
      });

      if (result.success) {
        setToastMessage({
          type: 'success',
          message: 'Your application has been successfully submitted!'
        });
        setMessage('');
        setOpenModal(false);
      } else if (result.error === 'existing_application') {
        setToastMessage({
          type: 'warning',
          message: 'You have already applied for this activity. Check your profile for the application status.'
        });
      }
    } catch (error) {
      setToastMessage({
        type: 'error',
        message: 'An error occurred while submitting your application. Please try again.'
      });
    } finally {
      setShowToast(true);
      setIsSubmitting(false);
    }
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <>
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="cursor-pointer w-full max-w-2xl p-4 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-50 transition-all duration-300"
      >
        {/* Header Section */}
        <div className='flex items-start space-x-4'>
          <div className='flex-shrink-0'>
            <Image
              src={organization_logo}
              alt={`${organization_name} Logo`}
              width={50}
              height={50}
              className='rounded-full'
            />
          </div>
          <div className='flex-1 min-w-0'>
            <h5 className='text-lg font-semibold text-gray-900 dark:text-white truncate'>
              {title}
            </h5>
            <p className='text-sm text-gray-500 truncate'>{organization_name}</p>
            <div className='flex items-center mt-1 text-sm text-gray-500'>
              <HiLocationMarker className='mr-1' />
              <span className='truncate'>{location}, {country}</span>
            </div>
          </div>
          <div className='flex items-center space-x-4'>
            <div className='flex items-center text-sm text-gray-600'>
              <HiUserGroup className='mr-1' />
              <span>{applicants} {t('applied')}</span>
            </div>
            <div className='flex items-center text-sm text-gray-600'>
              <HiStar className='mr-1' />
              <span>{xp_reward} {t('points')}</span>
            </div>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setOpenModal(true);
              }}
              size="sm"
            >
              {t('apply')}
            </Button>
          </div>
        </div>

        {/* Category and Skills Section */}
        <div className='mt-3 flex items-center space-x-4'>
          <div className='flex items-center space-x-2'>
            <Badge color="info" size="sm">
              {category}
            </Badge>
          </div>
          <div className='flex flex-wrap gap-1 flex-1'>
            {skills?.map((skill, index) => (
              <Badge key={index} color="gray" size="sm">
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {/* Description Section */}
        {isExpanded && (
          <div className='mt-3 pt-3 border-t border-gray-200'>
            <div className='font-semibold text-sm text-gray-700 mb-1'>{t('description')}:</div>
            <p className='text-sm text-gray-600 line-clamp-3'>
              {description || t('noDescription')}
            </p>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-5 right-5 z-[60]">
          <Toast
            duration={5000}
            onClose={() => setShowToast(false)}
          >
            {toastMessage.type === 'success' && (
              <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-500">
                <HiCheck className="h-5 w-5" />
              </div>
            )}
            {toastMessage.type === 'warning' && (
              <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-500">
                <HiExclamation className="h-5 w-5" />
              </div>
            )}
            {toastMessage.type === 'error' && (
              <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-500">
                <HiExclamation className="h-5 w-5" />
              </div>
            )}
            <div className="ml-3 text-sm font-normal">
              {toastMessage.message}
            </div>
            <Toast.Toggle onClose={() => setShowToast(false)} />
          </Toast>
        </div>
      )}

      {/* Application Modal */}
      <Modal 
        show={openModal}
        onClose={() => setOpenModal(false)} 
        onClick={handleModalClick} 
        className="z-50"
      >
        <Modal.Header>{t('applyFor')} {title}</Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            <div>
              <div className="mb-2 block">
                <Label htmlFor="message" value={t('whyHelp')} />
              </div>
              <Textarea
                id="message"
                placeholder={t('interestPlaceholder')}
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            onClick={handleSubmitApplication} 
            disabled={isSubmitting}
          >
            {isSubmitting ? t('submitting') : t('wantToHelp')}
          </Button>
          <Button 
            color="gray" 
            onClick={() => setOpenModal(false)}
            disabled={isSubmitting} 
          >
            {t('cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
