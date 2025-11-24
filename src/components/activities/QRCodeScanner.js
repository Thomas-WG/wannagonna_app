'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button, Alert } from 'flowbite-react';
import { HiX, HiCamera } from 'react-icons/hi';

/**
 * QRCodeScanner Component
 * Camera-based QR code scanner for activity validation
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether scanner is open
 * @param {Function} props.onClose - Function to close scanner
 * @param {Function} props.onScanSuccess - Callback when QR code is successfully scanned
 */
export default function QRCodeScanner({ isOpen, onClose, onScanSuccess }) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [cameraId, setCameraId] = useState(null);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const isStartingRef = useRef(false);
  const isStoppingRef = useRef(false);
  const hasScannedRef = useRef(false);

  useEffect(() => {
    if (isOpen && !html5QrCodeRef.current) {
      html5QrCodeRef.current = new Html5Qrcode('qr-reader');
    }

    return () => {
      // Cleanup will be handled by stopScanning when modal closes
    };
  }, [isOpen]);

  const startScanning = async () => {
    // Prevent multiple simultaneous start calls
    if (isStartingRef.current || scanning || isStoppingRef.current) {
      return;
    }

    if (!html5QrCodeRef.current) {
      setError('Scanner not initialized');
      return;
    }

    try {
      isStartingRef.current = true;
      setError(null);
      
      // Get available cameras
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        const selectedCameraId = cameraId || devices[0].id;
        setCameraId(selectedCameraId);

        await html5QrCodeRef.current.start(
          selectedCameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText, decodedResult) => {
            // Successfully scanned
            handleScanSuccess(decodedText);
          },
          (errorMessage) => {
            // Ignore scanning errors (they're frequent during scanning)
          }
        );
        setScanning(true);
        isStartingRef.current = false;
      } else {
        setError('No camera found. Please ensure your device has a camera.');
        isStartingRef.current = false;
      }
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError(err.message || 'Failed to start camera. Please check permissions.');
      isStartingRef.current = false;
    }
  };

  const stopScanning = async () => {
    // Prevent multiple simultaneous stop calls
    if (isStoppingRef.current || !html5QrCodeRef.current) {
      return;
    }

    if (scanning || isStartingRef.current) {
      try {
        isStoppingRef.current = true;
        await html5QrCodeRef.current.stop();
        setScanning(false);
        isStoppingRef.current = false;
        isStartingRef.current = false;
      } catch (err) {
        console.error('Error stopping scanner:', err);
        isStoppingRef.current = false;
        isStartingRef.current = false;
      }
    }
  };

  const handleScanSuccess = (decodedText) => {
    // Prevent multiple scans
    if (hasScannedRef.current) {
      return;
    }
    
    hasScannedRef.current = true;
    stopScanning();
    
    // Parse the URL to extract activityId and token
    try {
      const url = new URL(decodedText);
      const activityId = url.searchParams.get('activityId');
      const token = url.searchParams.get('token');

      if (activityId && token && onScanSuccess) {
        onScanSuccess({ activityId, token, url: decodedText });
      } else {
        hasScannedRef.current = false; // Reset on error
        setError('Invalid QR code format. Please scan a valid activity QR code.');
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      hasScannedRef.current = false; // Reset on error
      setError('Invalid QR code. Please scan a valid activity QR code.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleClose = async () => {
    await stopScanning();
    setError(null);
    setScanning(false);
    isStartingRef.current = false;
    isStoppingRef.current = false;
    hasScannedRef.current = false; // Reset scan flag when closing
    
    // Clean up scanner instance
    if (html5QrCodeRef.current) {
      try {
        // Try to stop if still running
        if (scanning) {
          await html5QrCodeRef.current.stop().catch(() => {});
        }
        html5QrCodeRef.current.clear();
      } catch (err) {
        // Ignore cleanup errors
      }
      html5QrCodeRef.current = null;
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Scan QR Code</h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <HiX className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4">
          {error && (
            <Alert color="failure" className="mb-4">
              {error}
            </Alert>
          )}

          <div id="qr-reader" className="mb-4"></div>

          {!scanning && (
            <div className="text-center">
              <Button
                onClick={startScanning}
                color="blue"
                className="w-full"
              >
                <HiCamera className="mr-2 h-5 w-5" />
                Start Camera
              </Button>
            </div>
          )}

          {scanning && (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Point your camera at the QR code
              </p>
              <Button
                onClick={stopScanning}
                color="gray"
                className="w-full"
              >
                Stop Scanning
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

