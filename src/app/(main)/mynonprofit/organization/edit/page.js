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
import { HiOfficeBuilding, HiArrowLeft } from 'react-icons/hi';
import { 
  fetchOrganizationById,
  updateOrganization 
} from '@/utils/crudOrganizations';
import { uploadOrgPicture } from '@/utils/storage';
import { countries } from 'countries-list';
import languages from '@cospired/i18n-iso-languages';
import Select from 'react-select';
import Image from 'next/image';
import { sdgOptions } from '@/constant/sdgs';

// Register the languages you want to use
languages.registerLocale(require("@cospired/i18n-iso-languages/langs/en.json"));

export default function OrganizationEditPage() {
  const t = useTranslations('OrganizationEdit');
  const { claims } = useAuth();
  const router = useRouter();
  
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
      // First, upload logo if a new logo file was selected
      if (logoFile && claims.npoId) {
        try {
          const url = await uploadOrgPicture(logoFile, claims.npoId);
          await updateOrganization(claims.npoId, { ...organizationForm, logo: url });
          setOrganizationForm(prev => ({ ...prev, logo: url }));
          showToast(t('organizationUpdated'), 'success');
        } catch (error) {
          console.error('Error uploading logo:', error);
          showToast(t('errorUploadingLogo'), 'error');
        }
      } else {
        // Update organization without logo change
        await updateOrganization(claims.npoId, organizationForm);
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-4xl">
      {/* Header with back button */}
      <div className="mb-4 sm:mb-6 flex items-center gap-3 sm:gap-4">
        <button
          onClick={() => router.push('/mynonprofit')}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Go back"
        >
          <HiArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
        </button>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-blue-100 p-2 sm:p-3 rounded-full">
            <HiOfficeBuilding className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
            {t('editOrganization')}
          </h1>
        </div>
      </div>

      {/* Form Card */}
      <Card className="shadow-md">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Logo Upload Section */}
          <div>
            <Label htmlFor="logo" className="mb-2 block text-sm sm:text-base font-medium">
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
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-gray-200"
                  />
                </div>
              )}
              <div className="flex-1 w-full sm:w-auto">
                <input
                  type="file"
                  id="logo"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                <p className="mt-1 text-xs sm:text-sm text-gray-500">
                  {t('logoHelper')}
                </p>
              </div>
            </div>
          </div>

          {/* Organization Name Field */}
          <div>
            <Label htmlFor="name" className="mb-2 block text-sm sm:text-base font-medium">
              {t('name')}
            </Label>
            <TextInput
              id="name"
              value={organizationForm.name}
              disabled
              className="w-full bg-gray-100 text-gray-600 cursor-not-allowed"
            />
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              {t('nameReadOnly')}
            </p>
          </div>

          {/* Country and City Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country" className="mb-2 block text-sm sm:text-base font-medium">
                {t('country')} <span className="text-red-500">*</span>
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
                required
              />
            </div>

            <div>
              <Label htmlFor="city" className="mb-2 block text-sm sm:text-base font-medium">
                {t('city')}
              </Label>
              <TextInput
                id="city"
                value={organizationForm.city}
                onChange={(e) => setOrganizationForm({
                  ...organizationForm,
                  city: e.target.value
                })}
                className="w-full"
              />
            </div>
          </div>

          {/* Address Field */}
          <div>
            <Label htmlFor="address" className="mb-2 block text-sm sm:text-base font-medium">
              {t('address')}
            </Label>
            <TextInput
              id="address"
              value={organizationForm.address}
              onChange={(e) => setOrganizationForm({
                ...organizationForm,
                address: e.target.value
              })}
              className="w-full"
            />
          </div>

          {/* Languages Selection Field */}
          <div>
            <Label htmlFor="languages" className="mb-2 block text-sm sm:text-base font-medium">
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
            />
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              {t('languagesHelper')}
            </p>
          </div>

          {/* SDGs Selection Field */}
          <div>
            <Label htmlFor="sdgs" className="mb-2 block text-sm sm:text-base font-medium">
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
            />
          </div>

          {/* Description Field */}
          <div>
            <Label htmlFor="description" className="mb-2 block text-sm sm:text-base font-medium">
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
              className="w-full"
            />
          </div>

          {/* Website Field */}
          <div>
            <Label htmlFor="website" className="mb-2 block text-sm sm:text-base font-medium">
              {t('website')}
            </Label>
            <TextInput
              id="website"
              type="url"
              value={organizationForm.website}
              onChange={(e) => setOrganizationForm({
                ...organizationForm,
                website: e.target.value
              })}
              placeholder="https://example.com"
              className="w-full"
            />
          </div>

          {/* Email Field */}
          <div>
            <Label htmlFor="email" className="mb-2 block text-sm sm:text-base font-medium">
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
              className="w-full"
            />
          </div>

          {/* Registration Number Field */}
          <div>
            <Label htmlFor="registrationNumber" className="mb-2 block text-sm sm:text-base font-medium">
              {t('registrationNumber')}
            </Label>
            <TextInput
              id="registrationNumber"
              value={organizationForm.registrationNumber}
              onChange={(e) => setOrganizationForm({
                ...organizationForm,
                registrationNumber: e.target.value
              })}
              className="w-full"
            />
          </div>

          {/* Form Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 border-t border-gray-200">
            <Button 
              type="button"
              color="gray" 
              onClick={() => router.push('/mynonprofit')}
              className="w-full sm:w-auto"
            >
              {t('cancel')}
            </Button>
            <Button 
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              {isSaving ? t('saving') : t('save')}
            </Button>
          </div>
        </form>
      </Card>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-4 sm:bottom-5 right-4 sm:right-5 left-4 sm:left-auto z-50 max-w-sm sm:max-w-none">
          <Toast onClose={() => setToast({ ...toast, show: false })}>
            {toast.type === 'success' && (
              <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-500">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            {toast.type === 'error' && (
              <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-500">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <div className="ml-3 text-sm font-normal break-words">{toast.message}</div>
            <Toast.Toggle onClose={() => setToast({ ...toast, show: false })} />
          </Toast>
        </div>
      )}
    </div>
  );
}

