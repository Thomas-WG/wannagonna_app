'use client';
import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import {
  HiDocument, HiCheckCircle, HiGlobeAlt
} from 'react-icons/hi';
import { FaRegCircle } from 'react-icons/fa';

export default function StatusUpdateModal({
  isOpen,
  onClose,
  currentStatus,
  onStatusUpdate,
  isUpdating = false
}) {
  const t = useTranslations('StatusUpdateModal');
  
  const handleStatusChange = (newStatus) => {
    if (onStatusUpdate) {
      onStatusUpdate(newStatus);
    } else {
      console.error('StatusUpdateModal: onStatusUpdate callback is not provided');
    }
  };

  const handleClose = () => {
    onClose();
  };

  // Determine which buttons to show based on current status
  const getStatusButtons = () => {
    const status = currentStatus || 'Draft';
    
    if (status === 'Draft') {
      // Draft: Show Publish button
      return (
        <div className="grid grid-cols-1 gap-4">
          <Button
            color="blue"
            onClick={() => handleStatusChange('Open')}
            disabled={isUpdating}
            className="h-auto py-6 px-4 hover:bg-blue-600 dark:hover:bg-blue-700"
          >
            <div className="flex flex-col items-center justify-center w-full">
              <HiGlobeAlt className="h-6 w-6 mb-3" />
              <span className="font-medium text-base mb-2">{t('publish', { default: 'Publish' })}</span>
              <span className="text-sm text-gray-600 dark:text-gray-300 text-center">{t('publishDescription', { default: 'Make activity available to volunteers' })}</span>
            </div>
          </Button>
        </div>
      );
    } else if (status === 'Open') {
      // Open: Show Close and Revert to Draft buttons
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            color="purple"
            onClick={() => handleStatusChange('Closed')}
            disabled={isUpdating}
            className="h-auto py-6 px-4 hover:bg-purple-600 dark:hover:bg-purple-700"
          >
            <div className="flex flex-col items-center justify-center w-full">
              <HiCheckCircle className="h-6 w-6 mb-3" />
              <span className="font-medium text-base mb-2">{t('close', { default: 'Close' })}</span>
              <span className="text-sm text-white text-center">{t('closeDescription', { default: 'Complete and close activity' })}</span>
            </div>
          </Button>
          <Button
            color="gray"
            onClick={() => handleStatusChange('Draft')}
            disabled={isUpdating}
            className="h-auto py-6 px-4 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <div className="flex flex-col items-center justify-center w-full">
              <HiDocument className="h-6 w-6 mb-3" />
              <span className="font-medium text-base mb-2">{t('revertToDraft', { default: 'Revert to Draft' })}</span>
              <span className="text-sm text-gray-600 dark:text-gray-300 text-center">{t('revertDescription', { default: 'Save for editing later' })}</span>
            </div>
          </Button>
        </div>
      );
    } else if (status === 'Closed') {
      // Closed: Show Reopen button
      return (
        <div className="grid grid-cols-1 gap-4">
          <Button
            color="green"
            onClick={() => handleStatusChange('Open')}
            disabled={isUpdating}
            className="h-auto py-6 px-4 hover:bg-green-600 dark:hover:bg-green-700"
          >
            <div className="flex flex-col items-center justify-center w-full">
              <FaRegCircle className="h-6 w-6 mb-3" />
              <span className="font-medium text-base mb-2">{t('reopen', { default: 'Reopen' })}</span>
              <span className="text-sm text-gray-600 dark:text-gray-300 text-center">{t('reopenDescription', { default: 'Make activity available again' })}</span>
            </div>
          </Button>
        </div>
      );
    }
    
    return null;
  };

  return (
    <Modal show={isOpen} onClose={handleClose} size="md" className="dark:bg-gray-800">
      <Modal.Header className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('title')}
          </span>
        </div>
      </Modal.Header>
      
      <Modal.Body className="py-6">
        <div className="space-y-6">
          <p className="text-base text-gray-700 dark:text-gray-300 text-center">
            {t('selectAction', { default: 'Select an action for this activity:' })}
          </p>
          
          {getStatusButtons()}
        </div>
      </Modal.Body>
      
      <Modal.Footer className="border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-end w-full">
          <Button
            color="gray"
            onClick={handleClose}
            disabled={isUpdating}
          >
            {t('cancel')}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
