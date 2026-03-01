'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllParametersForNpo, groupImpactParametersByCategory } from '@/utils/impactParameterService';
import { Card, Label, TextInput, Spinner, Checkbox } from 'flowbite-react';
import { useTranslations } from 'next-intl';

/**
 * Returns selected impact parameters with optional target values.
 * @param {string} orgId
 * @param {Array<{ parameterId: string, scope: string, label: string, unit: string, category?: string, targetValue?: number|null }>} initialSelected
 * @param {(params: Array<{ parameterId: string, scope: string, label: string, unit: string, category: string, targetValue?: number|null }>) => void} onChange
 */
export default function ActivityImpactParametersStep({ orgId, initialSelected = [], onChange }) {
  const t = useTranslations('ManageActivities');
  const [selected, setSelected] = useState(() => {
    const map = new Map();
    (initialSelected || []).forEach((p) => map.set(p.parameterId, { ...p, targetValue: p.targetValue ?? null }));
    return map;
  });

  const { data: parameters = [], isLoading } = useQuery({
    queryKey: ['impactParametersForNpo', orgId],
    queryFn: () => getAllParametersForNpo(orgId),
    enabled: !!orgId,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    const arr = Array.from(selected.values()).map((p) => ({
      parameterId: p.parameterId || p.id,
      scope: p.scope,
      label: p.label,
      unit: p.unit,
      category: p.category ?? '',
      targetValue: p.targetValue ?? null,
    }));
    onChange?.(arr);
  }, [selected, onChange]);

  const toggle = (p, checked) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (checked) {
        next.set(p.id, {
          id: p.id,
          parameterId: p.id,
          scope: p.scope,
          label: p.label,
          unit: p.unit,
          category: p.category ?? '',
          targetValue: null,
        });
      } else {
        next.delete(p.id);
      }
      return next;
    });
  };

  const setTarget = (paramId, value) => {
    const v = value === '' || value == null ? null : Number(value);
    setSelected((prev) => {
      const next = new Map(prev);
      const entry = next.get(paramId);
      if (entry) next.set(paramId, { ...entry, targetValue: v });
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="xl" />
      </div>
    );
  }

  const grouped = groupImpactParametersByCategory(parameters);

  return (
    <div className="space-y-6">
      <p className="text-sm text-text-secondary dark:text-text-secondary">
        {t('impactParametersStepDescription') || 'Select impact metrics to track for this activity. You can set an optional target for each.'}
      </p>
      {Object.keys(grouped).length === 0 ? (
        <Card className="p-4 text-text-secondary dark:text-text-secondary text-sm">
          {t('noImpactParametersAvailable') || 'No parameters available. Add global or custom parameters from Impact Parameters settings.'}
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([category, params]) => (
            <Card key={category} className="p-4">
              <div className="text-xs font-medium text-text-tertiary dark:text-text-tertiary uppercase mb-3">
                {category}
              </div>
              <ul className="space-y-3">
                {params.map((p) => {
                  const isChecked = selected.has(p.id);
                  return (
                    <li key={p.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex items-center gap-2 min-h-[44px]">
                        <Checkbox
                          id={`impact-${p.id}`}
                          checked={isChecked}
                          onChange={(e) => toggle(p, e.target.checked)}
                        />
                        <Label htmlFor={`impact-${p.id}`} className="cursor-pointer font-medium text-text-primary dark:text-text-primary">
                          {p.label} ({p.unit})
                        </Label>
                      </div>
                      {isChecked && (
                        <div className="sm:ml-4 flex items-center gap-2 w-full sm:w-auto">
                          <Label htmlFor={`target-${p.id}`} className="text-text-tertiary dark:text-text-tertiary text-sm whitespace-nowrap">
                            {t('targetOptional') || 'Target (optional)'}
                          </Label>
                          <TextInput
                            id={`target-${p.id}`}
                            type="number"
                            min={0}
                            step="any"
                            placeholder="—"
                            value={selected.get(p.id)?.targetValue ?? ''}
                            onChange={(e) => setTarget(p.id, e.target.value)}
                            className="max-w-[120px]"
                          />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
