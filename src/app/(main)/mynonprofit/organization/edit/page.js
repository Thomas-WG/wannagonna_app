'use client';

/**
 * Organization Edit Page
 * 
 * This page allows NPO members to edit their organization information.
 * Mobile-friendly and user-friendly interface.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/utils/auth/AuthContext';
import { Card, Button, Label, TextInput, Textarea, Toast } from 'flowbite-react';
import { HiOfficeBuilding } from 'react-icons/hi';
import BackButton from '@/components/layout/BackButton';
import { 
  fetchOrganizationById,
  updateOrganization 
} from '@/utils/crudOrganizations';
import { updateActivitiesForOrganization } from '@/utils/crudActivities';
import { uploadOrgPicture } from '@/utils/storage';
import { countries } from 'countries-list';
import languages from '@cospired/i18n-iso-languages';
import Select from 'react-select';
import Image from 'next/image';
import { sdgOptions } from '@/constant/sdgs';
import { useTheme } from '@/utils/theme/ThemeContext';
import { normalizeUrl, formatUrlForDisplay } from '@/utils/urlUtils';

// Register the languages you want to use
languages.registerLocale(require("@cospired/i18n-iso-languages/langs/en.json"));

export default function OrganizationEditPage() {
  const t = useTranslations('OrganizationEdit');
  const { claims } = useAuth();
  const router = useRouter();
  const { isDark } = useTheme();
  
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [organizationForm, setOrganizationForm] = useState({
    name: '',
    logo: '',
    country: '',
    city: '',
    languages: [],
    sdgs: [],
    description: '',
    address: '',
    website: '',
    email: '',
    registrationNumber: '',
    linkedin: '',
    facebook: '',
    instagram: '',
  });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [logoFile, setLogoFile] = useState(null);

  // Prepare options for dropdown selectors
  const countryOptions = Object.entries(countries).map(([code, country]) => ({
    value: code,
    label: country.name
  }));

  const languageOptions = Object.entries(languages.getNames('en')).map(([code, name]) => ({
    value: code,
    label: name
  }));

  // Load organization data
  useEffect(() => {
    const loadOrganizationData = async () => {
      if (!claims?.npoId) {
        setIsLoading(false);
        return;
      }

      try {
        const orgData = await fetchOrganizationById(claims.npoId);
        if (orgData) {
          setOrganizationForm({
            name: orgData.name || '',
            logo: orgData.logo || '',
            country: orgData.country || '',
            city: orgData.city || '',
            languages: orgData.languages || [],
            sdgs: orgData.sdgs || [],
            description: orgData.description || '',
            address: orgData.address || '',
            website: orgData.website || '',
            email: orgData.email || '',
            registrationNumber: orgData.registrationNumber || '',
            linkedin: orgData.linkedin || '',
            facebook: orgData.facebook || '',
            instagram: orgData.instagram || '',
          });
        }
      } catch (error) {
        console.error('Error loading organization data:', error);
        showToast(t('errorLoading'), 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrganizationData();
  }, [claims, t]);

  /**
   * Displays a toast notification
   */
  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  }, []);

  /**
   * Handles form submission for updating the organization
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!claims?.npoId) {
      showToast(t('noOrganization'), 'error');
      return;
    }

    setIsSaving(true);
    try {
      // Normalize URL fields before saving
      const normalizedForm = {
        ...organizationForm,
        website: organizationForm.website ? normalizeUrl(organizationForm.website) : '',
        linkedin: organizationForm.linkedin ? normalizeUrl(organizationForm.linkedin) : '',
        facebook: organizationForm.facebook ? normalizeUrl(organizationForm.facebook) : '',
        instagram: organizationForm.instagram ? normalizeUrl(organizationForm.instagram) : '',
      };

      // First, upload logo if a new logo file was selected
      if (logoFile && claims.npoId) {
        try {
          const url = await uploadOrgPicture(logoFile, claims.npoId);
          await updateOrganization(claims.npoId, { ...normalizedForm, logo: url });
          
          // Update all activities for this organization with the new logo
          try {
            const updatedCount = await updateActivitiesForOrganization(
              claims.npoId, 
              url, 
              normalizedForm.name
            );
            console.log(`Updated ${updatedCount} activities with new organization logo`);
          } catch (activityUpdateError) {
            // Log error but don't fail the organization update
            console.error('Error updating activities with new logo:', activityUpdateError);
          }
          
          setOrganizationForm(prev => ({ ...prev, logo: url }));
          showToast(t('organizationUpdated'), 'success');
        } catch (error) {
          console.error('Error uploading logo:', error);
          showToast(t('errorUploadingLogo'), 'error');
        }
      } else {
        // Update organization without logo change
        await updateOrganization(claims.npoId, normalizedForm);
        showToast(t('organizationUpdated'), 'success');
      }

      // Small delay to show success message before redirect
      setTimeout(() => {
        router.push('/mynonprofit');
      }, 1000);
    } catch (error) {
      console.error('Error saving organization:', error);
      showToast(t('errorSavingOrganization'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handles logo file upload
   */
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setLogoFile(file);
        
        const imageUrl = URL.createObjectURL(file);
        setOrganizationForm(prev => ({
          ...prev,
          logo: imageUrl
        }));
      } catch (error) {
        console.error("Error handling logo:", error);
      }
    }
  };

  /**
   * Handles URL field blur to normalize URLs
   * @param {string} fieldName - The field name to normalize
   * @param {string} value - The URL value
   */
  const handleUrlBlur = (fieldName, value) => {
    if (value && value.trim() !== '') {
      const normalized = normalizeUrl(value);
      setOrganizationForm(prev => ({
        ...prev,
        [fieldName]: normalized
      }));
    }
  };

  // Custom styles for react-select with dark mode support
  const selectStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderColor: isDark ? '#334155' : '#e2e8f0',
      color: isDark ? '#f8fafc' : '#0f172a',
      '&:hover': {
        borderColor: isDark ? '#fb923c' : '#f97316',
      },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderColor: isDark ? '#334155' : '#e2e8f0',
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
      '&:active': {
        backgroundColor: isDark ? '#475569' : '#e0f2fe',
      },
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: isDark ? '#334155' : '#e0f2fe',
      borderRadius: '4px',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: isDark ? '#f8fafc' : '#0284c7',
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: isDark ? '#cbd5e1' : '#0284c7',
      '&:hover': {
        backgroundColor: isDark ? '#475569' : '#bae6fd',
        color: isDark ? '#f8fafc' : '#0369a1',
      },
    }),
    placeholder: (base) => ({
      ...base,
      color: isDark ? '#94a3b8' : '#64748b',
    }),
    input: (base) => ({
      ...base,
      color: isDark ? '#f8fafc' : '#0f172a',
    }),
    singleValue: (base) => ({
      ...base,
      color: isDark ? '#f8fafc' : '#0f172a',
    }),
    indicatorsContainer: (base) => ({
      ...base,
      color: isDark ? '#cbd5e1' : '#64748b',
    }),
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 bg-background-page dark:bg-background-page min-h-dvh">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 dark:border-primary-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-4xl bg-background-page dark:bg-background-page min-h-dvh">
      {/* Back Button */}
      <BackButton fallbackPath="/mynonprofit" />

      {/* Header */}
      <div className="mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
        <div className="bg-semantic-info-100 dark:bg-semantic-info-900 p-2 sm:p-3 rounded-full">
          <HiOfficeBuilding className="h-5 w-5 sm:h-6 sm:w-6 text-semantic-info-600 dark:text-semantic-info-400" />
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-text-primary dark:text-text-primary">
          {t('editOrganization')}
        </h1>
      </div>

      {/* Form Card */}
      <Card className="shadow-md bg-background-card dark:bg-background-card border-border-light dark:border-border-dark">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 pb-safe-bottom pb-20 sm:pb-24">
          {/* Logo Upload Section */}
          <div>
            <Label htmlFor="logo" className="mb-2 block text-sm sm:text-base font-medium text-text-primary dark:text-text-primary">
              {t('logo')}
            </Label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {organizationForm.logo && (
                <div className="relative flex-shrink-0">
                  <Image 
                    src={organizationForm.logo} 
                    alt="Organization logo" 
                    width={80}
                    height={80}
                    priority={true}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-border-light dark:border-border-dark"
                  />
                </div>
              )}
              <div className="flex-1 w-full sm:w-auto">
                <input
                  type="file"
                  id="logo"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="block w-full text-sm text-text-secondary dark:text-text-secondary
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-semantic-info-50 dark:file:bg-semantic-info-900 file:text-semantic-info-700 dark:file:text-semantic-info-300
                    hover:file:bg-semantic-info-100 dark:hover:file:bg-semantic-info-800"
                />
                <p className="mt-1 text-xs sm:text-sm text-text-tertiary dark:text-text-tertiary">
                  {t('logoHelper')}
                </p>
              </div>
            </div>
          </div>

          {/* Organization Name Field */}
          <div>
            <Label htmlFor="name" className="mb-2 block text-sm sm:text-base font-medium text-text-primary dark:text-text-primary">
              {t('name')}
            </Label>
            <TextInput
              id="name"
              value={organizationForm.name}
              disabled
              className="w-full bg-background-hover dark:bg-background-hover !text-text-secondary dark:!text-text-secondary cursor-not-allowed border-border-light dark:border-border-dark"
            />
            <p className="mt-1 text-xs sm:text-sm text-text-tertiary dark:text-text-tertiary">
              {t('nameReadOnly')}
            </p>
          </div>

          {/* Country and City Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country" className="mb-2 block text-sm sm:text-base font-medium text-text-primary dark:text-text-primary">
                {t('country')} <span className="text-semantic-error-500 dark:text-semantic-error-400">*</span>
              </Label>
              <Select
                id="country"
                name="country"
                options={countryOptions}
                value={countryOptions.find(option => option.value === organizationForm.country)}
                onChange={(selectedOption) => setOrganizationForm({
                  ...organizationForm,
                  country: selectedOption ? selectedOption.value : ''
                })}
                placeholder={t('selectCountry')}
                className="basic-single-select"
                classNamePrefix="select"
                styles={selectStyles}
                required
              />
            </div>

            <div>
              <Label htmlFor="city" className="mb-2 block text-sm sm:text-base font-medium text-text-primary dark:text-text-primary">
                {t('city')}
              </Label>
              <TextInput
                id="city"
                value={organizationForm.city}
                onChange={(e) => setOrganizationForm({
                  ...organizationForm,
                  city: e.target.value
                })}
                className="w-full bg-background-card dark:bg-background-card !text-text-primary dark:!text-text-primary border-border-light dark:border-border-dark placeholder:text-text-tertiary dark:placeholder:text-text-tertiary"
              />
            </div>
          </div>

          {/* Address Field */}
          <div>
            <Label htmlFor="address" className="mb-2 block text-sm sm:text-base font-medium text-text-primary dark:text-text-primary">
              {t('address')}
            </Label>
            <TextInput
              id="address"
              value={organizationForm.address}
              onChange={(e) => setOrganizationForm({
                ...organizationForm,
                address: e.target.value
              })}
              className="w-full bg-background-card dark:bg-background-card !text-text-primary dark:!text-text-primary border-border-light dark:border-border-dark placeholder:text-text-tertiary dark:placeholder:text-text-tertiary"
            />
          </div>

          {/* Languages Selection Field */}
          <div>
            <Label htmlFor="languages" className="mb-2 block text-sm sm:text-base font-medium text-text-primary dark:text-text-primary">
              {t('languages')}
            </Label>
            <Select
              id="languages"
              name="languages"
              isMulti
              options={languageOptions}
              value={organizationForm.languages.map(lang => 
                languageOptions.find(option => option.value === lang)
              ).filter(Boolean)}
              onChange={(selectedOptions) => setOrganizationForm({
                ...organizationForm,
                languages: selectedOptions ? selectedOptions.map(option => option.value) : []
              })}
              placeholder={t('selectLanguages')}
              className="basic-multi-select"
              classNamePrefix="select"
              styles={selectStyles}
            />
            <p className="mt-1 text-xs sm:text-sm text-text-tertiary dark:text-text-tertiary">
              {t('languagesHelper')}
            </p>
          </div>

          {/* SDGs Selection Field */}
          <div>
            <Label htmlFor="sdgs" className="mb-2 block text-sm sm:text-base font-medium text-text-primary dark:text-text-primary">
              {t('sdgs')}
            </Label>
            <Select
              id="sdgs"
              isMulti
              options={sdgOptions}
              value={organizationForm.sdgs.map(sdg => 
                sdgOptions.find(option => option.value === sdg)
              ).filter(Boolean)}
              onChange={(selectedOptions) => setOrganizationForm({
                ...organizationForm,
                sdgs: selectedOptions ? selectedOptions.map(option => option.value) : []
              })}
              placeholder={t('selectSDGs')}
              className="basic-multi-select"
              classNamePrefix="select"
              styles={selectStyles}
            />
          </div>

          {/* Description Field */}
          <div>
            <Label htmlFor="description" className="mb-2 block text-sm sm:text-base font-medium text-text-primary dark:text-text-primary">
              {t('description')}
            </Label>
            <Textarea
              id="description"
              value={organizationForm.description}
              onChange={(e) => setOrganizationForm({
                ...organizationForm,
                description: e.target.value
              })}
              rows={4}
              className="w-full bg-background-card dark:bg-background-card !text-text-primary dark:!text-text-primary border-border-light dark:border-border-dark placeholder:text-text-tertiary dark:placeholder:text-text-tertiary"
            />
          </div>

          {/* Website Field */}
          <div>
            <Label htmlFor="website" className="mb-2 block text-sm sm:text-base font-medium text-text-primary dark:text-text-primary">
              {t('website')}
            </Label>
            <TextInput
              id="website"
              type="text"
              value={formatUrlForDisplay(organizationForm.website || '')}
              onChange={(e) => setOrganizationForm({
                ...organizationForm,
                website: e.target.value
              })}
              onBlur={(e) => handleUrlBlur('website', e.target.value)}
              placeholder="www.example.com or example.com"
              className="w-full bg-background-card dark:bg-background-card !text-text-primary dark:!text-text-primary border-border-light dark:border-border-dark placeholder:text-text-tertiary dark:placeholder:text-text-tertiary"
            />
            <p className="mt-1 text-xs sm:text-sm text-text-tertiary dark:text-text-tertiary">
              (https:// will be added automatically)
            </p>
          </div>

          {/* LinkedIn Field */}
          <div>
            <Label htmlFor="linkedin" className="mb-2 block text-sm sm:text-base font-medium text-text-primary dark:text-text-primary">
              LinkedIn
            </Label>
            <TextInput
              id="linkedin"
              type="text"
              value={formatUrlForDisplay(organizationForm.linkedin || '')}
              onChange={(e) => setOrganizationForm({
                ...organizationForm,
                linkedin: e.target.value
              })}
              onBlur={(e) => handleUrlBlur('linkedin', e.target.value)}
              placeholder="www.linkedin.com/in/yourprofile"
              className="w-full bg-background-card dark:bg-background-card !text-text-primary dark:!text-text-primary border-border-light dark:border-border-dark placeholder:text-text-tertiary dark:placeholder:text-text-tertiary"
            />
            <p className="mt-1 text-xs sm:text-sm text-text-tertiary dark:text-text-tertiary">
              Enter your profile URL (e.g., https://linkedin.com/in/yourprofile) (https:// will be added automatically)
            </p>
          </div>

          {/* Facebook Field */}
          <div>
            <Label htmlFor="facebook" className="mb-2 block text-sm sm:text-base font-medium text-text-primary dark:text-text-primary">
              Facebook
            </Label>
            <TextInput
              id="facebook"
              type="text"
              value={formatUrlForDisplay(organizationForm.facebook || '')}
              onChange={(e) => setOrganizationForm({
                ...organizationForm,
                facebook: e.target.value
              })}
              onBlur={(e) => handleUrlBlur('facebook', e.target.value)}
              placeholder="www.facebook.com/yourprofile"
              className="w-full bg-background-card dark:bg-background-card !text-text-primary dark:!text-text-primary border-border-light dark:border-border-dark placeholder:text-text-tertiary dark:placeholder:text-text-tertiary"
            />
            <p className="mt-1 text-xs sm:text-sm text-text-tertiary dark:text-text-tertiary">
              Enter your profile URL (e.g., https://facebook.com/yourprofile) (https:// will be added automatically)
            </p>
          </div>

          {/* Instagram Field */}
          <div>
            <Label htmlFor="instagram" className="mb-2 block text-sm sm:text-base font-medium text-text-primary dark:text-text-primary">
              Instagram
            </Label>
            <TextInput
              id="instagram"
              type="text"
              value={formatUrlForDisplay(organizationForm.instagram || '')}
              onChange={(e) => setOrganizationForm({
                ...organizationForm,
                instagram: e.target.value
              })}
              onBlur={(e) => handleUrlBlur('instagram', e.target.value)}
              placeholder="www.instagram.com/yourprofile"
              className="w-full bg-background-card dark:bg-background-card !text-text-primary dark:!text-text-primary border-border-light dark:border-border-dark placeholder:text-text-tertiary dark:placeholder:text-text-tertiary"
            />
            <p className="mt-1 text-xs sm:text-sm text-text-tertiary dark:text-text-tertiary">
              Enter your profile URL (e.g., https://instagram.com/yourprofile) (https:// will be added automatically)
            </p>
          </div>

          {/* Email Field */}
          <div>
            <Label htmlFor="email" className="mb-2 block text-sm sm:text-base font-medium text-text-primary dark:text-text-primary">
              {t('email')}
            </Label>
            <TextInput
              id="email"
              type="email"
              value={organizationForm.email}
              onChange={(e) => setOrganizationForm({
                ...organizationForm,
                email: e.target.value
              })}
              placeholder="contact@example.com"
              className="w-full bg-background-card dark:bg-background-card !text-text-primary dark:!text-text-primary border-border-light dark:border-border-dark placeholder:text-text-tertiary dark:placeholder:text-text-tertiary"
            />
          </div>

          {/* Registration Number Field */}
          <div>
            <Label htmlFor="registrationNumber" className="mb-2 block text-sm sm:text-base font-medium text-text-primary dark:text-text-primary">
              {t('registrationNumber')}
            </Label>
            <TextInput
              id="registrationNumber"
              value={organizationForm.registrationNumber}
              onChange={(e) => setOrganizationForm({
                ...organizationForm,
                registrationNumber: e.target.value
              })}
              className="w-full bg-background-card dark:bg-background-card !text-text-primary dark:!text-text-primary border-border-light dark:border-border-dark placeholder:text-text-tertiary dark:placeholder:text-text-tertiary"
            />
          </div>

          {/* Form Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 border-t border-border-light dark:border-border-dark">
            <Button 
              type="button"
              color="gray" 
              onClick={() => router.push('/mynonprofit')}
              className="w-full sm:w-auto bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600"
            >
              {t('cancel')}
            </Button>
            <Button 
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-white"
            >
              {isSaving ? t('saving') : t('save')}
            </Button>
          </div>
        </form>
      </Card>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-4 sm:bottom-5 right-4 sm:right-5 left-4 sm:left-auto z-50 max-w-sm sm:max-w-none">
          <Toast onClose={() => setToast({ ...toast, show: false })} className="bg-background-card dark:bg-background-card border-border-light dark:border-border-dark">
            {toast.type === 'success' && (
              <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-semantic-success-100 dark:bg-semantic-success-900 text-semantic-success-600 dark:text-semantic-success-400">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            {toast.type === 'error' && (
              <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-semantic-error-100 dark:bg-semantic-error-900 text-semantic-error-600 dark:text-semantic-error-400">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <div className="ml-3 text-sm font-normal break-words text-text-primary dark:text-text-primary">{toast.message}</div>
            <Toast.Toggle onClose={() => setToast({ ...toast, show: false })} className="text-text-tertiary dark:text-text-tertiary hover:text-text-primary dark:hover:text-text-primary" />
          </Toast>
        </div>
      )}
    </div>
  );
}

