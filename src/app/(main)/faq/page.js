'use client';

/**
 * FAQ Page
 * 
 * Displays frequently asked questions in an accordion format.
 * Supports multilingual content based on user's language preference.
 * Includes search functionality to filter FAQs.
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, Accordion, TextInput, Spinner } from 'flowbite-react';
import { HiSearch } from 'react-icons/hi';
import { fetchFaqs, getLocalizedText } from '@/utils/crudFaq';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/utils/theme/ThemeContext';
import { useDebounce } from '@/hooks/useDebounce';

export default function FAQPage() {
  const t = useTranslations('FAQ');
  const locale = useLocale();
  const { isDark } = useTheme();
  
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch FAQs on component mount
  useEffect(() => {
    const loadFaqs = async () => {
      try {
        setLoading(true);
        const faqsData = await fetchFaqs();
        setFaqs(faqsData);
      } catch (error) {
        console.error('Error loading FAQs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFaqs();
  }, []);

  // Filter FAQs based on search query
  const filteredFaqs = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return faqs;
    }

    const query = debouncedSearchQuery.toLowerCase();
    return faqs.filter(faq => {
      const question = getLocalizedText(faq.question, locale).toLowerCase();
      const answer = getLocalizedText(faq.answer, locale).toLowerCase();
      return question.includes(query) || answer.includes(query);
    });
  }, [faqs, debouncedSearchQuery, locale]);

  return (
    <div className="w-full max-w-full overflow-x-hidden px-3 sm:px-4 md:container md:mx-auto py-3 sm:py-4 space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary dark:text-text-primary mb-2">
          {t('title')}
        </h1>
        <p className="text-sm sm:text-base text-text-secondary dark:text-text-secondary">
          {t('subtitle')}
        </p>
      </div>

      {/* Search Bar */}
      <Card className="w-full">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <HiSearch className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
          <TextInput
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
            color={isDark ? 'gray' : 'gray'}
          />
        </div>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Spinner size="xl" />
        </div>
      )}

      {/* FAQs Accordion */}
      {!loading && (
        <>
          {filteredFaqs.length === 0 ? (
            <Card className="w-full">
              <div className="text-center py-8">
                <p className="text-text-secondary dark:text-text-secondary text-sm sm:text-base">
                  {searchQuery.trim() ? t('noResults') : t('noFaqs')}
                </p>
              </div>
            </Card>
          ) : (
            <Card className="w-full">
              <Accordion className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredFaqs.map((faq) => {
                  const question = getLocalizedText(faq.question, locale);
                  const answer = getLocalizedText(faq.answer, locale);
                  
                  return (
                    <Accordion.Panel key={faq.id}>
                      <Accordion.Title className="text-left text-base sm:text-lg font-semibold text-text-primary dark:text-text-primary hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                        {question}
                      </Accordion.Title>
                      <Accordion.Content>
                        <div className="text-sm sm:text-base text-text-secondary dark:text-text-secondary leading-relaxed whitespace-pre-wrap">
                          {answer}
                        </div>
                      </Accordion.Content>
                    </Accordion.Panel>
                  );
                })}
              </Accordion>
            </Card>
          )}
        </>
      )}

      {/* Results Count */}
      {!loading && searchQuery.trim() && filteredFaqs.length > 0 && (
        <div className="text-center text-sm text-text-tertiary dark:text-text-tertiary">
          {t('resultsCount', { count: filteredFaqs.length })}
        </div>
      )}
    </div>
  );
}
