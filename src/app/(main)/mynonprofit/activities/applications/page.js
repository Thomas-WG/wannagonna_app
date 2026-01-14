'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Modal } from 'flowbite-react'
import { HiCheck, HiX } from 'react-icons/hi'
import { useAuth } from '@/utils/auth/AuthContext'
import { fetchActivitiesByCriteria } from '@/utils/crudActivities'
import { fetchApplicationsForActivity, updateApplicationStatus } from '@/utils/crudApplications'
import { useTranslations } from 'next-intl'
import { useModal } from '@/utils/modal/useModal'
import PublicProfileModal from '@/components/profile/PublicProfileModal'
import ApplicationCard from '@/components/activities/ApplicationCard'
import NPODetailsModal from '@/components/activities/NPODetailsModal'
import { fetchOrganizationById } from '@/utils/crudOrganizations'
import BackButton from '@/components/layout/BackButton'

export default function ReviewApplicationsPage() {
  const { user, claims } = useAuth()
  const t = useTranslations('MyNonProfit')
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState([])
  const [applicationsByActivityId, setApplicationsByActivityId] = useState({})
  const [processingApplicationId, setProcessingApplicationId] = useState(null)
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [confirmation, setConfirmation] = useState(null)
  const [npoResponse, setNpoResponse] = useState('')
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [showOrgModal, setShowOrgModal] = useState(false)
  const [selectedOrganization, setSelectedOrganization] = useState(null)
  
  const organizationId = claims?.npoId || null

  const loadData = useCallback(async () => {
    if (!organizationId) return
    setLoading(true)
    try {
      const orgActivities = await fetchActivitiesByCriteria(organizationId, 'any', 'any')
      // Sort by creation_date or start_date desc if present
      const sorted = [...orgActivities].sort((a, b) => {
        const aDate = (a.creation_date?.seconds ? new Date(a.creation_date.seconds * 1000) : (a.creation_date ? new Date(a.creation_date) : 0))
        const bDate = (b.creation_date?.seconds ? new Date(b.creation_date.seconds * 1000) : (b.creation_date ? new Date(b.creation_date) : 0))
        return (bDate?.getTime?.() || 0) - (aDate?.getTime?.() || 0)
      })
      setActivities(sorted)

      // Fetch applications for each activity in parallel
      const appsArrays = await Promise.all(sorted.map((act) => fetchApplicationsForActivity(act.id)))
      const mapping = {}
      sorted.forEach((act, idx) => {
        mapping[act.id] = appsArrays[idx] || []
      })
      setApplicationsByActivityId(mapping)
    } catch (err) {
      console.error('Error loading applications review data:', err)
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    if (organizationId) {
      loadData()
    }
  }, [organizationId, loadData])

  const openConfirm = (activityId, application, nextStatus) => {
    setConfirmation({ activityId, application, nextStatus })
    setNpoResponse('')
    setConfirmationOpen(true)
  }

  const closeConfirm = () => {
    setConfirmationOpen(false)
    setConfirmation(null)
    setNpoResponse('')
  }

  // Register confirmation modal with global modal manager
  const wrappedConfirmationOnClose = useModal(confirmationOpen, closeConfirm, 'applications-confirmation-modal')

  const confirmAction = async () => {
    if (!confirmation) return
    const { activityId, application, nextStatus } = confirmation
    try {
      setProcessingApplicationId(application.id)
      // Pass the current user's UID to track who approved/rejected the application
      const updatedByUserId = user?.uid || null
      await updateApplicationStatus(activityId, application.id, nextStatus, npoResponse, updatedByUserId)
      // Update local state for application status and response
      setApplicationsByActivityId((prev) => ({
        ...prev,
        [activityId]: (prev[activityId] || []).map((app) =>
          app.id === application.id ? { ...app, status: nextStatus, npoResponse } : app
        ),
      }))
    } catch (err) {
      console.error('Error updating application:', err)
    } finally {
      setProcessingApplicationId(null)
      closeConfirm()
    }
  }

  const totalApplications = useMemo(() => {
    return Object.values(applicationsByActivityId).reduce((acc, arr) => acc + (arr?.length || 0), 0)
  }, [applicationsByActivityId])

  // Sort and organize activities: pending first, then answered, then no applications
  const sortedActivities = useMemo(() => {
    return [...activities].sort((a, b) => {
      const appsA = applicationsByActivityId[a.id] || []
      const appsB = applicationsByActivityId[b.id] || []
      
      const pendingA = appsA.filter(app => app.status === 'pending').length
      const pendingB = appsB.filter(app => app.status === 'pending').length
      
      // Activities with pending applications come first
      if (pendingA > 0 && pendingB === 0) return -1
      if (pendingA === 0 && pendingB > 0) return 1
      
      // If both have pending, sort by number of pending (more pending first)
      if (pendingA > 0 && pendingB > 0) {
        return pendingB - pendingA
      }
      
      // If both have no pending, prioritize ones with applications
      if (appsA.length > 0 && appsB.length === 0) return -1
      if (appsA.length === 0 && appsB.length > 0) return 1
      
      // Otherwise sort by creation date (newest first)
      const aDate = (a.creation_date?.seconds ? new Date(a.creation_date.seconds * 1000) : (a.creation_date ? new Date(a.creation_date) : 0))
      const bDate = (b.creation_date?.seconds ? new Date(b.creation_date.seconds * 1000) : (b.creation_date ? new Date(b.creation_date) : 0))
      return (bDate?.getTime?.() || 0) - (aDate?.getTime?.() || 0)
    })
  }, [activities, applicationsByActivityId])

  // Sort applications within each activity: pending first, then answered
  const getSortedApplications = (activityId) => {
    const apps = applicationsByActivityId[activityId] || []
    return [...apps].sort((a, b) => {
      // Pending applications come first
      if (a.status === 'pending' && b.status !== 'pending') return -1
      if (a.status !== 'pending' && b.status === 'pending') return 1
      
      // Within same status, sort by date (newest first)
      const aDate = a.createdAt?.getTime?.() || (a.createdAt ? new Date(a.createdAt).getTime() : 0)
      const bDate = b.createdAt?.getTime?.() || (b.createdAt ? new Date(b.createdAt).getTime() : 0)
      return (bDate || 0) - (aDate || 0)
    })
  }

  const totalPendingApplications = useMemo(() => {
    return Object.values(applicationsByActivityId).reduce((acc, arr) => {
      return acc + (arr?.filter(app => app.status === 'pending').length || 0)
    }, 0)
  }, [applicationsByActivityId])

  if (!user) return null

  return (
    <div className="p-4 max-w-5xl mx-auto bg-background-page dark:bg-background-page min-h-screen">
      {/* Back Button */}
      <BackButton fallbackPath="/mynonprofit" />

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-text-primary dark:text-text-primary">{t('reviewApplications') || 'Review Applications'}</h1>
        <p className="text-sm text-text-secondary dark:text-text-secondary">
          {loading ? (t('loading') || 'Loading…') : (
            <>
              {sortedActivities.length} {t('activities') || 'activities'} • {totalApplications} {t('applications') || 'applications'}
              {totalPendingApplications > 0 && (
                <span className="ml-2 text-semantic-warning-600 dark:text-semantic-warning-400 font-semibold">
                  • {totalPendingApplications} {t('pending') || 'pending'}
                </span>
              )}
            </>
          )}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500 dark:border-primary-400"></div>
        </div>
      ) : sortedActivities.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-text-secondary dark:text-text-secondary">{t('noActivitiesFound') || 'No activities found for your organization.'}</p>
        </div>
      ) : totalApplications === 0 ? (
        <div className="text-center py-10">
          <p className="text-text-secondary dark:text-text-secondary">{t('noApplicationsYet') || 'No applications yet.'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedActivities.flatMap((activity) => {
            const applications = getSortedApplications(activity.id)
            
            return applications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={{
                  ...application,
                  activityId: activity.id,
                  applicationId: application.id,
                }}
                activity={activity}
                memberProfile={{
                  displayName: application.displayName,
                  profilePicture: application.profilePicture,
                }}
                onMemberAvatarClick={() => {
                  if (application.userId) {
                    setSelectedUserId(application.userId);
                    setProfileModalOpen(true);
                  }
                }}
                onOrgLogoClick={async () => {
                  // Fetch organization data and open modal
                  const orgId = activity.organizationId || application.organizationId || organizationId;
                  if (orgId) {
                    try {
                      const orgData = await fetchOrganizationById(orgId);
                      if (orgData) {
                        setSelectedOrganization(orgData);
                        setShowOrgModal(true);
                      }
                    } catch (error) {
                      console.error('Error fetching organization:', error);
                    }
                  }
                }}
                onAcceptClick={() => openConfirm(activity.id, application, 'accepted')}
                onRejectClick={() => openConfirm(activity.id, application, 'rejected')}
                isProcessing={processingApplicationId === application.id}
                acceptLabel={t('accept')}
                rejectLabel={t('reject')}
              />
            ))
          })}
        </div>
      )}

      <Modal show={confirmationOpen} onClose={closeConfirm} size="md">
        <Modal.Header className="border-b border-border-light dark:border-border-dark">
          <span className="text-text-primary dark:text-text-primary">{t('confirmAction') || 'Confirm Action'}</span>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-semantic-warning-100 dark:bg-semantic-warning-900 mb-4">
              {confirmation?.nextStatus === 'accepted' ? (
                <HiCheck className="h-6 w-6 text-semantic-success-600 dark:text-semantic-success-400" />
              ) : (
                <HiX className="h-6 w-6 text-semantic-error-600 dark:text-semantic-error-400" />
              )}
            </div>
            <h3 className="text-lg font-medium text-text-primary dark:text-text-primary mb-2">
              {confirmation?.nextStatus === 'accepted' ? (t('acceptApplication') || 'Accept Application') : (t('rejectApplication') || 'Reject Application')}
            </h3>
            <p className="text-sm text-text-secondary dark:text-text-secondary mb-4">
              {t('confirmActionMessage') || 'Are you sure you want to'} {confirmation?.nextStatus === 'accepted' ? (t('accept').toLowerCase() || 'accept') : (t('reject').toLowerCase() || 'reject')} {t('theApplicationFrom') || 'the application from'}{' '}
              <span className="font-medium">{confirmation?.application?.displayName}</span>?
            </p>
            <div className="bg-background-hover dark:bg-background-hover p-3 rounded-lg text-left">
              <p className="text-xs text-text-secondary dark:text-text-secondary mb-1">
                <strong className="text-text-primary dark:text-text-primary">{t('activity') || 'Activity'}:</strong> {activities.find((a) => a.id === confirmation?.activityId)?.title || (t('untitledActivity') || 'Untitled activity')}
              </p>
              <p className="text-xs text-text-secondary dark:text-text-secondary mb-1">
                <strong className="text-text-primary dark:text-text-primary">{t('applicant') || 'Applicant'}:</strong> {confirmation?.application?.displayName}
              </p>
              <p className="text-xs text-text-secondary dark:text-text-secondary">
                <strong className="text-text-primary dark:text-text-primary">{t('message') || 'Message'}:</strong> {confirmation?.application?.message || (t('noMessageProvided') || 'No message provided')}
              </p>
            </div>

            <div className="mt-4">
              <label htmlFor="npoResponse" className="block text-sm font-medium text-text-primary dark:text-text-primary mb-2">
                {t('messageToVolunteer') || 'Message to volunteer (optional)'}
              </label>
              <textarea
                id="npoResponse"
                rows={3}
                value={npoResponse}
                onChange={(e) => setNpoResponse(e.target.value)}
                placeholder={t('addPersonalMessagePlaceholder', { name: confirmation?.application?.displayName || t('theVolunteer') || 'the volunteer' }) || `Add a personal message for ${confirmation?.application?.displayName || 'the volunteer'}...`}
                className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-md shadow-sm bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 text-sm"
                maxLength={500}
              />
              <p className="text-xs text-text-tertiary dark:text-text-tertiary mt-1">{npoResponse.length}/500 {t('characters') || 'characters'}</p>
            </div>
            <p className="text-xs text-semantic-error-600 dark:text-semantic-error-400 mt-3">{t('actionCannotBeUndone') || '⚠️ This action cannot be undone and will notify the volunteer.'}</p>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-t border-border-light dark:border-border-dark">
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end w-full">
            <Button color="gray" onClick={wrappedConfirmationOnClose} className="w-full sm:w-auto">{t('cancel') || 'Cancel'}</Button>
            <Button
              color={confirmation?.nextStatus === 'accepted' ? 'success' : 'failure'}
              onClick={confirmAction}
              disabled={processingApplicationId === confirmation?.application?.id}
              className="w-full sm:w-auto"
            >
              {processingApplicationId === confirmation?.application?.id ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  <span>{t('processing') || 'Processing...'}</span>
                </div>
              ) : (
                `${t('yes') || 'Yes'}, ${confirmation?.nextStatus === 'accepted' ? (t('accept') || 'Accept') : (t('reject') || 'Reject')}`
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

      {/* Organization Details Modal */}
      <NPODetailsModal
        isOpen={showOrgModal}
        onClose={() => {
          setShowOrgModal(false);
          setSelectedOrganization(null);
        }}
        organization={selectedOrganization}
      />
    </div>
  )
}


