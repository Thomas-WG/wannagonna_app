'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/utils/auth/AuthContext';
import {
  getGlobalParameters,
  getNpoCustomParameters,
  createCustomParameter,
  toggleCustomParameter,
  groupImpactParametersByCategory,
} from '@/utils/impactParameterService';
import { Card, Button, Modal, Spinner, Toast, Label, TextInput, Select, Tooltip } from 'flowbite-react';
import { HiPlus, HiCheck, HiX, HiInformationCircle } from 'react-icons/hi';
import { useTranslations } from 'next-intl';
import BackButton from '@/components/layout/BackButton';
import { MEASUREMENT_TYPES, suggestMeasurementTypeFromUnit } from '@/constant/measurementTypes';
const IMPACT_CATEGORIES = [
  'people',
  'food',
  'goods',
  'environment',
  'animals',
  'education',
  'health',
  'housing',
  'livelihoods',
  'culture',
  'digital',
  'communication',
  'consulting',
];

const UNITS = ['kg', 'count', 'hours', 'm²', 'liters', 'meters', 'm2'];

export default function ImpactParametersPage() {
  const t = useTranslations('MyNonProfit');
  const tExport = useTranslations('impact_export');
  const { claims } = useAuth();
  const queryClient = useQueryClient();
  const orgId = claims?.npoId;

  const [globalParams, setGlobalParams] = useState([]);
  const [customParams, setCustomParams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ label: '', unit: 'count', category: 'people', measurementType: 'output' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, type: '', message: '' });

  const { data: global = [], isLoading: loadingGlobal } = useQuery({
    queryKey: ['impactGlobalParameters'],
    queryFn: getGlobalParameters,
    staleTime: 60 * 1000,
  });

  const { data: custom = [], isLoading: loadingCustom } = useQuery({
    queryKey: ['impactCustomParameters', orgId],
    queryFn: () => getNpoCustomParameters(orgId),
    enabled: !!orgId,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    setGlobalParams(global);
    setCustomParams(custom);
  }, [global, custom]);

  useEffect(() => {
    setLoading(loadingGlobal || loadingCustom);
  }, [loadingGlobal, loadingCustom]);

  useEffect(() => {
    if (toast.show) {
      const t = setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 5000);
      return () => clearTimeout(t);
    }
  }, [toast.show]);

  const showToast = (type, message) => setToast({ show: true, type, message });

  const handleAddParameter = async (e) => {
    e.preventDefault();
    if (!addForm.label?.trim() || !orgId) return;
    setSubmitting(true);
    try {
      await createCustomParameter(orgId, {
        label: addForm.label.trim(),
        unit: addForm.unit,
        category: addForm.category,
        measurementType: addForm.measurementType,
      });
      queryClient.invalidateQueries({ queryKey: ['impactCustomParameters', orgId] });
      setShowAddModal(false);
      setAddForm({ label: '', unit: 'count', category: 'people', measurementType: 'output' });
      showToast('success', t('impactParameterCreated') || 'Parameter created');
    } catch (err) {
      console.error(err);
      showToast('error', t('impactParameterError') || 'Failed to create parameter');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (parameterId, currentActive) => {
    if (!orgId) return;
    try {
      await toggleCustomParameter(orgId, parameterId, !currentActive);
      queryClient.invalidateQueries({ queryKey: ['impactCustomParameters', orgId] });
      showToast('success', currentActive ? (t('impactParameterDeactivated') || 'Deactivated') : (t('impactParameterActivated') || 'Activated'));
    } catch (err) {
      console.error(err);
      showToast('error', t('impactParameterError') || 'Failed to update');
    }
  };

  return (
    <div className="min-h-screen bg-background-primary dark:bg-background-primary">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <BackButton href="/mynonprofit" />
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-text-primary mt-4 mb-2">
          {t('impactParameters') || 'Impact Parameters'}
        </h1>
        <p className="text-sm text-text-secondary dark:text-text-secondary mb-6">
          {t('impactParametersDescription') || 'View global parameters and manage your organization’s custom parameters for activity impact tracking.'}
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="xl" />
          </div>
        ) : (
          <>
            {/* Global parameters (read-only) */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-text-primary dark:text-text-primary mb-3">
                {t('globalParameters') || 'Global parameters'}
              </h2>
              <p className="text-xs sm:text-sm text-text-tertiary dark:text-text-tertiary mb-3">
                {t('globalParametersReadOnly') || 'Reference only. Managed by platform admin.'}
              </p>
              {globalParams.length === 0 ? (
                <Card className="p-4 text-text-secondary dark:text-text-secondary text-sm">
                  {t('noGlobalParameters') || 'No global parameters defined yet.'}
                </Card>
              ) : (
                <div className="space-y-3">
                  {Object.entries(groupImpactParametersByCategory(globalParams)).map(([category, params]) => (
                    <Card key={category} className="p-4">
                      <div className="text-xs font-medium text-text-tertiary dark:text-text-tertiary uppercase mb-2">
                        {category}
                      </div>
                      <ul className="space-y-2">
                        {params.map((p) => (
                          <li
                            key={p.id}
                            className="flex flex-wrap items-center gap-2 text-sm text-text-primary dark:text-text-primary"
                          >
                            <span className="font-medium">{p.label}</span>
                            <span className="text-text-tertiary dark:text-text-tertiary">
                              ({p.unit})
                            </span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* Custom parameters */}
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <h2 className="text-lg font-semibold text-text-primary dark:text-text-primary">
                  {t('yourCustomParameters') || 'Your custom parameters'}
                </h2>
                <Button
                  size="sm"
                  className="min-h-[44px] touch-manipulation"
                  onClick={() => setShowAddModal(true)}
                >
                  <HiPlus className="mr-2 h-5 w-5" />
                  {t('addParameter') || 'Add parameter'}
                </Button>
              </div>
              {customParams.length === 0 ? (
                <Card className="p-6 text-center text-text-secondary dark:text-text-secondary text-sm">
                  {t('noCustomParameters') || 'No custom parameters. Add one to use in activities.'}
                </Card>
              ) : (
                <div className="space-y-3">
                  {customParams.map((p) => (
                    <Card key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="font-medium text-text-primary dark:text-text-primary">
                          {p.label}
                        </span>
                        <span className="text-text-tertiary dark:text-text-tertiary text-sm ml-2">
                          {p.unit} · {p.category}
                          {p.measurementType && (
                            <span className="ml-1 text-xs"> · {tExport(`measurementType.${p.measurementType}`)}</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${p.isActive ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                          {p.isActive ? (t('active') || 'Active') : (t('inactive') || 'Inactive')}
                        </span>
                        <Button
                          size="xs"
                          color={p.isActive ? 'failure' : 'success'}
                          className="min-h-[40px] touch-manipulation"
                          onClick={() => handleToggle(p.id, p.isActive)}
                        >
                          {p.isActive ? (t('deactivate') || 'Deactivate') : (t('activate') || 'Activate')}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {toast.show && (
          <Toast className="fixed bottom-4 right-4 z-50">
            {toast.type === 'success' ? (
              <HiCheck className="h-5 w-5 text-green-500" />
            ) : (
              <HiX className="h-5 w-5 text-red-500" />
            )}
            <div className="ml-3 text-sm font-normal">{toast.message}</div>
          </Toast>
        )}
      </div>

      <Modal show={showAddModal} onClose={() => setShowAddModal(false)} size="md">
        <Modal.Header>{t('addParameter') || 'Add parameter'}</Modal.Header>
        <form onSubmit={handleAddParameter}>
          <Modal.Body className="space-y-4">
            <div>
              <Label htmlFor="impact-label">{t('label') || 'Label'}</Label>
              <TextInput
                id="impact-label"
                placeholder={t('labelPlaceholder') || 'e.g. Food distributed'}
                value={addForm.label}
                onChange={(e) => setAddForm((prev) => ({ ...prev, label: e.target.value }))}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="impact-unit">{t('unit') || 'Unit'}</Label>
              <Select
                id="impact-unit"
                value={addForm.unit}
                onChange={(e) => {
                  const unit = e.target.value;
                  setAddForm((prev) => ({
                    ...prev,
                    unit,
                    measurementType: suggestMeasurementTypeFromUnit(unit),
                  }));
                }}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="impact-category">{t('category') || 'Category'}</Label>
              <Select
                id="impact-category"
                value={addForm.category}
                onChange={(e) => setAddForm((prev) => ({ ...prev, category: e.target.value }))}
              >
                {IMPACT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="impact-measurementType">{tExport('measurementType.label')}</Label>
                <Tooltip content={tExport('measurementType.tooltip')}>
                  <HiInformationCircle className="h-4 w-4 text-text-tertiary cursor-help" />
                </Tooltip>
              </div>
              <Select
                id="impact-measurementType"
                value={addForm.measurementType}
                onChange={(e) => setAddForm((prev) => ({ ...prev, measurementType: e.target.value }))}
              >
                {MEASUREMENT_TYPES.map((mt) => (
                  <option key={mt.id} value={mt.id}>
                    {tExport(mt.labelKey)}
                  </option>
                ))}
              </Select>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button type="submit" disabled={submitting || !addForm.label?.trim()}>
              {submitting ? <Spinner size="sm" className="mr-2" /> : null}
              {t('save') || 'Save'}
            </Button>
            <Button color="gray" onClick={() => setShowAddModal(false)}>
              {t('cancel') || 'Cancel'}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  );
}
