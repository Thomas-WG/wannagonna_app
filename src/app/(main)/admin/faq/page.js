'use client';

/**
 * FAQ Management Page
 * 
 * This component provides a complete CRUD interface for managing FAQs.
 * It allows administrators to view, add, edit, and delete FAQs with multilingual support.
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, Button, Label, TextInput, Table, Modal, Toast, Textarea, Tabs, Spinner } from 'flowbite-react';
import { 
  fetchFaqs, 
  addFaq, 
  updateFaq, 
  deleteFaq,
  getLocalizedText
} from '@/utils/crudFaq';
import { useTheme } from '@/utils/theme/ThemeContext';
import { useTranslations } from 'next-intl';
import { HiSearch } from 'react-icons/hi';
import { useDebounce } from '@/hooks/useDebounce';

const locales = ['en', 'fr', 'es', 'ja'];
const localeLabels = {
  en: 'English',
  fr: 'French',
  es: 'Spanish',
  ja: 'Japanese'
};

/**
 * FAQManagementPage Component
 * 
 * Main component for managing FAQs in the admin interface.
 * Provides functionality to view, add, edit, and delete FAQs.
 */
export default function FAQManagementPage() {
  const { isDark } = useTheme();
  const t = useTranslations('Admin');
  
  // State management
  const [faqs, setFaqs] = useState([]); // List of all FAQs
  const [isLoading, setIsLoading] = useState(true); // Loading state indicator
  const [showModal, setShowModal] = useState(false); // Controls visibility of add/edit modal
  const [showDeleteModal, setShowDeleteModal] = useState(false); // Controls visibility of delete confirmation modal
  const [selectedFaq, setSelectedFaq] = useState(null); // Currently selected FAQ for edit/delete
  const [faqForm, setFaqForm] = useState({
    question: { en: '', fr: '', es: '', ja: '' },
    answer: { en: '', fr: '', es: '', ja: '' },
    order: ''
  }); // Form data for adding/editing FAQs
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' }); // Toast notification state
  const [searchQuery, setSearchQuery] = useState(''); // Search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [activeTab, setActiveTab] = useState('en'); // Active language tab

  // Define loadData function outside of useEffect so it can be reused
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const faqsData = await fetchFaqs();
      setFaqs(faqsData);
    } catch (error) {
      console.error('Error loading data:', error);
      setToast({ show: true, message: t('errorLoading'), type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // Load FAQs data when component mounts
  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Displays a toast notification
   * @param {string} message - The message to display
   * @param {string} type - The type of toast ('success' or 'error')
   */
  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  }, []);

  /**
   * Handles form submission for adding or updating an FAQ
   * @param {Event} e - Form submission event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate English is provided
      if (!faqForm.question.en.trim() || !faqForm.answer.en.trim()) {
        showToast(t('englishRequired'), 'error');
        return;
      }

      const orderValue = faqForm.order ? parseInt(faqForm.order) : null;

      if (selectedFaq) {
        // Update existing FAQ
        await updateFaq(selectedFaq.id, faqForm.question, faqForm.answer, orderValue);
        showToast(t('faqUpdated'), 'success');
      } else {
        // Create new FAQ
        await addFaq(faqForm.question, faqForm.answer, orderValue);
        showToast(t('faqAdded'), 'success');
      }

      // Reset UI state after successful operation
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving FAQ:', error);
      showToast(t('errorSavingFaq'), 'error');
    }
  };

  /**
   * Handles FAQ deletion
   * Deletes the selected FAQ and updates the UI
   */
  const handleDelete = async () => {
    try {
      await deleteFaq(selectedFaq.id);
      showToast(t('faqDeleted'), 'success');
      setShowDeleteModal(false);
      setSelectedFaq(null);
      loadData();
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      showToast(t('errorDeletingFaq'), 'error');
    }
  };

  /**
   * Sets up the form for editing an existing FAQ
   * @param {Object} faq - The FAQ to edit
   */
  const editFaq = (faq) => {
    setSelectedFaq(faq);
    setFaqForm({
      question: faq.question || { en: '', fr: '', es: '', ja: '' },
      answer: faq.answer || { en: '', fr: '', es: '', ja: '' },
      order: faq.order?.toString() || ''
    });
    setActiveTab('en');
    setShowModal(true);
  };

  /**
   * Resets the form and related state to default values
   */
  const resetForm = () => {
    setSelectedFaq(null);
    setFaqForm({
      question: { en: '', fr: '', es: '', ja: '' },
      answer: { en: '', fr: '', es: '', ja: '' },
      order: ''
    });
    setActiveTab('en');
  };

  /**
   * Handles input change for multilingual fields
   */
  const handleMultilingualChange = (field, locale, value) => {
    setFaqForm(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [locale]: value
      }
    }));
  };

  /**
   * Handles order input change
   */
  const handleOrderChange = (e) => {
    setFaqForm(prev => ({
      ...prev,
      order: e.target.value
    }));
  };

  // Filter FAQs based on search query
  const filteredFaqs = faqs.filter(faq => {
    if (!debouncedSearchQuery.trim()) return true;
    const query = debouncedSearchQuery.toLowerCase();
    // Search across all language versions
    return locales.some(locale => {
      const question = getLocalizedText(faq.question, locale).toLowerCase();
      const answer = getLocalizedText(faq.answer, locale).toLowerCase();
      return question.includes(query) || answer.includes(query);
    });
  });

  return (
    <div className="w-full max-w-full overflow-x-hidden px-3 sm:px-4 md:container md:mx-auto py-3 sm:py-4 space-y-4 sm:space-y-6">
      {/* Page Header */}
      <h1 className="text-xl sm:text-2xl font-bold">{t('faqManagement')}</h1>
      
      {/* FAQs Table Card */}
      <Card className="w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h2 className="text-lg sm:text-xl font-semibold">{t('faqs')}</h2>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Search Bar */}
            <div className="relative flex-1 sm:flex-initial sm:w-64">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <HiSearch className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              <TextInput
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            {/* Add FAQ Button */}
            <Button 
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="w-full sm:w-auto text-sm sm:text-base"
              size="sm"
            >
              {t('addFaq')}
            </Button>
          </div>
        </div>
        
        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner size="xl" />
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            {filteredFaqs.length > 0 && (
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <Table.Head>
                    <Table.HeadCell className="text-xs sm:text-sm">{t('order')}</Table.HeadCell>
                    <Table.HeadCell className="text-xs sm:text-sm">{t('question')} (EN)</Table.HeadCell>
                    <Table.HeadCell className="text-xs sm:text-sm">{t('answer')} (EN)</Table.HeadCell>
                    <Table.HeadCell className="text-xs sm:text-sm">{t('actions')}</Table.HeadCell>
                  </Table.Head>
                  <Table.Body>
                    {/* FAQ Rows */}
                    {filteredFaqs.map(faq => (
                      <Table.Row key={faq.id}>
                        <Table.Cell className="font-medium">{faq.order || '-'}</Table.Cell>
                        <Table.Cell className="max-w-[300px] truncate">
                          {getLocalizedText(faq.question, 'en')}
                        </Table.Cell>
                        <Table.Cell className="max-w-[300px] truncate">
                          {getLocalizedText(faq.answer, 'en')}
                        </Table.Cell>
                        <Table.Cell>
                          {/* Action Buttons */}
                          <div className="flex space-x-2">
                            <Button size="xs" onClick={() => editFaq(faq)}>
                              {t('edit')}
                            </Button>
                            <Button 
                              size="xs" 
                              color="failure" 
                              onClick={() => {
                                setSelectedFaq(faq);
                                setShowDeleteModal(true);
                              }}
                            >
                              {t('delete')}
                            </Button>
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </div>
            )}

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3 w-full">
              {filteredFaqs.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-4">{t('noFaqs')}</p>
              ) : (
                filteredFaqs.map(faq => (
                  <Card key={faq.id} className="p-4 w-full overflow-hidden">
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="mb-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('order')}: </span>
                        <span className="text-xs text-gray-700 dark:text-gray-300">{faq.order || '-'}</span>
                      </div>
                      <h3 className="font-semibold text-sm sm:text-base mb-2">{getLocalizedText(faq.question, 'en')}</h3>
                      <p className="text-xs text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
                        {getLocalizedText(faq.answer, 'en')}
                      </p>
                      <div className="flex flex-col gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => editFaq(faq)}
                          className="w-full text-xs sm:text-sm"
                        >
                          {t('edit')}
                        </Button>
                        <Button 
                          size="sm" 
                          color="failure" 
                          onClick={() => {
                            setSelectedFaq(faq);
                            setShowDeleteModal(true);
                          }}
                          className="w-full text-xs sm:text-sm"
                        >
                          {t('delete')}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Empty State */}
            {!isLoading && filteredFaqs.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery.trim() ? t('noResults') : t('noFaqs')}
                </p>
              </div>
            )}
          </>
        )}
      </Card>
      
      {/* FAQ Add/Edit Modal */}
      <Modal 
        show={showModal} 
        onClose={() => setShowModal(false)} 
        size="4xl"
        className="z-50 max-w-[95vw] sm:max-w-none"
        dismissible={true}
      >
        <Modal.Header className="text-base sm:text-lg px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="w-full min-w-0">
            <h3 className="truncate">{selectedFaq ? t('editFaq') : t('addFaq')}</h3>
          </div>
        </Modal.Header>
        <Modal.Body className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 max-h-[85vh] sm:max-h-[80vh] overflow-y-auto overflow-x-hidden w-full">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
            {/* Language Tabs */}
            <div className="w-full">
              <Tabs aria-label="Language tabs" variant="underline" onActiveTabChange={(tab) => setActiveTab(tab)}>
                {locales.map(locale => (
                  <Tabs.Item key={locale} active={activeTab === locale} title={localeLabels[locale]}>
                    <div className="space-y-4 pt-4">
                      {/* Question Field */}
                      <div className="w-full">
                        <Label htmlFor={`question-${locale}`} className="text-sm sm:text-base mb-2 block">
                          {t(`question${locale.charAt(0).toUpperCase() + locale.slice(1)}`)} {locale === 'en' && '*'}
                        </Label>
                        <Textarea
                          id={`question-${locale}`}
                          value={faqForm.question[locale] || ''}
                          onChange={(e) => handleMultilingualChange('question', locale, e.target.value)}
                          required={locale === 'en'}
                          className="text-sm sm:text-base w-full"
                          rows={2}
                          placeholder={locale === 'en' ? t('questionEn') : `${t('question')} (${localeLabels[locale]})`}
                        />
                      </div>

                      {/* Answer Field */}
                      <div className="w-full">
                        <Label htmlFor={`answer-${locale}`} className="text-sm sm:text-base mb-2 block">
                          {t(`answer${locale.charAt(0).toUpperCase() + locale.slice(1)}`)} {locale === 'en' && '*'}
                        </Label>
                        <Textarea
                          id={`answer-${locale}`}
                          value={faqForm.answer[locale] || ''}
                          onChange={(e) => handleMultilingualChange('answer', locale, e.target.value)}
                          required={locale === 'en'}
                          className="text-sm sm:text-base w-full"
                          rows={4}
                          placeholder={locale === 'en' ? t('answerEn') : `${t('answer')} (${localeLabels[locale]})`}
                        />
                      </div>
                    </div>
                  </Tabs.Item>
                ))}
              </Tabs>
            </div>

            {/* Order Field */}
            <div className="w-full max-w-full overflow-hidden">
              <Label htmlFor="order" className="text-sm sm:text-base">{t('order')}</Label>
              <TextInput
                id="order"
                type="number"
                value={faqForm.order}
                onChange={handleOrderChange}
                className="text-sm sm:text-base w-full"
                placeholder={t('orderHelper')}
              />
              <p className="mt-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {t('orderHelper')}
              </p>
            </div>

            {/* Form Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700 mt-4 sm:mt-6">
              <Button 
                color="gray" 
                onClick={() => setShowModal(false)}
                className="w-full sm:w-auto text-sm sm:text-base py-2.5 sm:py-2 min-h-[44px] sm:min-h-0"
              >
                {t('cancel')}
              </Button>
              <Button 
                type="submit"
                className="w-full sm:w-auto text-sm sm:text-base py-2.5 sm:py-2 min-h-[44px] sm:min-h-0"
              >
                {selectedFaq ? t('update') : t('add')}
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} className="max-w-[95vw] sm:max-w-none">
        <Modal.Header className="text-base sm:text-lg px-3 sm:px-4 md:px-6">{t('deleteFaq')}</Modal.Header>
        <Modal.Body className="px-3 sm:px-4 md:px-6">
          <p className="text-sm sm:text-base">{t('confirmDeleteFaq')}</p>
        </Modal.Body>
        <Modal.Footer className="px-3 sm:px-4 md:px-6">
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:space-x-2 w-full sm:w-auto">
            <Button 
              color="gray" 
              onClick={() => setShowDeleteModal(false)}
              className="w-full sm:w-auto text-sm sm:text-base"
            >
              {t('cancel')}
            </Button>
            <Button 
              color="failure" 
              onClick={handleDelete}
              className="w-full sm:w-auto text-sm sm:text-base"
            >
              {t('delete')}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
      
      {/* Toast Notification Component */}
      {toast.show && (
        <Toast className="fixed bottom-4 right-4 z-50 max-w-[calc(100%-2rem)] sm:max-w-md">
          <div className={`inline-flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg ${
            toast.type === 'success' ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'
          }`}>
            {toast.type === 'success' ? (
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="ml-2 sm:ml-3 text-xs sm:text-sm font-normal">{toast.message}</div>
        </Toast>
      )}
    </div>
  );
}
