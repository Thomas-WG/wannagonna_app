'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useTheme } from '@/utils/theme/ThemeContext';

/**
 * AddressMapPreview Component
 * Small map preview for address cards
 */
export default function AddressMapPreview({ coordinates, address }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const { isDark } = useTheme();

  useEffect(() => {
    if (!mapRef.current || !coordinates) return;

    // Initialize map
    if (!mapInstanceRef.current) {
      // Use dark tiles if dark mode
      const tileUrl = isDark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      const attribution = isDark
        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

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
  }, [coordinates, isDark]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full"
      style={{ minHeight: '128px' }}
      aria-label={address || 'Map preview'}
    />
  );
}
