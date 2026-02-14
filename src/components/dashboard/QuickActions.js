'use client';

import { Card } from 'flowbite-react';
import { HiDocumentText, HiCog, HiUsers } from 'react-icons/hi';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { memo } from 'react';

/**
 * QuickActions Component
 * Displays quick action cards for review applications and organization edit
 */
const QuickActions = memo(function QuickActions({ orgData }) {
  const t = useTranslations('MyNonProfit');
  const router = useRouter();

  return (
    <div className="mb-6 sm:mb-8">
      <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 px-1 text-text-primary dark:text-text-primary">
        {t('quickActions')}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* New Applications Card - With Badge */}
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer relative"
          onClick={() => router.push('/mynonprofit/activities/applications')}
        >
          <div className="flex items-center gap-2 sm:gap-3 py-1 sm:py-1.5 px-2 sm:px-2.5">
            {/* Badge indicator */}
            {orgData?.totalNewApplications > 0 && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-xs sm:text-sm font-bold shadow-lg animate-pulse">
                {orgData.totalNewApplications > 99 ? '99+' : orgData.totalNewApplications}
              </div>
            )}
            <div
              className={`p-2 rounded-full flex-shrink-0 transition-colors ${
                orgData?.totalNewApplications > 0 ? 'bg-yellow-500' : 'bg-yellow-100'
              }`}
            >
              <HiDocumentText
                className={`h-5 w-5 sm:h-6 sm:w-6 ${
                  orgData?.totalNewApplications > 0 ? 'text-white' : 'text-yellow-600'
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xs sm:text-sm font-semibold text-text-primary dark:text-text-primary">
                {t('reviewApplications')}
              </h2>
              {orgData?.totalNewApplications > 0 && (
                <p className="text-[10px] sm:text-xs text-text-tertiary dark:text-text-tertiary mt-0.5">
                  {t('requiresAttention')}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Participants Card */}
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer bg-background-card dark:bg-background-card border-border-light dark:border-border-dark"
          onClick={() => router.push('/mynonprofit/participants')}
        >
          <div className="flex items-center gap-2 sm:gap-3 py-1 sm:py-1.5 px-2 sm:px-2.5">
            <div className="bg-semantic-error-100 dark:bg-semantic-error-900 p-2 rounded-full flex-shrink-0">
              <HiUsers className="h-5 w-5 sm:h-6 sm:w-6 text-semantic-error-600 dark:text-semantic-error-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xs sm:text-sm font-semibold text-text-primary dark:text-text-primary">
                {t('participants')}
              </h2>
              <p className="text-[10px] sm:text-xs text-semantic-error-600 dark:text-semantic-error-400 font-medium mt-0.5">
                {t('participantsListSubtitle') || 'View list'}
              </p>
            </div>
          </div>
        </Card>

        {/* Edit Organization Card */}
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer bg-background-card dark:bg-background-card border-border-light dark:border-border-dark"
          onClick={() => router.push('/mynonprofit/organization/edit')}
        >
          <div className="flex items-center gap-2 sm:gap-3 py-1 sm:py-1.5 px-2 sm:px-2.5">
            <div className="bg-semantic-info-100 dark:bg-semantic-info-900 p-2 rounded-full flex-shrink-0">
              <HiCog className="h-5 w-5 sm:h-6 sm:w-6 text-semantic-info-600 dark:text-semantic-info-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xs sm:text-sm font-semibold text-text-primary dark:text-text-primary">
                {t('organization')}
              </h2>
              <p className="text-[10px] sm:text-xs text-semantic-info-600 dark:text-semantic-info-400 font-medium mt-0.5">
                {t('editInformation')}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
});

export default QuickActions;

