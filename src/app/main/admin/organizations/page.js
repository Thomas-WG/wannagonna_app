'use client';

/**
 * Organizations Management Page
 * 
 * This component provides a complete CRUD interface for managing organizations.
 * It allows administrators to view, add, edit, and delete organizations with their details.
 */

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { Card, Button, Label, TextInput, Table, Modal, Toast, Textarea } from 'flowbite-react';
import { 
  fetchOrganizations, 
  addOrganization, 
  updateOrganization, 
  deleteOrganization 
} from '@/utils/crudOrganizations';
import { uploadOrgPicture } from '@/utils/storage';
import { countries } from 'countries-list';
import languages from '@cospired/i18n-iso-languages';
import Select from 'react-select';

// Register the languages you want to use
languages.registerLocale(require("@cospired/i18n-iso-languages/langs/en.json"));

/**
 * OrganizationsManagementPage Component
 * 
 * Main component for managing organizations in the admin interface.
 * Provides functionality to view, add, edit, and delete organizations.
 */
export default function OrganizationsManagementPage() {
  // Translation hook for internationalization
  const t = useTranslations('Admin');
  
  // State management
  const [organizations, setOrganizations] = useState([]); // List of all organizations
  const [isLoading, setIsLoading] = useState(true); // Loading state indicator
  const [showModal, setShowModal] = useState(false); // Controls visibility of add/edit modal
  const [showDeleteModal, setShowDeleteModal] = useState(false); // Controls visibility of delete confirmation modal
  const [selectedOrganization, setSelectedOrganization] = useState(null); // Currently selected organization for edit/delete
  const [organizationForm, setOrganizationForm] = useState({
    name: '',
    logo: '',
    country: '',
    languages: [],
    sdgs: [],
    description: '',
    address: '',
    website: '',
    email: '',
    members: [],
    registrationNumber: '',
    createdAt: ''
  }); // Form data for adding/editing organizations
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' }); // Toast notification state
  const [logoFile, setLogoFile] = useState(null); // File object for logo upload

  // Load organizations data when component mounts
  useEffect(() => {
    loadData();
  }, []);

  /**
   * Fetches organizations data from the backend
   * Updates the organizations state and handles loading states
   */
  const loadData = async () => {
    try {
      setIsLoading(true);
      const organizationsData = await fetchOrganizations();
      setOrganizations(organizationsData);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast(t('errorLoading'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles form submission for adding or updating an organization
   * @param {Event} e - Form submission event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let organizationId;
      if (selectedOrganization) {
        // Update existing organization
        organizationId = selectedOrganization.id;
        await updateOrganization(selectedOrganization.id, organizationForm);
        showToast(t('organizationUpdated'), 'success');
      } else {
        // Create new organization
        const organizationWithCreatedAt = {
          ...organizationForm,
          createdAt: new Date().toISOString()
        };
        const newOrg = await addOrganization(organizationWithCreatedAt);
        organizationId = newOrg.id;
        showToast(t('organizationAdded'), 'success');
      }

      // Handle logo upload if a new logo file was selected
      if (logoFile && organizationId) {
        try {
          const url = await uploadOrgPicture(logoFile, organizationId);
          await updateOrganization(organizationId, { ...organizationForm, logo: url });
          setOrganizationForm(prev => ({ ...prev, logo: url }));
        } catch (error) {
          console.error('Error uploading logo:', error);
          showToast(t('errorUploadingLogo'), 'error');
        }
      }

      // Reset UI state after successful operation
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving organization:', error);
      showToast(t('errorSavingOrganization'), 'error');
    }
  };

  /**
   * Handles organization deletion
   * Deletes the selected organization and updates the UI
   */
  const handleDelete = async () => {
    try {
      await deleteOrganization(selectedOrganization.id);
      showToast(t('organizationDeleted'), 'success');
      setShowDeleteModal(false);
      setSelectedOrganization(null);
      loadData();
    } catch (error) {
      console.error('Error deleting organization:', error);
      showToast(t('errorDeletingOrganization'), 'error');
    }
  };

  /**
   * Sets up the form for editing an existing organization
   * @param {Object} organization - The organization to edit
   */
  const editOrganization = (organization) => {
    setSelectedOrganization(organization);
    setOrganizationForm(organization);
    setShowModal(true);
  };

  /**
   * Resets the form and related state to default values
   */
  const resetForm = () => {
    setSelectedOrganization(null);
    setOrganizationForm({
      name: '',
      logo: '',
      country: '',
      languages: [],
      sdgs: [],
      description: '',
      address: '',
      website: '',
      email: '',
      members: [],
      registrationNumber: '',
      createdAt: ''
    });
    setLogoFile(null);
  };

  /**
   * Displays a toast notification
   * @param {string} message - The message to display
   * @param {string} type - The type of toast ('success' or 'error')
   */
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  /**
   * Handles logo file upload
   * Creates a preview URL and updates the form state
   * @param {Event} e - File input change event
   */
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
        try{
      setLogoFile(file);
      
      const imageUrl = URL.createObjectURL(file);
      setOrganizationForm(prev => ({
        ...prev,
        logo: imageUrl
      }));
    } catch (error) {
        console.error("Error handling profile picture:", error);
      }
    }
  };

  // Prepare options for dropdown selectors
  
  // Get country options from countries-list library
  const countryOptions = Object.entries(countries).map(([code, country]) => ({
    value: code,
    label: country.name
  }));

  // Get language options from i18n-iso-languages library
  const languageOptions = Object.entries(languages.getNames('en')).map(([code, name]) => ({
    value: code,
    label: name
  }));

  // Get SDG options (1-17) for Sustainable Development Goals
  const sdgOptions = Array.from({ length: 17 }, (_, i) => ({
    value: `Goal-${String(i + 1).padStart(2, '0')}`,
    label: `Goal-${String(i + 1).padStart(2, '0')}`
  }));

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Page Header */}
      <h1 className="text-2xl font-bold">{t('organizationsManagement')}</h1>
      
      {/* Organizations Table Card */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{t('organizations')}</h2>
          {/* Add Organization Button */}
          <Button onClick={() => {
            resetForm();
            setShowModal(true);
          }}>
            {t('addOrganization')}
          </Button>
        </div>
        
        {/* Organizations Table */}
        <Table>
          <Table.Head>
            <Table.HeadCell>{t('logo')}</Table.HeadCell>
            <Table.HeadCell>{t('name')}</Table.HeadCell>
            <Table.HeadCell>{t('country')}</Table.HeadCell>
            <Table.HeadCell>{t('email')}</Table.HeadCell>
            <Table.HeadCell>{t('actions')}</Table.HeadCell>
          </Table.Head>
          <Table.Body>
            {/* Organization Rows */}
            {organizations.map(org => (
              <Table.Row key={org.id}>
                <Table.Cell>
                  {/* Organization Logo */}
                  {org.logo && (
                    <img 
                      src={org.logo} 
                      alt={org.name} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                </Table.Cell>
                <Table.Cell>{org.name}</Table.Cell>
                <Table.Cell>{countries[org.country]?.name || org.country}</Table.Cell>
                <Table.Cell>{org.email}</Table.Cell>
                <Table.Cell>
                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Button size="xs" onClick={() => editOrganization(org)}>
                      {t('edit')}
                    </Button>
                    <Button 
                      size="xs" 
                      color="failure" 
                      onClick={() => {
                        setSelectedOrganization(org);
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
      </Card>
      
      {/* Organization Add/Edit Modal */}
      <Modal show={showModal} onClose={() => setShowModal(false)} size="xl">
        <Modal.Header>
          {selectedOrganization ? t('editOrganization') : t('addOrganization')}
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Logo Upload Section */}
            <div>
              <Label htmlFor="logo">{t('logo')}</Label>
              <div className="flex items-center space-x-4">
                {organizationForm.logo && (
                  <img 
                    src={organizationForm.logo} 
                    alt="Organization logo" 
                    className="w-20 h-20 rounded-full object-cover"
                  />
                )}
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
              </div>
            </div>

            {/* Organization Name Field */}
            <div>
              <Label htmlFor="name">{t('name')}</Label>
              <TextInput
                id="name"
                value={organizationForm.name}
                onChange={(e) => setOrganizationForm({
                  ...organizationForm,
                  name: e.target.value
                })}
                required
              />
            </div>
            
            {/* Country Selection Field */}
            <div>
              <Label htmlFor="country">{t('country')}</Label>
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

            {/* Languages Selection Field */}
            <div>
              <Label htmlFor="languages">{t('languages')}</Label>
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
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                {t('languagesHelper')}
              </p>
            </div>

            {/* SDGs Selection Field */}
            <div>
              <Label htmlFor="sdgs">{t('sdgs')}</Label>
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
                className="basic-multi-select"
                classNamePrefix="select"
              />
            </div>

            {/* Registration Number Field */}
            <div>
              <Label htmlFor="registrationNumber">{t('registrationNumber')}</Label>
              <TextInput
                id="registrationNumber"
                value={organizationForm.registrationNumber}
                onChange={(e) => setOrganizationForm({
                  ...organizationForm,
                  registrationNumber: e.target.value
                })}
              />
            </div>

            {/* Description Field */}
            <div>
              <Label htmlFor="description">{t('description')}</Label>
              <Textarea
                id="description"
                value={organizationForm.description}
                onChange={(e) => setOrganizationForm({
                  ...organizationForm,
                  description: e.target.value
                })}
              />
            </div>
            
            {/* Address Field */}
            <div>
              <Label htmlFor="address">{t('address')}</Label>
              <TextInput
                id="address"
                value={organizationForm.address}
                onChange={(e) => setOrganizationForm({
                  ...organizationForm,
                  address: e.target.value
                })}
              />
            </div>

            {/* Website Field */}
            <div>
              <Label htmlFor="website">{t('website')}</Label>
              <TextInput
                id="website"
                type="url"
                value={organizationForm.website}
                onChange={(e) => setOrganizationForm({
                  ...organizationForm,
                  website: e.target.value
                })}
              />
            </div>

            {/* Email Field */}
            <div>
              <Label htmlFor="email">{t('email')}</Label>
              <TextInput
                id="email"
                type="email"
                value={organizationForm.email}
                onChange={(e) => setOrganizationForm({
                  ...organizationForm,
                  email: e.target.value
                })}
              />
            </div>

            {/* Form Action Buttons */}
            <div className="flex justify-end space-x-2">
              <Button color="gray" onClick={() => setShowModal(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit">
                {selectedOrganization ? t('update') : t('add')}
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <Modal.Header>{t('deleteOrganization')}</Modal.Header>
        <Modal.Body>
          <p>{t('confirmDeleteOrganization')}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button color="gray" onClick={() => setShowDeleteModal(false)}>
            {t('cancel')}
          </Button>
          <Button color="failure" onClick={handleDelete}>
            {t('delete')}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Toast Notification Component */}
      {toast.show && (
        <Toast>
          <div className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            toast.type === 'success' ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'
          }`}>
            {toast.type === 'success' ? (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="ml-3 text-sm font-normal">{toast.message}</div>
        </Toast>
      )}
    </div>
  );
}
