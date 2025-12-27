'use client';

import { useState, memo } from 'react';
import { Card, Select } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import { useActivityAnalytics } from '@/hooks/dashboard/useActivityAnalytics';
import { HiTrendingUp, HiUsers, HiStar, HiChartBar } from 'react-icons/hi';

/**
 * ActivityAnalytics Component
 * Displays analytics and metrics for activities
 */
const ActivityAnalytics = memo(function ActivityAnalytics({ organizationId }) {
  const t = useTranslations('MyNonProfit');
  const [timeRange, setTimeRange] = useState('all');

  const { metrics, chartData, isLoading } = useActivityAnalytics(organizationId, timeRange);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500 dark:border-primary-400"></div>
      </div>
    );
  }

  return (
    <div className="mt-6 sm:mt-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-text-primary dark:text-text-primary">
          {t('activityAnalytics') || 'Activity Analytics'}
        </h2>
        <Select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="w-full sm:w-auto bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border-border-light dark:border-border-dark"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="all">All time</option>
        </Select>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-background-card dark:bg-background-card">
          <div className="flex items-center gap-3">
            <div className="bg-primary-100 dark:bg-primary-900 p-3 rounded-full">
              <HiChartBar className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-sm text-text-secondary dark:text-text-secondary">
                {t('totalActivities') || 'Total Activities'}
              </p>
              <p className="text-2xl font-bold text-text-primary dark:text-text-primary">
                {metrics.totalActivities}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-background-card dark:bg-background-card">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
              <HiUsers className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-text-secondary dark:text-text-secondary">
                {t('totalApplications') || 'Total Applications'}
              </p>
              <p className="text-2xl font-bold text-text-primary dark:text-text-primary">
                {metrics.totalApplications}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-background-card dark:bg-background-card">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
              <HiStar className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-text-secondary dark:text-text-secondary">
                {t('totalXP') || 'Total XP'}
              </p>
              <p className="text-2xl font-bold text-text-primary dark:text-text-primary">
                {metrics.totalXP}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-background-card dark:bg-background-card">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
              <HiTrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-text-secondary dark:text-text-secondary">
                {t('averageXP') || 'Average XP'}
              </p>
              <p className="text-2xl font-bold text-text-primary dark:text-text-primary">
                {metrics.averageXP}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <Card className="bg-background-card dark:bg-background-card">
          <h3 className="text-lg font-semibold mb-4 text-text-primary dark:text-text-primary">
            {t('statusBreakdown') || 'Status Breakdown'}
          </h3>
          <div className="space-y-2">
            {chartData.statusChart.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="text-sm text-text-secondary dark:text-text-secondary">
                  {item.name}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{
                        width: `${
                          (item.value / metrics.totalActivities) * 100 || 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-text-primary dark:text-text-primary w-8 text-right">
                    {item.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Type Breakdown */}
        <Card className="bg-background-card dark:bg-background-card">
          <h3 className="text-lg font-semibold mb-4 text-text-primary dark:text-text-primary">
            {t('typeBreakdown') || 'Type Breakdown'}
          </h3>
          <div className="space-y-2">
            {chartData.typeChart.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="text-sm text-text-secondary dark:text-text-secondary capitalize">
                  {item.name}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{
                        width: `${
                          (item.value / metrics.totalActivities) * 100 || 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-text-primary dark:text-text-primary w-8 text-right">
                    {item.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
});

export default ActivityAnalytics;

