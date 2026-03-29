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
 * @param {Object} props.entry - XP history entry with title, type, points, created_at, badge_id, etc.
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

      if (entryType === 'badge' && entry.badge_id) {
        // Use badgeId from entry
        try {
          const badgeDetails = await findBadgeById(entry.badge_id);
          let badgeImageUrl = '';

          if (badgeDetails && badgeDetails.category_id) {
            badgeImageUrl = await getBadgeImageUrl(badgeDetails.category_id, entry.badge_id);
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

      } else if (entryType === 'activity' && entry.activity_id) {
        const activityIdToUse = entry.activity_id;
        try {
          const activity = await fetchActivityById(activityIdToUse);
          let organization = null;

          if (activity?.organization_id) {
            organization = await fetchOrganizationById(activity.organization_id);
          }

          if (activity) {
            // Use activity_id from entry to ensure URL always contains the correct activityId
            // Pass it as override parameter to ensure it's used even if activity.id is missing
            const shareDataResult = prepareActivityCompletionShareData(
              activity, 
              organization, 
              translations,
              activityIdToUse
            );
            setShareData(shareDataResult);
          } else {
            setError('Activity not found');
          }
        } catch (err) {
          console.error('Error fetching activity details:', err);
          setError('Failed to load activity details');
        }

      } else if (entryType === 'referral' && entry.referrer_id) {
        // Use referrer_id from entry to get the referrer's code
        try {
          const memberDoc = doc(db, 'members', entry.referrer_id);
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
      (entryType === 'badge' && entry.badge_id) ||
      (entryType === 'activity' && entry.activity_id) ||
      (entryType === 'referral' && entry.referrer_id);
    
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
