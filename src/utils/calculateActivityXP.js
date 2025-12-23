/**
 * XP Calculation Utility for Activities
 * 
 * Calculates XP points based on:
 * - Activity category (base XP)
 * - Time commitment slider (0-100)
 * - Complexity slider (0-100)
 * - Long-term role status (frequency === 'role')
 * 
 * Events always return 15 XP (fixed)
 */

/**
 * Get base XP for a category
 * @param {string} category - Category ID
 * @returns {number} Base XP points
 */
export function getCategoryBaseXP(category) {
  // High-value categories (consulting, architecture, translation, education)
  const highValueCategories = {
    consulting: 30,
    architecture: 28,
    translation: 25,
    education: 25,
  };

  // Medium-value categories (website, photovideo, teaching, fundraising)
  const mediumValueCategories = {
    website: 23,
    photovideo: 22,
    teaching: 22,
    fundraising: 21,
    onlinesupport: 20,
    sns: 20,
    explainer: 20,
    flyer: 20,
    logo: 20,
  };

  // Simple categories (dataentry, cleaning, administrative)
  const simpleCategories = {
    dataentry: 12,
    cleaning: 13,
    administrative: 14,
  };

  // Check high-value first
  if (highValueCategories[category]) {
    return highValueCategories[category];
  }

  // Check medium-value
  if (mediumValueCategories[category]) {
    return mediumValueCategories[category];
  }

  // Check simple categories
  if (simpleCategories[category]) {
    return simpleCategories[category];
  }

  // Default for standard categories (most others)
  // Local activities
  const localDefaults = {
    food_distribution: 18,
    elderly_support: 18,
    animal_care: 17,
    environment: 17,
    community_events: 16,
    childcare: 18,
    manual_labor: 16,
  };

  if (localDefaults[category]) {
    return localDefaults[category];
  }

  // Default fallback
  return 18;
}

/**
 * Get time multiplier based on slider value (0-100)
 * @param {number} sliderValue - Slider value from 0 to 100
 * @returns {number} Multiplier (0.7x to 2.0x)
 */
export function getTimeMultiplier(sliderValue) {
  const value = Number(sliderValue) || 50; // Default to 50 if invalid

  if (value <= 20) {
    return 0.7; // Very quick - e.g., 30 min
  } else if (value <= 40) {
    return 0.9; // Quick - e.g., 1-2 hours
  } else if (value <= 60) {
    return 1.0; // Standard - e.g., 2-4 hours
  } else if (value <= 80) {
    return 1.4; // Substantial - e.g., 4-8 hours
  } else {
    return 2.0; // Major commitment - e.g., 8+ hours
  }
}

/**
 * Get complexity multiplier based on slider value (0-100)
 * @param {number} sliderValue - Slider value from 0 to 100
 * @returns {number} Multiplier (0.8x to 1.5x)
 */
export function getComplexityMultiplier(sliderValue) {
  const value = Number(sliderValue) || 50; // Default to 50 if invalid

  if (value <= 30) {
    return 0.8; // Simple - straightforward, minimal skills
  } else if (value <= 60) {
    return 1.0; // Moderate - standard complexity
  } else {
    return 1.5; // Complex - requires expertise/specialized skills
  }
}

/**
 * Calculate XP for an activity
 * @param {Object} activityData - Activity data object
 * @param {string} activityData.type - Activity type ('online', 'local', 'event')
 * @param {string} activityData.category - Category ID
 * @param {number} activityData.timeCommitment - Time commitment slider value (0-100)
 * @param {number} activityData.complexity - Complexity slider value (0-100)
 * @param {string} activityData.frequency - Frequency ('once', 'role', etc.)
 * @returns {number} Calculated XP points
 */
export function calculateActivityXP(activityData) {
  const { type, category, timeCommitment, complexity, frequency } = activityData;

  // Events always return 15 XP (fixed)
  if (type === 'event') {
    return 15;
  }

  // Get base XP from category
  const baseXP = getCategoryBaseXP(category || '');

  // Get multipliers (with backward compatibility defaults)
  const timeMultiplier = getTimeMultiplier(timeCommitment ?? 50);
  const complexityMultiplier = getComplexityMultiplier(complexity ?? 50);
  const longTermMultiplier = frequency === 'role' ? 1.5 : 1.0;

  // Calculate final XP
  let finalXP = baseXP * timeMultiplier * complexityMultiplier * longTermMultiplier;

  // Round to nearest integer
  finalXP = Math.round(finalXP);

  // Ensure minimum XP of 5 points
  return Math.max(5, finalXP);
}
