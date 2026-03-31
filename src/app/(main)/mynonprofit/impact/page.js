'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/utils/auth/AuthContext';
import { fetchOrganizationById } from '@/utils/crudOrganizations';
import { Card, Spinner, Button, Label, TextInput } from 'flowbite-react';
import { useTranslations, useLocale } from 'next-intl';
import BackButton from '@/components/layout/BackButton';
import { HiChartBar, HiClock, HiCollection, HiDownload } from 'react-icons/hi';
import { getAllParametersForNpo } from '@/utils/impactParameterService';
import { exportImpactReport } from '@/utils/impactExportService';

export default function NPOImpactPage() {
  const t = useTranslations('MyNonProfit');
  const tExport = useTranslations('impact_export');
  const locale = useLocale();
  const { claims } = useAuth();
  const orgId = claims?.npo_id;

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

  const summary = org?.impact_summary ?? {};
  const totalHours = summary.total_hours ?? 0;
  const totalActivities = summary.total_activities ?? 0;
  const parameters = summary.parameters || {};
  const paramEntries = Object.entries(parameters).filter(([, v]) => v != null && Number(v) !== 0);

  const paramMeta = impactParams.reduce((acc, p) => {
    if (p?.id) {
      acc[p.id] = p;
    }
    return acc;
  }, {});

  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportState, setExportState] = useState('idle'); // idle | loading | success | error | zero
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadFilename, setDownloadFilename] = useState('');

  const handleExport = async () => {
    if (!exportStartDate || !exportEndDate) return;
    setExportState('loading');
    setDownloadUrl('');
    try {
      const result = await exportImpactReport({
        startDate: exportStartDate,
        endDate: exportEndDate,
        locale,
      });
      if (result.success && result.base64 && result.filename) {
        const blob = new Blob(
          [Uint8Array.from(atob(result.base64), (c) => c.charCodeAt(0))],
          { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
        );
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        setDownloadFilename(result.filename);
        setExportState('success');
      } else if (result.error === 'zeroActivities') {
        setExportState('zero');
      } else {
        setExportState('error');
      }
    } catch {
      setExportState('error');
    }
  };

  const handleDownload = () => {
    if (!downloadUrl || !downloadFilename) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = downloadFilename;
    a.click();
    URL.revokeObjectURL(downloadUrl);
    setDownloadUrl('');
    setExportState('idle');
  };

  const canExport = exportStartDate && exportEndDate && exportState !== 'loading';

  return (
    <div className="min-h-screen bg-background-primary dark:bg-background-primary">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <BackButton href="/mynonprofit" />
        <h1 className="page-title text-xl sm:text-2xl font-bold text-text-primary dark:text-text-primary mt-4 mb-2">
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

            {/* Export Impact Report */}
            <Card className="p-4 sm:p-5">
              <h2 className="text-lg font-semibold text-text-primary dark:text-text-primary mb-3 flex items-center gap-2">
                <HiDownload className="h-5 w-5" />
                {tExport('exportButton')}
              </h2>
              <p className="text-sm text-text-secondary dark:text-text-secondary mb-4">
                {tExport('dateRangeTooltip')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
                <div className="flex-1 min-w-0">
                  <Label htmlFor="export-start" className="text-xs">{tExport('reportingPeriod')}</Label>
                  <div className="flex gap-2 mt-1">
                    <TextInput
                      id="export-start"
                      type="date"
                      value={exportStartDate}
                      onChange={(e) => setExportStartDate(e.target.value)}
                      className="flex-1 min-w-0"
                    />
                    <span className="self-center text-text-tertiary">–</span>
                    <TextInput
                      id="export-end"
                      type="date"
                      value={exportEndDate}
                      onChange={(e) => setExportEndDate(e.target.value)}
                      className="flex-1 min-w-0"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleExport}
                  disabled={!canExport}
                  className="w-full sm:w-auto min-h-[44px] min-w-[160px]"
                >
                  {exportState === 'loading' ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      {tExport('generating')}
                    </>
                  ) : (
                    tExport('exportButton')
                  )}
                </Button>
              </div>
              {exportState === 'success' && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Button color="success" size="sm" onClick={handleDownload} className="min-h-[44px]">
                    <HiDownload className="mr-2 h-4 w-4" />
                    {tExport('downloadExcel')}
                  </Button>
                </div>
              )}
              {exportState === 'error' && (
                <p className="mt-4 text-sm text-red-600 dark:text-red-400">
                  {tExport('errorGeneric')}
                </p>
              )}
              {exportState === 'zero' && (
                <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
                  {tExport('zeroActivities')}
                </p>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
