import { useState, useEffect } from 'react';
import { Modal, Button } from 'flowbite-react';
import { HiTrash } from 'react-icons/hi';
import { HiExclamationTriangle } from 'react-icons/hi2';

import { useTranslations } from 'next-intl';
import { deleteActivity } from '@/utils/crudActivities';

// Helper function to convert Firestore timestamps to readable dates
const formatDateForDisplay = (dateValue) => {
  if (!dateValue) return '';
  
  try {
    // Handle Firestore Timestamp objects
    if (dateValue && typeof dateValue === 'object' && 'seconds' in dateValue) {
      return new Date(dateValue.seconds * 1000).toLocaleDateString();
    }
    // Handle regular Date objects or strings
    return new Date(dateValue).toLocaleDateString();
  } catch (error) {
    console.error('Error converting date for display:', error);
    return 'Invalid date';
  }
};

export default function DeleteActivityModal({ 
  isOpen, 
  onClose, 
  activity, 
  onActivityDeleted 
}) {
  const t = useTranslations('DeleteActivity');
  const [isDeleting, setIsDeleting] = useState(false);


 

  const handleDelete = async () => {
    if (!activity) return;

    setIsDeleting(true);
    try {
      // Delete single activity
      await deleteActivity(activity.id);
      onActivityDeleted?.(1);
      
      onClose();
    } catch (error) {
      console.error('Error deleting activity:', error);
      alert('Error deleting activity. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };


  if (!activity) return null;

  return (
    <Modal show={isOpen} onClose={onClose} size="md">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center gap-2">
          <HiExclamationTriangle className="h-5 w-5 text-red-500" />
          {t('delete-activity')}
        </div>
      </div>
      
      <div className="p-6">
        <div className="space-y-4">
          {/* Activity Info */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900">{activity.title}</h3>
          </div>
            <div className="flex items-center p-4 mb-4 text-sm text-yellow-800 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300" role="alert">
              <HiExclamationTriangle className="flex-shrink-0 inline w-4 h-4 mr-3" />
              <span>{t('confirm-delete')}</span>
            </div>
        </div>
      </div>
      
      <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-gray-600">
        <div className="flex justify-end gap-3">
          <Button 
            color="gray" 
            onClick={onClose}
            disabled={isDeleting}
          >
            {t('cancel')}
          </Button>
          <Button 
            color="failure"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2"
          >
            <HiTrash className="h-4 w-4" />
            {t('deleting')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
