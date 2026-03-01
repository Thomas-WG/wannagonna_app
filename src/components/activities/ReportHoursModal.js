'use client';

import { useState } from 'react';
import { Modal, Button, Label, TextInput, Spinner } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/utils/auth/AuthContext';
import { reportHours } from '@/utils/participationService';

const MIN_HOURS = 0.5;
const MAX_HOURS = 24;

export default function ReportHoursModal({
  isOpen,
  onClose,
  activityId,
  activityTitle = '',
  activityType = '',
  prefillHours = null,
  onSuccess,
}) {
  const t = useTranslations('ActivityCard');
  const { user } = useAuth();
  const [hours, setHours] = useState(prefillHours != null ? String(prefillHours) : '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = Number(hours);
    if (Number.isNaN(num) || num < MIN_HOURS || num > MAX_HOURS) {
      setError(t('reportHoursValidation') || `Enter between ${MIN_HOURS} and ${MAX_HOURS} hours`);
      return;
    }
    if (!activityId || !user?.uid) return;
    setSubmitting(true);
    setError('');
    try {
      await reportHours(activityId, user.uid, num);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error(err);
      setError(t('reportHoursError') || 'Failed to save hours');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose} size="md">
      <Modal.Header>
        {t('reportHours') || 'Report hours'}
      </Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body className="space-y-4">
          {activityTitle && (
            <p className="text-sm text-text-secondary dark:text-text-secondary">
              {activityTitle}
            </p>
          )}
          <div>
            <Label htmlFor="report-hours-input">
              {t('hoursSpent') || 'Hours spent'}
            </Label>
            <TextInput
              id="report-hours-input"
              type="number"
              min={MIN_HOURS}
              max={MAX_HOURS}
              step="0.5"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="e.g. 2.5"
              className="mt-1"
            />
            <p className="text-xs text-text-tertiary dark:text-text-tertiary mt-1">
              {t('reportHoursHint') || `Between ${MIN_HOURS} and ${MAX_HOURS} hours`}
            </p>
            {error && (
              <p className="text-sm text-red-500 dark:text-red-400 mt-1">{error}</p>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="gray" onClick={onClose} disabled={submitting}>
            {t('cancel') || 'Cancel'}
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? <Spinner size="sm" className="mr-2" /> : null}
            {t('submit') || 'Submit'}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
