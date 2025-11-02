import { useTranslations } from 'use-intl';
import { Card } from 'flowbite-react';
import { HiQuestionMarkCircle } from 'react-icons/hi';
import { categoryIcons } from '@/constant/categoryIcons';

export default function CategorySelector({ availableCategories, formData, setFormData }) {
  const t = useTranslations('ManageActivities');

  return (
    <Card className="w-full p-4 sm:p-6 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
      <div className='space-y-4 sm:space-y-6'>
        <div className="text-center sm:text-left">
          <h5 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t('category-label')}
          </h5>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Choose the category that best matches your activity
          </p>
        </div>
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4'>
          {availableCategories.map(({ id }) => {
            const Icon = categoryIcons[id] || HiQuestionMarkCircle;
            const isSelected = formData.category === id;
            return (
              <Card
                key={id}
                className={`relative cursor-pointer transition-all duration-300 touch-manipulation ${
                  isSelected
                    ? 'border-2 border-orange-500 bg-orange-500 dark:bg-orange-600 shadow-xl scale-105 ring-2 ring-orange-200 dark:ring-orange-800'
                    : 'border-2 border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-600 hover:shadow-md hover:scale-105 active:scale-95 bg-white dark:bg-gray-800'
                }`}
                onClick={() => {
                  setFormData((prev) => ({ ...prev, category: id }));
                }}
              >
                <div className="flex flex-col items-center justify-center space-y-2 p-3 sm:p-4">
                  <Icon className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors ${
                    isSelected
                      ? 'text-white'
                      : 'text-gray-700 dark:text-gray-300'
                  }`} />
                  <h5 className={`text-xs sm:text-sm font-medium text-center leading-tight ${
                    isSelected
                      ? 'text-white'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {t(`${id}`)}
                  </h5>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </Card>
  );
} 