'use client';
import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/utils/theme/ThemeContext';
import { useModal } from '@/utils/modal/useModal';
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
  const { isDark } = useTheme();
  const wrappedOnClose = useModal(isOpen, onClose, 'status-update-modal');
  
  const handleStatusChange = (newStatus) => {
    if (onStatusUpdate) {
      onStatusUpdate(newStatus);
    } else {
      console.error('StatusUpdateModal: onStatusUpdate callback is not provided');
    }
  };

  const handleClose = () => {
    wrappedOnClose();
  };

  // Determine which buttons to show based on current status
  const getStatusButtons = () => {
    const status = currentStatus || 'Draft';
    
    // Handle both 'Draft' and 'created' status (activities are created with 'created' status)
    if (status === 'Draft' || status === 'created') {
      // Draft: Show Publish button
      return (
        <div className="grid grid-cols-1 gap-4">
          <Button
            color="blue"
            onClick={() => handleStatusChange('Open')}
            disabled={isUpdating}
            className="h-auto py-6 px-4 bg-semantic-info-700 hover:bg-semantic-info-800 dark:bg-semantic-info-500 dark:hover:bg-semantic-info-600 text-white"
          >
            <div className="flex flex-col items-center justify-center w-full">
              <HiGlobeAlt className="h-6 w-6 mb-3 text-white" />
              <span className="font-medium text-base mb-2 text-white">{t('publish', { default: 'Publish' })}</span>
              <span className="text-sm text-white text-center">{t('publishDescription', { default: 'Make activity available to volunteers' })}</span>
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
            className="h-auto py-6 px-4 bg-semantic-success-600 hover:bg-semantic-success-700 dark:bg-semantic-success-500 dark:hover:bg-semantic-success-600 text-white"
          >
            <div className="flex flex-col items-center justify-center w-full">
              <HiCheckCircle className="h-6 w-6 mb-3 text-white" />
              <span className="font-medium text-base mb-2 text-white">{t('close', { default: 'Close' })}</span>
              <span className="text-sm text-white/90 text-center">{t('closeDescription', { default: 'Complete and close activity' })}</span>
            </div>
          </Button>
          <Button
            color="gray"
            onClick={() => handleStatusChange('Draft')}
            disabled={isUpdating}
            className="h-auto py-6 px-4 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200"
          >
            <div className="flex flex-col items-center justify-center w-full">
              <HiDocument className="h-6 w-6 mb-3 text-neutral-700 dark:text-neutral-200" />
              <span className="font-medium text-base mb-2 text-neutral-700 dark:text-neutral-200">{t('revertToDraft', { default: 'Revert to Draft' })}</span>
              <span className="text-sm text-neutral-600 dark:text-neutral-300 text-center">{t('revertDescription', { default: 'Save for editing later' })}</span>
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
            className="h-auto py-6 px-4 bg-semantic-success-600 hover:bg-semantic-success-700 dark:bg-semantic-success-500 dark:hover:bg-semantic-success-600 text-white"
          >
            <div className="flex flex-col items-center justify-center w-full">
              <FaRegCircle className="h-6 w-6 mb-3 text-white" />
              <span className="font-medium text-base mb-2 text-white">{t('reopen', { default: 'Reopen' })}</span>
              <span className="text-sm text-white/90 text-center">{t('reopenDescription', { default: 'Make activity available again' })}</span>
            </div>
          </Button>
        </div>
      );
    }
    
    return null;
  };

  return (
    <Modal show={isOpen} onClose={wrappedOnClose} size="md" className="z-50">
      <Modal.Header className="bg-gradient-to-r from-primary-400 to-primary-600 dark:from-primary-600 dark:to-primary-700 text-white border-b border-border-light dark:border-border-dark">
        <div className="flex items-center space-x-2">
          <span className="text-lg font-semibold text-white">
            {t('title')}
          </span>
        </div>
      </Modal.Header>
      
      <Modal.Body className="py-6 bg-background-card dark:bg-background-card">
        <div className="space-y-6">
          <p className="text-base text-text-secondary dark:text-text-secondary text-center">
            {t('selectAction', { default: 'Select an action for this activity:' })}
          </p>
          
          {getStatusButtons()}
        </div>
      </Modal.Body>
      
      <Modal.Footer className="bg-background-card dark:bg-background-card border-t-2 border-border-light dark:border-[#475569]">
        <div className="flex justify-end w-full">
          <Button
            color="gray"
            onClick={handleClose}
            disabled={isUpdating}
            className="bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600"
          >
            {t('cancel')}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
