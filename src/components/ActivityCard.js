import { Modal, Button, Label, Textarea, Toast } from 'flowbite-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { createApplication } from '@/utils/crudApplications';
import { HiCheck, HiExclamation } from 'react-icons/hi';

export default function ActivityCard({
  id,
  organization_name,
  organization_logo,
  title,
  location,
  applicants,
  xp_reward,
  description,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ type: '', message: '' });
  const { user } = useAuth();
  const t = useTranslations('ActivityCard');

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

  // Prevent event bubble up when clicking the modal
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <>
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="cursor-pointer block max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-50 transition-all duration-300"
      >
        <div className='flex items-center'>
          <Image
            src={organization_logo}
            alt={`${organization_name} Logo`}
            width={50}
            height={50}
            className='rounded-full'
          />
          <div className='ml-3'>
            <h5 className='text-lg font-semibold text-gray-900 dark:text-white'>
              {title}
            </h5>
            <p className='text-sm text-gray-500'>{organization_name}</p>
            <p className='text-sm text-gray-500'>{location}</p>
          </div>
        </div>
        <div className='flex items-center justify-between mt-3'>
          <span className='text-gray-600 dark:text-gray-400'>
            {applicants} applied
          </span>
          <span className='px-2 py-1 text-sm font-medium text-white bg-orange-500 rounded-full'>
            {xp_reward} {t('points')}
          </span>
        </div>
        {isExpanded && (
          <div className='mt-4'>
            <div className='font-semibold'>Description:</div>
            <p className='text-sm text-gray-900'>
              {description || 'No description available'}
            </p>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setOpenModal(true);
              }}
              className='mt-4'
            >
              Apply Now
            </Button>
          </div>
        )}
      </div>
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
      <Modal 
        show={openModal} 
        onClose={() => setOpenModal(false)} 
        onClick={handleModalClick}
        className="z-50"
      >
        <Modal.Header>Apply for {title}</Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            <div>
              <div className="mb-2 block">
                <Label htmlFor="message" value="Why do you want to help?" />
              </div>
              <Textarea
                id="message"
                placeholder="Tell us why you're interested in this opportunity..."
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
            {isSubmitting ? 'Submitting...' : 'I want to help'}
          </Button>
          <Button 
            color="gray" 
            onClick={() => setOpenModal(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      
    </>
  );
}
