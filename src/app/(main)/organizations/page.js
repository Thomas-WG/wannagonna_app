'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, Avatar, Select, Badge } from 'flowbite-react';
import { useAuth } from '@/utils/auth/AuthContext';
import { HiSearch, HiX, HiFilter, HiChevronDown, HiChevronUp, HiLocationMarker, HiGlobeAlt } from 'react-icons/hi';
import { useDebounce } from '@/hooks/useDebounce';
import { useTranslations } from 'next-intl';
import { countries } from 'countries-list';
import NPODetailsModal from '@/components/activities/NPODetailsModal';
import { useOrganizationsPaginated } from '@/hooks/organizations/useOrganizationsPaginated';
import MembersPagination from '@/components/members/MembersPagination';
import languagesLib from '@cospired/i18n-iso-languages';

languagesLib.registerLocale(require('@cospired/i18n-iso-languages/langs/en.json'));

export default function OrganizationsPage() {
  const t = useTranslations('Organizations');
  const { user, loading: authLoading } = useAuth();

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const [filters, setFilters] = useState({
    country: 'all',
    language: 'all',
    sdg: 'all',
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const [sortBy, setSortBy] = useState('name_az');

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortBy]);

  const {
    organizations: paginatedOrganizations,
    totalCount,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    startIndex,
    endIndex,
    isLoading,
    error,
  } = useOrganizationsPaginated(currentPage, pageSize, filters, sortBy);

  const processedOrganizations = useMemo(() => {
    return paginatedOrganizations.map((org) => {
      let countryName = '';
      if (org.country) {
        const countryData = countries[org.country];
        countryName = countryData ? countryData.name : org.country;
      }

      const languageNames =
        org.languages?.map((lang) => languagesLib.getName(lang, 'en') || lang) || [];

      const displayName =
        typeof org.name === 'object' ? org.name.en || org.name.fr || org.name.es || org.name.ja : org.name;

      return {
        ...org,
        countryName,
        languageNames,
        displayName: displayName || t('anonymousOrganization'),
      };
    });
  }, [paginatedOrganizations, t]);

  const searchedOrganizations = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return processedOrganizations;
    }

    const query = debouncedSearchQuery.toLowerCase();
    return processedOrganizations.filter((org) => {
      const name = org.displayName || '';
      const description = org.description || '';
      return (
        name.toLowerCase().includes(query) ||
        description.toLowerCase().includes(query)
      );
    });
  }, [processedOrganizations, debouncedSearchQuery]);

  const availableCountries = useMemo(() => {
    const countriesSet = new Set();
    processedOrganizations.forEach((org) => {
      if (org.country) {
        countriesSet.add(org.country);
      }
    });
    return Array.from(countriesSet).sort();
  }, [processedOrganizations]);

  const availableLanguages = useMemo(() => {
    const languagesSet = new Set();
    processedOrganizations.forEach((org) => {
      if (Array.isArray(org.languages)) {
        org.languages.forEach((lang) => languagesSet.add(lang));
      }
    });
    return Array.from(languagesSet).sort();
  }, [processedOrganizations]);

  const availableSdgs = useMemo(() => {
    const sdgSet = new Set();
    processedOrganizations.forEach((org) => {
      if (Array.isArray(org.sdgs)) {
        org.sdgs.forEach((sdg) => sdgSet.add(sdg));
      }
    });
    return Array.from(sdgSet).sort();
  }, [processedOrganizations]);

  const handleOrganizationClick = (organization) => {
    setSelectedOrganization(organization);
    setDetailsModalOpen(true);
  };

  const handleFilterChange = (filterKey, value) => {
    setFilters({
      ...filters,
      [filterKey]: value,
    });
  };

  const clearFilters = () => {
    setFilters({
      country: 'all',
      language: 'all',
      sdg: 'all',
    });
  };

  const hasActiveFilters =
    filters.country !== 'all' || filters.language !== 'all' || filters.sdg !== 'all';

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!user && !authLoading) return null;

  return (
    <div className="min-h-screen bg-background-page dark:bg-background-page">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary dark:text-text-primary mb-2">
            {t('title')}
          </h1>
          <p className="text-text-secondary dark:text-text-secondary">
            {t('subtitle')}
          </p>
        </div>

        <div className="mb-4">
          <div className="relative">
            <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-tertiary dark:text-text-tertiary" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-tertiary dark:text-text-tertiary hover:text-text-primary dark:hover:text-text-primary transition-colors duration-200"
              >
                <HiX className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <div className="w-full mb-6">
          <div className="block md:hidden">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="w-full flex items-center justify-between p-4 bg-background-card dark:bg-background-card rounded-lg shadow-sm border border-border-light dark:border-border-dark hover:bg-background-hover dark:hover:bg-background-hover transition-colors"
            >
              <div className="flex items-center gap-2">
                <HiFilter className="h-5 w-5 text-text-primary dark:text-text-primary" />
                <span className="font-medium text-text-primary dark:text-text-primary">
                  {t('filters')}
                </span>
                {hasActiveFilters && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-primary-500 dark:bg-primary-600 text-white rounded-full">
                    {t('active')}
                  </span>
                )}
              </div>
              {isFilterOpen ? (
                <HiChevronUp className="h-5 w-5 text-text-primary dark:text-text-primary" />
              ) : (
                <HiChevronDown className="h-5 w-5 text-text-primary dark:text-text-primary" />
              )}
            </button>
            {isFilterOpen && (
              <div className="mt-2 p-4 bg-background-card dark:bg-background-card rounded-lg shadow-sm border border-border-light dark:border-border-dark space-y-4">
                {availableCountries.length > 0 && (
                  <div>
                    <label className="block mb-1 text-sm font-medium text-text-primary dark:text-text-primary">
                      {t('filterCountry')}
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

                {availableLanguages.length > 0 && (
                  <div>
                    <label className="block mb-1 text-sm font-medium text-text-primary dark:text-text-primary">
                      {t('filterLanguage')}
                    </label>
                    <Select
                      value={filters.language}
                      onChange={(e) => handleFilterChange('language', e.target.value)}
                      className="w-full bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border-border-light dark:border-border-dark"
                    >
                      <option value="all">{t('allLanguages')}</option>
                      {availableLanguages.map((langCode) => (
                        <option key={langCode} value={langCode}>
                          {languagesLib.getName(langCode, 'en') || langCode}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}

                {availableSdgs.length > 0 && (
                  <div>
                    <label className="block mb-1 text-sm font-medium text-text-primary dark:text-text-primary">
                      {t('filterSdg')}
                    </label>
                    <Select
                      value={filters.sdg}
                      onChange={(e) => handleFilterChange('sdg', e.target.value)}
                      className="w-full bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border-border-light dark:border-border-dark"
                    >
                      <option value="all">{t('allSdgs')}</option>
                      {availableSdgs.map((sdg) => (
                        <option key={sdg} value={sdg}>
                          {sdg}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2 text-sm text-text-primary dark:text-text-primary bg-background-hover dark:bg-background-hover hover:bg-opacity-80 dark:hover:bg-opacity-80 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <HiX className="h-4 w-4" />
                    {t('clearAllFilters')}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="hidden md:flex flex-wrap items-end gap-4 p-4 bg-background-card dark:bg-background-card rounded-lg shadow-sm border border-border-light dark:border-border-dark">
            {availableCountries.length > 0 && (
              <div className="flex-1 min-w-[150px]">
                <label className="block mb-1 text-sm font-medium text-text-primary dark:text-text-primary">
                  {t('filterCountry')}
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

            {availableLanguages.length > 0 && (
              <div className="flex-1 min-w-[150px]">
                <label className="block mb-1 text-sm font-medium text-text-primary dark:text-text-primary">
                  {t('filterLanguage')}
                </label>
                <Select
                  value={filters.language}
                  onChange={(e) => handleFilterChange('language', e.target.value)}
                  className="w-full bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border-border-light dark:border-border-dark"
                >
                  <option value="all">{t('allLanguages')}</option>
                  {availableLanguages.map((langCode) => (
                    <option key={langCode} value={langCode}>
                      {languagesLib.getName(langCode, 'en') || langCode}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {availableSdgs.length > 0 && (
              <div className="flex-1 min-w-[150px]">
                <label className="block mb-1 text-sm font-medium text-text-primary dark:text-text-primary">
                  {t('filterSdg')}
                </label>
                <Select
                  value={filters.sdg}
                  onChange={(e) => handleFilterChange('sdg', e.target.value)}
                  className="w-full bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border-border-light dark:border-border-dark"
                >
                  <option value="all">{t('allSdgs')}</option>
                  {availableSdgs.map((sdg) => (
                    <option key={sdg} value={sdg}>
                      {sdg}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-text-primary dark:text-text-primary bg-background-hover dark:bg-background-hover hover:bg-opacity-80 dark:hover:bg-opacity-80 rounded-lg transition-colors flex items-center gap-2"
              >
                <HiX className="h-4 w-4" />
                {t('clearAll')}
              </button>
            )}
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.country !== 'all' && (
              <Badge color="blue" className="flex items-center gap-1">
                {(() => {
                  const countryData = countries[filters.country];
                  return countryData ? countryData.name : filters.country;
                })()}
                <button
                  onClick={() => setFilters({ ...filters, country: 'all' })}
                  className="ml-1 hover:text-text-primary dark:hover:text-text-primary transition-colors"
                >
                  <HiX className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {filters.language !== 'all' && (
              <Badge color="blue" className="flex items-center gap-1">
                {languagesLib.getName(filters.language, 'en') || filters.language}
                <button
                  onClick={() => setFilters({ ...filters, language: 'all' })}
                  className="ml-1 hover:text-text-primary dark:hover:text-text-primary transition-colors"
                >
                  <HiX className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {filters.sdg !== 'all' && (
              <Badge color="blue" className="flex items-center gap-1">
                {filters.sdg}
                <button
                  onClick={() => setFilters({ ...filters, sdg: 'all' })}
                  className="ml-1 hover:text-text-primary dark:hover:text-text-primary transition-colors"
                >
                  <HiX className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="text-sm text-text-secondary dark:text-text-secondary">
            {isLoading ? (
              <span>{t('loading')}...</span>
            ) : (
              <>
                {t('showing')}{' '}
                <span className="font-semibold">{startIndex}</span>-
                <span className="font-semibold">{endIndex}</span> {t('of')}{' '}
                <span className="font-semibold">{totalCount}</span> {t('organizations')}
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-text-primary dark:text-text-primary">
              {t('sortBy')}
            </label>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-auto bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border-border-light dark:border-border-dark"
            >
              <option value="name_az">{t('sortNameAZ')}</option>
              <option value="name_za">{t('sortNameZA')}</option>
            </Select>
          </div>
        </div>

        {!isLoading && totalPages > 1 && searchedOrganizations.length > 0 && (
          <MembersPagination
            currentPage={currentPage}
            totalPages={totalPages}
            hasNextPage={hasNextPage}
            hasPreviousPage={hasPreviousPage}
            onPageChange={handlePageChange}
            variant="top"
          />
        )}

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
            {Array.from({ length: pageSize }).map((_, index) => (
              <Card
                key={index}
                className="animate-pulse bg-background-card dark:bg-background-card border border-border-light dark:border-border-dark"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-background-page dark:bg-background-page" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-background-page dark:bg-background-page rounded w-3/4" />
                    <div className="h-3 bg-background-page dark:bg-background-page rounded w-1/2" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {error && !isLoading && (
          <div className="text-center py-12 bg-background-card dark:bg-background-card rounded-lg shadow-sm border border-border-light dark:border-border-dark">
            <p className="text-lg text-text-secondary dark:text-text-secondary mb-2">
              {t('errorLoadingOrganizations')}
            </p>
            <p className="text-sm text-text-tertiary dark:text-text-tertiary">
              {error.message || t('errorLoadingOrganizationsFallback')}
            </p>
          </div>
        )}

        {!isLoading && !error && searchedOrganizations.length === 0 && (
          <div className="text-center py-12 bg-background-card dark:bg-background-card rounded-lg shadow-sm border border-border-light dark:border-border-dark">
            <p className="text-lg text-text-secondary dark:text-text-secondary mb-2">
              {t('noOrganizationsFound')}
            </p>
            <p className="text-sm text-text-tertiary dark:text-text-tertiary">
              {totalCount === 0 ? t('noOrganizations') : t('tryAdjustingFilters')}
            </p>
          </div>
        )}

        {!isLoading && !error && searchedOrganizations.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
              {searchedOrganizations.map((org) => (
                <Card
                  key={org.id}
                  onClick={() => handleOrganizationClick(org)}
                  className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 transform"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <Avatar
                        img={org.logo || '/logo/Favicon.png'}
                        alt={org.displayName}
                        size="lg"
                        rounded
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-xl font-semibold text-text-primary dark:text-text-primary mb-1.5 line-clamp-1">
                        {org.displayName}
                      </h3>

                      {(org.city || org.countryName) && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <HiLocationMarker className="w-4 h-4 text-text-tertiary dark:text-text-tertiary flex-shrink-0" />
                          <span className="text-xs sm:text-sm text-text-secondary dark:text-text-secondary truncate">
                            {org.city && org.countryName
                              ? `${org.city}, ${org.countryName}`
                              : org.city || org.countryName}
                          </span>
                        </div>
                      )}

                      {org.languageNames.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <HiGlobeAlt className="w-4 h-4 text-text-tertiary dark:text-text-tertiary flex-shrink-0" />
                          <span className="text-xs sm:text-sm text-text-secondary dark:text-text-secondary truncate">
                            {org.languageNames.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <MembersPagination
                currentPage={currentPage}
                totalPages={totalPages}
                hasNextPage={hasNextPage}
                hasPreviousPage={hasPreviousPage}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}

        <NPODetailsModal
          isOpen={detailsModalOpen}
          onClose={() => {
            setDetailsModalOpen(false);
            setSelectedOrganization(null);
          }}
          organization={selectedOrganization}
        />
      </div>
    </div>
  );
}

