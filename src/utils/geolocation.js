/**
 * Get user's current location using browser Geolocation API
 * @param {Object} options - Geolocation options
 * @returns {Promise<{latitude: number, longitude: number}>} User coordinates
 */
export function getUserLocation(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    const defaultOptions = {
      enableHighAccuracy: false, // Don't require high accuracy for better performance
      timeout: 10000, // 10 seconds timeout
      maximumAge: 300000 // Accept cached location up to 5 minutes old
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let errorMessage = 'Unable to get your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage = 'An unknown error occurred while getting your location.';
            break;
        }
        
        reject(new Error(errorMessage));
      },
      { ...defaultOptions, ...options }
    );
  });
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Filter activities within a specified radius from a center point
 * @param {Array} activities - Array of activity objects with coordinates
 * @param {number} centerLat - Center latitude
 * @param {number} centerLon - Center longitude
 * @param {number} radiusKm - Radius in kilometers
 * @returns {Array} Filtered activities with distance property added
 */
export function filterActivitiesByRadius(activities, centerLat, centerLon, radiusKm) {
  return activities
    .filter(activity => {
      // Only include activities with valid coordinates
      if (!activity.coordinates || 
          typeof activity.coordinates.latitude !== 'number' ||
          typeof activity.coordinates.longitude !== 'number') {
        return false;
      }
      
      // Filter out online activities (they don't have physical locations)
      if (activity.type === 'online') {
        return false;
      }
      
      const distance = calculateDistance(
        centerLat,
        centerLon,
        activity.coordinates.latitude,
        activity.coordinates.longitude
      );
      
      // Add distance to activity object
      activity.distance = distance;
      
      return distance <= radiusKm;
    })
    .sort((a, b) => a.distance - b.distance); // Sort by distance, closest first
}
