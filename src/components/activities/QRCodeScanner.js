'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button, Alert } from 'flowbite-react';
import { HiX, HiCamera, HiRefresh } from 'react-icons/hi';

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
  const [availableCameras, setAvailableCameras] = useState([]);
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const isStartingRef = useRef(false);
  const isStoppingRef = useRef(false);
  const hasScannedRef = useRef(false);

  useEffect(() => {
    if (isOpen && !html5QrCodeRef.current) {
      html5QrCodeRef.current = new Html5Qrcode('qr-reader');
    }

    // Cleanup when component unmounts or modal closes
    return () => {
      if (html5QrCodeRef.current) {
        // Directly stop and clear the scanner
        const scanner = html5QrCodeRef.current;
        (async () => {
          try {
            // Try to stop if running
            await scanner.stop().catch(() => {});
          } catch (err) {
            // Ignore stop errors
          }
          try {
            // Clear to release all resources
            scanner.clear();
          } catch (err) {
            // Ignore clear errors
          }
          html5QrCodeRef.current = null;
        })();
      }
    };
  }, [isOpen]);

  // Helper function to find back camera (environment-facing)
  const findBackCamera = (devices) => {
    if (!devices || devices.length === 0) return null;
    
    // Try to find environment-facing camera (back camera)
    const backCamera = devices.find(device => {
      const label = device.label?.toLowerCase() || '';
      return label.includes('back') || 
             label.includes('rear') || 
             label.includes('environment') ||
             label.includes('facing back');
    });
    
    // If no back camera found by label, try to find by position
    if (!backCamera && devices.length > 1) {
      // On mobile, usually the second camera is the back camera
      // But we'll prefer environment-facing if available
      return devices.find(device => {
        // Try to get facing mode from constraints if available
        return device.deviceId && devices.indexOf(device) > 0;
      }) || devices[devices.length - 1];
    }
    
    return backCamera || devices[0];
  };

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
        setAvailableCameras(devices);
        
        // Find back camera or use selected camera
        let selectedCameraId = cameraId;
        if (!selectedCameraId) {
          const backCamera = findBackCamera(devices);
          selectedCameraId = backCamera?.id || devices[0].id;
        }
        
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

  const switchCamera = async () => {
    if (!scanning || availableCameras.length < 2 || isStartingRef.current || isStoppingRef.current || isSwitchingCamera) {
      return;
    }

    try {
      isStoppingRef.current = true;
      setIsSwitchingCamera(true);
      
      // Stop current camera
      await html5QrCodeRef.current.stop();
      html5QrCodeRef.current.clear();
      
      // Find the other camera
      const currentIndex = availableCameras.findIndex(cam => cam.id === cameraId);
      const nextIndex = (currentIndex + 1) % availableCameras.length;
      const nextCameraId = availableCameras[nextIndex].id;
      
      setCameraId(nextCameraId);
      
      // Start with the new camera
      await html5QrCodeRef.current.start(
        nextCameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText, decodedResult) => {
          handleScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Ignore scanning errors
        }
      );
      
      isStoppingRef.current = false;
      setIsSwitchingCamera(false);
    } catch (err) {
      console.error('Error switching camera:', err);
      setError('Failed to switch camera. Please try again.');
      isStoppingRef.current = false;
      setIsSwitchingCamera(false);
      // Try to restart with the original camera
      try {
        await startScanning();
      } catch (restartErr) {
        console.error('Error restarting scanner:', restartErr);
      }
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
        // Stop the scanner
        await html5QrCodeRef.current.stop();
        // Clear the scanner to release camera resources
        html5QrCodeRef.current.clear();
        setScanning(false);
        isStoppingRef.current = false;
        isStartingRef.current = false;
      } catch (err) {
        console.error('Error stopping scanner:', err);
        // Try to clear even if stop failed
        try {
          if (html5QrCodeRef.current) {
            html5QrCodeRef.current.clear();
          }
        } catch (clearErr) {
          // Ignore clear errors
        }
        isStoppingRef.current = false;
        isStartingRef.current = false;
      }
    }
  };

  const handleScanSuccess = async (decodedText) => {
    // Prevent multiple scans
    if (hasScannedRef.current) {
      return;
    }
    
    hasScannedRef.current = true;
    
    // Stop scanning and wait for camera to fully stop before proceeding
    await stopScanning();
    
    // Parse the URL to extract activityId and token
    try {
      const url = new URL(decodedText);
      const activityId = url.searchParams.get('activityId');
      const token = url.searchParams.get('token');

      if (activityId && token && onScanSuccess) {
        // Ensure camera is fully stopped before calling callback
        // Add a small delay to ensure camera stream is released
        await new Promise(resolve => setTimeout(resolve, 100));
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
    // Stop scanning and wait for it to complete
    await stopScanning();
    
    // Additional cleanup
    setError(null);
    setScanning(false);
    setAvailableCameras([]);
    setIsSwitchingCamera(false);
    isStartingRef.current = false;
    isStoppingRef.current = false;
    hasScannedRef.current = false; // Reset scan flag when closing
    
    // Clean up scanner instance completely
    if (html5QrCodeRef.current) {
      try {
        // Try to stop if still running (double-check using scanning state)
        if (scanning) {
          await html5QrCodeRef.current.stop().catch(() => {});
        }
        // Clear the scanner to release all resources
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error('Error during cleanup:', err);
        // Force clear even if there's an error
        try {
          html5QrCodeRef.current.clear();
        } catch (clearErr) {
          // Ignore
        }
      }
      html5QrCodeRef.current = null;
    }
    
    // Small delay to ensure camera stream is fully released
    await new Promise(resolve => setTimeout(resolve, 100));
    
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
              <div className="flex gap-2">
                {availableCameras.length > 1 && (
                  <Button
                    onClick={switchCamera}
                    color="blue"
                    className="flex-1"
                    disabled={isSwitchingCamera}
                  >
                    <HiRefresh className="mr-2 h-5 w-5" />
                    Switch Camera
                  </Button>
                )}
                <Button
                  onClick={stopScanning}
                  color="gray"
                  className={availableCameras.length > 1 ? "flex-1" : "w-full"}
                >
                  Stop Scanning
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

