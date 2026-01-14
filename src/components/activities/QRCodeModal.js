'use client';

import { Modal } from 'flowbite-react';
import ActivityQRCode from './ActivityQRCode';
import { useTheme } from '@/utils/theme/ThemeContext';
import { useModal } from '@/utils/modal/useModal';

/**
 * QRCodeModal Component
 * Modal to display QR code for activity validation
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Function to close modal
 * @param {string} props.activityId - Activity ID
 * @param {string} props.qrCodeToken - QR code token
 * @param {string} props.title - Activity title
 * @param {Date} props.startDate - Activity start date
 */
export default function QRCodeModal({ 
  isOpen, 
  onClose, 
  activityId, 
  qrCodeToken, 
  title, 
  startDate 
}) {
  const { isDark } = useTheme();
  const wrappedOnClose = useModal(isOpen, onClose, 'qr-code-modal');
  
  return (
    <Modal show={isOpen} onClose={wrappedOnClose} size="md" className="z-50">
      <Modal.Header className="bg-gradient-to-r from-primary-400 to-primary-600 dark:from-primary-600 dark:to-primary-700 text-white border-b border-border-light dark:border-border-dark">
        <div className="flex items-center gap-2">
          <span>QR Code for Activity</span>
        </div>
      </Modal.Header>
      <Modal.Body className="bg-background-card dark:bg-background-card">
        <ActivityQRCode
          activityId={activityId}
          qrCodeToken={qrCodeToken}
          title={title}
          startDate={startDate}
          size={256}
        />
      </Modal.Body>
    </Modal>
  );
}

