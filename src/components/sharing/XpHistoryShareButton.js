'use client';

import { useState, useEffect } from 'react';
import ShareButton from './ShareButton';
import { 
  prepareBadgeShareData, 
  prepareActivityCompletionShareData, 
  prepareReferralShareData 
} from '@/utils/sharing/shareUtils';
import { findBadgeById, getBadgeImageUrl } from '@/utils/crudBadges';
import { fetchActivityById } from '@/utils/crudActivities';
import { fetchOrganizationById } from '@/utils/crudOrganizations';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/utils/auth/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from 'firebaseConfig';

/**
 * XpHistoryShareButton Component
 * Handles sharing for XP history entries with automatic type detection and data fetching
 * @param {Object} props
 * @param {Object} props.entry - XP history entry object with title, type, points, timestamp
 * @param {string} props.variant - Button variant: 'default', 'icon', 'text'
 * @param {string} props.size - Button size: 'xs', 'sm', 'md', 'lg'
 * @param {string} props.className - Additional CSS classes
 */
export default function XpHistoryShareButton({ entry, variant = 'icon', size = 'sm', className = '' }) {
  const t = useTranslations('Sharing');
  const { user } = useAuth();
  const [shareData, setShareData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadShareData = async () => {
    if (shareData || loading) return; // Already loaded or loading

    setLoading(true);
    setError(null);

    try {
      const translations = {
        badgePhrase: t('badgePhrase'),
        shareBadgeTitle: t('shareBadgeTitle'),
        completionPhrase: t('completionPhrase'),
        shareCompletionTitle: t('shareCompletionTitle'),
        referralPhrase: t('referralPhrase'),
        shareReferralTitle: t('shareReferralTitle')
      };

      // Determine entry type
      const entryType = entry.type || 'unknown';

      if (entryType === 'badge' && entry.badgeId) {
        // Use badgeId from entry
        try {
          const badgeDetails = await findBadgeById(entry.badgeId);
          let badgeImageUrl = '';

          if (badgeDetails && badgeDetails.categoryId) {
            badgeImageUrl = await getBadgeImageUrl(badgeDetails.categoryId, entry.badgeId);
          }

          // Fallback: create basic badge object
          const badgeData = badgeDetails || {
            title: entry.title.replace(/^Badge Earned:\s*/i, '').trim(),
            description: ''
          };

          const shareDataResult = prepareBadgeShareData(badgeData, badgeImageUrl, translations);
          setShareData(shareDataResult);
        } catch (err) {
          console.warn('Could not fetch badge details:', err);
          setError('Failed to load badge details');
        }

      } else if (entryType === 'activity' && entry.activityId) {
        // Use activityId from entry
        try {
          const activity = await fetchActivityById(entry.activityId);
          let organization = null;

          if (activity?.organizationId) {
            organization = await fetchOrganizationById(activity.organizationId);
          }

          if (activity) {
            // Use entry.activityId directly to ensure URL always contains the correct activityId
            // Pass it as override parameter to ensure it's used even if activity.id is missing
            const shareDataResult = prepareActivityCompletionShareData(
              activity, 
              organization, 
              translations,
              entry.activityId // Pass activityId from entry as override
            );
            setShareData(shareDataResult);
          } else {
            setError('Activity not found');
          }
        } catch (err) {
          console.error('Error fetching activity details:', err);
          setError('Failed to load activity details');
        }

      } else if (entryType === 'referral' && entry.memberId) {
        // Use memberId from entry to get the referrer's code
        try {
          const memberDoc = doc(db, 'members', entry.memberId);
          const memberSnap = await getDoc(memberDoc);
          
          if (!memberSnap.exists()) {
            setError('Member not found');
            return;
          }

          const memberData = memberSnap.data();
          const memberCode = memberData?.code;

          if (!memberCode) {
            setError('Member code not found');
            return;
          }

          const shareDataResult = prepareReferralShareData(memberCode, translations);
          setShareData(shareDataResult);
        } catch (err) {
          console.error('Error fetching member code:', err);
          setError('Failed to load referral code');
        }
      } else {
        // Unknown type or missing ID - don't show share button
        setShareData(null);
      }
    } catch (err) {
      console.error('Error preparing share data:', err);
      setError('Failed to prepare share data');
    } finally {
      setLoading(false);
    }
  };

  // Load share data when component mounts (for entries we can share)
  useEffect(() => {
    if (!entry || shareData || loading) return;
    
    const entryType = entry.type || 'unknown';
    
    // Only load for shareable types that have the required ID
    const isShareable = 
      (entryType === 'badge' && entry.badgeId) ||
      (entryType === 'activity' && entry.activityId) ||
      (entryType === 'referral' && entry.memberId);
    
    if (isShareable) {
      loadShareData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry]);

  // Don't render if no share data and not loading
  if (!shareData && !loading && !error) {
    return null;
  }

  if (error) {
    return null; // Silently fail - don't show error to user
  }

  if (loading) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-500"></div>
      </div>
    );
  }

  return (
    <ShareButton
      shareData={shareData}
      variant={variant}
      size={size}
      className={className}
    />
  );
}
