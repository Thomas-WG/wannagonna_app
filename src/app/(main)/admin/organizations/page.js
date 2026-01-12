'use client';

/**
 * Organizations Management Page
 * 
 * This component provides a complete CRUD interface for managing organizations.
 * It allows administrators to view, add, edit, and delete organizations with their details.
 */

import { useState, useEffect, useCallback } from 'react';
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
import Image from 'next/image';
import { sdgOptions } from '@/constant/sdgs';
import { useTheme } from '@/utils/theme/ThemeContext';
import { useModal } from '@/utils/modal/useModal';
import BackButton from '@/components/layout/BackButton';

// Register the languages you want to use
languages.registerLocale(require("@cospired/i18n-iso-languages/langs/en.json"));

/**
 * OrganizationsManagementPage Component
 * 
 * Main component for managing organizations in the admin interface.
 * Provides functionality to view, add, edit, and delete organizations.
 */
export default function OrganizationsManagementPage() {
  const { isDark } = useTheme();
  
  // State management
  const [organizations, setOrganizations] = useState([]); // List of all organizations
  const [isLoading, setIsLoading] = useState(true); // Loading state indicator
  const [showModal, setShowModal] = useState(false); // Controls visibility of add/edit modal
  const [showDeleteModal, setShowDeleteModal] = useState(false); // Controls visibility of delete confirmation modal
  const [selectedOrganization, setSelectedOrganization] = useState(null); // Currently selected organization for edit/delete
  
  // Register modals with global modal manager
  const wrappedModalOnClose = useModal(showModal, () => setShowModal(false), 'org-add-edit-modal');
  const wrappedDeleteModalOnClose = useModal(showDeleteModal, () => setShowDeleteModal(false), 'org-delete-modal');
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

  // Define loadData function outside of useEffect so it can be reused
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const organizationsData = await fetchOrganizations();
      setOrganizations(organizationsData);
    } catch (error) {
      console.error('Error loading data:', error);
      setToast({ show: true, message: 'Error loading organizations', type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load organizations data when component mounts
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
        showToast('Organization updated successfully', 'success');
      } else {
        // Create new organization
        const organizationWithCreatedAt = {
          ...organizationForm,
          createdAt: new Date().toISOString()
        };
        const newOrg = await addOrganization(organizationWithCreatedAt);
        organizationId = newOrg.id;
        showToast('Organization added successfully', 'success');
      }

      // Handle logo upload if a new logo file was selected
      if (logoFile && organizationId) {
        try {
          const url = await uploadOrgPicture(logoFile, organizationId);
          await updateOrganization(organizationId, { ...organizationForm, logo: url });
          setOrganizationForm(prev => ({ ...prev, logo: url }));
        } catch (error) {
          console.error('Error uploading logo:', error);
          showToast('Error uploading logo', 'error');
        }
      }

      // Reset UI state after successful operation
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving organization:', error);
      showToast('Error saving organization', 'error');
    }
  };

  /**
   * Handles organization deletion
   * Deletes the selected organization and updates the UI
   */
  const handleDelete = async () => {
    try {
      await deleteOrganization(selectedOrganization.id);
      showToast('Organization deleted successfully', 'success');
      setShowDeleteModal(false);
      setSelectedOrganization(null);
      loadData();
    } catch (error) {
      console.error('Error deleting organization:', error);
      showToast('Error deleting organization', 'error');
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
      city: '',
      website: '',
      email: '',
      members: [],
      registrationNumber: '',
      createdAt: ''
    });
    setLogoFile(null);
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

  // SDG options are imported from constants

  // Custom styles for react-select with dark mode and mobile support
  const selectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderColor: state.isFocused 
        ? (isDark ? '#fb923c' : '#f97316')
        : (isDark ? '#334155' : '#e2e8f0'),
      color: isDark ? '#f8fafc' : '#0f172a',
      minHeight: '44px', // Better touch target on mobile (44px minimum for accessibility)
      fontSize: '14px',
      width: '100%',
      maxWidth: '100%',
      '&:hover': {
        borderColor: isDark ? '#fb923c' : '#f97316',
      },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderColor: isDark ? '#334155' : '#e2e8f0',
      zIndex: 9999, // Ensure dropdown appears above modal
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999, // Ensure portal appears above modal
    }),
    menuList: (base) => ({
      ...base,
      maxHeight: '200px',
      padding: '4px',
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
      padding: '12px 14px', // Larger padding for better touch targets
      minHeight: '44px', // Minimum touch target size
      fontSize: '14px',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: isDark ? '#475569' : '#e0f2fe',
      },
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: isDark ? '#334155' : '#e0f2fe',
      borderRadius: '4px',
      margin: '2px',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: isDark ? '#f8fafc' : '#0284c7',
      fontSize: '13px',
      padding: '4px 6px',
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: isDark ? '#cbd5e1' : '#0284c7',
      padding: '6px', // Larger padding for touch
      minWidth: '36px', // Better touch target
      minHeight: '36px',
      '&:hover': {
        backgroundColor: isDark ? '#475569' : '#bae6fd',
        color: isDark ? '#f8fafc' : '#0369a1',
      },
    }),
    placeholder: (base) => ({
      ...base,
      color: isDark ? '#94a3b8' : '#64748b',
      fontSize: '14px',
    }),
    input: (base) => ({
      ...base,
      color: isDark ? '#f8fafc' : '#0f172a',
      fontSize: '14px',
      margin: '0',
      padding: '0',
    }),
    singleValue: (base) => ({
      ...base,
      color: isDark ? '#f8fafc' : '#0f172a',
      fontSize: '14px',
    }),
    indicatorsContainer: (base) => ({
      ...base,
      color: isDark ? '#cbd5e1' : '#64748b',
      padding: '4px',
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '6px 10px', // Adequate padding for mobile
      maxWidth: '100%',
      overflow: 'hidden',
    }),
    container: (base) => ({
      ...base,
      width: '100%',
      maxWidth: '100%',
    }),
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden px-3 sm:px-4 md:container md:mx-auto py-3 sm:py-4 space-y-4 sm:space-y-6">
      {/* Back Button */}
      <BackButton fallbackPath="/admin" />

      {/* Page Header */}
      <h1 className="text-xl sm:text-2xl font-bold">Organizations Management</h1>
      
      {/* Organizations Table Card */}
      <Card className="w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h2 className="text-lg sm:text-xl font-semibold">Organizations</h2>
          {/* Add Organization Button */}
          <Button 
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="w-full sm:w-auto text-sm sm:text-base"
            size="sm"
          >
            Add Organization
          </Button>
        </div>
        
        {/* Desktop Table */}
        {organizations.length > 0 && (
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <Table.Head>
                <Table.HeadCell className="text-xs sm:text-sm">Logo</Table.HeadCell>
                <Table.HeadCell className="text-xs sm:text-sm">Name</Table.HeadCell>
                <Table.HeadCell className="text-xs sm:text-sm">Country</Table.HeadCell>
                <Table.HeadCell className="text-xs sm:text-sm">Email</Table.HeadCell>
                <Table.HeadCell className="text-xs sm:text-sm">Actions</Table.HeadCell>
              </Table.Head>
              <Table.Body>
                {/* Organization Rows */}
                {organizations.map(org => (
                  <Table.Row key={org.id}>
                    <Table.Cell>
                      {/* Organization Logo */}
                      {org.logo && (
                        <Image 
                          src={org.logo} 
                          alt={org.name} 
                          width={40}
                          height={40}
                          priority={true}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      )}
                    </Table.Cell>
                    <Table.Cell className="font-medium">{org.name}</Table.Cell>
                    <Table.Cell>{countries[org.country]?.name || org.country}</Table.Cell>
                    <Table.Cell className="max-w-[200px] truncate">{org.email}</Table.Cell>
                    <Table.Cell>
                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <Button size="xs" onClick={() => editOrganization(org)}>
                          Edit
                        </Button>
                        <Button 
                          size="xs" 
                          color="failure" 
                          onClick={() => {
                            setSelectedOrganization(org);
                            setShowDeleteModal(true);
                          }}
                        >
                          Delete
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
          {organizations.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4">No organizations found</p>
          ) : (
            organizations.map(org => (
              <Card key={org.id} className="p-4 w-full overflow-hidden">
                <div className="flex items-start gap-2 sm:gap-3 w-full min-w-0">
                  {org.logo && (
                    <Image 
                      src={org.logo} 
                      alt={org.name} 
                      width={50}
                      height={50}
                      priority={true}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <h3 className="font-semibold text-sm sm:text-base truncate">{org.name}</h3>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex-shrink-0">Country:</span>
                        <span className="text-xs text-gray-700 dark:text-gray-300 truncate min-w-0">{countries[org.country]?.name || org.country}</span>
                      </div>
                      {org.email && (
                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex-shrink-0">Email:</span>
                          <span className="text-xs text-gray-700 dark:text-gray-300 truncate min-w-0">{org.email}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 mt-3">
                      <Button 
                        size="sm" 
                        onClick={() => editOrganization(org)}
                        className="w-full text-xs sm:text-sm"
                      >
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        color="failure" 
                        onClick={() => {
                          setSelectedOrganization(org);
                          setShowDeleteModal(true);
                        }}
                        className="w-full text-xs sm:text-sm"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>
      
      {/* Organization Add/Edit Modal */}
      <Modal 
        show={showModal} 
        onClose={wrappedModalOnClose} 
        size="xl"
        className="z-50 max-w-[95vw] sm:max-w-none"
        dismissible={true}
      >
        <Modal.Header className="text-base sm:text-lg px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="w-full min-w-0">
            <h3 className="truncate">{selectedOrganization ? 'Edit Organization' : 'Add Organization'}</h3>
          </div>
        </Modal.Header>
        <Modal.Body className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 max-h-[85vh] sm:max-h-[80vh] overflow-y-auto overflow-x-hidden w-full">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 w-full max-w-full overflow-hidden">
            {/* Logo Upload Section */}
            <div className="w-full max-w-full overflow-hidden">
              <Label htmlFor="logo" className="text-sm sm:text-base">Logo</Label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:space-x-4 w-full max-w-full">
                {organizationForm.logo && (
                  <Image 
                    src={organizationForm.logo} 
                    alt="Organization logo" 
                    width={80}
                    height={80}
                    priority={true}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover flex-shrink-0"
                  />
                )}
                <input
                  type="file"
                  id="logo"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="block w-full text-xs sm:text-sm text-gray-500 dark:text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-xs sm:file:text-sm file:font-semibold
                    file:bg-blue-50 dark:file:bg-blue-900 file:text-blue-700 dark:file:text-blue-300
                    hover:file:bg-blue-100 dark:hover:file:bg-blue-800"
                />
              </div>
            </div>

            {/* Organization Name Field */}
            <div className="w-full max-w-full overflow-hidden">
              <Label htmlFor="name" className="text-sm sm:text-base">Name</Label>
              <TextInput
                id="name"
                value={organizationForm.name}
                onChange={(e) => setOrganizationForm({
                  ...organizationForm,
                  name: e.target.value
                })}
                required
                className="text-sm sm:text-base w-full"
              />
            </div>
            
            {/* Country Selection Field */}
            <div className="w-full max-w-full overflow-hidden">
              <Label htmlFor="country" className="text-sm sm:text-base mb-1.5 block">Country</Label>
              <div className="w-full">
              <Select
                id="country"
                name="country"
                options={countryOptions}
                value={countryOptions.find(option => option.value === organizationForm.country)}
                onChange={(selectedOption) => setOrganizationForm({
                  ...organizationForm,
                  country: selectedOption ? selectedOption.value : ''
                })}
                placeholder="Select Country"
                className="basic-single-select"
                classNamePrefix="select"
                styles={selectStyles}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                menuPosition="fixed"
                required
              />
              </div>
            </div>

            {/* Languages Selection Field */}
            <div className="w-full max-w-full overflow-hidden">
              <Label htmlFor="languages" className="text-sm sm:text-base mb-1.5 block">Languages</Label>
              <div className="w-full">
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
                placeholder="Select Languages"
                className="basic-multi-select"
                classNamePrefix="select"
                styles={selectStyles}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                menuPosition="fixed"
                required
              />
              </div>
              <p className="mt-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Select all languages spoken by this organization
              </p>
            </div>

            {/* SDGs Selection Field */}
            <div className="w-full max-w-full overflow-hidden">
              <Label htmlFor="sdgs" className="text-sm sm:text-base mb-1.5 block">SDGs</Label>
              <div className="w-full">
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
                placeholder="Select SDGs"
                className="basic-multi-select"
                classNamePrefix="select"
                styles={selectStyles}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                menuPosition="fixed"
              />
              </div>
            </div>

            {/* Registration Number Field */}
            <div className="w-full max-w-full overflow-hidden">
              <Label htmlFor="registrationNumber" className="text-sm sm:text-base">Registration Number</Label>
              <TextInput
                id="registrationNumber"
                value={organizationForm.registrationNumber}
                onChange={(e) => setOrganizationForm({
                  ...organizationForm,
                  registrationNumber: e.target.value
                })}
                className="text-sm sm:text-base w-full"
              />
            </div>

            {/* Description Field */}
            <div className="w-full max-w-full overflow-hidden">
              <Label htmlFor="description" className="text-sm sm:text-base">Description</Label>
              <Textarea
                id="description"
                value={organizationForm.description}
                onChange={(e) => setOrganizationForm({
                  ...organizationForm,
                  description: e.target.value
                })}
                className="text-sm sm:text-base w-full"
                rows={4}
              />
            </div>
            
            {/* Address Field */}
            <div className="w-full max-w-full overflow-hidden">
              <Label htmlFor="address" className="text-sm sm:text-base">Address</Label>
              <TextInput
                id="address"
                value={organizationForm.address}
                onChange={(e) => setOrganizationForm({
                  ...organizationForm,
                  address: e.target.value
                })}
                className="text-sm sm:text-base w-full"
              />
            </div>

            {/* City Field */}
            <div className="w-full max-w-full overflow-hidden">
              <Label htmlFor="city" className="text-sm sm:text-base">City</Label>
              <TextInput
                id="city"
                value={organizationForm.city}
                onChange={(e) => setOrganizationForm({
                  ...organizationForm,
                  city: e.target.value
                })}
                className="text-sm sm:text-base w-full"
              />
            </div>

            {/* Website Field */}
            <div className="w-full max-w-full overflow-hidden">
              <Label htmlFor="website" className="text-sm sm:text-base">Website</Label>
              <TextInput
                id="website"
                type="url"
                value={organizationForm.website}
                onChange={(e) => setOrganizationForm({
                  ...organizationForm,
                  website: e.target.value
                })}
                className="text-sm sm:text-base w-full"
              />
            </div>

            {/* Email Field */}
            <div className="w-full max-w-full overflow-hidden">
              <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
              <TextInput
                id="email"
                type="email"
                value={organizationForm.email}
                onChange={(e) => setOrganizationForm({
                  ...organizationForm,
                  email: e.target.value
                })}
                className="text-sm sm:text-base w-full"
              />
            </div>

            {/* Form Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700 mt-4 sm:mt-6">
              <Button 
                color="gray" 
                onClick={wrappedModalOnClose}
                className="w-full sm:w-auto text-sm sm:text-base py-2.5 sm:py-2 min-h-[44px] sm:min-h-0"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="w-full sm:w-auto text-sm sm:text-base py-2.5 sm:py-2 min-h-[44px] sm:min-h-0"
              >
                {selectedOrganization ? 'Update' : 'Add'}
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onClose={wrappedDeleteModalOnClose} className="max-w-[95vw] sm:max-w-none">
        <Modal.Header className="text-base sm:text-lg px-3 sm:px-4 md:px-6">Delete Organization</Modal.Header>
        <Modal.Body className="px-3 sm:px-4 md:px-6">
          <p className="text-sm sm:text-base">Are you sure you want to delete this organization? This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer className="px-3 sm:px-4 md:px-6">
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:space-x-2 w-full sm:w-auto">
            <Button 
              color="gray" 
              onClick={wrappedDeleteModalOnClose}
              className="w-full sm:w-auto text-sm sm:text-base"
            >
              Cancel
            </Button>
            <Button 
              color="failure" 
              onClick={handleDelete}
              className="w-full sm:w-auto text-sm sm:text-base"
            >
              Delete
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
