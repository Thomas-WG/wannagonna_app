'use client';

import { useState } from 'react';
import { Button, Select } from 'flowbite-react';
import { HiFilter, HiX, HiChevronDown, HiChevronUp } from 'react-icons/hi';
import { useTranslations } from 'next-intl';
import categories from '@/constant/categories';
import { allSDGs, sdgNames } from '@/constant/sdgs';

export default function ActivityFilters({
  filters,
  onFiltersChange,
  availableCountries,
  availableCategories,
  availableSkills,
}) {
  const t = useTranslations('ActivityCard');
  const tManage = useTranslations('ManageActivities');
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
      sdg: 'all',
      skill: 'all',
    });
  };

  const hasActiveFilters = 
    filters.type !== 'all' ||
    filters.category !== 'all' ||
    filters.country !== 'all' ||
    filters.sdg !== 'all' ||
    filters.skill !== 'all';

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
            <span className="font-medium">Filters</span>
            {hasActiveFilters && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                Active
              </span>
            )}
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
                Clear All Filters
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
            Clear All
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
            Type
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
            <option value="all">All Types</option>
            <option value="online">Online</option>
            <option value="local">Local</option>
            <option value="event">Event</option>
          </Select>
        </div>

        {/* Category Filter */}
        <div className="flex-1 min-w-[150px]">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Category
          </label>
          <Select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full"
            disabled={filters.type === 'all' && categoryOptions.length === 0}
          >
            <option value="all">All Categories</option>
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
              Location
            </label>
            <Select
              value={filters.country}
              onChange={(e) => handleFilterChange('country', e.target.value)}
              className="w-full"
            >
              <option value="all">All Countries</option>
              {availableCountries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* SDG Filter */}
        <div className="flex-1 min-w-[150px]">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            SDG
          </label>
          <Select
            value={filters.sdg}
            onChange={(e) => handleFilterChange('sdg', e.target.value)}
            className="w-full"
          >
            <option value="all">All SDGs</option>
            {allSDGs.map((sdg) => (
              <option key={sdg.id} value={sdg.id}>
                {sdg.id}: {sdgNames[sdg.id] || `SDG ${sdg.name}`}
              </option>
            ))}
          </Select>
        </div>

        {/* Skills Filter */}
        {availableSkills && availableSkills.length > 0 && (
          <div className="flex-1 min-w-[150px]">
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Skill
            </label>
            <Select
              value={filters.skill}
              onChange={(e) => handleFilterChange('skill', e.target.value)}
              className="w-full"
            >
              <option value="all">All Skills</option>
              {availableSkills.map((skill) => (
                <option key={skill} value={skill}>
                  {skill}
                </option>
              ))}
            </Select>
          </div>
        )}
      </>
    );
  }
}

