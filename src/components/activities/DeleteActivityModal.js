import { useState, useEffect } from 'react';
import { Modal, Button } from 'flowbite-react';
import { HiTrash, HiRefresh } from 'react-icons/hi';
import { HiExclamationTriangle } from 'react-icons/hi2';

import { useTranslations } from 'next-intl';
import { deleteActivity, fetchActivitiesByCriteria } from '@/utils/crudActivities';
import { getActivitiesInSeries, isRecurringActivity } from '@/utils/recurrenceUtils';

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
  const [deleteOption, setDeleteOption] = useState('single'); // 'single' or 'series'
  const [seriesActivities, setSeriesActivities] = useState([]);
  const [loadingSeries, setLoadingSeries] = useState(false);

  // Fetch series activities when modal opens for recurring activities
  useEffect(() => {
    if (isOpen && isRecurringActivity(activity)) {
      fetchSeriesActivities();
    }
  }, [isOpen, activity]);

  const fetchSeriesActivities = async () => {
    if (!activity?.organizationId) return;
    
    setLoadingSeries(true);
    try {
      // Fetch all activities for the organization
      const allActivities = await fetchActivitiesByCriteria(activity.organizationId, 'any', 'any');
      
      // Filter activities with the same seriesId (excluding the current activity)
      const series = getActivitiesInSeries(allActivities, activity.seriesId)
        .filter(act => act.id !== activity.id);
      
      setSeriesActivities(series);
    } catch (error) {
      console.error('Error fetching series activities:', error);
    } finally {
      setLoadingSeries(false);
    }
  };

  const handleDelete = async () => {
    if (!activity) return;

    setIsDeleting(true);
    try {
      if (deleteOption === 'series' && activity.isRecurring) {
        // Delete the entire series
        const allActivitiesToDelete = [activity, ...seriesActivities];
        
        for (const act of allActivitiesToDelete) {
          await deleteActivity(act.id);
        }
        
        onActivityDeleted?.(allActivitiesToDelete.length);
      } else {
        // Delete single activity
        await deleteActivity(activity.id);
        onActivityDeleted?.(1);
      }
      
      onClose();
    } catch (error) {
      console.error('Error deleting activity:', error);
      alert('Error deleting activity. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getDeleteButtonText = () => {
    if (isDeleting) {
      return deleteOption === 'series' ? t('deleting-series') : t('deleting');
    }
    
    if (deleteOption === 'series') {
      return `${t('delete-series-button')} (${seriesActivities.length + 1} activities)`;
    }
    
    return t('delete-button');
  };

  const getDeleteButtonColor = () => {
    return deleteOption === 'series' ? 'failure' : 'failure';
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
            color={getDeleteButtonColor()}
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2"
          >
            <HiTrash className="h-4 w-4" />
            {getDeleteButtonText()}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
