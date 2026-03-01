'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Select from 'react-select';
import { fetchAddresses } from '@/utils/crudAddresses';
import { useTheme } from '@/utils/theme/ThemeContext';
import { HiLocationMarker, HiPlus } from 'react-icons/hi';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

/**
 * AddressSelector Component
 * Dropdown for selecting saved addresses
 */
export default function AddressSelector({
  organizationId,
  value,
  onChange,
  allowAddNew = true,
  className = '',
  placeholder = 'Select an address'
}) {
  const t = useTranslations('MyNonProfit');
  const router = useRouter();
  const { isDark } = useTheme();
  const [selectedOption, setSelectedOption] = useState(null);

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ['addresses', organizationId],
    queryFn: () => fetchAddresses(organizationId),
    enabled: !!organizationId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000
  });

  // Custom styles for react-select with dark mode support
  const selectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderColor: state.isFocused 
        ? (isDark ? '#fb923c' : '#f97316')
        : (isDark ? '#334155' : '#e2e8f0'),
      boxShadow: state.isFocused 
        ? `0 0 0 1px ${isDark ? '#fb923c' : '#f97316'}`
        : 'none',
      minHeight: '44px',
      '&:hover': {
        borderColor: isDark ? '#475569' : '#cbd5e1'
      }
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      zIndex: 1000
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? (isDark ? '#334155' : '#f1f5f9')
        : state.isFocused
        ? (isDark ? '#334155' : '#f8fafc')
        : 'transparent',
      color: isDark ? '#f8fafc' : '#0f172a',
      minHeight: '44px',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: isDark ? '#475569' : '#e2e8f0'
      }
    }),
    singleValue: (base) => ({
      ...base,
      color: isDark ? '#f8fafc' : '#0f172a'
    }),
    input: (base) => ({
      ...base,
      color: isDark ? '#f8fafc' : '#0f172a'
    }),
    placeholder: (base) => ({
      ...base,
      color: isDark ? '#94a3b8' : '#64748b'
    })
  };

  // Convert addresses to options
  const options = addresses.map(address => ({
    value: address.id,
    label: address.name 
      ? `${address.name} - ${address.formattedAddress}`
      : address.formattedAddress,
    address: address
  }));

  // Add "Add new address" option if allowed
  if (allowAddNew) {
    options.push({
      value: '__add_new__',
      label: t('addAddress') || 'Add new address',
      isAddNew: true
    });
  }

  useEffect(() => {
    if (value && addresses.length > 0) {
      const address = addresses.find(a => a.id === value);
      if (address) {
        setSelectedOption({
          value: address.id,
          label: address.name 
            ? `${address.name} - ${address.formattedAddress}`
            : address.formattedAddress,
          address: address
        });
      }
    } else {
      setSelectedOption(null);
    }
  }, [value, addresses]);

  const handleChange = (selectedOption) => {
    if (!selectedOption) {
      setSelectedOption(null);
      if (onChange) {
        onChange(null, null);
      }
      return;
    }

    // Handle "Add new address" option
    if (selectedOption.isAddNew) {
      router.push('/mynonprofit/addresses');
      return;
    }

    setSelectedOption(selectedOption);
    
    if (onChange) {
      onChange(selectedOption.value, selectedOption.address);
    }
  };

  if (!organizationId) {
    return (
      <div className={`text-sm text-text-tertiary dark:text-text-tertiary ${className}`}>
        {t('selectAddress') || 'Select an address'}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`min-h-[44px] flex items-center ${className}`}>
        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-500"></div>
        <span className="ml-2 text-sm text-text-secondary dark:text-text-secondary">
          {t('loading') || 'Loading addresses...'}
        </span>
      </div>
    );
  }

  if (addresses.length === 0 && !allowAddNew) {
    return (
      <div className={`text-sm text-text-tertiary dark:text-text-tertiary ${className}`}>
        {t('noAddresses') || 'No addresses saved. Add one to get started.'}
      </div>
    );
  }

  return (
    <div className={className}>
      <Select
        value={selectedOption}
        onChange={handleChange}
        options={options}
        placeholder={placeholder}
        isSearchable={true}
        isClearable={true}
        styles={selectStyles}
        className="basic-single-select w-full"
        classNamePrefix="select"
        formatOptionLabel={({ label, isAddNew }) => (
          <div className="flex items-center gap-2">
            {isAddNew ? (
              <>
                <HiPlus className="h-4 w-4 text-primary-500" />
                <span className="text-primary-500 font-medium">{label}</span>
              </>
            ) : (
              <>
                <HiLocationMarker className="h-4 w-4 text-text-tertiary dark:text-text-tertiary flex-shrink-0" />
                <span className="truncate">{label}</span>
              </>
            )}
          </div>
        )}
        noOptionsMessage={() => t('noAddresses') || 'No addresses found'}
        loadingMessage={() => t('loading') || 'Loading...'}
      />
    </div>
  );
}
