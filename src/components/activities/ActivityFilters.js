'use client';

import { useState, useEffect } from 'react';
import { Button, Select } from 'flowbite-react';
import { HiFilter, HiX, HiChevronDown, HiChevronUp } from 'react-icons/hi';
import { useTranslations, useLocale } from 'next-intl';
import { countries } from 'countries-list';
import categories from '@/constant/categories';
import { getSkillsForSelect } from '@/utils/crudSkills';
import { sdgNames } from '@/constant/sdgs';

export default function ActivityFilters({
  filters,
  onFiltersChange,
  availableCountries,
  availableCategories,
  availableSkills,
  availableSDGs,
  availableStatuses,
}) {
  const t = useTranslations('Activities');
  const tManage = useTranslations('ManageActivities');
  const tStatus = useTranslations('StatusUpdateModal');
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [skillLabelsMap, setSkillLabelsMap] = useState({});
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);

  // Load skill labels for translation
  useEffect(() => {
    const loadSkillLabels = async () => {
      if (!availableSkills || availableSkills.length === 0) {
        setSkillLabelsMap({});
        return;
      }

      try {
        setIsLoadingSkills(true);
        const skillOptions = await getSkillsForSelect(locale);
        // Create a flat map of all skills for easy lookup
        const allSkills = skillOptions.reduce((acc, group) => {
          return [...acc, ...group.options];
        }, []);

        // Create a mapping from skill ID to label
        const labelsMap = {};
        availableSkills.forEach(skillId => {
          const foundSkill = allSkills.find(s => s.value === skillId);
          if (foundSkill) {
            labelsMap[skillId] = foundSkill.label;
          } else {
            // Fallback to ID if not found
            labelsMap[skillId] = skillId;
          }
        });

        setSkillLabelsMap(labelsMap);
      } catch (error) {
        console.error('Error loading skill labels:', error);
        // Fallback: create map with IDs as labels
        const fallbackMap = {};
        availableSkills.forEach(skillId => {
          fallbackMap[skillId] = skillId;
        });
        setSkillLabelsMap(fallbackMap);
      } finally {
        setIsLoadingSkills(false);
      }
    };

    loadSkillLabels();
  }, [availableSkills, locale]);

  const handleFilterChange = (filterKey, value) => {
    onFiltersChange({
      ...filters,
      [filterKey]: value,
    });
  };

  const clearFilters = () => {
    const clearedFilters = {
      type: 'all',
      category: 'all',
      country: 'all',
      skill: 'all',
    };
    // Include sdg if it exists (for activities page)
    if (filters.sdg !== undefined) {
      clearedFilters.sdg = 'all';
    }
    // Include startDate if it exists (for activities page)
    if (filters.startDate !== undefined) {
      clearedFilters.startDate = 'all';
    }
    // Include status if it exists (for admin pages)
    if (filters.status !== undefined) {
      clearedFilters.status = 'all';
    }
    // Preserve organization filter if it exists (for admin pages)
    if (filters.organization !== undefined) {
      clearedFilters.organization = 'all';
    }
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = 
    filters.type !== 'all' ||
    filters.category !== 'all' ||
    filters.country !== 'all' ||
    filters.skill !== 'all' ||
    (filters.sdg !== undefined && filters.sdg !== 'all') ||
    (filters.startDate !== undefined && filters.startDate !== 'all') ||
    (filters.status !== undefined && filters.status !== 'all');

  // Get categories based on selected type and available categories from filtered list
  const getCategoriesForType = () => {
    // If availableCategories is provided (filtered list), use those
    if (availableCategories && availableCategories.length > 0) {
      // Map available category IDs to category objects
      const allCats = [
        ...categories.online,
        ...categories.local,
        ...categories.event,
      ];
      return allCats.filter(cat => availableCategories.includes(cat.id));
    }
    
    // Fallback to all categories if no filtered list provided
    if (filters.type === 'all') {
      const allCats = [
        ...categories.online,
        ...categories.local,
        ...categories.event,
      ];
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
          className="w-full flex items-center justify-between p-4 bg-background-card dark:bg-background-card rounded-lg shadow-sm border border-border-light dark:border-border-dark hover:bg-background-hover dark:hover:bg-background-hover transition-colors"
        >
          <div className="flex items-center gap-2">
            <HiFilter className="h-5 w-5 text-text-primary dark:text-text-primary" />
            <span className="font-medium text-text-primary dark:text-text-primary">{t('filters')}</span>
          </div>
          {isOpen ? (
            <HiChevronUp className="h-5 w-5 text-text-primary dark:text-text-primary" />
          ) : (
            <HiChevronDown className="h-5 w-5 text-text-primary dark:text-text-primary" />
          )}
        </button>
        {isOpen && (
          <div className="mt-2 p-4 bg-background-card dark:bg-background-card rounded-lg shadow-sm border border-border-light dark:border-border-dark space-y-4">
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
      <div className="hidden md:flex flex-wrap items-end gap-4 p-4 bg-background-card dark:bg-background-card rounded-lg shadow-sm border border-border-light dark:border-border-dark">
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
          <label className="block mb-1 text-sm font-medium text-text-primary dark:text-text-primary">
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
            className="w-full bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border-border-light dark:border-border-dark"
          >
            <option value="all">{t('allTypes')}</option>
            <option value="online">{t('online')}</option>
            <option value="local">{t('local')}</option>
            <option value="event">{t('event')}</option>
          </Select>
        </div>

        {/* Category Filter */}
        <div className="flex-1 min-w-[150px]">
          <label className="block mb-1 text-sm font-medium text-text-primary dark:text-text-primary">
            {t('filterCategoryLabel')}
          </label>
          <Select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border-border-light dark:border-border-dark"
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
            <label className="block mb-1 text-sm font-medium text-text-primary dark:text-text-primary">
              {t('filterLocationLabel')}
            </label>
            <Select
              value={filters.country}
              onChange={(e) => handleFilterChange('country', e.target.value)}
              className="w-full bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border-border-light dark:border-border-dark"
            >
              <option value="all">{t('allCountries')}</option>
              {availableCountries.map((countryCode) => {
                const countryData = countries[countryCode];
                const countryName = countryData ? countryData.name : countryCode;
                return (
                  <option key={countryCode} value={countryCode}>
                    {countryName}
                  </option>
                );
              })}
            </Select>
          </div>
        )}

        {/* Skills Filter */}
        {availableSkills && availableSkills.length > 0 && (
          <div className="flex-1 min-w-[150px]">
            <label className="block mb-1 text-sm font-medium text-text-primary dark:text-text-primary">
              {t('filterSkillLabel')}
            </label>
            <Select
              value={filters.skill}
              onChange={(e) => handleFilterChange('skill', e.target.value)}
              className="w-full bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border-border-light dark:border-border-dark"
              disabled={isLoadingSkills}
            >
              <option value="all">{t('allSkills')}</option>
              {availableSkills.map((skillId) => (
                <option key={skillId} value={skillId}>
                  {skillLabelsMap[skillId] || skillId}
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* SDG Filter */}
        {filters.sdg !== undefined && availableSDGs && availableSDGs.length > 0 && (
          <div className="flex-1 min-w-[150px]">
            <label className="block mb-1 text-sm font-medium text-text-primary dark:text-text-primary">
              {t('filterSdgLabel') || 'SDG'}
            </label>
            <Select
              value={filters.sdg || 'all'}
              onChange={(e) => handleFilterChange('sdg', e.target.value)}
              className="w-full bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border-border-light dark:border-border-dark"
            >
              <option value="all">{t('allSDGs') || 'All SDGs'}</option>
              {availableSDGs.map((sdgNum) => (
                <option key={sdgNum} value={sdgNum}>
                  {sdgNames[sdgNum] ? `SDG ${sdgNum}: ${sdgNames[sdgNum]}` : `SDG ${sdgNum}`}
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* Start Date Filter */}
        {filters.startDate !== undefined && (
          <div className="flex-1 min-w-[150px]">
            <label className="block mb-1 text-sm font-medium text-text-primary dark:text-text-primary">
              {t('filterStartDateLabel') || 'Start Date'}
            </label>
            <Select
              value={filters.startDate || 'all'}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border-border-light dark:border-border-dark"
            >
              <option value="all">{t('allDates') || 'All Dates'}</option>
              <option value="today">{t('today') || 'Today'}</option>
              <option value="tomorrow">{t('tomorrow') || 'Tomorrow'}</option>
              <option value="thisWeek">{t('thisWeek') || 'This Week'}</option>
              <option value="thisWeekend">{t('thisWeekend') || 'This Weekend'}</option>
              <option value="thisMonth">{t('thisMonth') || 'This Month'}</option>
              <option value="thisYear">{t('thisYear') || 'This Year'}</option>
              <option value="nextWeek">{t('nextWeek') || 'Next Week'}</option>
              <option value="nextMonth">{t('nextMonth') || 'Next Month'}</option>
              <option value="nextYear">{t('nextYear') || 'Next Year'}</option>
            </Select>
          </div>
        )}

        {/* Status Filter */}
        {filters.status !== undefined && (
          <div className="flex-1 min-w-[150px]">
            <label className="block mb-1 text-sm font-medium text-text-primary dark:text-text-primary">
              Status
            </label>
            <Select
              value={filters.status || 'all'}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border-border-light dark:border-border-dark"
            >
              <option value="all">All Statuses</option>
              {availableStatuses && availableStatuses.length > 0 ? (
                availableStatuses.map((status) => (
                  <option key={status} value={status}>
                    {tStatus(`status.${status}`) || status}
                  </option>
                ))
              ) : (
                <>
                  <option value="Draft">{tStatus('status.Draft')}</option>
                  <option value="Open">{tStatus('status.Open')}</option>
                  <option value="Closed">{tStatus('status.Closed')}</option>
                </>
              )}
            </Select>
          </div>
        )}
      </>
    );
  }
}

