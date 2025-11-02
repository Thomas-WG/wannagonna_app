import Image from 'next/image';
import { useTranslations } from 'use-intl';
import { Card } from 'flowbite-react';

export default function SDGSelector({ formData, setFormData, organizationData }) {
  const t = useTranslations('ManageActivities');

  // All available SDGs
  const allSDGs = [
    { id: '1', name: 1 },
    { id: '2', name: 2 },
    { id: '3', name: 3 },
    { id: '4', name: 4 },
    { id: '5', name: 5 },
    { id: '6', name: 6 },
    { id: '7', name: 7 },
    { id: '8', name: 8 },
    { id: '9', name: 9 },
    { id: '10', name: 10 },
    { id: '11', name: 11 },
    { id: '12', name: 12 },
    { id: '13', name: 13 },
    { id: '14', name: 14 },
    { id: '15', name: 15 },
    { id: '16', name: 16 },
    { id: '17', name: 17 },
  ];

  // Filter SDGs based on organization's associated SDGs
  // If organizationData is not provided or has no sdgs, show all SDGs
  const availableSDGs = organizationData?.sdgs && organizationData.sdgs.length > 0 
    ? allSDGs.filter(sdg => {
        // Handle both numeric format (1, 2, 3) and "Goal-XX" format (Goal-01, Goal-02, etc.)
        const goalFormat = `Goal-${sdg.id.padStart(2, '0')}`;
        return organizationData.sdgs.includes(sdg.name) || organizationData.sdgs.includes(goalFormat);
      })
    : allSDGs;

  return (
    <Card className="w-full p-4 sm:p-6 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
      <div className="space-y-4 sm:space-y-6">
        <div className="text-center sm:text-left">
          <label className='block text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2'>
            {t('sdg-label')}
          </label>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{t('sdg-helper')}</p>
        </div>
        
        {organizationData?.sdgs && organizationData.sdgs.length > 0 && (
          <div className='bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4'>
            <p className='text-sm sm:text-base text-blue-800 dark:text-blue-200 font-medium'>
              Showing SDGs associated with your organization ({availableSDGs.length} of 17)
            </p>
            {process.env.NODE_ENV === 'development' && (
              <p className='text-xs text-blue-600 dark:text-blue-400 mt-1'>
                Organization SDGs: {JSON.stringify(organizationData.sdgs)}
              </p>
            )}
          </div>
        )}
        
        <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3'>
          {availableSDGs.map(({ id, name }) => {
            const isSelected = formData.sdg === name;
            return (
              <div
                key={id}
                className={`flex flex-col items-center justify-center p-2 sm:p-3 cursor-pointer rounded-lg transition-all duration-200 touch-manipulation ${
                  isSelected
                    ? 'bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-500 dark:border-orange-400 shadow-lg scale-105 ring-2 ring-orange-200 dark:ring-orange-800'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-md hover:scale-105 active:scale-95 border-2 border-transparent'
                }`}
                onClick={() => setFormData((prev) => ({ ...prev, sdg: name }))}
              >
                <div className={`relative ${isSelected ? 'animate-pulse' : ''}`}>
                  <Image
                    src={
                      isSelected
                        ? `/icons/sdgs/c-${id}.png`
                        : `/icons/sdgs/w-${id}.png`
                    }
                    alt={`SDG ${name}`}
                    className="transition-all duration-200"
                    style={{ width: '100%', height: 'auto' }}
                    width={90} 
                    height={90}
                    priority={false}
                  />
                </div>
                {isSelected && (
                  <div className="mt-2 text-xs font-semibold text-orange-600 dark:text-orange-400">
                    Selected
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
} 