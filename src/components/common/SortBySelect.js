'use client';

import Select from 'react-select';
import { useTheme } from '@/utils/theme/ThemeContext';

/**
 * SortBySelect - Reusable sort dropdown matching the members page design.
 * Uses react-select with consistent styling across dashboard, NPO dashboard, and activities pages.
 */
export default function SortBySelect({ value, onChange, options, label, className = '' }) {
  const { isDark } = useTheme();

  const selectStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderColor: isDark ? '#334155' : '#e2e8f0',
      color: isDark ? '#f8fafc' : '#0f172a',
      minHeight: '44px',
      fontSize: '14px',
      '&:hover': {
        borderColor: isDark ? '#fb923c' : '#f97316',
      },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderColor: isDark ? '#334155' : '#e2e8f0',
      zIndex: 9999,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? (isDark ? '#334155' : '#e0f2fe')
        : state.isFocused
        ? (isDark ? '#334155' : '#f1f5f9')
        : isDark ? '#1e293b' : '#ffffff',
      color: state.isSelected
        ? (isDark ? '#f8fafc' : '#0284c7')
        : isDark ? '#f8fafc' : '#0f172a',
      padding: '12px 14px',
      minHeight: '44px',
      fontSize: '14px',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: isDark ? '#475569' : '#e0f2fe',
      },
    }),
    placeholder: (base) => ({
      ...base,
      color: isDark ? '#94a3b8' : '#64748b',
    }),
    singleValue: (base) => ({
      ...base,
      color: isDark ? '#f8fafc' : '#0f172a',
    }),
  };

  const selectedOption = options.find((opt) => opt.value === value) || null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-text-primary dark:text-text-primary">{label}</label>
      )}
      <Select
        options={options}
        value={selectedOption}
        onChange={(selectedOption) => onChange(selectedOption ? selectedOption.value : options[0]?.value)}
        className="basic-single-select w-full sm:w-auto"
        classNamePrefix="select"
        styles={selectStyles}
        isClearable={false}
      />
    </div>
  );
}
