'use client';

/**
 * Members Management Page
 * 
 * This component provides an interface for managing member roles.
 * It allows administrators to view all members and assign roles to them.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card, Button, Label, Select, Table, Modal, Toast, TextInput } from 'flowbite-react';
import { fetchMembers, updateMember } from '@/utils/crudMemberProfile';
import { fetchOrganizations } from '@/utils/crudOrganizations';
import { functions } from 'firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '@/utils/auth/AuthContext';
import { fetchUserBadges, grantBadgeToUser, removeBadgeFromUser, fetchAllBadges } from '@/utils/crudBadges';
import Image from 'next/image';

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
    npoId: '', // For npo-staff role
    xp: 0 // XP points
  }); // Form data for role assignment and member editing
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' }); // Toast notification state
  const [organizations, setOrganizations] = useState([]); // List of organizations for npo-staff role
  const [showBadgeModal, setShowBadgeModal] = useState(false); // Controls visibility of badge management modal
  const [selectedMemberForBadges, setSelectedMemberForBadges] = useState(null); // Member selected for badge management
  const [memberBadges, setMemberBadges] = useState([]); // Current badges for selected member
  const [allBadges, setAllBadges] = useState([]); // All available badges
  const [isLoadingBadges, setIsLoadingBadges] = useState(false); // Loading state for badges
  const [badgeToAdd, setBadgeToAdd] = useState(''); // Badge ID to add
  const [searchQuery, setSearchQuery] = useState(''); // Search query for filtering members

  // Define loadData function outside of useEffect so it can be reused
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const membersData = await fetchMembers();
      setMembers(membersData);
      
      // Use fetchOrganizations from crudOrganizations instead of API call
      const orgsData = await fetchOrganizations();
      setOrganizations(orgsData);
    } catch (error) {
      console.error('Error loading data:', error);
      setToast({ show: true, message: t('errorLoading'), type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // Load members data when component mounts
  useEffect(() => {
    loadData();
    loadAllBadges();
  }, [loadData]);

  // Load all available badges
  const loadAllBadges = useCallback(async () => {
    try {
      const badges = await fetchAllBadges();
      setAllBadges(badges);
    } catch (error) {
      console.error('Error loading badges:', error);
    }
  }, []);

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
   * Opens the member edit modal for a specific member
   * @param {Object} member - The member to edit
   */
  const openRoleModal = (member) => {
    setSelectedMember(member);
    setRoleForm({
      role: member.role || '',
      npoId: member.npoId || '',
      xp: member.xp || 0
    });
    setShowModal(true);
  };

  /**
   * Handles form submission for member editing (role and XP)
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

      // Prepare update data
      const newXp = parseInt(roleForm.xp) || 0;
      const updateData = {
        role: roleForm.role,
        npoId: roleForm.role === 'npo-staff' ? roleForm.npoId : null,
        xp: newXp // Always update XP to ensure consistency
      };

      // Update the member document in Firestore
      await updateMember(selectedMember.id, updateData);

      // Update the local state
      setMembers(prevMembers => 
        prevMembers.map(member => 
          member.id === selectedMember.id 
            ? { 
                ...member, 
                role: roleForm.role, 
                npoId: roleForm.role === 'npo-staff' ? roleForm.npoId : null,
                xp: newXp
              } 
            : member
        )
      );

      showToast(t('memberUpdated') || 'Member updated successfully', 'success');
      setShowModal(false);
    } catch (error) {
      console.error('Error updating member:', error);
      showToast(t('errorUpdatingMember') || 'Error updating member', 'error');
    }
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

  /**
   * Opens the badge management modal for a specific member
   * @param {Object} member - The member to manage badges for
   */
  const openBadgeModal = async (member) => {
    setSelectedMemberForBadges(member);
    setBadgeToAdd('');
    setIsLoadingBadges(true);
    try {
      const badges = await fetchUserBadges(member.id);
      setMemberBadges(badges);
    } catch (error) {
      console.error('Error loading member badges:', error);
      showToast(t('errorLoadingBadges') || 'Error loading badges', 'error');
    } finally {
      setIsLoadingBadges(false);
    }
    setShowBadgeModal(true);
  };

  /**
   * Handles adding a badge to a member
   */
  const handleAddBadge = async () => {
    if (!badgeToAdd || !selectedMemberForBadges) return;
    
    try {
      setIsLoadingBadges(true);
      const result = await grantBadgeToUser(selectedMemberForBadges.id, badgeToAdd);
      
      if (result) {
        // Refresh badges list
        const badges = await fetchUserBadges(selectedMemberForBadges.id);
        setMemberBadges(badges);
        setBadgeToAdd('');
        showToast(t('badgeAdded') || 'Badge added successfully', 'success');
      } else {
        showToast(t('errorAddingBadge') || 'Error adding badge (may already exist)', 'error');
      }
    } catch (error) {
      console.error('Error adding badge:', error);
      showToast(t('errorAddingBadge') || 'Error adding badge', 'error');
    } finally {
      setIsLoadingBadges(false);
    }
  };

  /**
   * Handles removing a badge from a member
   * @param {string} badgeId - The badge ID to remove
   */
  const handleRemoveBadge = async (badgeId) => {
    if (!selectedMemberForBadges) return;
    
    try {
      setIsLoadingBadges(true);
      const result = await removeBadgeFromUser(selectedMemberForBadges.id, badgeId);
      
      if (result) {
        // Refresh badges list
        const badges = await fetchUserBadges(selectedMemberForBadges.id);
        setMemberBadges(badges);
        showToast(t('badgeRemoved') || 'Badge removed successfully', 'success');
      } else {
        showToast(t('errorRemovingBadge') || 'Error removing badge', 'error');
      }
    } catch (error) {
      console.error('Error removing badge:', error);
      showToast(t('errorRemovingBadge') || 'Error removing badge', 'error');
    } finally {
      setIsLoadingBadges(false);
    }
  };

  // Filter members based on search query
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    
    const lowerQuery = searchQuery.toLowerCase().trim();
    
    return members.filter(member => {
      const displayName = (member.displayName || '').toLowerCase();
      const email = (member.email || '').toLowerCase();
      const role = getRoleDisplayName(member.role || '').toLowerCase();
      const organization = member.role === 'npo-staff' 
        ? getOrganizationName(member.npoId).toLowerCase() 
        : '';
      
      return displayName.includes(lowerQuery) ||
             email.includes(lowerQuery) ||
             role.includes(lowerQuery) ||
             organization.includes(lowerQuery);
    });
  }, [members, searchQuery, organizations, t]);

  return (
    <div className="container mx-auto p-2 sm:p-4 space-y-4 sm:space-y-6">
      {/* Page Header */}
      <h1 className="text-xl sm:text-2xl font-bold px-2 sm:px-0">{t('membersManagement')}</h1>
      
      {/* Search Field */}
      {!isLoading && (
        <Card className="px-4 py-3">
          <div className="w-full">
            <Label htmlFor="search" className="mb-2 block text-sm font-medium">
              {t('searchMembers') || 'Search Members'}
            </Label>
            <TextInput
              id="search"
              type="text"
              placeholder={t('searchPlaceholder') || 'Search by name, email, role, or organization...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
            {searchQuery && (
              <div className="mt-2 text-sm text-gray-500">
                {filteredMembers.length === 0 ? (
                  <span>{t('noResults') || 'No members found'}</span>
                ) : (
                  <span>
                    {filteredMembers.length} {filteredMembers.length === 1 ? t('member') || 'member' : t('members') || 'members'} {t('found') || 'found'}
                  </span>
                )}
              </div>
            )}
          </div>
        </Card>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <Card>
          <div className="text-center py-8">
            <div className="text-gray-500">{t('loading') || 'Loading...'}</div>
          </div>
        </Card>
      )}

      {/* Members Table Card - Desktop */}
      {!isLoading && (
        <Card className="hidden md:block">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-semibold">{t('members')}</h2>
          </div>
          
          {/* Members Table */}
          <div className="overflow-x-auto">
            <Table>
            <Table.Head>
              <Table.HeadCell>{t('profilePicture')}</Table.HeadCell>
              <Table.HeadCell>{t('displayName')}</Table.HeadCell>
              <Table.HeadCell>{t('email')}</Table.HeadCell>
              <Table.HeadCell>{t('role')}</Table.HeadCell>
              <Table.HeadCell>{t('organization')}</Table.HeadCell>
              <Table.HeadCell>{t('badges') || 'Badges'}</Table.HeadCell>
              <Table.HeadCell>{t('actions')}</Table.HeadCell>
            </Table.Head>
            <Table.Body>
              {/* Member Rows */}
              {filteredMembers.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={7} className="text-center py-8 text-gray-500">
                    {searchQuery ? (t('noResults') || 'No members found') : (t('noMembers') || 'No members')}
                  </Table.Cell>
                </Table.Row>
              ) : (
                filteredMembers.map(member => (
                <Table.Row key={member.id}>
                  <Table.Cell>
                    {/* Member Profile Picture */}
                    {member.profilePicture && (
                      <Image 
                        src={member.profilePicture} 
                        alt={member.displayName} 
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                    )}
                  </Table.Cell>
                  <Table.Cell className="max-w-[150px] truncate">{member.displayName}</Table.Cell>
                  <Table.Cell className="max-w-[200px] truncate">{member.email}</Table.Cell>
                  <Table.Cell>{getRoleDisplayName(member.role)}</Table.Cell>
                  <Table.Cell className="max-w-[150px] truncate">
                    {member.role === 'npo-staff' && getOrganizationName(member.npoId)}
                  </Table.Cell>
                  <Table.Cell>
                    <Button size="xs" color="purple" onClick={() => openBadgeModal(member)}>
                      {t('manageBadges') || 'Manage Badges'}
                    </Button>
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
                ))
              )}
            </Table.Body>
          </Table>
          </div>
        </Card>
      )}

      {/* Members Cards - Mobile */}
      {!isLoading && (
        <div className="md:hidden space-y-3">
        {filteredMembers.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? (t('noResults') || 'No members found') : (t('noMembers') || 'No members')}
            </div>
          </Card>
        ) : (
          filteredMembers.map(member => (
          <Card key={member.id} className="p-4">
            <div className="flex items-start gap-3">
              {/* Profile Picture */}
              {member.profilePicture && (
                <Image 
                  src={member.profilePicture} 
                  alt={member.displayName} 
                  width={50}
                  height={50}
                  className="rounded-full object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base truncate">{member.displayName}</h3>
                <p className="text-sm text-gray-600 truncate">{member.email}</p>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">{t('role')}:</span>
                    <span className="text-xs">{getRoleDisplayName(member.role)}</span>
                  </div>
                  {member.role === 'npo-staff' && getOrganizationName(member.npoId) && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">{t('organization')}:</span>
                      <span className="text-xs truncate">{getOrganizationName(member.npoId)}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                  <Button 
                    size="sm" 
                    color="purple" 
                    onClick={() => openBadgeModal(member)}
                    className="w-full sm:w-auto"
                  >
                    {t('manageBadges') || 'Manage Badges'}
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => openRoleModal(member)}
                    className="w-full sm:w-auto"
                  >
                    {t('edit')}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
          ))
        )}
        </div>
      )}
      
      {/* Member Edit Modal */}
      <Modal 
        show={showModal} 
        onClose={() => setShowModal(false)}
      >
        <Modal.Header className="text-base sm:text-lg px-4 sm:px-6">
          {t('editMember') || 'Edit Member'} - {selectedMember?.displayName}
        </Modal.Header>
        <Modal.Body className="px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* XP Points Field */}
            <div>
              <Label htmlFor="xp" className="mb-2 block text-sm font-medium">
                {t('xpPoints') || 'XP Points'}
              </Label>
              <TextInput
                id="xp"
                type="number"
                min="0"
                step="1"
                value={roleForm.xp}
                onChange={(e) => setRoleForm({
                  ...roleForm,
                  xp: parseInt(e.target.value) || 0
                })}
                className="w-full text-base"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                {t('currentXp') || 'Current XP'}: {selectedMember?.xp || 0}
              </p>
            </div>

            {/* Role Selection Field */}
            <div>
              <Label htmlFor="role" className="mb-2 block text-sm font-medium">{t('role')}</Label>
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
                className="w-full text-base"
              >
                <option value="">{t('selectRole')}</option>
                <option value="admin">{t('roleAdmin')}</option>
                <option value="ambassador">{t('roleAmbassador')}</option>
                <option value="npo-staff">{t('roleNpoStaff')}</option>
                <option value="member">{t('roleNone')}</option>
              </Select>
            </div>
            
            {/* Organization Selection Field (only for npo-staff role) */}
            {roleForm.role === 'npo-staff' && (
              <div>
                <Label htmlFor="npoId" className="mb-2 block text-sm font-medium">{t('organization')}</Label>
                <Select
                  id="npoId"
                  value={roleForm.npoId}
                  onChange={(e) => setRoleForm({
                    ...roleForm,
                    npoId: e.target.value
                  })}
                  required
                  className="w-full text-base"
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
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-2 pt-4">
              <Button 
                color="gray" 
                onClick={() => setShowModal(false)}
                className="w-full sm:w-auto"
              >
                {t('cancel')}
              </Button>
              <Button 
                type="submit"
                className="w-full sm:w-auto"
              >
                {t('update')}
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
      
      {/* Badge Management Modal */}
      <Modal 
        show={showBadgeModal} 
        onClose={() => setShowBadgeModal(false)} 
        size="xl"
      >
        <Modal.Header className="text-base sm:text-lg px-4 sm:px-6">
          <div className="truncate">
            {t('manageBadges') || 'Manage Badges'} - <span className="font-normal">{selectedMemberForBadges?.displayName}</span>
          </div>
        </Modal.Header>
        <Modal.Body className="px-4 sm:px-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-4">
            {/* Current Badges Section */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">{t('currentBadges') || 'Current Badges'}</h3>
              {isLoadingBadges ? (
                <div className="text-center py-8 text-sm sm:text-base">{t('loading') || 'Loading...'}</div>
              ) : memberBadges.length === 0 ? (
                <p className="text-gray-500 text-sm sm:text-base py-4">{t('noBadges') || 'No badges assigned'}</p>
              ) : (
                <div className="space-y-2">
                  {memberBadges.map((badge) => (
                    <div 
                      key={badge.id} 
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <span className="font-medium text-sm sm:text-base break-words flex-1">{badge.title || badge.id}</span>
                      <Button 
                        size="sm" 
                        color="failure" 
                        onClick={() => handleRemoveBadge(badge.id)}
                        className="w-full sm:w-auto min-w-[80px]"
                      >
                        {t('remove') || 'Remove'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Badge Section */}
            <div className="border-t pt-4">
              <h3 className="text-base sm:text-lg font-semibold mb-3">{t('addBadge') || 'Add Badge'}</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <Select
                    value={badgeToAdd}
                    onChange={(e) => setBadgeToAdd(e.target.value)}
                    className="w-full text-base"
                  >
                    <option value="">{t('selectBadge') || 'Select a badge...'}</option>
                    {allBadges
                      .filter(badge => !memberBadges.some(mb => mb.id === badge.id))
                      .map(badge => (
                        <option key={badge.id} value={badge.id}>
                          {badge.title || badge.id}
                        </option>
                      ))}
                  </Select>
                </div>
                <Button 
                  onClick={handleAddBadge} 
                  disabled={!badgeToAdd || isLoadingBadges}
                  className="w-full sm:w-auto min-w-[100px]"
                >
                  {t('add') || 'Add'}
                </Button>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="px-4 sm:px-6">
          <Button 
            color="gray" 
            onClick={() => setShowBadgeModal(false)}
            className="w-full sm:w-auto"
          >
            {t('close') || 'Close'}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Toast Notification Component */}
      {toast.show && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto z-50">
          <Toast className="w-full sm:w-auto">
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
            <div className="ml-3 text-sm font-normal break-words">{toast.message}</div>
          </Toast>
        </div>
      )}
    </div>
  );
}
