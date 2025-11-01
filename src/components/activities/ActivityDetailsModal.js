'use client';

import { useEffect, useState } from 'react';
import { Modal, Badge, Button, Spinner } from 'flowbite-react';
import Image from 'next/image';
import { fetchActivityById } from '@/utils/crudActivities';
import { fetchOrganizationById } from '@/utils/crudOrganizations';
import { formatDateOnly } from '@/utils/dateUtils';
import { useTranslations } from 'next-intl';
import {
  HiLocationMarker,
  HiUserGroup,
  HiStar,
  HiCalendar,
  HiOfficeBuilding,
  HiGlobeAlt,
  HiQuestionMarkCircle,
} from 'react-icons/hi';
import { HiClock } from 'react-icons/hi2';
import NPODetailsModal from './NPODetailsModal';
import { categoryIcons } from '@/constant/categoryIcons';

export default function ActivityDetailsModal({ isOpen, onClose, activityId }) {
  const t = useTranslations('ActivityCard');
  const tManage = useTranslations('ManageActivities');
  
  const [activity, setActivity] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showNPOModal, setShowNPOModal] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!activityId || !isOpen) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const activityData = await fetchActivityById(activityId);
        
        if (!activityData) {
          setError('Activity not found');
          setLoading(false);
          return;
        }

        // Convert Firestore timestamps to Date objects
        const processedActivity = {
          ...activityData,
          start_date: activityData.start_date
            ? activityData.start_date instanceof Date
              ? activityData.start_date
              : activityData.start_date.seconds
              ? new Date(activityData.start_date.seconds * 1000)
              : new Date(activityData.start_date)
            : null,
          end_date: activityData.end_date
            ? activityData.end_date instanceof Date
              ? activityData.end_date
              : activityData.end_date.seconds
              ? new Date(activityData.end_date.seconds * 1000)
              : new Date(activityData.end_date)
            : null,
        };

        setActivity(processedActivity);

        // Fetch organization data if organizationId exists
        if (activityData.organizationId) {
          try {
            const orgData = await fetchOrganizationById(activityData.organizationId);
            setOrganization(orgData);
          } catch (orgError) {
            console.error('Error fetching organization:', orgError);
            // Organization fetch error shouldn't block the modal
          }
        }
      } catch (err) {
        console.error('Error fetching activity:', err);
        setError('Failed to load activity details');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [activityId, isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActivity(null);
      setOrganization(null);
      setError(null);
      setShowNPOModal(false);
    }
  }, [isOpen]);

  const CategoryIcon = activity?.category ? (categoryIcons[activity.category] || HiQuestionMarkCircle) : null;
  const categoryLabel = activity?.category ? (() => {
    try {
      return tManage(activity.category);
    } catch {
      return activity.category;
    }
  })() : '';

  const formatDateTimeRange = (start, end) => {
    if (!start) return 'Not specified';
    try {
      const startDate = new Date(start);
      const endDate = end ? new Date(end) : null;

      const dateFormatter = new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      const timeFormatter = new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      });

      const datePart = dateFormatter.format(startDate);
      const startTime = timeFormatter.format(startDate);
      const endTime = endDate ? timeFormatter.format(endDate) : null;

      if (endDate && startDate.toDateString() === endDate.toDateString()) {
        return `${datePart}, ${startTime} - ${endTime}`;
      } else if (endDate) {
        return `${datePart}, ${startTime} - ${dateFormatter.format(endDate)}, ${endTime}`;
      } else {
        return `${datePart}, ${startTime}`;
      }
    } catch (e) {
      return formatDateOnly(start);
    }
  };

  return (
    <>
      <Modal show={isOpen} onClose={onClose} size="4xl" className="z-50">
        <Modal.Header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-semibold">Activity Details</h3>
          </div>
        </Modal.Header>
        
        <Modal.Body className="max-h-[85vh] overflow-y-auto px-4 sm:px-6">
          {loading && (
            <div className="flex justify-center items-center py-12">
              <Spinner size="xl" />
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <Button color="gray" onClick={onClose}>
                Close
              </Button>
            </div>
          )}

          {!loading && !error && activity && (
            <div className="space-y-4 sm:space-y-6 py-2">
              {/* Activity Header */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 pb-4 border-b border-gray-200">
                {/* Organization Logo */}
                <div className="flex items-center gap-3">
                  <Image
                    src={activity.organization_logo || '/logo/Favicon.png'}
                    alt={activity.organization_name || 'Organization'}
                    width={60}
                    height={60}
                    className="rounded-full"
                  />
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">
                      {activity.organization_name || 'Organization'}
                    </h3>
                  </div>
                </div>

                {/* Title and Category */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex-1">
                      {activity.title}
                    </h1>
                    <Badge
                      color={
                        activity.type === 'online'
                          ? 'blue'
                          : activity.type === 'local'
                          ? 'green'
                          : 'purple'
                      }
                      size="lg"
                      className="capitalize"
                    >
                      {activity.type}
                    </Badge>
                  </div>

                  {/* Category */}
                  {CategoryIcon && (
                    <div className="flex items-center gap-2 text-gray-600 mb-4">
                      <CategoryIcon className="h-5 w-5" />
                      <span className="text-sm font-medium">{categoryLabel}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Key Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <HiStar className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">XP Reward</p>
                    <p className="text-base sm:text-lg font-semibold text-indigo-600">{activity.xp_reward || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <HiUserGroup className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Applicants</p>
                    <p className="text-base sm:text-lg font-semibold text-gray-700">
                      {activity.applicants || 0}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <HiLocationMarker className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="text-xs sm:text-sm font-semibold text-gray-700 truncate">
                      {activity.type === 'online'
                        ? 'Online'
                        : activity.city && activity.country
                        ? `${activity.city}, ${activity.country}`
                        : activity.country || 'Not specified'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <HiCalendar className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="text-xs sm:text-sm font-semibold text-gray-700">
                      {activity.frequency === 'once' ? 'One-time' : activity.frequency === 'regular' ? 'Regular' : 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900">Description</h2>
                <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {activity.description || 'No description provided.'}
                </p>
              </div>

              {/* Activity Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Dates */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <HiClock className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Schedule</h2>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Start Date</p>
                      <p className="text-sm font-medium text-gray-700">
                        {activity.start_date
                          ? formatDateOnly(activity.start_date)
                          : 'Not specified'}
                      </p>
                    </div>
                    {activity.end_date && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">End Date</p>
                        <p className="text-sm font-medium text-gray-700">
                          {formatDateOnly(activity.end_date)}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Time</p>
                      <p className="text-sm font-medium text-gray-700">
                        {formatDateTimeRange(activity.start_date, activity.end_date)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                {activity.skills && activity.skills.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <HiUsers className="h-5 w-5 text-purple-600" />
                      <h2 className="text-lg font-semibold text-gray-900">Required Skills</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activity.skills.map((skill, index) => (
                        <Badge key={index} color="purple" size="sm">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Languages */}
                {activity.languages && activity.languages.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <HiTranslate className="h-5 w-5 text-green-600" />
                      <h2 className="text-lg font-semibold text-gray-900">Languages</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activity.languages.map((lang, index) => (
                        <Badge key={index} color="green" size="sm">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* SDG */}
                {activity.sdg && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Sustainable Development Goal
                      </h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <Image
                        src={`/icons/sdgs/c-${activity.sdg}.png`}
                        alt={`SDG ${activity.sdg}`}
                        width={60}
                        height={60}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-600">SDG {activity.sdg}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* NPO Summary */}
              {organization && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 w-full">
                      <Image
                        src={organization.logo || activity.organization_logo || '/logo/Favicon.png'}
                        alt={organization.name || activity.organization_name}
                        width={60}
                        height={60}
                        className="rounded-full border-2 border-white shadow-md flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                          {organization.name || activity.organization_name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                          {organization.city && organization.country && (
                            <div className="flex items-center gap-1">
                              <HiLocationMarker className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span className="truncate">
                                {organization.city}, {organization.country}
                              </span>
                            </div>
                          )}
                          {organization.website && (
                            <div className="flex items-center gap-1">
                              <HiGlobeAlt className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span>Website</span>
                            </div>
                          )}
                        </div>
                        {organization.description && (
                          <p className="text-xs sm:text-sm text-gray-600 mt-2 line-clamp-2">
                            {organization.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      color="blue"
                      onClick={() => setShowNPOModal(true)}
                      className="w-full sm:w-auto flex-shrink-0"
                      size="sm"
                    >
                      <HiOfficeBuilding className="mr-2 h-4 w-4" />
                      Learn More
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        
        <Modal.Footer>
          <Button color="gray" onClick={onClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* NPO Details Modal */}
      {organization && (
        <NPODetailsModal
          isOpen={showNPOModal}
          onClose={() => setShowNPOModal(false)}
          organization={organization}
        />
      )}
    </>
  );
}

