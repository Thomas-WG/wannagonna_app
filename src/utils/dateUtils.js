/**
 * Utility functions for handling date conversions from Firebase Timestamps
 */

/**
 * Converts a Firebase Timestamp to a JavaScript Date object
 * @param {Object} timestamp - Firebase Timestamp object
 * @returns {Date} JavaScript Date object
 */
export const convertTimestampToDate = (timestamp) => {
  if (!timestamp) return null;
  
  // If it's already a Date object, return it
  if (timestamp instanceof Date) return timestamp;
  
  // If it's a Firebase Timestamp, convert it
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  // If it's a string or number, try to create a Date
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  
  // If it has seconds and nanoseconds (Firebase Timestamp structure)
  if (timestamp.seconds && timestamp.nanoseconds !== undefined) {
    return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
  }
  
  return null;
};

/**
 * Formats a date for display in a user-friendly format
 * @param {Date|Object} date - Date object or Firebase Timestamp
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  const jsDate = convertTimestampToDate(date);
  if (!jsDate) return 'Unknown date';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  const formatOptions = { ...defaultOptions, ...options };
  
  try {
    return jsDate.toLocaleDateString(undefined, formatOptions);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Formats a date for display with just the date (no time)
 * @param {Date|Object} date - Date object or Firebase Timestamp
 * @returns {string} Formatted date string
 */
export const formatDateOnly = (date) => {
  const jsDate = convertTimestampToDate(date);
  if (!jsDate) return 'Unknown date';
  
  try {
    // Use toLocaleDateString directly to ensure no time is included
    return jsDate.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Formats a date for display with just the time
 * @param {Date|Object} date - Date object or Firebase Timestamp
 * @returns {string} Formatted time string
 */
export const formatTimeOnly = (date) => {
  return formatDate(date, {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Gets a relative time string (e.g., "2 hours ago", "3 days ago")
 * @param {Date|Object} date - Date object or Firebase Timestamp
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  const jsDate = convertTimestampToDate(date);
  if (!jsDate) return 'Unknown time';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now - jsDate) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return formatDateOnly(jsDate);
  }
};

/**
 * Converts an array of objects with timestamp fields to have proper Date objects
 * @param {Array} items - Array of objects that may contain timestamp fields
 * @param {Array} timestampFields - Array of field names that contain timestamps
 * @returns {Array} Array with converted timestamps
 */
export const convertTimestampsInArray = (items, timestampFields = ['createdAt', 'updatedAt']) => {
  if (!Array.isArray(items)) return items;
  
  return items.map(item => {
    const convertedItem = { ...item };
    
    timestampFields.forEach(field => {
      if (convertedItem[field]) {
        convertedItem[field] = convertTimestampToDate(convertedItem[field]);
      }
    });
    
    return convertedItem;
  });
};
