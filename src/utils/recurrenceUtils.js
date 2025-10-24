import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique series ID for recurring activities
 * @returns {string} Unique UUID for the series
 */
export function generateSeriesId() {
  return uuidv4();
}

/**
 * Calculate the next occurrence date based on the recurrence pattern
 * @param {Date} startDate - The start date of the series
 * @param {Array<number>} recurrenceDays - Array of day indices (0=Sunday, 1=Monday, etc.)
 * @param {number} occurrenceIndex - The occurrence number (0-based)
 * @returns {Date} The date for this occurrence
 */
export function calculateOccurrenceDate(startDate, recurrenceDays, occurrenceIndex) {
  const start = new Date(startDate);
  const dayOfWeek = start.getDay(); // 0=Sunday, 1=Monday, etc.
  
  // Find the first occurrence date that matches one of the selected days
  let firstOccurrenceDate = new Date(start);
  let daysToAdd = 0;
  
  // If start date doesn't match any selected day, find the next one
  if (!recurrenceDays.includes(dayOfWeek)) {
    // Find the next selected day
    for (let i = 1; i <= 7; i++) {
      const nextDay = (dayOfWeek + i) % 7;
      if (recurrenceDays.includes(nextDay)) {
        daysToAdd = i;
        break;
      }
    }
  }
  
  firstOccurrenceDate.setDate(start.getDate() + daysToAdd);
  
  // Calculate the occurrence date based on the pattern
  const weeksToAdd = Math.floor(occurrenceIndex / recurrenceDays.length);
  const dayIndexInWeek = occurrenceIndex % recurrenceDays.length;
  
  const occurrenceDate = new Date(firstOccurrenceDate);
  occurrenceDate.setDate(firstOccurrenceDate.getDate() + (weeksToAdd * 7));
  
  // If we need to find a specific day within the week
  if (dayIndexInWeek > 0) {
    const sortedDays = [...recurrenceDays].sort((a, b) => a - b);
    const targetDay = sortedDays[dayIndexInWeek];
    const currentDay = occurrenceDate.getDay();
    
    if (targetDay !== currentDay) {
      const daysToTarget = (targetDay - currentDay + 7) % 7;
      occurrenceDate.setDate(occurrenceDate.getDate() + daysToTarget);
    }
  }
  
  return occurrenceDate;
}

/**
 * Generate all occurrence dates for a recurring activity
 * @param {Object} recurrenceConfig - Configuration object
 * @param {Date} recurrenceConfig.startDate - Start date of the series
 * @param {Array<number>} recurrenceConfig.recurrenceDays - Days of the week (0=Sunday, 1=Monday, etc.)
 * @param {string} recurrenceConfig.endType - 'occurrences' or 'date'
 * @param {number} recurrenceConfig.occurrences - Number of occurrences (if endType is 'occurrences')
 * @param {Date} recurrenceConfig.endDate - End date (if endType is 'date')
 * @returns {Array<Date>} Array of occurrence dates
 */
export function generateOccurrenceDates(recurrenceConfig) {
  const { startDate, recurrenceDays, endType, occurrences, endDate, recurrenceCadence } = recurrenceConfig;
  const occurrenceDates = [];
  
  // Ensure startDate is a valid Date object
  const validStartDate = (() => {
    if (startDate instanceof Date) return startDate;
    if (startDate && typeof startDate === 'object' && 'seconds' in startDate) {
      return new Date(startDate.seconds * 1000);
    }
    return new Date(startDate);
  })();
  
  // Normalize cadence
  const cadence = recurrenceCadence || 'weekly';

  // Helper to get first Monday of given date's period
  const getFirstMondayOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun..6=Sat
    const diffToMonday = (1 - day + 7) % 7;
    d.setDate(d.getDate() + diffToMonday);
    d.setHours(0,0,0,0);
    return d;
  };

  const getFirstMondayOfMonth = (date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), 1);
    return getFirstMondayOfWeek(d);
  };
  
  let currentOccurrence = 0;
  let currentDate = new Date(validStartDate);
  const maxOccurrences = endType === 'occurrences' ? occurrences : 1000; // Safety limit
  const endDateTime = endType === 'date' ? (() => {
    if (endDate instanceof Date) return endDate.getTime();
    if (endDate && typeof endDate === 'object' && 'seconds' in endDate) {
      return new Date(endDate.seconds * 1000).getTime();
    }
    return new Date(endDate).getTime();
  })() : null;
  
  while (currentOccurrence < maxOccurrences) {
    let occurrenceDate;

    if (cadence === 'daily') {
      occurrenceDate = new Date(validStartDate);
      occurrenceDate.setDate(validStartDate.getDate() + currentOccurrence);
    } else if (cadence === 'weekly' || cadence === 'biweekly') {
      // If no days selected, default to first Monday of each (bi)weekly period
      const hasDays = Array.isArray(recurrenceDays) && recurrenceDays.length > 0;
      const baseDate = new Date(validStartDate);
      const weeksToAdd = (cadence === 'biweekly' ? 2 : 1) * currentOccurrence;
      baseDate.setDate(baseDate.getDate() + weeksToAdd * 7);
      if (!hasDays) {
        occurrenceDate = getFirstMondayOfWeek(baseDate);
      } else {
        occurrenceDate = calculateOccurrenceDate(baseDate, recurrenceDays, 0);
      }
    } else if (cadence === 'monthly') {
      const baseDate = new Date(validStartDate);
      baseDate.setMonth(baseDate.getMonth() + currentOccurrence);
      const hasDays = Array.isArray(recurrenceDays) && recurrenceDays.length > 0;
      if (!hasDays) {
        occurrenceDate = getFirstMondayOfMonth(baseDate);
      } else {
        // Align to first selected day within the target month starting from day 1
        const monthStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
        occurrenceDate = calculateOccurrenceDate(monthStart, recurrenceDays, 0);
      }
    } else {
      // default weekly behavior
      occurrenceDate = calculateOccurrenceDate(validStartDate, recurrenceDays || [1], currentOccurrence);
    }
    
    // Check if we've exceeded the end date
    if (endDateTime && occurrenceDate.getTime() > endDateTime) {
      break;
    }
    
    occurrenceDates.push(occurrenceDate);
    currentOccurrence++;
    
    // Safety check to prevent infinite loops
    if (currentOccurrence > 1000) {
      console.warn('Maximum occurrences limit reached (1000)');
      break;
    }
  }
  
  return occurrenceDates;
}

