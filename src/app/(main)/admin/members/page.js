'use client';

/**
 * Members Management Page
 * 
 * This component provides an interface for managing member roles.
 * It allows administrators to view all members and assign roles to them.
 */

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, Button, Label, Select, Table, Modal, Toast } from 'flowbite-react';
import { fetchMembers, updateMember } from '@/utils/crudMemberProfile';
import { fetchOrganizations } from '@/utils/crudOrganizations';
import { functions } from 'firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '@/utils/auth/AuthContext';

/**
 * MembersManagementPage Component
 * 
 * Main component for managing member roles in the admin interface.
 * Provides functionality to view members and assign roles to them.
 */
export default function MembersManagementPage() {
  // Translation hook for internationalization
  const t = useTranslations('Admin');
  const { user } = useAuth();
  
  // State management
  const [members, setMembers] = useState([]); // List of all members
  const [isLoading, setIsLoading] = useState(true); // Loading state indicator
  const [showModal, setShowModal] = useState(false); // Controls visibility of role assignment modal
  const [selectedMember, setSelectedMember] = useState(null); // Currently selected member for role assignment
  const [roleForm, setRoleForm] = useState({
    role: '',
    npoId: '' // For npo-staff role
  }); // Form data for role assignment
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' }); // Toast notification state
  const [organizations, setOrganizations] = useState([]); // List of organizations for npo-staff role

  // Load members data when component mounts
  useEffect(() => {
    loadData();
  }, []);

  /**
   * Fetches members data from the backend
   * Updates the members state and handles loading states
   */
  const loadData = async () => {
    try {
      setIsLoading(true);
      const membersData = await fetchMembers();
      setMembers(membersData);
      
      // Use fetchOrganizations from crudOrganizations instead of API call
      const orgsData = await fetchOrganizations();
      setOrganizations(orgsData);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast(t('errorLoading'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Opens the role assignment modal for a specific member
   * @param {Object} member - The member to assign a role to
   */
  const openRoleModal = (member) => {
    setSelectedMember(member);
    setRoleForm({
      role: member.role || '',
      npoId: member.npoId || ''
    });
    setShowModal(true);
  };

  /**
   * Handles form submission for role assignment
   * @param {Event} e - Form submission event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!selectedMember) return;

      // Prepare the claims object based on the role
      const claims = {
        role: roleForm.role
      };
      
      // Add npoId to claims if role is npo-staff
      if (roleForm.role === 'npo-staff' && roleForm.npoId) {
        claims.npoId = roleForm.npoId;
      }

      // Call the Cloud Function to set custom claims
      const setCustomClaimsFunction = httpsCallable(functions, 'setCustomClaims');
      await setCustomClaimsFunction({
        uid: selectedMember.id,
        claims: claims
      });

      // Update the member document in Firestore
      await updateMember(selectedMember.id, {
        role: roleForm.role,
        npoId: roleForm.role === 'npo-staff' ? roleForm.npoId : null
      });

      // Update the local state
      setMembers(prevMembers => 
        prevMembers.map(member => 
          member.id === selectedMember.id 
            ? { 
                ...member, 
                role: roleForm.role, 
                npoId: roleForm.role === 'npo-staff' ? roleForm.npoId : null 
              } 
            : member
        )
      );

      showToast(t('roleUpdated'), 'success');
      setShowModal(false);
    } catch (error) {
      console.error('Error updating role:', error);
      showToast(t('errorUpdatingRole'), 'error');
    }
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
   * Gets the display name for a role
   * @param {string} role - The role code
   * @returns {string} - The display name for the role
   */
  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin':
        return t('roleAdmin');
      case 'ambassador':
        return t('roleAmbassador');
      case 'npo-staff':
        return t('roleNpoStaff');
      default:
        return t('roleNone');
    }
  };

  /**
   * Gets the organization name for a member with npo-staff role
   * @param {string} npoId - The organization ID
   * @returns {string} - The organization name
   */
  const getOrganizationName = (npoId) => {
    if (!npoId) return '';
    const org = organizations.find(org => org.id === npoId);
    return org ? org.name : npoId;
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Page Header */}
      <h1 className="text-2xl font-bold">{t('membersManagement')}</h1>
      
      {/* Members Table Card */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{t('members')}</h2>
        </div>
        
        {/* Members Table */}
        <Table>
          <Table.Head>
            <Table.HeadCell>{t('profilePicture')}</Table.HeadCell>
            <Table.HeadCell>{t('displayName')}</Table.HeadCell>
            <Table.HeadCell>{t('email')}</Table.HeadCell>
            <Table.HeadCell>{t('role')}</Table.HeadCell>
            <Table.HeadCell>{t('organization')}</Table.HeadCell>
            <Table.HeadCell>{t('actions')}</Table.HeadCell>
          </Table.Head>
          <Table.Body>
            {/* Member Rows */}
            {members.map(member => (
              <Table.Row key={member.id}>
                <Table.Cell>
                  {/* Member Profile Picture */}
                  {member.profilePicture && (
                    <img 
                      src={member.profilePicture} 
                      alt={member.displayName} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                </Table.Cell>
                <Table.Cell>{member.displayName}</Table.Cell>
                <Table.Cell>{member.email}</Table.Cell>
                <Table.Cell>{getRoleDisplayName(member.role)}</Table.Cell>
                <Table.Cell>
                  {member.role === 'npo-staff' && getOrganizationName(member.npoId)}
                </Table.Cell>
                <Table.Cell>
                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Button size="xs" onClick={() => openRoleModal(member)}>
                      {t('edit')}
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Card>
      
      {/* Role Assignment Modal */}
      <Modal show={showModal} onClose={() => setShowModal(false)}>
        <Modal.Header>{t('assignRole')}</Modal.Header>
        <Modal.Body>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection Field */}
            <div>
              <Label htmlFor="role">{t('role')}</Label>
              <Select
                id="role"
                value={roleForm.role}
                onChange={(e) => setRoleForm({
                  ...roleForm,
                  role: e.target.value,
                  // Reset npoId if role is not npo-staff
                  npoId: e.target.value !== 'npo-staff' ? '' : roleForm.npoId
                })}
                required
              >
                <option value="">{t('selectRole')}</option>
                <option value="admin">{t('roleAdmin')}</option>
                <option value="ambassador">{t('roleAmbassador')}</option>
                <option value="npo-staff">{t('roleNpoStaff')}</option>
              </Select>
            </div>
            
            {/* Organization Selection Field (only for npo-staff role) */}
            {roleForm.role === 'npo-staff' && (
              <div>
                <Label htmlFor="npoId">{t('organization')}</Label>
                <Select
                  id="npoId"
                  value={roleForm.npoId}
                  onChange={(e) => setRoleForm({
                    ...roleForm,
                    npoId: e.target.value
                  })}
                  required
                >
                  <option value="">{t('selectOrganization')}</option>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {/* Form Action Buttons */}
            <div className="flex justify-end space-x-2">
              <Button color="gray" onClick={() => setShowModal(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit">
                {t('update')}
              </Button>
            </div>
          </form>
        </Modal.Body>
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
