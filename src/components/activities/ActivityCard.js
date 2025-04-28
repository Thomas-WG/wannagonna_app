import { Modal, Button, Label, Textarea, Toast } from 'flowbite-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/utils/auth/AuthContext';
import { createApplication } from '@/utils/crudApplications';
import { HiCheck, HiExclamation } from 'react-icons/hi';

// Main component for displaying an activity card
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
  // State variables for managing component behavior
  const [isExpanded, setIsExpanded] = useState(false); // Track if the card is expanded
  const [openModal, setOpenModal] = useState(false); // Track if the modal is open
  const [message, setMessage] = useState(''); // Message input for application
  const [isSubmitting, setIsSubmitting] = useState(false); // Track submission state
  const [showToast, setShowToast] = useState(false); // Track toast visibility
  const [toastMessage, setToastMessage] = useState({ type: '', message: '' }); // Toast message details
  const { user } = useAuth(); // Get user information from authentication hook
  const t = useTranslations('ActivityCard'); // Translation function for internationalization

  // Effect to handle toast visibility timeout
  useEffect(() => {
    let timeoutId;
    if (showToast) {
      timeoutId = setTimeout(() => {
        setShowToast(false);
      }, 5000); // Hide toast after 5 seconds
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId); // Clear timeout on component unmount
      }
    };
  }, [showToast]);

  // Function to handle application submission
  const handleSubmitApplication = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setIsSubmitting(true); // Set submitting state to true
    
    try {
      const result = await createApplication({
        activityId: id,
        userId: user.uid,
        userEmail: user.email,
        message,
      });

      // Handle successful application submission
      if (result.success) {
        setToastMessage({
          type: 'success',
          message: 'Your application has been successfully submitted!'
        });
        setMessage(''); // Clear message input
        setOpenModal(false); // Close modal
      } else if (result.error === 'existing_application') {
        // Handle case where user has already applied
        setToastMessage({
          type: 'warning',
          message: 'You have already applied for this activity. Check your profile for the application status.'
        });
      }
    } catch (error) {
      // Handle errors during submission
      setToastMessage({
        type: 'error',
        message: 'An error occurred while submitting your application. Please try again.'
      });
    } finally {
      setShowToast(true); // Show toast message
      setIsSubmitting(false); // Reset submitting state
    }
  };

  // Prevent event bubble up when clicking the modal
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <>
      <div
        onClick={() => setIsExpanded(!isExpanded)} // Toggle expanded state on click
        className="cursor-pointer block max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-50 transition-all duration-300"
      >
        <div className='flex items-center'>
          <Image
            src={organization_logo}
            alt={`${organization_name} Logo`} // Alt text for organization logo
            width={50}
            height={50}
            className='rounded-full'
          />
          <div className='ml-3'>
            <h5 className='text-lg font-semibold text-gray-900 dark:text-white'>
              {title} {/* Activity title */}
            </h5>
            <p className='text-sm text-gray-500'>{organization_name}</p> {/* Organization name */}
            <p className='text-sm text-gray-500'>{location}</p> {/* Activity location */}
          </div>
        </div>
        <div className='flex items-center justify-between mt-3'>
          <span className='text-gray-600 dark:text-gray-400'>
            {applicants} applied {/* Number of applicants */}
          </span>
          <span className='px-2 py-1 text-sm font-medium text-white bg-orange-500 rounded-full'>
            {xp_reward} {t('points')} {/* XP reward points */}
          </span>
        </div>
        {isExpanded && (
          <div className='mt-4'>
            <div className='font-semibold'>Description:</div>
            <p className='text-sm text-gray-900'>
              {description || 'No description available'} {/* Activity description */}
            </p>
            <Button
              onClick={(e) => {
                e.stopPropagation(); // Prevent event bubbling
                setOpenModal(true); // Open application modal
              }}
              className='mt-4'
            >
              Apply Now {/* Button to apply for the activity */}
            </Button>
          </div>
        )}
      </div>
      {showToast && (
        <div className="fixed bottom-5 right-5 z-[60]">
          <Toast
            duration={5000} // Duration for toast visibility
            onClose={() => setShowToast(false)} // Close toast on action
          >
            {toastMessage.type === 'success' && (
              <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-500">
                <HiCheck className="h-5 w-5" /> {/* Success icon */}
              </div>
            )}
            {toastMessage.type === 'warning' && (
              <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-500">
                <HiExclamation className="h-5 w-5" /> {/* Warning icon */}
              </div>
            )}
            {toastMessage.type === 'error' && (
              <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-500">
                <HiExclamation className="h-5 w-5" /> {/* Error icon */}
              </div>
            )}
            <div className="ml-3 text-sm font-normal">
              {toastMessage.message} {/* Toast message content */}
            </div>
            <Toast.Toggle onClose={() => setShowToast(false)} /> {/* Button to close toast */}
          </Toast>
        </div>
      )}
      <Modal 
        show={openModal}
        onClose={() => setOpenModal(false)} 
        onClick={handleModalClick} 
        className="z-50"
      >
        <Modal.Header>Apply for {title}</Modal.Header> {/* Modal header */}
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
            {isSubmitting ? 'Submitting...' : 'I want to help'} {/* Button text based on state */}
          </Button>
          <Button 
            color="gray" 
            onClick={() => setOpenModal(false)}
            disabled={isSubmitting} 
          >
            Cancel {/* Cancel button */}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
