'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from 'flowbite-react';
import { HiDownload, HiPrinter } from 'react-icons/hi';

// Dynamically import QRCode to avoid SSR issues
const QRCode = dynamic(
  () => import('react-qr-code').then((mod) => mod.QRCode || mod.default),
  { ssr: false }
);

/**
 * ActivityQRCode Component
 * Displays a QR code for activity validation
 * @param {Object} props
 * @param {string} props.activityId - Activity ID
 * @param {string} props.qrCodeToken - QR code token
 * @param {string} props.title - Activity title
 * @param {Date} props.startDate - Activity start date
 * @param {string} props.size - QR code size (default: 256)
 */
export default function ActivityQRCode({ 
  activityId, 
  qrCodeToken, 
  title, 
  startDate,
  size = 256 
}) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!activityId || !qrCodeToken) {
    return (
      <div className="p-4 text-center text-gray-500">
        QR code not available for this activity
      </div>
    );
  }

  // Generate validation URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const validationUrl = `${baseUrl}/validate-activity?activityId=${activityId}&token=${qrCodeToken}`;

  // Format date - handles Firestore Timestamps, Date objects, and date strings
  const formatDate = (date) => {
    if (!date) return '';
    try {
      let d;
      
      // Handle Firestore Timestamp
      if (date && typeof date.toDate === 'function') {
        d = date.toDate();
      }
      // Handle Date object
      else if (date instanceof Date) {
        d = date;
      }
      // Handle date string or number (timestamp)
      else if (typeof date === 'string' || typeof date === 'number') {
        d = new Date(date);
      }
      // Handle object with seconds property (Firestore Timestamp-like)
      else if (date && date.seconds) {
        d = new Date(date.seconds * 1000);
      }
      else {
        d = new Date(date);
      }
      
      // Check if date is valid
      if (isNaN(d.getTime())) {
        return '';
      }
      
      return d.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      console.error('Error formatting date:', e, date);
      return '';
    }
  };

  // Download QR code as PNG
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const qrContainer = document.getElementById('qr-code-svg');
      if (!qrContainer) return;

      const svg = qrContainer.querySelector('svg');
      if (!svg) return;

      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `qr-code-${activityId}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          setIsDownloading(false);
        });
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (error) {
      console.error('Error downloading QR code:', error);
      setIsDownloading(false);
    }
  };

  // Print QR code
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 40px;
            }
            h1 { margin-bottom: 10px; }
            p { color: #666; margin-bottom: 20px; }
            @media print {
              body { margin: 0; padding: 20px; }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${startDate ? `<p>Date: ${formatDate(startDate)}</p>` : ''}
          <div style="margin: 20px 0;">
            ${document.getElementById('qr-code-svg')?.querySelector('svg')?.outerHTML || ''}
          </div>
          <p style="font-size: 12px; color: #999;">Scan this QR code to validate your participation</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-lg">
      <div className="mb-4 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        {startDate && (
          <p className="text-sm text-gray-600">Date: {formatDate(startDate)}</p>
        )}
      </div>

      <div className="mb-4 p-4 bg-white border-2 border-gray-200 rounded-lg flex justify-center">
        <div id="qr-code-svg">
          {QRCode && (
            <QRCode
              value={validationUrl}
              size={size}
              level="H"
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              viewBox={`0 0 ${size} ${size}`}
            />
          )}
        </div>
      </div>

      <div className="text-center mb-4">
        <p className="text-xs text-gray-500 mb-2">Scan to validate participation</p>
        <p className="text-xs text-gray-400 break-all max-w-xs">{validationUrl}</p>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          color="gray"
          onClick={handleDownload}
          disabled={isDownloading}
        >
          <HiDownload className="mr-2 h-4 w-4" />
          Download
        </Button>
        <Button
          size="sm"
          color="gray"
          onClick={handlePrint}
        >
          <HiPrinter className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>
    </div>
  );
}

