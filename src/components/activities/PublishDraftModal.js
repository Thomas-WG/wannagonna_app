'use client';
import React from 'react';
import { Modal, Button } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import { HiDocument, HiGlobeAlt } from 'react-icons/hi';

export default function PublishDraftModal({
  isOpen,
  onClose,
  onPublish,
  onDraft,
  isUpdating = false
}) {
  const t = useTranslations('PublishDraftModal');
  
  const handlePublish = () => {
    if (onPublish) {
      onPublish();
    }
  };

  const handleDraft = () => {
    if (onDraft) {
      onDraft();
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose} size="md" className="dark:bg-gray-800">
      <Modal.Header className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('title', { default: 'Publish Activity' })}
          </span>
        </div>
      </Modal.Header>
      
      <Modal.Body className="py-6">
        <div className="space-y-6">
          <p className="text-base text-gray-700 dark:text-gray-300 text-center">
            {t('question', { default: 'Do you want to publish it now or keep it in draft?' })}
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Draft Button */}
            <Button
              color="gray"
              onClick={handleDraft}
              disabled={isUpdating}
              className="h-auto py-6 px-4 flex flex-col items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <HiDocument className="h-6 w-6 mb-3" />
              <span className="font-medium text-base mb-1">{t('draft', { default: 'Keep as Draft' })}</span>
            </Button>
            
            {/* Publish Button */}
            <Button
              color="blue"
              onClick={handlePublish}
              disabled={isUpdating}
              className="h-auto py-6 px-4 flex flex-col items-center justify-center hover:bg-blue-600 dark:hover:bg-blue-700"
            >
              <HiGlobeAlt className="h-6 w-6 mb-3" />
              <span className="font-medium text-base mb-1">{t('publish', { default: 'Publish Now' })}</span>
            </Button>
          </div>
        </div>
      </Modal.Body>
      
      <Modal.Footer className="border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-end w-full">
          <Button
            color="gray"
            onClick={onClose}
            disabled={isUpdating}
          >
            {t('cancel', { default: 'Cancel' })}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}

