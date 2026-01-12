'use client';

import { HiGlobeAlt, HiExternalLink } from 'react-icons/hi';
import { FaLinkedin, FaFacebook, FaInstagram } from 'react-icons/fa';
import { normalizeUrl } from '@/utils/urlUtils';
import { useTranslations } from 'next-intl';

/**
 * Connect section component
 * Displays social links (website, LinkedIn, Facebook, Instagram)
 */
export default function ConnectSection({ profileData }) {
  const tProfile = useTranslations('PublicProfile');

  if (!profileData) return null;

  const hasLinks = profileData.website || profileData.linkedin || profileData.facebook || profileData.instagram;

  if (!hasLinks) return null;

  return (
    <div className="bg-background-hover dark:bg-background-hover rounded-lg p-4 border border-border-light dark:border-border-dark">
      <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary mb-3">{tProfile('connectWithMe') || 'Connect'}</h3>
      <div className="space-y-2">
        {profileData.website && (
          <a
            href={normalizeUrl(profileData.website)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-semantic-info-600 dark:text-semantic-info-400 hover:text-semantic-info-700 dark:hover:text-semantic-info-300 transition-colors text-sm"
          >
            <HiGlobeAlt className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{tProfile('website') || 'Website'}</span>
            <HiExternalLink className="w-3 h-3 flex-shrink-0 ml-auto" />
          </a>
        )}
        {profileData.linkedin && (
          <a
            href={normalizeUrl(profileData.linkedin)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-semantic-info-700 dark:text-semantic-info-300 hover:text-semantic-info-800 dark:hover:text-semantic-info-200 transition-colors text-sm"
          >
            <FaLinkedin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{tProfile('linkedin') || 'LinkedIn'}</span>
            <HiExternalLink className="w-3 h-3 flex-shrink-0 ml-auto" />
          </a>
        )}
        {profileData.facebook && (
          <a
            href={normalizeUrl(profileData.facebook)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-semantic-info-600 dark:text-semantic-info-400 hover:text-semantic-info-700 dark:hover:text-semantic-info-300 transition-colors text-sm"
          >
            <FaFacebook className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{tProfile('facebook') || 'Facebook'}</span>
            <HiExternalLink className="w-3 h-3 flex-shrink-0 ml-auto" />
          </a>
        )}
        {profileData.instagram && (
          <a
            href={normalizeUrl(profileData.instagram)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-accent-pink dark:text-accent-pink hover:opacity-80 transition-colors text-sm"
          >
            <FaInstagram className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{tProfile('instagram') || 'Instagram'}</span>
            <HiExternalLink className="w-3 h-3 flex-shrink-0 ml-auto" />
          </a>
        )}
      </div>
    </div>
  );
}
