'use client';

import { Modal, Badge } from 'flowbite-react';
import Image from 'next/image';
import {
  HiOfficeBuilding,
  HiGlobeAlt,
  HiMail,
  HiLocationMarker,
  HiCalendar,
} from 'react-icons/hi';
import { countries } from 'countries-list';
import languages from '@cospired/i18n-iso-languages';
import { sdgNames, getSDGNumber } from '@/constant/sdgs';
import { useTheme } from '@/utils/theme/ThemeContext';

// Register the languages you want to use
languages.registerLocale(require("@cospired/i18n-iso-languages/langs/en.json"));

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return null;
  }
};

export default function NPODetailsModal({ isOpen, onClose, organization }) {
  const { isDark } = useTheme();
  
  if (!organization) return null;

  // Get country name
  const countryName = organization.country 
    ? (countries[organization.country]?.name || organization.country)
    : null;

  // Get language names
  const languageNames = organization.languages?.map(lang => 
    languages.getName(lang, 'en') || lang
  ) || [];

  return (
    <Modal show={isOpen} onClose={onClose} size="xl" className="z-50">
      <Modal.Header className="bg-gradient-to-r from-semantic-info-500 to-semantic-info-600 dark:from-semantic-info-600 dark:to-semantic-info-700 text-white border-b border-border-light dark:border-border-dark">
        <div className="flex items-center gap-3">
          <HiOfficeBuilding className="h-6 w-6" />
          <h3 className="text-xl font-semibold">Organization Details</h3>
        </div>
      </Modal.Header>
      <Modal.Body className="max-h-[85vh] overflow-y-auto px-4 sm:px-6 py-6 bg-background-card dark:bg-background-card">
        <div className="space-y-6">
          {/* Organization Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 pb-6 border-b-2 border-border-light dark:border-[#475569]">
            <div className="relative">
              <Image
                src={organization.logo || '/logo/Favicon.png'}
                alt={organization.name || 'Organization'}
                width={120}
                height={120}
                className="rounded-full border-4 border-semantic-info-200 dark:border-semantic-info-700 shadow-lg flex-shrink-0 object-cover"
              />
              <div className="absolute -bottom-2 -right-2 bg-semantic-info-600 dark:bg-semantic-info-500 rounded-full p-2 shadow-md">
                <HiOfficeBuilding className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left min-w-0">
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary dark:text-text-primary mb-3 break-words">
                {organization.name || 'Organization'}
              </h2>
              {(organization.city || countryName) && (
                <div className="flex items-center justify-center sm:justify-start gap-2 text-text-secondary dark:text-text-secondary mb-2">
                  <HiLocationMarker className="h-5 w-5 flex-shrink-0 text-semantic-info-500 dark:text-semantic-info-400" />
                  <span className="break-words text-base">
                    {organization.city && countryName
                      ? `${organization.city}, ${countryName}`
                      : organization.city || countryName}
                  </span>
                </div>
              )}
              {organization.createdAt && (
                <div className="flex items-center justify-center sm:justify-start gap-2 text-text-tertiary dark:text-text-tertiary text-sm">
                  <HiCalendar className="h-4 w-4" />
                  <span>Registered on {formatDate(organization.createdAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {organization.description && (
            <div className="bg-gradient-to-r from-semantic-info-50 to-semantic-info-100 dark:from-semantic-info-900 dark:to-semantic-info-800 rounded-xl p-5 border-2 border-semantic-info-200 dark:border-semantic-info-700">
              <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary mb-3 flex items-center gap-2">
                <div className="w-1 h-6 bg-semantic-info-500 dark:bg-semantic-info-400 rounded-full"></div>
                About
              </h3>
              <p className="text-text-secondary dark:text-text-secondary whitespace-pre-wrap leading-relaxed text-base">
                {organization.description}
              </p>
            </div>
          )}

          {/* Contact Information */}
          {(organization.website || organization.email || organization.address) && (
            <div className="space-y-3 pt-4 border-t-2 border-border-light dark:border-[#475569]">
              <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-semantic-info-500 dark:bg-semantic-info-400 rounded-full"></div>
                Contact Information
              </h3>
              
              {organization.website && (
                <div className="flex items-center gap-4 p-4 bg-background-hover dark:bg-background-hover rounded-xl border-2 border-border-light dark:border-[#475569] hover:shadow-md transition-all">
                  <div className="bg-semantic-info-100 dark:bg-semantic-info-900 p-3 rounded-full">
                    <HiGlobeAlt className="h-6 w-6 text-semantic-info-600 dark:text-semantic-info-400 flex-shrink-0" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text-tertiary dark:text-text-tertiary mb-1 uppercase tracking-wide">Website</p>
                    <a
                      href={organization.website.startsWith('http') ? organization.website : `https://${organization.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-semantic-info-600 dark:text-semantic-info-400 hover:text-semantic-info-700 dark:hover:text-semantic-info-300 text-sm font-medium break-all hover:underline"
                    >
                      {organization.website}
                    </a>
                  </div>
                </div>
              )}

              {organization.email && (
                <div className="flex items-center gap-4 p-4 bg-background-hover dark:bg-background-hover rounded-xl border-2 border-border-light dark:border-[#475569] hover:shadow-md transition-all">
                  <div className="bg-semantic-info-100 dark:bg-semantic-info-900 p-3 rounded-full">
                    <HiMail className="h-6 w-6 text-semantic-info-600 dark:text-semantic-info-400 flex-shrink-0" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text-tertiary dark:text-text-tertiary mb-1 uppercase tracking-wide">Email</p>
                    <a
                      href={`mailto:${organization.email}`}
                      className="text-semantic-info-600 dark:text-semantic-info-400 hover:text-semantic-info-700 dark:hover:text-semantic-info-300 text-sm font-medium break-all hover:underline"
                    >
                      {organization.email}
                    </a>
                  </div>
                </div>
              )}

              {organization.address && (
                <div className="flex items-start gap-4 p-4 bg-background-hover dark:bg-background-hover rounded-xl border-2 border-border-light dark:border-[#475569] hover:shadow-md transition-all">
                  <div className="bg-semantic-info-100 dark:bg-semantic-info-900 p-3 rounded-full mt-1">
                    <HiLocationMarker className="h-6 w-6 text-semantic-info-600 dark:text-semantic-info-400 flex-shrink-0" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text-tertiary dark:text-text-tertiary mb-1 uppercase tracking-wide">Address</p>
                    <p className="text-text-secondary dark:text-text-secondary text-sm leading-relaxed">{organization.address}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Languages */}
          {languageNames.length > 0 && (
            <div className="pt-4 border-t-2 border-border-light dark:border-[#475569]">
              <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary mb-3 flex items-center gap-2">
                <div className="w-1 h-6 bg-semantic-info-500 dark:bg-semantic-info-400 rounded-full"></div>
                Languages
              </h3>
              <div className="flex flex-wrap gap-2">
                {languageNames.map((langName, index) => (
                  <Badge 
                    key={index} 
                    color="blue" 
                    size="lg"
                    className="px-4 py-2 text-sm font-medium"
                  >
                    {langName}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* SDGs */}
          {organization.sdgs && organization.sdgs.length > 0 && (
            <div className="pt-4 border-t-2 border-border-light dark:border-[#475569]">
              <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-semantic-info-500 dark:bg-semantic-info-400 rounded-full"></div>
                Sustainable Development Goals
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {organization.sdgs.map((sdg, index) => {
                  const sdgNumber = getSDGNumber(sdg);
                  const sdgName = sdgNames[sdgNumber];
                  return (
                    <div
                      key={index}
                      className="flex flex-col items-center p-3 bg-background-hover dark:bg-background-hover rounded-xl border-2 border-border-light dark:border-[#475569] hover:shadow-lg hover:scale-105 transition-all cursor-pointer group"
                      title={sdgName ? `SDG ${sdgNumber}: ${sdgName}` : `SDG ${sdgNumber}`}
                    >
                      <Image
                        src={`/icons/sdgs/c-${sdgNumber}.png`}
                        alt={`SDG ${sdgNumber}`}
                        width={56}
                        height={56}
                        className="rounded-lg group-hover:scale-110 transition-transform"
                      />
                      <span className="text-xs font-semibold text-text-primary dark:text-text-primary mt-2 text-center">
                        SDG {sdgNumber}
                      </span>
                      {sdgName && (
                        <span className="text-[10px] text-text-tertiary dark:text-text-tertiary mt-1 text-center leading-tight">
                          {sdgName}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </Modal.Body>
      <Modal.Footer className="bg-background-card dark:bg-background-card border-t-2 border-border-light dark:border-[#475569]">
        <button
          onClick={onClose}
          className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-semantic-info-500 to-semantic-info-600 dark:from-semantic-info-600 dark:to-semantic-info-700 text-white rounded-lg hover:from-semantic-info-600 hover:to-semantic-info-700 dark:hover:from-semantic-info-700 dark:hover:to-semantic-info-800 transition-all shadow-md hover:shadow-lg font-medium text-sm"
        >
          Close
        </button>
      </Modal.Footer>
    </Modal>
  );
}

