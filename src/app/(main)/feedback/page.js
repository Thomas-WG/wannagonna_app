'use client';

/**
 * Feedback Page
 * 
 * Allows users to submit feedback, ideas, or bug reports.
 * Submissions are saved to the ideaBox collection in Firestore.
 */

import { useState } from 'react';
import { Card, Button, Textarea, Label, Toast, Spinner } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/utils/theme/ThemeContext';
import { useAuth } from '@/utils/auth/AuthContext';
import { addIdeaBoxEntry } from '@/utils/crudIdeaBox';

export default function FeedbackPage() {
  const t = useTranslations('Feedback');
  const { isDark } = useTheme();
  const { user } = useAuth();
  
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ type: 'success', message: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset error
    setError('');
    
    // Validate content
    if (!content.trim()) {
      setError(t('contentRequired'));
      return;
    }

    if (content.trim().length < 10) {
      setError(t('contentMinLength') || 'Please provide at least 10 characters of feedback.');
      return;
    }

    if (!user) {
      setError(t('userRequired') || 'You must be logged in to submit feedback.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await addIdeaBoxEntry(user.uid, content);
      
      // Success
      setToastMessage({
        type: 'success',
        message: t('successMessage')
      });
      setShowToast(true);
      setContent('');
      setError('');
      
      // Auto-hide toast after 5 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 5000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setToastMessage({
        type: 'error',
        message: t('errorMessage')
      });
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden px-3 sm:px-4 md:container md:mx-auto py-3 sm:py-4 space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary dark:text-text-primary mb-2">
          {t('title')}
        </h1>
        <p className="text-sm sm:text-base text-text-secondary dark:text-text-secondary">
          {t('subtitle')}
        </p>
      </div>

      {/* Feedback Form */}
      <Card className="w-full">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <Label 
              htmlFor="feedback-content" 
              className="mb-2 block text-sm sm:text-base font-medium text-text-primary dark:text-text-primary"
            >
              {t('contentLabel')}
            </Label>
            <Textarea
              id="feedback-content"
              placeholder={t('contentPlaceholder')}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setError('');
              }}
              rows={8}
              className="w-full text-sm sm:text-base"
              color={error ? 'failure' : (isDark ? 'gray' : 'gray')}
              helperText={error ? <span className="text-sm text-semantic-error-600 dark:text-semantic-error-400">{error}</span> : null}
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="w-full sm:w-auto bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  {t('submitting')}
                </>
              ) : (
                t('submitButton')
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 sm:bottom-5 right-4 sm:right-5 left-4 sm:left-auto z-50 max-w-sm sm:max-w-none">
          <Toast onClose={() => setShowToast(false)} className="bg-background-card dark:bg-background-card border-border-light dark:border-border-dark">
            {toastMessage.type === 'success' && (
              <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-semantic-success-100 dark:bg-semantic-success-900 text-semantic-success-600 dark:text-semantic-success-400">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            {toastMessage.type === 'error' && (
              <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-semantic-error-100 dark:bg-semantic-error-900 text-semantic-error-600 dark:text-semantic-error-400">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <div className="ml-3 text-sm font-normal break-words text-text-primary dark:text-text-primary">
              {toastMessage.message}
            </div>
            <Toast.Toggle onClose={() => setShowToast(false)} className="text-text-tertiary dark:text-text-tertiary hover:text-text-primary dark:hover:text-text-primary" />
          </Toast>
        </div>
      )}
    </div>
  );
}
