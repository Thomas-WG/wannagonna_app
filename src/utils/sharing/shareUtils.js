/**
 * Sharing Utilities
 * Functions to prepare share data for different content types
 */

/**
 * Get base URL for sharing
 * @returns {string} Base URL of the application
 */
export function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Fallback for SSR
  return process.env.NEXT_PUBLIC_APP_URL || 'https://app.wannagona.org';
}

/**
 * Prepare share data for an activity
 * @param {Object} activity - Activity object
 * @param {Object} organization - Organization object (optional)
 * @param {Object} translations - Translation object with sharing phrases
 * @returns {Object} Share data object
 */
export function prepareActivityShareData(activity, organization = null, translations = {}) {
  const baseUrl = getBaseUrl();
  const activityUrl = `${baseUrl}/activities?activityId=${activity.id}`;
  
  const orgName = organization?.name || activity.organization_name || 'Organization';
  const orgLogo = organization?.logo || activity.organization_logo || '';
  
  // Get description preview (first 150 characters)
  const descriptionPreview = activity.description 
    ? activity.description.substring(0, 150).trim() + (activity.description.length > 150 ? '...' : '')
    : '';
  
  const catchyPhrase = translations.activityPhrase || '🌟 Making a difference with...';
  const shareTitle = translations.shareActivityTitle || 'Check out this volunteering opportunity!';
  
  const shareText = `${catchyPhrase}\n\n${activity.title} by ${orgName}${descriptionPreview ? `\n\n${descriptionPreview}` : ''}`;
  
  return {
    title: shareTitle,
    text: shareText,
    url: activityUrl,
    image: orgLogo
  };
}

/**
 * Prepare share data for a badge achievement
 * @param {Object} badge - Badge object with title, description, etc.
 * @param {string} badgeImageUrl - Badge image URL
 * @param {Object} translations - Translation object with sharing phrases
 * @returns {Object} Share data object
 */
export function prepareBadgeShareData(badge, badgeImageUrl = '', translations = {}) {
  const baseUrl = getBaseUrl();
  const badgeUrl = `${baseUrl}/badges`;
  
  const catchyPhrase = translations.badgePhrase || '🏆 Just earned...';
  const shareTitle = translations.shareBadgeTitle || 'I just earned a badge!';
  
  const shareText = `${catchyPhrase}\n\n${badge.title || 'Badge'}${badge.description ? `\n\n${badge.description}` : ''}`;
  
  return {
    title: shareTitle,
    text: shareText,
    url: badgeUrl,
    image: badgeImageUrl
  };
}

/**
 * Prepare share data for activity completion
 * @param {Object} activity - Activity object
 * @param {Object} organization - Organization object (optional)
 * @param {Object} translations - Translation object with sharing phrases
 * @param {string} activityIdOverride - Optional activityId to use instead of activity.id
 * @returns {Object} Share data object
 */
export function prepareActivityCompletionShareData(activity, organization = null, translations = {}, activityIdOverride = null) {
  const baseUrl = getBaseUrl();
  // Use override if provided, otherwise use activity.id, fallback to empty string
  const activityId = activityIdOverride || activity?.id || '';
  const activityUrl = `${baseUrl}/activities?activityId=${activityId}`;
  
  const orgName = organization?.name || activity.organization_name || 'Organization';
  const orgLogo = organization?.logo || activity.organization_logo || '';
  
  const catchyPhrase = translations.completionPhrase || '✅ Completed...';
  const shareTitle = translations.shareCompletionTitle || 'I completed a volunteering activity!';
  
  const shareText = `${catchyPhrase}\n\n${activity.title} by ${orgName}`;
  
  return {
    title: shareTitle,
    text: shareText,
    url: activityUrl,
    image: orgLogo
  };
}

/**
 * Prepare share data for referral code
 * @param {string} memberCode - Member referral code
 * @param {Object} translations - Translation object with sharing phrases
 * @returns {Object} Share data object
 */
export function prepareReferralShareData(memberCode, translations = {}) {
  const baseUrl = getBaseUrl();
  const referralUrl = `${baseUrl}/login`;
  
  // Use WannaGonna favicon as preview image for referral sharing
  const faviconUrl = `${baseUrl}/logo/Favicon.png`;
  
  const catchyPhrase = translations.referralPhrase || 'Join me in making an impact!';
  const shareTitle = translations.shareReferralTitle || 'Join me on WannaGonna!';
  
  const shareText = `${catchyPhrase}\n\nUse my code: ${memberCode}`;
  
  return {
    title: shareTitle,
    text: shareText,
    url: referralUrl,
    image: faviconUrl
  };
}

/**
 * Generate platform-specific sharing URLs
 * @param {Object} shareData - Share data object with title, text, url
 * @returns {Object} Object with platform URLs
 */
export function generatePlatformUrls(shareData) {
  const { title, text, url } = shareData;
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  
  // Combine text and URL for platforms that support it
  const combinedText = `${text}\n\n${url}`;
  const encodedCombined = encodeURIComponent(combinedText);
  
  return {
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedCombined}`,
    copyText: combinedText
  };
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Check if Web Share API is supported
 * @returns {boolean}
 */
export function isWebShareSupported() {
  return typeof navigator !== 'undefined' && navigator.share !== undefined;
}
