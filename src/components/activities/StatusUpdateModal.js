'use client';
import React, { useState, useEffect } from 'react';
import { Modal, Button, Label, Select } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import {
  HiDocument, HiCheckCircle, HiArchive, HiClock
} from 'react-icons/hi';
import { FaRegCircle } from 'react-icons/fa';

export default function StatusUpdateModal({
  isOpen,
  onClose,
  currentStatus,
  onStatusUpdate,
  isUpdating = false
}) {
  const t = useTranslations('StatusUpdateModal');
  
  const [selectedStatus, setSelectedStatus] = useState(currentStatus || 'Draft');

  // Update selectedStatus when currentStatus changes
  useEffect(() => {
    setSelectedStatus(currentStatus || 'Draft');
  }, [currentStatus]);

  // Status options configuration
  const statusOptions = [
    {
      value: 'Draft',
      label: t('status.Draft'),
      icon: HiDocument,
      color: 'text-gray-600'
    },
    {
      value: 'Open',
      label: t('status.Open'),
      icon: FaRegCircle,
      color: 'text-green-600'
    },
    {
      value: 'InProgress',
      label: t('status.InProgress'),
      icon: HiClock,
      color: 'text-blue-600'
    },
    {
      value: 'Completed',
      label: t('status.Completed'),
      icon: HiCheckCircle,
      color: 'text-purple-600'
    },
    {
      value: 'Archived',
      label: t('status.Archived'),
      icon: HiArchive,
      color: 'text-gray-500'
    }
  ];

  const handleStatusChange = (newStatus) => {
    setSelectedStatus(newStatus);
  };

  const handleSave = () => {
    console.log('StatusUpdateModal: handleSave called with status:', selectedStatus);
    if (onStatusUpdate) {
      onStatusUpdate(selectedStatus);
    } else {
      console.error('StatusUpdateModal: onStatusUpdate callback is not provided');
    }
  };

  const handleClose = () => {
    setSelectedStatus(currentStatus || 'Draft');
    onClose();
  };

  return (
    <Modal show={isOpen} onClose={handleClose} size="md">
      <Modal.Header>
        <div className="flex items-center space-x-2">
          <span>{t('title')}</span>
        </div>
      </Modal.Header>
      
      <Modal.Body>
        <div className="space-y-4">
          <div>
            <Label htmlFor="status-select" value={t('selectStatus')} />
            <Select
              id="status-select"
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="mt-2"
            >
              {statusOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                );
              })}
            </Select>
          </div>
        </div>
      </Modal.Body>
      
      <Modal.Footer>
        <div className="flex justify-end space-x-2">
          <Button
            color="gray"
            onClick={handleClose}
            disabled={isUpdating}
          >
            {t('cancel')}
          </Button>
          <Button
            color="blue"
            onClick={handleSave}
            disabled={isUpdating}
          >
            {isUpdating ? t('saving') : t('save')}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
