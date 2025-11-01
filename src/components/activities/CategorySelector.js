import { useTranslations } from 'use-intl';
import { Card } from 'flowbite-react';
import { HiQuestionMarkCircle } from 'react-icons/hi';
import { categoryIcons } from '@/constant/categoryIcons';

export default function CategorySelector({ availableCategories, formData, setFormData }) {
  const t = useTranslations('ManageActivities');

  return (
    <Card className="w-full p-1 space-y-6">
      <div className='space-y-4'>
        <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          {t('category-label')}
        </h5>
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'>
          {availableCategories.map(({ id }) => {
            const Icon = categoryIcons[id] || HiQuestionMarkCircle;
            return (
              <Card
                key={id}
                className={`relative cursor-pointer transition-all duration-300 hover:scale-105 ${
                  formData.category === id
                    ? 'border-orange-400 bg-orange-400 dark:bg-orange-900/20 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-800'
                }`}
                onClick={() => {
                  setFormData((prev) => ({ ...prev, category: id }));
                }}
              >
                <div className="flex flex-col items-center justify-center space-y-2">
                  <Icon className={`w-8 h-8 ${
                    formData.category === id
                      ? 'text-white dark:text-orange-400'
                      : 'text-gray-700 dark:text-gray-300'
                  }`} />
                  <h5 className={`text-sm font-medium text-center ${
                    formData.category === id
                      ? 'text-white dark:text-orange-400'
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