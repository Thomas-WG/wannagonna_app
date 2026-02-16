'use client';

import { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTheme } from '@/utils/theme/ThemeContext';

// Fix for default marker icons in Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (color, type) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: ${type === 'user' ? '24px' : '32px'};
      height: ${type === 'user' ? '24px' : '32px'};
      background-color: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      color: white;
    ">${type === 'local' ? 'L' : type === 'event' ? 'E' : '📍'}</div>`,
    iconSize: [type === 'user' ? 24 : 32, type === 'user' ? 24 : 32],
    iconAnchor: [type === 'user' ? 12 : 16, type === 'user' ? 12 : 16]
  });
};

// Component to update map center when props change
function MapUpdater({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center && center.lat && center.lng) {
      map.setView([center.lat, center.lng], zoom);
    }
  }, [center, zoom, map]);
  
  return null;
}

/**
 * ActivitiesMapView Component
 * Displays activities on a map with markers
 */
export default function ActivitiesMapView({
  activities = [],
  onActivityClick,
  center = null,
  zoom = 10,
  userLocation = null
}) {
  const { isDark } = useTheme();

  // Filter activities with coordinates and exclude online activities
  const activitiesWithCoordinates = useMemo(() => {
    return activities.filter(activity => {
      if (activity.type === 'online') return false;
      if (!activity.coordinates) return false;
      if (typeof activity.coordinates.latitude !== 'number' || 
          typeof activity.coordinates.longitude !== 'number') {
        return false;
      }
      return true;
    });
  }, [activities]);

  // Calculate map center
  const mapCenter = useMemo(() => {
    if (center && center.lat && center.lng) {
      return [center.lat, center.lng];
    }
    if (userLocation && userLocation.latitude && userLocation.longitude) {
      return [userLocation.latitude, userLocation.longitude];
    }
    if (activitiesWithCoordinates.length > 0) {
      const firstActivity = activitiesWithCoordinates[0];
      return [firstActivity.coordinates.latitude, firstActivity.coordinates.longitude];
    }
    // Default center (Paris)
    return [48.8566, 2.3522];
  }, [center, userLocation, activitiesWithCoordinates]);

  // Tile URL based on dark mode
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const attribution = isDark
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  if (activitiesWithCoordinates.length === 0 && !userLocation) {
    return (
      <div className="h-[500px] sm:h-[600px] lg:h-[700px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <p className="text-text-secondary dark:text-text-secondary mb-2">
            No activities with locations to display
          </p>
          <p className="text-sm text-text-tertiary dark:text-text-tertiary">
            Activities need coordinates to appear on the map
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[500px] sm:h-[600px] lg:h-[700px] w-full rounded-lg overflow-hidden border border-border-light dark:border-border-dark">
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
        className="z-0"
      >
        <MapUpdater center={center ? { lat: center.lat, lng: center.lng } : null} zoom={zoom} />
        
        <TileLayer
          url={tileUrl}
          attribution={attribution}
          maxZoom={19}
        />

        {/* User location marker */}
        {userLocation && userLocation.latitude && userLocation.longitude && (
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            icon={createCustomIcon('#3b82f6', 'user')}
          >
            <Popup>
              <div className="text-sm font-semibold">Your Location</div>
            </Popup>
          </Marker>
        )}

        {/* Activity markers */}
        {activitiesWithCoordinates.map((activity) => {
          const iconColor = activity.type === 'event' ? '#a855f7' : '#10b981';
          const iconType = activity.type === 'event' ? 'event' : 'local';

          return (
            <Marker
              key={activity.id}
              position={[activity.coordinates.latitude, activity.coordinates.longitude]}
              icon={createCustomIcon(iconColor, iconType)}
              eventHandlers={{
                click: () => {
                  if (onActivityClick) {
                    onActivityClick(activity);
                  }
                }
              }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold text-text-primary dark:text-text-primary mb-1">
                    {activity.title}
                  </div>
                  {activity.location && (
                    <div className="text-text-secondary dark:text-text-secondary text-xs mb-1">
                      {activity.location}
                    </div>
                  )}
                  {activity.distance !== undefined && (
                    <div className="text-primary-600 dark:text-primary-400 text-xs font-medium">
                      {activity.distance.toFixed(1)} km away
                    </div>
                  )}
                  {onActivityClick && (
                    <button
                      onClick={() => onActivityClick(activity)}
                      className="mt-2 text-xs text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      View details
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
