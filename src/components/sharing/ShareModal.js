'use client';

import { useState } from 'react';
import { Modal, Button } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import { generatePlatformUrls, copyToClipboard } from '@/utils/sharing/shareUtils';
import { 
  HiShare, 
  HiClipboardCopy, 
  HiExternalLink 
} from 'react-icons/hi';
import { 
  FaTwitter, 
  FaFacebook, 
  FaLinkedin, 
  FaWhatsapp 
} from 'react-icons/fa';

/**
 * ShareModal Component
 * Displays platform-specific sharing options as fallback when Web Share API is unavailable
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Callback when modal should close
 * @param {Object} props.shareData - Share data object with title, text, url
 * @param {Function} props.onCopySuccess - Callback when copy succeeds (optional)
 */
export default function ShareModal({ isOpen, onClose, shareData, onCopySuccess }) {
  const t = useTranslations('Sharing');
  const [copied, setCopied] = useState(false);

  if (!shareData) return null;

  const platformUrls = generatePlatformUrls(shareData);

  const handleCopy = async () => {
    const success = await copyToClipboard(platformUrls.copyText);
    if (success) {
      setCopied(true);
      onCopySuccess?.();
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 1500);
    }
  };

  const handlePlatformShare = (url) => {
    window.open(url, '_blank', 'width=600,height=400');
  };

  return (
    <Modal show={isOpen} onClose={onClose} size="md">
      <Modal.Header className="bg-gradient-to-r from-primary-400 to-primary-600 dark:from-primary-600 dark:to-primary-700 text-white border-b border-border-light dark:border-border-dark">
        <div className="flex items-center gap-2">
          <HiShare className="h-5 w-5" />
          <span>{t('share') || 'Share'}</span>
        </div>
      </Modal.Header>
      
      <Modal.Body className="bg-background-card dark:bg-background-card">
        <div className="space-y-3">
          {/* Twitter/X */}
          <Button
            onClick={() => handlePlatformShare(platformUrls.twitter)}
            className="w-full justify-start bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white"
            size="lg"
          >
            <FaTwitter className="h-5 w-5 mr-3" />
            <span>{t('shareOnTwitter') || 'Share on Twitter/X'}</span>
            <HiExternalLink className="h-4 w-4 ml-auto" />
          </Button>

          {/* Facebook */}
          <Button
            onClick={() => handlePlatformShare(platformUrls.facebook)}
            className="w-full justify-start bg-[#1877F2] hover:bg-[#166fe5] text-white"
            size="lg"
          >
            <FaFacebook className="h-5 w-5 mr-3" />
            <span>{t('shareOnFacebook') || 'Share on Facebook'}</span>
            <HiExternalLink className="h-4 w-4 ml-auto" />
          </Button>

          {/* LinkedIn */}
          <Button
            onClick={() => handlePlatformShare(platformUrls.linkedin)}
            className="w-full justify-start bg-[#0077B5] hover:bg-[#006399] text-white"
            size="lg"
          >
            <FaLinkedin className="h-5 w-5 mr-3" />
            <span>{t('shareOnLinkedIn') || 'Share on LinkedIn'}</span>
            <HiExternalLink className="h-4 w-4 ml-auto" />
          </Button>

          {/* WhatsApp */}
          <Button
            onClick={() => handlePlatformShare(platformUrls.whatsapp)}
            className="w-full justify-start bg-[#25D366] hover:bg-[#20ba5a] text-white"
            size="lg"
          >
            <FaWhatsapp className="h-5 w-5 mr-3" />
            <span>{t('shareOnWhatsApp') || 'Share on WhatsApp'}</span>
            <HiExternalLink className="h-4 w-4 ml-auto" />
          </Button>

          {/* Copy Link */}
          <Button
            onClick={handleCopy}
            className="w-full justify-start bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white"
            size="lg"
          >
            <HiClipboardCopy className="h-5 w-5 mr-3" />
            <span>
              {copied 
                ? (t('copied') || 'Copied!') 
                : (t('copyLink') || 'Copy Link')
              }
            </span>
          </Button>
        </div>
      </Modal.Body>
      
      <Modal.Footer className="bg-background-card dark:bg-background-card border-t border-border-light dark:border-border-dark">
        <Button color="gray" onClick={onClose} className="w-full sm:w-auto">
          {t('close') || 'Close'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
