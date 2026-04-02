import { useMemo } from 'react';
import { Card, Progress } from 'flowbite-react';
import { useTheme } from '@/utils/theme/ThemeContext';
import { getProfileCompletionState } from '@/utils/profileHelpers';

/**
 * ProfileProgress component displays completion percentage and missing fields
 * Uses the same rules as isProfileComplete / complete-profile badge.
 */
export default function ProfileProgress({ formData }) {
  const { isDark } = useTheme();

  const { percentage, completedFields, totalFields, missingFields } = useMemo(
    () => getProfileCompletionState(formData),
    [formData]
  );

  return (
    <Card className="w-full bg-white dark:bg-gray-800 border-border-light dark:border-border-dark sticky top-0 z-40 shadow-md backdrop-blur-sm">
      <div className="p-4 md:p-6">
        {/* Mobile: Compact view */}
        <div className="block md:hidden">
          <div className="flex items-center justify-between mb-2">
            <h6 className="text-sm font-semibold text-text-primary dark:text-text-primary">
              Profile Progress
            </h6>
            <span className="text-sm font-bold text-text-primary dark:text-text-primary">
              {percentage}%
            </span>
          </div>
          <Progress
            progress={percentage}
            color="blue"
            className="h-2"
          />
        </div>

        {/* Desktop: Detailed view */}
        <div className="hidden md:block">
          <h6 className="text-lg font-semibold text-text-primary dark:text-text-primary mb-4">
            Profile Progress
          </h6>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary dark:text-text-secondary">
                {completedFields} of {totalFields} sections completed
              </span>
              <span className="text-sm font-bold text-text-primary dark:text-text-primary">
                {percentage}%
              </span>
            </div>
            <Progress
              progress={percentage}
              color="blue"
              className="h-2.5"
            />
            {missingFields.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-text-tertiary dark:text-text-tertiary">
                  <span className="font-medium">Still needed:</span>{' '}
                  <span className="text-text-secondary dark:text-text-secondary">
                    {missingFields.join(', ')}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

