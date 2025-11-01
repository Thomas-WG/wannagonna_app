'use client';

import { Modal, Badge } from 'flowbite-react';
import Image from 'next/image';
import {
  HiOfficeBuilding,
  HiGlobeAlt,
  HiMail,
  HiMapPin,
  HiUsers,
  HiX,
} from 'react-icons/hi';

export default function NPODetailsModal({ isOpen, onClose, organization }) {
  if (!organization) return null;

  return (
    <Modal show={isOpen} onClose={onClose} size="md" className="z-50">
      <Modal.Header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="flex items-center gap-3">
          <HiOfficeBuilding className="h-6 w-6" />
          <h3 className="text-xl font-semibold">Organization Details</h3>
        </div>
      </Modal.Header>
      <Modal.Body className="max-h-[80vh] overflow-y-auto px-4 sm:px-6">
        <div className="space-y-4 sm:space-y-6">
          {/* Organization Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 pb-4 border-b border-gray-200">
            <Image
              src={organization.logo || '/logo/Favicon.png'}
              alt={organization.name || 'Organization'}
              width={80}
              height={80}
              className="rounded-full border-2 border-blue-200 shadow-md flex-shrink-0"
            />
            <div className="flex-1 text-center sm:text-left min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 break-words">
                {organization.name || 'Organization'}
              </h2>
              {(organization.city || organization.country) && (
                <div className="flex items-center justify-center sm:justify-start gap-1 text-gray-600">
                  <HiMapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="break-words">
                    {organization.city && organization.country
                      ? `${organization.city}, ${organization.country}`
                      : organization.city || organization.country}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {organization.description && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">About</h3>
              <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                {organization.description}
              </p>
            </div>
          )}

          {/* Contact Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Contact Information</h3>
            
            {organization.website && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <HiGlobeAlt className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">Website</p>
                  <a
                    href={organization.website.startsWith('http') ? organization.website : `https://${organization.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm break-all"
                  >
                    {organization.website}
                  </a>
                </div>
              </div>
            )}

            {organization.email && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <HiMail className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <a
                    href={`mailto:${organization.email}`}
                    className="text-blue-600 hover:text-blue-800 text-sm break-all"
                  >
                    {organization.email}
                  </a>
                </div>
              </div>
            )}

            {organization.address && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <HiMapPin className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">Address</p>
                  <p className="text-gray-700 text-sm">{organization.address}</p>
                </div>
              </div>
            )}
          </div>

          {/* Languages */}
          {organization.languages && organization.languages.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Languages</h3>
              <div className="flex flex-wrap gap-2">
                {organization.languages.map((lang, index) => (
                  <Badge key={index} color="blue" size="sm">
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* SDGs */}
          {organization.sdgs && organization.sdgs.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Sustainable Development Goals
              </h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {organization.sdgs.map((sdg, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Image
                      src={`/icons/sdgs/c-${sdg}.png`}
                      alt={`SDG ${sdg}`}
                      width={48}
                      height={48}
                      className="rounded"
                    />
                    <span className="text-xs text-gray-600 mt-1">SDG {sdg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Registration Number */}
          {organization.registrationNumber && (
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Registration Number</p>
              <p className="text-sm font-medium text-gray-700">
                {organization.registrationNumber}
              </p>
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button
          onClick={onClose}
          className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
        >
          Close
        </button>
      </Modal.Footer>
    </Modal>
  );
}

