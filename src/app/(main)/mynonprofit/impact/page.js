'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/utils/auth/AuthContext';
import { fetchOrganizationById } from '@/utils/crudOrganizations';
import { Card, Spinner } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import BackButton from '@/components/layout/BackButton';
import { HiChartBar, HiClock, HiCollection } from 'react-icons/hi';
import { getAllParametersForNpo } from '@/utils/impactParameterService';

export default function NPOImpactPage() {
  const t = useTranslations('MyNonProfit');
  const { claims } = useAuth();
  const orgId = claims?.npoId;

  const { data: org, isLoading } = useQuery({
    queryKey: ['npoOrganization', orgId],
    queryFn: () => fetchOrganizationById(orgId),
    enabled: !!orgId,
    staleTime: 60 * 1000,
  });

  const { data: impactParams = [] } = useQuery({
    queryKey: ['impactAllParametersForNpo', orgId],
    queryFn: () => getAllParametersForNpo(orgId),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  const summary = org?.impactSummary || {};
  const totalHours = summary.totalHours ?? 0;
  const totalActivities = summary.totalActivities ?? 0;
  const parameters = summary.parameters || {};
  const paramEntries = Object.entries(parameters).filter(([, v]) => v != null && Number(v) !== 0);

  const paramMeta = impactParams.reduce((acc, p) => {
    if (p?.id) {
      acc[p.id] = p;
    }
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background-primary dark:bg-background-primary">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <BackButton href="/mynonprofit" />
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-text-primary mt-4 mb-2">
          {t('impactDashboard') || 'Impact'}
        </h1>
        <p className="text-sm text-text-secondary dark:text-text-secondary mb-6">
          {t('impactDashboardDescription') || 'Cumulative impact from your closed activities.'}
        </p>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="xl" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900">
                    <HiClock className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm text-text-tertiary dark:text-text-tertiary">
                      {t('totalVolunteerHours') || 'Volunteer hours'}
                    </p>
                    <p className="text-2xl font-bold text-text-primary dark:text-text-primary">
                      {totalHours.toFixed(1)}
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                    <HiCollection className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-text-tertiary dark:text-text-tertiary">
                      {t('activitiesClosed') || 'Activities closed'}
                    </p>
                    <p className="text-2xl font-bold text-text-primary dark:text-text-primary">
                      {totalActivities}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {paramEntries.length > 0 ? (
              <Card className="p-4">
                <h2 className="text-lg font-semibold text-text-primary dark:text-text-primary mb-3 flex items-center gap-2">
                  <HiChartBar className="h-5 w-5" />
                  {t('impactByParameter') || 'Impact by parameter'}
                </h2>
                <ul className="space-y-2">
                  {paramEntries.map(([parameterId, value]) => {
                    const meta = paramMeta[parameterId] || {};
                    const label = meta.label || parameterId;
                    const unit = meta.unit ? ` ${meta.unit}` : '';
                    return (
                      <li
                        key={parameterId}
                        className="flex justify-between items-center text-sm py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                      >
                        <span className="text-text-primary dark:text-text-primary font-medium">
                          {label}
                        </span>
                        <span className="text-text-secondary dark:text-text-secondary">
                          {Number(value).toLocaleString()}
                          {unit}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            ) : (
              <Card className="p-6 text-center text-text-secondary dark:text-text-secondary text-sm">
                {t('noImpactDataYet') || 'No impact data yet. Close activities to see metrics here.'}
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
