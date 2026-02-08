'use client';

import { useState } from 'react';
import { Button } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import { HiShare } from 'react-icons/hi';
import { isWebShareSupported, copyToClipboard } from '@/utils/sharing/shareUtils';
import ShareModal from './ShareModal';

/**
 * ShareButton Component
 * Handles sharing using Web Share API with fallback to ShareModal
 * @param {Object} props
 * @param {Object} props.shareData - Share data object with title, text, url, image (optional)
 * @param {string} props.variant - Button variant: 'default', 'icon', 'text'
 * @param {string} props.size - Button size: 'xs', 'sm', 'md', 'lg'
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onShareSuccess - Callback when share succeeds (optional)
 * @param {Function} props.onShareError - Callback when share fails (optional)
 */
export default function ShareButton({ 
  shareData, 
  variant = 'default',
  size = 'sm',
  className = '',
  onShareSuccess,
  onShareError
}) {
  const t = useTranslations('Sharing');
  const [showModal, setShowModal] = useState(false);
  const [sharing, setSharing] = useState(false);

  if (!shareData) return null;

  const handleShare = async () => {
    if (!shareData) return;

    // Check if Web Share API is supported
    if (isWebShareSupported()) {
      try {
        setSharing(true);
        
        // Prepare share data for Web Share API
        const webShareData = {
          title: shareData.title,
          text: shareData.text,
          url: shareData.url
        };

        // Some browsers support files/images, but we'll keep it simple for compatibility
        if (shareData.image && navigator.canShare && navigator.canShare({ files: [] })) {
          // Note: Web Share API with images requires File objects, which is complex
          // For now, we'll share without images
        }

        await navigator.share(webShareData);
        onShareSuccess?.();
      } catch (error) {
        // User cancelled or error occurred
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error);
          onShareError?.(error);
          // Fallback to modal on error
          setShowModal(true);
        }
      } finally {
        setSharing(false);
      }
    } else {
      // Fallback to modal
      setShowModal(true);
    }
  };

  const handleCopySuccess = () => {
    onShareSuccess?.();
  };

  // Render button based on variant
  const renderButton = () => {
    const baseProps = {
      onClick: handleShare,
      disabled: sharing,
      className: className
    };

    if (variant === 'icon') {
      return (
        <Button
          {...baseProps}
          size={size}
          color="gray"
          className={`${className} p-2`}
          title={t('share') || 'Share'}
        >
          <HiShare className="h-4 w-4" />
        </Button>
      );
    }

    if (variant === 'text') {
      return (
        <Button
          {...baseProps}
          size={size}
          color="gray"
          className={className}
        >
          {sharing ? (t('sharing') || 'Sharing...') : (t('share') || 'Share')}
        </Button>
      );
    }

    // Default variant
    return (
      <Button
        {...baseProps}
        size={size}
        color="gray"
        className={`${className} flex items-center gap-2`}
      >
        <HiShare className="h-4 w-4" />
        <span>{sharing ? (t('sharing') || 'Sharing...') : (t('share') || 'Share')}</span>
      </Button>
    );
  };

  return (
    <>
      {renderButton()}
      <ShareModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        shareData={shareData}
        onCopySuccess={handleCopySuccess}
      />
    </>
  );
}
