import { useMemo } from 'react';
import { Card, Progress } from 'flowbite-react';
import { useTheme } from '@/utils/theme/ThemeContext';

/**
 * ProfileProgress component displays completion percentage and missing fields
 * Responsive design: compact on mobile, detailed on desktop
 */
export default function ProfileProgress({ formData }) {
  const { isDark } = useTheme();

  const { percentage, completedFields, totalFields, missingFields } = useMemo(() => {
    // Match the requirements from isProfileComplete function
    const fields = [
      { key: 'displayName', label: 'Display Name', value: formData?.displayName },
      { key: 'bio', label: 'Bio', value: formData?.bio },
      { key: 'cause', label: 'Cause', value: formData?.cause },
      { key: 'hobbies', label: 'Hobbies', value: formData?.hobbies },
      { key: 'country', label: 'Country', value: formData?.country },
      { key: 'languages', label: 'Languages', value: formData?.languages, isArray: true },
      { key: 'profilePicture', label: 'Profile Picture', value: formData?.profilePicture },
      { key: 'timeCommitment', label: 'Time Commitment', value: formData?.timeCommitment, isObject: true },
      { key: 'availabilities', label: 'Availability', value: formData?.availabilities, isObject: true },
    ];

    let completed = 0;
    const missing = [];

    fields.forEach((field) => {
      let isComplete = false;

      if (field.isArray) {
        isComplete = Array.isArray(field.value) && field.value.length > 0;
      } else if (field.isObject) {
        isComplete = field.value && typeof field.value === 'object' && Object.values(field.value).some((v) => v === true);
      } else {
        isComplete = field.value && String(field.value).trim() !== '';
      }

      if (isComplete) {
        completed++;
      } else {
        missing.push(field.label);
      }
    });

    const total = fields.length;
    const percentage = Math.round((completed / total) * 100);

    return { percentage, completedFields: completed, totalFields: total, missingFields: missing };
  }, [formData]);

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

