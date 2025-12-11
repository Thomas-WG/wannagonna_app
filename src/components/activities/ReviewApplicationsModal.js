"use client";

import { Modal, Button, Avatar, Badge } from "flowbite-react";
import { HiCheck, HiX, HiClock } from "react-icons/hi";
import { useEffect, useState, useCallback } from "react";
import { fetchApplicationsForActivity, updateApplicationStatus, countPendingApplicationsForOrganization } from "@/utils/crudApplications";
import { formatDate } from "@/utils/dateUtils";
import { fetchOrganizationById } from "@/utils/crudOrganizations";
import { useAuth } from "@/utils/auth/AuthContext";
import { useTranslations } from "next-intl";
import PublicProfileModal from "@/components/profile/PublicProfileModal";

export default function ReviewApplicationsModal({ isOpen, onClose, activity, onOrganizationDataUpdate }) {
  const { claims, user } = useAuth();
  const t = useTranslations('MyNonProfit');
  const tStatus = useTranslations('Dashboard');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingApplication, setProcessingApplication] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState(null);
  const [npoResponse, setNpoResponse] = useState('');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const fetchApplications = useCallback(async () => {
    if (!activity?.id) return;
    
    setLoading(true);
    try {
      const apps = await fetchApplicationsForActivity(activity.id);
      setApplications(apps);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  }, [activity?.id]);

  useEffect(() => {
    if (isOpen && activity?.id) {
      fetchApplications();
    } else if (!isOpen) {
      // Reset confirmation state when modal closes
      setShowConfirmation(false);
      setConfirmationData(null);
      setNpoResponse('');
    }
  }, [isOpen, activity?.id, fetchApplications]);

  const handleApplicationActionClick = (application, status) => {
    setConfirmationData({
      application,
      status,
      action: status === 'accepted' ? 'accept' : 'reject'
    });
    setNpoResponse(''); // Reset response message
    setShowConfirmation(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmationData || !activity?.id) return;
    
    const { application, status } = confirmationData;
    setProcessingApplication(application.id);
    setShowConfirmation(false);
    
    try {
      // Pass the current user's UID to track who approved/rejected the application
      const updatedByUserId = user?.uid || null;
      if (!updatedByUserId) {
        console.warn("ReviewApplicationsModal: user.uid is not available, lastStatusUpdatedBy will not be set");
      }
      await updateApplicationStatus(activity.id, application.id, status, npoResponse, updatedByUserId);
      
      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app.id === application.id 
            ? { ...app, status: status, npoResponse: npoResponse }
            : app
        )
      );
      
      // Refresh organization data to update the counter
      if (claims && claims.npoId && onOrganizationDataUpdate) {
        const orgData = await fetchOrganizationById(claims.npoId);
        if (orgData) {
          // Count pending applications dynamically instead of using stored value
          const pendingCount = await countPendingApplicationsForOrganization(claims.npoId);
          onOrganizationDataUpdate({
            ...orgData,
            totalNewApplications: pendingCount
          });
        }
      }
    } catch (error) {
      console.error("Error updating application status:", error);
    } finally {
      setProcessingApplication(null);
      setConfirmationData(null);
      setNpoResponse('');
    }
  };

  const handleCancelAction = () => {
    setShowConfirmation(false);
    setConfirmationData(null);
    setNpoResponse('');
  };


  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return <Badge color="success" icon={HiCheck}>{tStatus('statusAccepted') || 'Accepted'}</Badge>;
      case 'rejected':
        return <Badge color="failure" icon={HiX}>{tStatus('statusRejected') || 'Rejected'}</Badge>;
      case 'cancelled':
        return <Badge color="gray" icon={HiX}>{tStatus('statusCancelled') || 'Cancelled'}</Badge>;
      default:
        return <Badge color="warning" icon={HiClock}>{tStatus('statusPending') || 'Pending'}</Badge>;
    }
  };

  // Don't render if activity is null
  if (!activity) {
    return null;
  }

  return (
    <Modal show={isOpen} onClose={onClose} size="4xl">
      <Modal.Header>
        <div className="flex flex-col">
          <span className="text-lg font-semibold">{t('reviewApplications') || 'Review Applications'}</span>
          <span className="text-sm text-gray-500 truncate">{activity?.title}</span>
        </div>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">{t('noApplicationsForActivity') || 'No applications found for this activity.'}</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {applications.map((application) => (
              <div 
                key={application.id} 
                className="border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {/* Mobile-friendly card layout */}
                <div className="p-4">
                  {/* Header with profile and status */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className={application.userId ? "cursor-pointer" : ""}
                        onClick={() => {
                          if (application.userId) {
                            setSelectedUserId(application.userId);
                            setProfileModalOpen(true);
                          }
                        }}
                      >
                        <Avatar
                          img={application.profilePicture || '/favicon.ico'}
                          alt={application.displayName}
                          size="md"
                          rounded
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-medium text-gray-900 truncate ${application.userId ? 'cursor-pointer hover:text-blue-600' : ''}`}
                          onClick={() => {
                            if (application.userId) {
                              setSelectedUserId(application.userId);
                              setProfileModalOpen(true);
                            }
                          }}
                        >
                          {application.displayName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(application.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(application.status)}
                    </div>
                  </div>

                  {/* Message content */}
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium text-gray-700">{t('message') || 'Message'}:</span>
                    </p>
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      {application.message || (t('noMessageProvided') || 'No message provided')}
                    </p>
                    {application.npoResponse && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-blue-700 mb-1">{t('npoResponse') || 'NPO Response'}:</p>
                        <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                          {application.npoResponse}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action buttons for pending applications */}
                  {application.status === 'pending' && (
                    <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100">
                      <Button
                        size="sm"
                        color="success"
                        onClick={() => handleApplicationActionClick(application, 'accepted')}
                        disabled={processingApplication === application.id}
                        className="flex items-center justify-center space-x-1 flex-1"
                      >
                        <HiCheck className="h-4 w-4" />
                        <span>{t('accept') || 'Accept'}</span>
                      </Button>
                      <Button
                        size="sm"
                        color="failure"
                        onClick={() => handleApplicationActionClick(application, 'rejected')}
                        disabled={processingApplication === application.id}
                        className="flex items-center justify-center space-x-1 flex-1"
                      >
                        <HiX className="h-4 w-4" />
                        <span>{t('reject') || 'Reject'}</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <div className="flex justify-center sm:justify-end">
          <Button 
            color="gray" 
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            {t('close') || 'Close'}
          </Button>
        </div>
      </Modal.Footer>

      {/* Confirmation Modal */}
      <Modal show={showConfirmation} onClose={handleCancelAction} size="md">
        <Modal.Header>
          {t('confirmAction') || 'Confirm Action'}
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
              {confirmationData?.action === 'accept' ? (
                <HiCheck className="h-6 w-6 text-green-600" />
              ) : (
                <HiX className="h-6 w-6 text-red-600" />
              )}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {confirmationData?.action === 'accept' ? (t('acceptApplication') || 'Accept Application') : (t('rejectApplication') || 'Reject Application')}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {t('confirmActionMessage') || 'Are you sure you want to'} {confirmationData?.action === 'accept' ? (t('accept').toLowerCase() || 'accept') : (t('reject').toLowerCase() || 'reject')} {t('theApplicationFrom') || 'the application from'}{' '}
              <span className="font-medium">{confirmationData?.application?.displayName}</span>?
            </p>
            <div className="bg-gray-50 p-3 rounded-lg text-left">
              <p className="text-xs text-gray-600 mb-1">
                <strong>{t('activity') || 'Activity'}:</strong> {activity?.title}
              </p>
              <p className="text-xs text-gray-600 mb-1">
                <strong>{t('applicant') || 'Applicant'}:</strong> {confirmationData?.application?.displayName}
              </p>
              <p className="text-xs text-gray-600">
                <strong>{t('message') || 'Message'}:</strong> {confirmationData?.application?.message || (t('noMessageProvided') || 'No message provided')}
              </p>
            </div>
            
            {/* NPO Response Message */}
            <div className="mt-4">
              <label htmlFor="npoResponse" className="block text-sm font-medium text-gray-700 mb-2">
                {t('messageToVolunteer') || 'Message to volunteer (optional)'}
              </label>
              <textarea
                id="npoResponse"
                rows={3}
                value={npoResponse}
                onChange={(e) => setNpoResponse(e.target.value)}
                placeholder={t('addPersonalMessagePlaceholder', { name: confirmationData?.application?.displayName || t('theVolunteer') || 'the volunteer' }) || `Add a personal message for ${confirmationData?.application?.displayName}...`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {npoResponse.length}/500 {t('characters') || 'characters'}
              </p>
            </div>
            
            <p className="text-xs text-red-600 mt-3">
              {t('actionCannotBeUndone') || '⚠️ This action cannot be undone and will notify the volunteer.'}
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button 
              color="gray" 
              onClick={handleCancelAction}
              className="w-full sm:w-auto"
            >
              {t('cancel') || 'Cancel'}
            </Button>
            <Button
              color={confirmationData?.action === 'accept' ? 'success' : 'failure'}
              onClick={handleConfirmAction}
              disabled={processingApplication === confirmationData?.application?.id}
              className="w-full sm:w-auto"
            >
              {processingApplication === confirmationData?.application?.id ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  <span>{t('processing') || 'Processing...'}</span>
                </div>
              ) : (
                `${t('yes') || 'Yes'}, ${confirmationData?.action === 'accept' ? (t('accept') || 'Accept') : (t('reject') || 'Reject')}`
              )}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Public Profile Modal */}
      <PublicProfileModal
        isOpen={profileModalOpen}
        onClose={() => {
          setProfileModalOpen(false);
          setSelectedUserId(null);
        }}
        userId={selectedUserId}
      />
    </Modal>
  );
}
