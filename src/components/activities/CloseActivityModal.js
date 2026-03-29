'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Label, TextInput, Spinner } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/utils/auth/AuthContext';
import { getActivityParticipations, validateHours } from '@/utils/participationService';
import { closeActivityWithResults } from '@/utils/activityImpactService';
import { fetchActivityById } from '@/utils/crudActivities';
import { fetchValidationsForActivity } from '@/utils/crudActivityValidation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from 'firebaseConfig';

function toDate(value) {
  if (!value) return null;
  if (value?.seconds != null) return new Date(value.seconds * 1000);
  if (typeof value?.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  return new Date(value);
}

function combineDateAndTime(date, timeStr) {
  if (!date || !timeStr) return null;
  const d = toDate(date);
  if (!d) return null;
  const [hours, minutes] = String(timeStr).split(':').map((n) => Number(n));
  const out = new Date(d);
  out.setHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return out;
}

function getActivityDurationHours(act) {
  if (!act) return null;
  const hasTime = act.start_time || act.end_time;
  const startDate = toDate(act.start_date);
  if (!startDate || !hasTime) return null;

  const start = combineDateAndTime(act.start_date, act.start_time || '00:00');
  const endDateRaw = act.end_date || act.start_date;
  const end = combineDateAndTime(endDateRaw, act.end_time || act.start_time || '00:00');

  if (!start || !end) return null;
  const ms = end.getTime() - start.getTime();
  if (!(ms > 0)) return null;
  return ms / (1000 * 60 * 60);
}

export default function CloseActivityModal({ isOpen, onClose, activity, onSuccess }) {
  const t = useTranslations('MyNonProfit');
  const { user } = useAuth();
  const [fullActivity, setFullActivity] = useState(activity);
  const [validatedParticipations, setValidatedParticipations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [parameterValues, setParameterValues] = useState({});
  const [hoursPerParticipant, setHoursPerParticipant] = useState({});

  // Sync fullActivity when activity prop changes (e.g. switching activities without unmounting).
  // For events, fetchData returns early so fullActivity would otherwise stay stale.
  useEffect(() => {
    if (activity) {
      setFullActivity(activity);
    }
  }, [activity?.id, activity?.type]);

  // Reset modal state when switching to a different activity
  useEffect(() => {
    if (activity?.id) {
      setValidatedParticipations([]);
      setParameterValues({});
      setHoursPerParticipant({});
      setShowConfirm(false);
    }
  }, [activity?.id]);

  const isEvent = fullActivity?.type === 'event';
  const isLocalOrEvent = fullActivity?.type === 'local' || fullActivity?.type === 'event';
  const impactParameters = fullActivity?.impact_parameters || [];
  const durationHours = getActivityDurationHours(fullActivity);
  const hasAutoCalc = isLocalOrEvent && durationHours != null && durationHours > 0;

  const fetchData = useCallback(async () => {
    if (!isOpen || !activity?.id || activity?.type === 'event') return;
    setLoading(true);
    try {
      const [a, validations, participations] = await Promise.all([
        fetchActivityById(activity.id),
        fetchValidationsForActivity(activity.id),
        getActivityParticipations(activity.id),
      ]);
      setFullActivity(a || activity);

      const validated = validations.filter((v) => v.status === 'validated');
      const partByUser = {};
      participations.forEach((p) => {
        partByUser[p.id] = p;
      });

      const list = await Promise.all(
        validated.map(async (v) => {
          const part = partByUser[v.user_id] || {};
          let display_name = 'Participant';
          try {
            const userDoc = await getDoc(doc(db, 'members', v.user_id));
            if (userDoc.exists()) {
              const d = userDoc.data();
              display_name = d.display_name || d.name || d.email || display_name;
            }
          } catch (_) {}
          return { user_id: v.user_id, display_name, ...part };
        })
      );

      setValidatedParticipations(list);

      const act = a || activity;
      const dur = getActivityDurationHours(act);
      const canAutoFill = (act?.type === 'local' || act?.type === 'event') && dur != null && dur > 0;

      // Pre-fill hours: existing validated/reported, or auto-calc for local
      const initialHours = {};
      list.forEach((p) => {
        const existing = Number(p.hours?.validated) || Number(p.hours?.reported) || 0;
        if (existing > 0) {
          initialHours[p.user_id] = String(existing);
        } else if (canAutoFill) {
          initialHours[p.user_id] = String(Number(dur.toFixed(1)));
        } else {
          initialHours[p.user_id] = '';
        }
      });
      setHoursPerParticipant(initialHours);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isOpen, activity?.id, activity]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!isOpen) setShowConfirm(false);
  }, [isOpen]);

  useEffect(() => {
    if (!impactParameters.length || Object.keys(parameterValues).length > 0) return;
    const initial = {};
    impactParameters.forEach((p) => {
      const paramId = p.parameter_id;
      const targetVal = p.target_value;
      if (paramId) initial[paramId] = targetVal != null ? String(targetVal) : '';
    });
    setParameterValues((prev) => ({ ...initial, ...prev }));
  }, [impactParameters]);

  const totalHours = Object.values(hoursPerParticipant).reduce((sum, v) => {
    const n = v === '' || v == null ? 0 : Number(v);
    return sum + (Number.isFinite(n) && n >= 0 ? n : 0);
  }, 0);

  const handleCloseActivity = async () => {
    if (!activity?.id || !user?.uid) return;

    // Events: single-step close; others: two-step (enter hours/impact, then confirm)
    if (!isEvent && !showConfirm) {
      setShowConfirm(true);
      return;
    }

    setSubmitting(true);
    try {
      let totalHoursToReport = 0;
      const parameters = {};

      if (!isEvent) {
        const participantHours = {};
        for (const p of validatedParticipations) {
          const raw = hoursPerParticipant[p.user_id];
          const num = raw === '' || raw == null ? 0 : Number(raw);
          participantHours[p.user_id] = Number.isFinite(num) && num >= 0 ? num : 0;
        }

        totalHoursToReport = Object.values(participantHours).reduce((s, h) => s + h, 0);

        if (isLocalOrEvent) {
          impactParameters.forEach((p) => {
            const paramId = p.parameter_id;
            const v = paramId ? parameterValues[paramId] : undefined;
            const num = v === '' || v == null ? 0 : Number(v);
            if (paramId) parameters[paramId] = Number.isFinite(num) ? num : 0;
          });
        }

        for (const [userId, hours] of Object.entries(participantHours)) {
          await validateHours(activity.id, userId, hours);
        }
      }

      await closeActivityWithResults(
        fullActivity?.id || activity.id,
        { total_hours: totalHoursToReport, parameters },
        user.uid
      );
      onSuccess?.(fullActivity?.id || activity.id);
      onClose?.();
    } catch (err) {
      console.error('Error closing activity:', err);
      alert(t('errorClosingActivity') || err?.message || 'Failed to close activity');
    } finally {
      setSubmitting(false);
    }
  };

  const fillAllWithDuration = () => {
    if (!durationHours) return;
    const next = {};
    validatedParticipations.forEach((p) => {
      next[p.user_id] = String(Number(durationHours.toFixed(1)));
    });
    setHoursPerParticipant(next);
  };

  if (!activity) return null;

  return (
    <Modal show={isOpen} onClose={onClose} size="md" className="z-50">
      <Modal.Header>
        {t('closeActivity') || 'Close activity'}
      </Modal.Header>
      <Modal.Body className="space-y-4">
        <p className="text-sm text-text-secondary dark:text-text-secondary">
          {fullActivity?.title || activity.title}
        </p>

        {loading ? (
          <div className="flex justify-center py-6">
            <Spinner size="lg" />
          </div>
        ) : showConfirm ? (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
              {t('closeActivityConfirmTitle') || 'Confirm closing'}
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              {isEvent
                ? (t('closeActivityConfirmEventMessage') || 'Are you sure? You will not be able to edit after closing.')
                : (t('closeActivityConfirmMessage') || 'Are you sure? You will not be able to edit hours and impact after closing. Contact an admin if you need to make changes later.')}
            </p>
          </div>
        ) : isEvent ? (
          <p className="text-sm text-text-secondary dark:text-text-secondary">
            {t('closeActivityConfirmEventMessage') || 'Are you sure? You will not be able to edit after closing.'}
          </p>
        ) : (
          <>
            {/* Hours & impact section – same color as Close button (green/success) */}
            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 space-y-4">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                {t('hoursAndImpactSection') || 'Hours & impact (entered by NPO)'}
              </p>

              {validatedParticipations.length === 0 ? (
                <p className="text-sm text-text-tertiary dark:text-text-tertiary">
                  {t('noValidatedParticipants') || 'No validated participants.'}
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <Label className="text-sm text-text-primary dark:text-text-primary">
                        {t('hoursPerParticipant') || 'Hours per participant'}
                      </Label>
                      {hasAutoCalc && (
                        <Button
                          size="xs"
                          color="success"
                          onClick={fillAllWithDuration}
                          className="min-h-[32px] touch-manipulation"
                        >
                          {t('autoFillFromSchedule') || 'Auto-fill from schedule'}
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {validatedParticipations.map((p) => (
                        <div
                          key={p.user_id}
                          className="flex items-center gap-2 flex-wrap"
                        >
                          <span className="text-sm text-text-secondary dark:text-text-secondary truncate flex-1 min-w-0">
                            {p.display_name || p.user_id}
                          </span>
                          <TextInput
                            type="number"
                            min={0}
                            max={24}
                            step={0.5}
                            placeholder="0"
                            value={hoursPerParticipant[p.user_id] ?? ''}
                            onChange={(e) =>
                              setHoursPerParticipant((prev) => ({
                                ...prev,
                                [p.user_id]: e.target.value,
                              }))
                            }
                            className="w-20 min-w-[72px]"
                            aria-label={t('hoursPerParticipant') || 'Hours'}
                          />
                          <span className="text-xs text-text-tertiary dark:text-text-tertiary">
                            {t('hoursShort') || 'h'}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-green-200 dark:border-green-800">
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">
                        {t('totalHours') || 'Total hours'}: {totalHours.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {isLocalOrEvent && impactParameters.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-green-200 dark:border-green-800">
                      <Label className="text-sm text-text-primary dark:text-text-primary">
                        {t('impactResults') || 'Impact results'}
                      </Label>
                      {impactParameters.map((p) => {
                        const paramId = p.parameter_id;
                        return (
                          <div key={paramId} className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <Label
                              htmlFor={`close-${paramId}`}
                              className="sm:w-36 text-sm text-text-secondary dark:text-text-secondary"
                            >
                              {p.label} ({p.unit})
                            </Label>
                            <TextInput
                              id={`close-${paramId}`}
                              type="number"
                              min={0}
                              step="any"
                              value={parameterValues[paramId] ?? ''}
                              onChange={(e) =>
                                setParameterValues((prev) => ({
                                  ...prev,
                                  [paramId]: e.target.value,
                                }))
                              }
                              className="flex-1 min-w-0"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {!isLocalOrEvent && validatedParticipations.length > 0 && (
              <p className="text-sm text-text-tertiary dark:text-text-tertiary">
                {t('closeActivityConfirmOnline') || 'Enter hours for each participant, then close.'}
              </p>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button
          color="gray"
          onClick={showConfirm ? () => setShowConfirm(false) : onClose}
          disabled={submitting}
          className="min-h-[44px] touch-manipulation"
        >
          {t('cancel') || 'Cancel'}
        </Button>
        <Button
          color="success"
          onClick={handleCloseActivity}
          disabled={loading || submitting}
          className="min-h-[44px] touch-manipulation bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
        >
          {submitting ? <Spinner size="sm" className="mr-2" /> : null}
          {showConfirm ? (t('closeActivityConfirmButton') || 'Confirm and close') : (t('closeActivity') || 'Close activity')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
