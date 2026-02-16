'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';

/**
 * AddressMapPreview Component
 * Small map preview for address cards
 */
export default function AddressMapPreview({ coordinates, address }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || !coordinates) return;

    // Initialize map
    if (!mapInstanceRef.current) {
      // Always use light tiles, regardless of app theme
      const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      const attribution =
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

      mapInstanceRef.current = L.map(mapRef.current, {
        center: [coordinates.latitude, coordinates.longitude],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        touchZoom: false,
        doubleClickZoom: false,
        scrollWheelZoom: false,
        boxZoom: false,
        keyboard: false
      });

      L.tileLayer(tileUrl, {
        attribution,
        maxZoom: 19
      }).addTo(mapInstanceRef.current);

      // Add marker
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          width: 20px;
          height: 20px;
          background-color: #f97316;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      markerRef.current = L.marker(
        [coordinates.latitude, coordinates.longitude],
        { icon }
      ).addTo(mapInstanceRef.current);
    } else {
      // Update map center and marker position if coordinates change
      mapInstanceRef.current.setView([coordinates.latitude, coordinates.longitude], 15);
      if (markerRef.current) {
        markerRef.current.setLatLng([coordinates.latitude, coordinates.longitude]);
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [coordinates]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full"
      style={{ minHeight: '128px' }}
      aria-label={address || 'Map preview'}
    />
  );
}
