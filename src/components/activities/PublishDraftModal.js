'use client';
import React from 'react';
import { Modal, Button } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/utils/theme/ThemeContext';
import { HiDocument, HiGlobeAlt } from 'react-icons/hi';

export default function PublishDraftModal({
  isOpen,
  onClose,
  onPublish,
  onDraft,
  isUpdating = false
}) {
  const t = useTranslations('PublishDraftModal');
  const { isDark } = useTheme();
  
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
    <Modal show={isOpen} onClose={onClose} size="md" className="z-50">
      <Modal.Header className="bg-gradient-to-r from-primary-400 to-primary-600 dark:from-primary-600 dark:to-primary-700 text-white border-b border-border-light dark:border-border-dark">
        <div className="flex items-center space-x-2">
          <span className="text-lg font-semibold text-white">
            {t('title', { default: 'Publish Activity' })}
          </span>
        </div>
      </Modal.Header>
      
      <Modal.Body className="py-6 bg-background-card dark:bg-background-card">
        <div className="space-y-6">
          <p className="text-base text-text-secondary dark:text-text-secondary text-center">
            {t('question', { default: 'Do you want to publish it now or keep it in draft?' })}
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Draft Button */}
            <Button
              color="gray"
              onClick={handleDraft}
              disabled={isUpdating}
              className="h-auto py-6 px-4 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200"
            >
              <div className="flex flex-col items-center justify-center w-full">
                <HiDocument className="h-6 w-6 mb-3 text-neutral-700 dark:text-neutral-200" />
                <span className="font-medium text-base mb-2 text-neutral-700 dark:text-neutral-200">{t('draft', { default: 'Keep as Draft' })}</span>
                <span className="text-sm text-neutral-600 dark:text-neutral-300 text-center">{t('draftDescription', { default: 'Save for later editing' })}</span>
              </div>
            </Button>
            
            {/* Publish Button */}
            <Button
              color="blue"
              onClick={handlePublish}
              disabled={isUpdating}
              className="h-auto py-6 px-4 bg-semantic-info-700 hover:bg-semantic-info-800 dark:bg-semantic-info-500 dark:hover:bg-semantic-info-600 text-white"
            >
              <div className="flex flex-col items-center justify-center w-full">
                <HiGlobeAlt className="h-6 w-6 mb-3 text-white" />
                <span className="font-medium text-base mb-2 text-white">{t('publish', { default: 'Publish Now' })}</span>
                <span className="text-sm text-white text-center">{t('publishDescription', { default: 'Make it available to volunteers' })}</span>
              </div>
            </Button>
          </div>
        </div>
      </Modal.Body>
      
      <Modal.Footer className="bg-background-card dark:bg-background-card border-t-2 border-border-light dark:border-[#475569]">
        <div className="flex justify-end w-full">
          <Button
            color="gray"
            onClick={onClose}
            disabled={isUpdating}
            className="bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600"
          >
            {t('cancel', { default: 'Cancel' })}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}