/**
 * Create multiple activity objects from a base activity and recurrence configuration
 * @param {Object} baseActivity - The base activity object
 * @param {Object} recurrenceConfig - Recurrence configuration
 * @returns {Array<Object>} Array of activity objects with series information
 */
export function createRecurringActivities(baseActivity, recurrenceConfig) {
  const seriesId = generateSeriesId();
  const occurrenceDates = generateOccurrenceDates(recurrenceConfig);
  
  return occurrenceDates.map((date, index) => ({
    ...baseActivity,
    id: uuidv4(), // Generate unique UUID for each occurrence
    start_date: date,
    end_date: baseActivity.end_date ? (() => {
      const baseEndDate = (() => {
        if (baseActivity.end_date instanceof Date) return baseActivity.end_date;
        if (baseActivity.end_date && typeof baseActivity.end_date === 'object' && 'seconds' in baseActivity.end_date) {
          return new Date(baseActivity.end_date.seconds * 1000);
        }
        return new Date(baseActivity.end_date);
      })();
      const baseStartDate = (() => {
        if (baseActivity.start_date instanceof Date) return baseActivity.start_date;
        if (baseActivity.start_date && typeof baseActivity.start_date === 'object' && 'seconds' in baseActivity.start_date) {
          return new Date(baseActivity.start_date.seconds * 1000);
        }
        return new Date(baseActivity.start_date);
      })();
      return new Date(date.getTime() + (baseEndDate.getTime() - baseStartDate.getTime()));
    })() : date,
    seriesId: seriesId,
    seriesIndex: index,
    isRecurring: true,
    originalActivityId: baseActivity.id || null,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
}

/**
 * Validate recurrence configuration
 * @param {Object} config - Recurrence configuration
 * @returns {Object} Validation result with isValid and errors
 */
export function validateRecurrenceConfig(config) {
  const errors = [];
  
  if (!config.recurrenceDays || config.recurrenceDays.length === 0) {
    errors.push('At least one day must be selected for recurrence');
  }
  
  if (config.endType === 'occurrences' && (!config.occurrences || config.occurrences < 1)) {
    errors.push('Number of occurrences must be at least 1');
  }
  
  if (config.endType === 'date' && !config.endDate) {
    errors.push('End date must be specified when ending by date');
  }
  
  if (config.endType === 'date' && config.endDate && new Date(config.endDate) <= new Date(config.startDate)) {
    errors.push('End date must be after the start date');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get all activities in a series by seriesId
 * @param {Array<Object>} allActivities - All activities to search through
 * @param {string} seriesId - The series ID to filter by
 * @returns {Array<Object>} Array of activities in the series
 */
export function getActivitiesInSeries(allActivities, seriesId) {
  return allActivities.filter(activity => activity.seriesId === seriesId);
}

/**
 * Check if an activity is part of a recurring series
 * @param {Object} activity - The activity to check
 * @returns {boolean} True if the activity is recurring
 */
export function isRecurringActivity(activity) {
  return activity && activity.isRecurring === true && activity.seriesId;
}
