'use client';

import { Modal } from 'flowbite-react';
import ActivityQRCode from './ActivityQRCode';

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
  return (
    <Modal show={isOpen} onClose={onClose} size="md">
      <Modal.Header>
        <div className="flex items-center gap-2">
          <span>QR Code for Activity</span>
        </div>
      </Modal.Header>
      <Modal.Body>
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

