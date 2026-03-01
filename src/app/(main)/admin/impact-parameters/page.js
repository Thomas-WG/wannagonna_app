'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, Button, Spinner, Label, TextInput, Select, Toast, Tooltip } from 'flowbite-react';
import { HiCheck, HiX, HiInformationCircle } from 'react-icons/hi';
import BackButton from '@/components/layout/BackButton';
import {
  getAllGlobalParameters,
  updateGlobalParameter,
  createGlobalParameter,
  getNpoCustomParameters,
  updateCustomParameter,
  groupImpactParametersByCategory,
  seedGlobalParameters,
} from '@/utils/impactParameterService';
import { fetchOrganizations } from '@/utils/crudOrganizations';
import { MEASUREMENT_TYPES } from '@/constant/measurementTypes';

const CATEGORIES = [
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

const SDG_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

export default function AdminImpactParametersPage() {
  const t = useTranslations('MyNonProfit');
  const tExport = useTranslations('impact_export');
  const [globalParams, setGlobalParams] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [orgParams, setOrgParams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingOrgParams, setLoadingOrgParams] = useState(false);
  const [editingGlobal, setEditingGlobal] = useState(null);
  const [globalForm, setGlobalForm] = useState({ label: '', unit: 'count', category: 'people', measurementType: 'output', sdg: [], isActive: true });
  const [creatingGlobal, setCreatingGlobal] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [toast, setToast] = useState({ show: false, type: 'success', message: '' });

  const showToast = useCallback((type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: 'success', message: '' }), 4000);
  }, []);

  useEffect(() => {
    const loadInitial = async () => {
      try {
        setLoading(true);
        const [globals, orgs] = await Promise.all([getAllGlobalParameters(), fetchOrganizations()]);
        setGlobalParams(globals || []);
        setOrganizations(orgs || []);
        if (orgs && orgs.length > 0) {
          setSelectedOrgId(orgs[0].id);
        }
      } catch (err) {
        console.error('Error loading impact parameters admin data:', err);
        showToast('error', 'Failed to load impact parameters');
      } finally {
        setLoading(false);
      }
    };
    loadInitial();
  }, [showToast]);

  useEffect(() => {
    const loadOrgParams = async () => {
      if (!selectedOrgId) {
        setOrgParams([]);
        return;
      }
      try {
        setLoadingOrgParams(true);
        const params = await getNpoCustomParameters(selectedOrgId);
        setOrgParams(params || []);
      } catch (err) {
        console.error('Error loading org parameters:', err);
        showToast('error', 'Failed to load organization parameters');
      } finally {
        setLoadingOrgParams(false);
      }
    };
    loadOrgParams();
  }, [selectedOrgId, showToast]);

  useEffect(() => {
    if (!toast.show) return;
    const id = setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
    return () => clearTimeout(id);
  }, [toast.show]);

  const startEditGlobal = (param) => {
    setEditingGlobal(param.id);
    setGlobalForm({
      label: param.label || '',
      unit: param.unit || 'count',
      category: param.category || 'people',
      measurementType: param.measurementType || 'output',
      sdg: Array.isArray(param.sdg) ? [...param.sdg] : [],
      isActive: param.isActive !== false,
    });
  };

  const resetGlobalForm = () => {
    setEditingGlobal(null);
    setGlobalForm({ label: '', unit: 'count', category: 'people', measurementType: 'output', sdg: [], isActive: true });
  };

  const toggleSdg = (num) => {
    setGlobalForm((prev) => {
      const next = [...(prev.sdg || [])];
      const idx = next.indexOf(num);
      if (idx >= 0) next.splice(idx, 1);
      else next.push(num);
      next.sort((a, b) => a - b);
      return { ...prev, sdg: next };
    });
  };

  const handleSaveGlobal = async (e) => {
    e.preventDefault();
    if (!globalForm.label.trim()) return;
    try {
      setCreatingGlobal(true);
      if (editingGlobal) {
        await updateGlobalParameter(editingGlobal, {
          label: globalForm.label.trim(),
          unit: globalForm.unit,
          category: globalForm.category,
          measurementType: globalForm.measurementType,
          sdg: globalForm.sdg,
          isActive: globalForm.isActive,
        });
        showToast('success', t('impactParameterActivated') || 'Parameter updated');
      } else {
        await createGlobalParameter({
          label: globalForm.label.trim(),
          unit: globalForm.unit,
          category: globalForm.category,
          measurementType: globalForm.measurementType,
          sdg: globalForm.sdg,
          isActive: globalForm.isActive,
        });
        showToast('success', t('impactParameterCreated') || 'Parameter created');
      }
      const updated = await getAllGlobalParameters();
      setGlobalParams(updated || []);
      resetGlobalForm();
    } catch (err) {
      console.error('Error saving global impact parameter:', err);
      showToast('error', t('impactParameterError') || 'Failed to save global parameter');
    } finally {
      setCreatingGlobal(false);
    }
  };

  const handleSeedGlobalParams = async () => {
    try {
      setSeeding(true);
      const { created, updated } = await seedGlobalParameters();
      const updatedList = await getAllGlobalParameters();
      setGlobalParams(updatedList || []);
      showToast('success', `Seeded: ${created} created, ${updated} updated`);
    } catch (err) {
      console.error('Error seeding global parameters:', err);
      showToast('error', 'Failed to seed global parameters');
    } finally {
      setSeeding(false);
    }
  };

  const handleUpdateOrgParam = async (paramId, changes) => {
    if (!selectedOrgId) return;
    try {
      await updateCustomParameter(selectedOrgId, paramId, changes);
      showToast('success', t('impactParameterActivated') || 'Parameter updated');
      const params = await getNpoCustomParameters(selectedOrgId);
      setOrgParams(params || []);
    } catch (err) {
      console.error('Error updating org parameter:', err);
      showToast('error', t('impactParameterError') || 'Failed to update parameter');
    }
  };

  return (
    <div className="min-h-screen bg-background-primary dark:bg-background-primary">
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <BackButton href="/admin" />
        <div className="mt-4">
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-text-primary mb-2">
            {t('impactParameters') || 'Impact Parameters'}
          </h1>
          <p className="text-sm text-text-secondary dark:text-text-secondary">
            Manage global impact parameters and review organization-specific custom parameters. All layouts are optimized for mobile and desktop.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="xl" />
          </div>
        ) : (
          <>
            {/* Global parameters management */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-lg sm:text-xl font-semibold text-text-primary dark:text-text-primary">
                  Global parameters
                </h2>
                <Button
                  color="gray"
                  onClick={handleSeedGlobalParams}
                  disabled={seeding}
                  className="min-h-[44px] w-full sm:w-auto"
                >
                  {seeding ? <Spinner size="sm" /> : 'Seed global parameters'}
                </Button>
              </div>
              <Card className="p-4 sm:p-5">
                <form onSubmit={handleSaveGlobal} className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="global-label">{t('label') || 'Label'}</Label>
                      <TextInput
                        id="global-label"
                        value={globalForm.label}
                        onChange={(e) =>
                          setGlobalForm((prev) => ({ ...prev, label: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="global-unit">{t('unit') || 'Unit'}</Label>
                      <Select
                        id="global-unit"
                        value={globalForm.unit}
                        onChange={(e) =>
                          setGlobalForm((prev) => ({ ...prev, unit: e.target.value }))
                        }
                      >
                        {UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="global-category">{t('category') || 'Category'}</Label>
                      <Select
                        id="global-category"
                        value={globalForm.category}
                        onChange={(e) =>
                          setGlobalForm((prev) => ({ ...prev, category: e.target.value }))
                        }
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="global-measurementType">{tExport('measurementType.label')}</Label>
                        <Tooltip content={tExport('measurementType.tooltip')}>
                          <HiInformationCircle className="h-4 w-4 text-text-tertiary cursor-help" />
                        </Tooltip>
                      </div>
                      <Select
                        id="global-measurementType"
                        value={globalForm.measurementType}
                        onChange={(e) =>
                          setGlobalForm((prev) => ({ ...prev, measurementType: e.target.value }))
                        }
                      >
                        {MEASUREMENT_TYPES.map((mt) => (
                          <option key={mt.id} value={mt.id}>
                            {tExport(mt.labelKey)}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label>SDGs</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {SDG_NUMBERS.map((num) => {
                          const checked = (globalForm.sdg || []).includes(num);
                          return (
                            <label
                              key={num}
                              className="inline-flex items-center gap-1.5 cursor-pointer text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleSdg(num)}
                                className="rounded border-gray-300"
                              />
                              <span>SDG {num}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="global-active">{t('active') || 'Active'}</Label>
                      <Select
                        id="global-active"
                        value={globalForm.isActive ? 'true' : 'false'}
                        onChange={(e) =>
                          setGlobalForm((prev) => ({
                            ...prev,
                            isActive: e.target.value === 'true',
                          }))
                        }
                      >
                        <option value="true">{t('active') || 'Active'}</option>
                        <option value="false">{t('inactive') || 'Inactive'}</option>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-end gap-2">
                    {editingGlobal && (
                      <Button
                        type="button"
                        color="light"
                        onClick={resetGlobalForm}
                        className="w-full sm:w-auto min-h-[44px]"
                      >
                        {t('cancel') || 'Cancel'}
                      </Button>
                    )}
                    <Button
                      type="submit"
                      className="w-full sm:w-auto min-h-[44px]"
                      disabled={creatingGlobal}
                    >
                      {creatingGlobal ? (
                        <Spinner size="sm" />
                      ) : editingGlobal ? (
                        t('update') || 'Update'
                      ) : (
                        t('addParameter') || 'Add parameter'
                      )}
                    </Button>
                  </div>
                </form>

                <div className="mt-5 space-y-3">
                  {globalParams.length === 0 ? (
                    <p className="text-sm text-text-secondary dark:text-text-secondary">
                      {t('noGlobalParameters') || 'No global parameters defined yet.'}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(groupImpactParametersByCategory(globalParams)).map(([category, list]) => (
                        <Card key={category} className="p-3 sm:p-4">
                          <div className="text-xs font-medium text-text-tertiary dark:text-text-tertiary uppercase mb-2">
                            {category}
                          </div>
                          <div className="space-y-2">
                            {list.map((p) => (
                              <div
                                key={p.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                              >
                                <div className="text-sm">
                                  <span className="font-medium text-text-primary dark:text-text-primary">
                                    {p.label}
                                  </span>
                                  <span className="text-text-tertiary dark:text-text-tertiary ml-2">
                                    {p.unit}
                                    {p.measurementType && ` · ${tExport(`measurementType.${p.measurementType}`)}`}
                                    {' · '}{p.isActive ? (t('active') || 'Active') : (t('inactive') || 'Inactive')}
                                  </span>
                                </div>
                                <Button
                                  size="xs"
                                  className="min-h-[36px] w-full sm:w-auto"
                                  onClick={() => startEditGlobal(p)}
                                >
                                  {t('edit') || 'Edit'}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </section>

            {/* Organization custom parameters overview */}
            <section className="space-y-4">
              <h2 className="text-lg sm:text-xl font-semibold text-text-primary dark:text-text-primary">
                Organization custom parameters
              </h2>
              <Card className="p-4 sm:p-5 space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="org-select">Organization</Label>
                  <Select
                    id="org-select"
                    value={selectedOrgId}
                    onChange={(e) => setSelectedOrgId(e.target.value)}
                    className="w-full sm:w-80"
                  >
                    {organizations.length === 0 && (
                      <option value="">{t('noOrganizations') || 'No organizations'}</option>
                    )}
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name || org.displayName || org.id}
                      </option>
                    ))}
                  </Select>
                </div>

                {loadingOrgParams ? (
                  <div className="flex justify-center py-6">
                    <Spinner size="lg" />
                  </div>
                ) : orgParams.length === 0 ? (
                  <p className="text-sm text-text-secondary dark:text-text-secondary">
                    {t('noCustomParameters') || 'No custom parameters for this organization.'}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {orgParams.map((p) => (
                      <Card
                        key={p.id}
                        className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 text-sm">
                          <div className="font-medium text-text-primary dark:text-text-primary">
                            {p.label}
                          </div>
                          <div className="text-text-tertiary dark:text-text-tertiary">
                            {p.unit} · {p.category}
                            {p.measurementType && ` · ${tExport(`measurementType.${p.measurementType}`)}`}
                          </div>
                          <div className="text-xs">
                            <span
                              className={`px-2 py-0.5 rounded ${
                                p.isActive
                                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                              }`}
                            >
                              {p.isActive ? (t('active') || 'Active') : (t('inactive') || 'Inactive')}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full sm:w-auto">
                          <Button
                            size="xs"
                            className="min-h-[36px] w-full sm:w-auto"
                            onClick={async () =>
                              handleUpdateOrgParam(p.id, { isActive: !p.isActive })
                            }
                          >
                            {p.isActive ? (t('deactivate') || 'Deactivate') : (t('activate') || 'Activate')}
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
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
    </div>
  );
}

