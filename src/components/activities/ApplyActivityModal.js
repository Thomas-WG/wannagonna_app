'use client';

import { useState } from 'react';
import { Modal, Button, Label, Textarea, Spinner } from 'flowbite-react';
import { HiExternalLink } from 'react-icons/hi';
import { useTranslations } from 'next-intl';
import { useModal } from '@/utils/modal/useModal';

/**
 * ApplyActivityModal Component
 * 
 * Modal for submitting an application to an activity.
 * Displays activity summary, description preview, external link, and application message form.
 * 
 * @param {boolean} isOpen - Whether the modal is open
 * @param {Function} onClose - Callback when modal is closed
 * @param {Object} activity - The activity to apply for
 * @param {Function} onSubmit - Callback when application is submitted (receives message)
 * @param {boolean} isSubmitting - Whether the application is being submitted
 * @param {Function} onViewFullDetails - Callback to view full activity details
 */
export default function ApplyActivityModal({
  isOpen,
  onClose,
  activity,
  onSubmit,
  isSubmitting,
  onViewFullDetails,
}) {
  const t = useTranslations('Activities');
  const [applyMessage, setApplyMessage] = useState('');

  // Handle modal close with message reset
  const handleClose = () => {
    setApplyMessage('');
    onClose();
  };

  // Register modal with global modal manager
  const wrappedOnClose = useModal(isOpen, handleClose, 'apply-activity-modal');

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!applyMessage.trim() || applyMessage.length < 10) return;
    await onSubmit(applyMessage);
    // Don't reset message here - let parent handle it after successful submission
  };

  // Reset message when modal closes
  const handleModalClose = () => {
    setApplyMessage('');
    wrappedOnClose();
  };

  return (
    <Modal
      show={isOpen}
      onClose={handleModalClose}
      size="2xl"
      className="z-50"
    >
      <Modal.Header>
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-xl font-semibold">{t('applyForActivity')}</h3>
            {activity && (
              <p className="text-sm text-gray-500 mt-1">{activity.title}</p>
            )}
          </div>
        </div>
      </Modal.Header>
      <Modal.Body>
        {activity && (
          <div className="space-y-6">
            {/* Activity Summary */}
            <div className="bg-gradient-to-r from-semantic-info-50 to-semantic-info-100 dark:from-semantic-info-900 dark:to-semantic-info-800 rounded-lg p-4 border-2 border-semantic-info-200 dark:border-semantic-info-700">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-text-primary dark:text-text-primary mb-2">
                    {activity.title}
                  </h4>
                  <div className="flex flex-wrap gap-3 text-sm text-text-secondary dark:text-text-secondary">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{t('organization')}</span>
                      <span>{activity.organization_name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{t('xpReward')}</span>
                      <span className="text-primary-600 dark:text-primary-400 font-semibold">
                        {activity.xp_reward || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Preview */}
            <div>
              <Label htmlFor="description" value={t('activityDescription')} className="text-text-primary dark:text-text-primary" />
              <div className="mt-2 p-3 bg-background-hover dark:bg-background-hover rounded-lg border-2 border-border-light dark:border-[#475569] max-h-32 overflow-y-auto">
                <p className="text-sm text-text-secondary dark:text-text-secondary line-clamp-4">
                  {activity.description || t('noDescriptionProvided')}
                </p>
              </div>
              {onViewFullDetails && (
                <button
                  onClick={() => {
                    handleModalClose();
                    onViewFullDetails();
                  }}
                  className="mt-2 text-sm text-semantic-info-600 dark:text-semantic-info-400 hover:text-semantic-info-700 dark:hover:text-semantic-info-300 underline"
                >
                  {t('viewFullDetails')}
                </button>
              )}
            </div>

            {/* External Platform Link */}
            {(activity.externalPlatformLink || activity.activity_url) && (
              <div className="flex items-center gap-4 p-4 bg-background-hover dark:bg-background-hover rounded-xl border-2 border-border-light dark:border-[#475569] hover:shadow-md transition-all">
                <div className="bg-semantic-info-100 dark:bg-semantic-info-900 p-3 rounded-full">
                  <HiExternalLink className="h-6 w-6 text-semantic-info-600 dark:text-semantic-info-400 flex-shrink-0" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-text-tertiary dark:text-text-tertiary mb-1 uppercase tracking-wide">{t('externalPlatformLink')}</p>
                  <a
                    href={(activity.externalPlatformLink || activity.activity_url).startsWith('http') 
                      ? (activity.externalPlatformLink || activity.activity_url) 
                      : `https://${activity.externalPlatformLink || activity.activity_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-semantic-info-600 dark:text-semantic-info-400 hover:text-semantic-info-700 dark:hover:text-semantic-info-300 text-sm font-medium break-all hover:underline"
                  >
                    {activity.externalPlatformLink || activity.activity_url}
                  </a>
                </div>
              </div>
            )}

            {/* Application Message */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label htmlFor="message" value={t('whyHelp')} className="text-text-primary dark:text-text-primary" />
                <span className="text-xs text-text-tertiary dark:text-text-tertiary">
                  {applyMessage.length}/500 {t('characters')}
                </span>
              </div>
              <Textarea
                id="message"
                placeholder={t('messagePlaceholder')}
                required
                rows={6}
                maxLength={500}
                value={applyMessage}
                onChange={(e) => setApplyMessage(e.target.value)}
                className="resize-none bg-background-card dark:bg-background-card !text-text-primary dark:!text-text-primary border-border-light dark:border-border-dark placeholder:text-text-tertiary dark:placeholder:text-text-tertiary"
              />
              <p className="mt-2 text-xs text-text-tertiary dark:text-text-tertiary">
                {t('messageTip')}
              </p>
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="bg-background-card dark:bg-background-card border-t-2 border-border-light dark:border-[#475569]">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !applyMessage.trim() || applyMessage.length < 10}
          className="w-full sm:w-auto bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-white"
        >
          {isSubmitting ? (
            <>
              <Spinner size="sm" className="mr-2" />
              {t('submitting')}
            </>
          ) : (
            t('submitApplication')
          )}
        </Button>
        <Button
          color="gray"
          onClick={handleModalClose}
          disabled={isSubmitting}
          className="w-full sm:w-auto bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600"
        >
          {t('cancel')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

