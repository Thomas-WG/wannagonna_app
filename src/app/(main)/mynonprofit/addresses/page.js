'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/utils/auth/AuthContext';
import { fetchAddresses, createAddress, updateAddress, deleteAddress } from '@/utils/crudAddresses';
import { Card, Button, Modal, Spinner, Toast } from 'flowbite-react';
import { HiLocationMarker, HiPlus, HiPencil, HiTrash, HiX } from 'react-icons/hi';
import { useTranslations } from 'next-intl';
import AddressAutocomplete from '@/components/addresses/AddressAutocomplete';
import dynamic from 'next/dynamic';

// Lazy load map component
const AddressMapPreview = dynamic(() => import('@/components/addresses/AddressMapPreview'), {
  ssr: false,
  loading: () => (
    <div className="h-32 sm:h-40 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse flex items-center justify-center">
      <Spinner size="sm" />
    </div>
  )
});

export default function AddressesPage() {
  const t = useTranslations('MyNonProfit');
  const { claims } = useAuth();
  const queryClient = useQueryClient();
  const organizationId = claims?.npoId;

  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    name: '',
    formattedAddress: '',
    coordinates: null,
    addressComponents: {},
    placeId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ type: '', message: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ['addresses', organizationId],
    queryFn: () => fetchAddresses(organizationId),
    enabled: !!organizationId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000
  });

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const showToastMessage = (type, message) => {
    setToastMessage({ type, message });
    setShowToast(true);
  };

  const handleAddClick = () => {
    setEditingAddress(null);
    setAddressForm({
      name: '',
      formattedAddress: '',
      coordinates: null,
      addressComponents: {},
      placeId: ''
    });
    setShowModal(true);
  };

  const handleEditClick = (address) => {
    setEditingAddress(address);
    setAddressForm({
      name: address.name || '',
      formattedAddress: address.formattedAddress || '',
      coordinates: address.coordinates || null,
      addressComponents: address.addressComponents || {},
      placeId: address.placeId || ''
    });
    setShowModal(true);
  };

  const handleAddressSelect = (addressData) => {
    setAddressForm(prev => ({
      ...prev,
      formattedAddress: addressData?.formattedAddress || prev.formattedAddress || '',
      coordinates: addressData?.coordinates || prev.coordinates || null,
      addressComponents: addressData?.addressComponents || prev.addressComponents || {},
      placeId: addressData?.placeId || prev.placeId || ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!addressForm.formattedAddress || !addressForm.coordinates) {
      showToastMessage('error', t('addressRequired') || 'Please select a valid address');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingAddress) {
        await updateAddress(organizationId, editingAddress.id, addressForm);
        showToastMessage('success', t('addressUpdated') || 'Address updated successfully');
      } else {
        await createAddress(organizationId, addressForm);
        showToastMessage('success', t('addressCreated') || 'Address created successfully');
      }

      queryClient.invalidateQueries({ queryKey: ['addresses', organizationId] });
      setShowModal(false);
      setAddressForm({
        name: '',
        formattedAddress: '',
        coordinates: null,
        addressComponents: {},
        placeId: ''
      });
    } catch (error) {
      console.error('Error saving address:', error);
      showToastMessage('error', t('errorSavingAddress') || 'Error saving address. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (addressId) => {
    try {
      await deleteAddress(organizationId, addressId);
      queryClient.invalidateQueries({ queryKey: ['addresses', organizationId] });
      showToastMessage('success', t('addressDeleted') || 'Address deleted successfully');
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting address:', error);
      showToastMessage('error', t('errorDeletingAddress') || 'Error deleting address. Please try again.');
    }
  };

  if (!organizationId) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="text-center py-12">
          <p className="text-text-secondary dark:text-text-secondary">
            {t('organizationRequired') || 'Organization ID is required'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 bg-background-page dark:bg-background-page min-h-dvh">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary dark:text-text-primary">
            {t('myAddresses') || 'My Addresses'}
          </h1>
          <Button
            onClick={handleAddClick}
            className="bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-white min-h-[44px] touch-manipulation"
          >
            <HiPlus className="h-5 w-5 mr-2" />
            {t('addAddress') || 'Add Address'}
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Spinner size="xl" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && addresses.length === 0 && (
        <Card className="bg-background-card dark:bg-background-card border-border-light dark:border-border-dark">
          <div className="text-center py-12">
            <HiLocationMarker className="h-16 w-16 mx-auto text-text-tertiary dark:text-text-tertiary mb-4" />
            <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary mb-2">
              {t('noAddresses') || 'No addresses saved'}
            </h3>
            <p className="text-text-secondary dark:text-text-secondary mb-6">
              {t('noAddressesHelper') || 'Add your first address to get started'}
            </p>
            <Button
              onClick={handleAddClick}
              className="bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-white min-h-[44px] touch-manipulation"
            >
              <HiPlus className="h-5 w-5 mr-2" />
              {t('addAddress') || 'Add Address'}
            </Button>
          </div>
        </Card>
      )}

      {/* Address List */}
      {!isLoading && addresses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {addresses.map((address) => (
            <Card
              key={address.id}
              className="bg-background-card dark:bg-background-card border-border-light dark:border-border-dark hover:shadow-lg transition-shadow"
            >
              <div className="space-y-3">
                {/* Map Preview */}
                {address.coordinates && (
                  <div className="h-32 sm:h-40 rounded-lg overflow-hidden">
                    <AddressMapPreview
                      coordinates={address.coordinates}
                      address={address.formattedAddress}
                    />
                  </div>
                )}

                {/* Address Info */}
                <div>
                  {address.name && (
                    <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary mb-1">
                      {address.name}
                    </h3>
                  )}
                  <p className="text-sm text-text-secondary dark:text-text-secondary flex items-start gap-2">
                    <HiLocationMarker className="h-4 w-4 mt-0.5 flex-shrink-0 text-text-tertiary dark:text-text-tertiary" />
                    <span className="line-clamp-2">{address.formattedAddress}</span>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-border-light dark:border-border-dark">
                  <Button
                    size="sm"
                    color="gray"
                    onClick={() => handleEditClick(address)}
                    className="flex-1 min-h-[44px] touch-manipulation"
                  >
                    <HiPencil className="h-4 w-4 mr-1" />
                    {t('edit') || 'Edit'}
                  </Button>
                  <Button
                    size="sm"
                    color="failure"
                    onClick={() => setDeleteConfirm(address)}
                    className="flex-1 min-h-[44px] touch-manipulation"
                  >
                    <HiTrash className="h-4 w-4 mr-1" />
                    {t('delete') || 'Delete'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        size="md"
        className="fixed inset-0 z-50"
      >
        <Modal.Header className="bg-background-card dark:bg-background-card border-b border-border-light dark:border-border-dark">
          <span className="text-xl font-semibold text-text-primary dark:text-text-primary">
            {editingAddress ? (t('editAddress') || 'Edit Address') : (t('addAddress') || 'Add Address')}
          </span>
        </Modal.Header>
        <Modal.Body className="bg-background-card dark:bg-background-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Address Name (Optional) */}
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-text-primary mb-2">
                {t('addressName') || 'Address Name (optional)'}
              </label>
              <input
                type="text"
                value={addressForm.name}
                onChange={(e) => setAddressForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('addressNamePlaceholder') || 'e.g., Main Office, Warehouse'}
                className="w-full px-3 py-2 text-sm sm:text-base bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border border-border-light dark:border-border-dark rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[44px] touch-manipulation"
              />
            </div>

            {/* Address Autocomplete */}
            <div>
              <AddressAutocomplete
                value={addressForm.formattedAddress}
                onChange={handleAddressSelect}
                label={t('address') || 'Address'}
                helperText={t('addressHelper') || 'Start typing to search for an address'}
                required
              />
            </div>

            {/* Map Preview */}
            {addressForm.coordinates && (
              <div className="h-48 rounded-lg overflow-hidden">
                <AddressMapPreview
                  coordinates={addressForm.coordinates}
                  address={addressForm.formattedAddress}
                />
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4 border-t border-border-light dark:border-border-dark">
              <Button
                type="button"
                color="gray"
                onClick={() => setShowModal(false)}
                className="flex-1 min-h-[44px] touch-manipulation"
                disabled={isSubmitting}
              >
                {t('cancel') || 'Cancel'}
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-white min-h-[44px] touch-manipulation"
                disabled={isSubmitting || !addressForm.formattedAddress || !addressForm.coordinates}
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    {t('saving') || 'Saving...'}
                  </>
                ) : (
                  editingAddress ? (t('update') || 'Update') : (t('save') || 'Save')
                )}
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        show={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        size="md"
      >
        <Modal.Header className="bg-background-card dark:bg-background-card border-b border-border-light dark:border-border-dark">
          <span className="text-xl font-semibold text-text-primary dark:text-text-primary">
            {t('deleteAddress') || 'Delete Address'}
          </span>
        </Modal.Header>
        <Modal.Body className="bg-background-card dark:bg-background-card">
          <p className="text-text-secondary dark:text-text-secondary mb-4">
            {t('deleteAddressConfirm') || 'Are you sure you want to delete this address? This action cannot be undone.'}
          </p>
          {deleteConfirm && (
            <p className="text-sm text-text-tertiary dark:text-text-tertiary mb-6">
              {deleteConfirm.name || deleteConfirm.formattedAddress}
            </p>
          )}
          <div className="flex gap-3">
            <Button
              color="gray"
              onClick={() => setDeleteConfirm(null)}
              className="flex-1 min-h-[44px] touch-manipulation"
            >
              {t('cancel') || 'Cancel'}
            </Button>
            <Button
              color="failure"
              onClick={() => handleDelete(deleteConfirm.id)}
              className="flex-1 min-h-[44px] touch-manipulation"
            >
              {t('delete') || 'Delete'}
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-16 sm:bottom-5 right-4 sm:right-5 left-4 sm:left-auto z-[60] max-w-sm sm:max-w-none">
          <Toast onClose={() => setShowToast(false)}>
            {toastMessage.type === 'success' && (
              <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-500">
                ✓
              </div>
            )}
            {toastMessage.type === 'error' && (
              <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-500">
                !
              </div>
            )}
            <div className="ml-3 text-sm font-normal break-words">{toastMessage.message}</div>
            <Toast.Toggle onClose={() => setShowToast(false)} />
          </Toast>
        </div>
      )}
    </div>
  );
}
