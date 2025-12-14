'use client';

import { useState } from 'react';
import { Button, Select } from 'flowbite-react';
import { HiFilter, HiX, HiChevronDown, HiChevronUp } from 'react-icons/hi';
import { useTranslations } from 'next-intl';
import categories from '@/constant/categories';

export default function ActivityFilters({
  filters,
  onFiltersChange,
  availableCountries,
  availableCategories,
  availableSkills,
}) {
  const t = useTranslations('Activities');
  const tManage = useTranslations('ManageActivities');
  const tStatus = useTranslations('StatusUpdateModal');
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (filterKey, value) => {
    onFiltersChange({
      ...filters,
      [filterKey]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      type: 'all',
      category: 'all',
      country: 'all',
      skill: 'all',
      status: 'all',
    });
  };

  const hasActiveFilters = 
    filters.type !== 'all' ||
    filters.category !== 'all' ||
    filters.country !== 'all' ||
    filters.skill !== 'all' ||
    (filters.status !== undefined && filters.status !== 'all');

  // Get categories based on selected type
  const getCategoriesForType = () => {
    if (filters.type === 'all') {
      // Return all categories from all types
      const allCats = [
        ...categories.online,
        ...categories.local,
        ...categories.event,
      ];
      // Remove duplicates
      const uniqueCats = Array.from(
        new Map(allCats.map(cat => [cat.id, cat])).values()
      );
      return uniqueCats;
    }
    return categories[filters.type] || [];
  };

  const categoryOptions = getCategoriesForType();

  return (
    <div className="w-full mb-6">
      {/* Mobile: Collapsible Section */}
      <div className="block md:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <HiFilter className="h-5 w-5" />
            <span className="font-medium">{t('filters')}</span>
          </div>
          {isOpen ? (
            <HiChevronUp className="h-5 w-5" />
          ) : (
            <HiChevronDown className="h-5 w-5" />
          )}
        </button>
        {isOpen && (
          <div className="mt-2 p-4 bg-white rounded-lg shadow-sm border border-gray-200 space-y-4">
            {renderFilters()}
            {hasActiveFilters && (
              <Button
                color="gray"
                size="sm"
                onClick={clearFilters}
                className="w-full"
              >
                <HiX className="mr-2 h-4 w-4" />
                {t('clearAllFilters')}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Desktop: Horizontal Layout */}
      <div className="hidden md:flex flex-wrap items-end gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        {renderFilters()}
        {hasActiveFilters && (
          <Button
            color="gray"
            size="sm"
            onClick={clearFilters}
          >
            <HiX className="mr-2 h-4 w-4" />
            {t('clearAll')}
          </Button>
        )}
      </div>
    </div>
  );

  function renderFilters() {
    return (
      <>
        {/* Type Filter */}
        <div className="flex-1 min-w-[150px]">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            {t('filterTypeLabel')}
          </label>
          <Select
            value={filters.type}
            onChange={(e) => {
              // Update both type and category in a single state update
              onFiltersChange({
                ...filters,
                type: e.target.value,
                category: 'all', // Reset category when type changes
              });
            }}
            className="w-full"
          >
            <option value="all">{t('allTypes')}</option>
            <option value="online">{t('online')}</option>
            <option value="local">{t('local')}</option>
            <option value="event">{t('event')}</option>
          </Select>
        </div>

        {/* Category Filter */}
        <div className="flex-1 min-w-[150px]">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            {t('filterCategoryLabel')}
          </label>
          <Select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full"
            disabled={filters.type === 'all' && categoryOptions.length === 0}
          >
            <option value="all">{t('allCategories')}</option>
            {categoryOptions.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {(() => {
                  try {
                    return tManage(cat.id);
                  } catch {
                    return cat.id;
                  }
                })()}
              </option>
            ))}
          </Select>
        </div>

        {/* Country Filter */}
        {availableCountries && availableCountries.length > 0 && (
          <div className="flex-1 min-w-[150px]">
            <label className="block mb-1 text-sm font-medium text-gray-700">
              {t('filterLocationLabel')}
            </label>
            <Select
              value={filters.country}
              onChange={(e) => handleFilterChange('country', e.target.value)}
              className="w-full"
            >
              <option value="all">{t('allCountries')}</option>
              {availableCountries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* Skills Filter */}
        {availableSkills && availableSkills.length > 0 && (
          <div className="flex-1 min-w-[150px]">
            <label className="block mb-1 text-sm font-medium text-gray-700">
              {t('filterSkillLabel')}
            </label>
            <Select
              value={filters.skill}
              onChange={(e) => handleFilterChange('skill', e.target.value)}
              className="w-full"
            >
              <option value="all">{t('allSkills')}</option>
              {availableSkills.map((skill) => (
                <option key={skill} value={skill}>
                  {skill}
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* Status Filter */}
        {filters.status !== undefined && (
          <div className="flex-1 min-w-[150px]">
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Status
            </label>
            <Select
              value={filters.status || 'all'}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full"
            >
              <option value="all">All Statuses</option>
              <option value="Draft">{tStatus('status.Draft')}</option>
              <option value="Open">{tStatus('status.Open')}</option>
              <option value="Closed">{tStatus('status.Closed')}</option>
            </Select>
          </div>
        )}
      </>
    );
  }
}

