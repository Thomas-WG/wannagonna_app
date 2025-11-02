/**
 * SDG (Sustainable Development Goals) Constants
 * 
 * This file contains all SDG-related data and helper functions used across the application.
 */

// SDG names mapping - maps SDG number to full name
export const sdgNames = {
  '1': 'No Poverty',
  '2': 'Zero Hunger',
  '3': 'Good Health and Well-being',
  '4': 'Quality Education',
  '5': 'Gender Equality',
  '6': 'Clean Water and Sanitation',
  '7': 'Affordable and Clean Energy',
  '8': 'Decent Work and Economic Growth',
  '9': 'Industry, Innovation and Infrastructure',
  '10': 'Reduced Inequalities',
  '11': 'Sustainable Cities and Communities',
  '12': 'Responsible Consumption and Production',
  '13': 'Climate Action',
  '14': 'Life Below Water',
  '15': 'Life on Land',
  '16': 'Peace, Justice and Strong Institutions',
  '17': 'Partnerships for the Goals'
};

// All available SDGs as a simple list
export const allSDGs = [
  { id: '1', name: 1 },
  { id: '2', name: 2 },
  { id: '3', name: 3 },
  { id: '4', name: 4 },
  { id: '5', name: 5 },
  { id: '6', name: 6 },
  { id: '7', name: 7 },
  { id: '8', name: 8 },
  { id: '9', name: 9 },
  { id: '10', name: 10 },
  { id: '11', name: 11 },
  { id: '12', name: 12 },
  { id: '13', name: 13 },
  { id: '14', name: 14 },
  { id: '15', name: 15 },
  { id: '16', name: 16 },
  { id: '17', name: 17 },
];

// SDG options for select dropdowns (with Goal-XX format)
export const sdgOptions = [
  { value: 'Goal-01', label: '01 - No Poverty' },
  { value: 'Goal-02', label: '02 - Zero Hunger' },
  { value: 'Goal-03', label: '03 - Good Health and Well-being' },
  { value: 'Goal-04', label: '04 - Quality Education' },
  { value: 'Goal-05', label: '05 - Gender Equality' },
  { value: 'Goal-06', label: '06 - Clean Water and Sanitation' },
  { value: 'Goal-07', label: '07 - Affordable and Clean Energy' },
  { value: 'Goal-08', label: '08 - Decent Work and Economic Growth' },
  { value: 'Goal-09', label: '09 - Industry, Innovation and Infrastructure' },
  { value: 'Goal-10', label: '10 - Reduced Inequalities' },
  { value: 'Goal-11', label: '11 - Sustainable Cities and Communities' },
  { value: 'Goal-12', label: '12 - Responsible Consumption and Production' },
  { value: 'Goal-13', label: '13 - Climate Action' },
  { value: 'Goal-14', label: '14 - Life Below Water' },
  { value: 'Goal-15', label: '15 - Life on Land' },
  { value: 'Goal-16', label: '16 - Peace, Justice and Strong Institutions' },
  { value: 'Goal-17', label: '17 - Partnerships for the Goals' }
];

/**
 * Helper function to extract SDG number from various formats
 * Handles: numbers, strings like "1", "Goal-01", "Goal-1", etc.
 * @param {string|number} sdg - The SDG value in any format
 * @returns {string} - The SDG number as a string
 */
export const getSDGNumber = (sdg) => {
  if (typeof sdg === 'number') return String(sdg);
  if (typeof sdg === 'string') {
    // Handle "Goal-01" format
    if (sdg.startsWith('Goal-')) {
      return sdg.replace('Goal-', '').replace(/^0+/, '') || '1';
    }
    // Handle just the number as string
    return sdg;
  }
  return sdg;
};

/**
 * Get SDG name by number
 * @param {string|number} sdgNumber - The SDG number
 * @returns {string|null} - The SDG name or null if not found
 */
export const getSDGName = (sdgNumber) => {
  const num = getSDGNumber(sdgNumber);
  return sdgNames[num] || null;
};

/**
 * Get formatted SDG label (e.g., "SDG 1: No Poverty")
 * @param {string|number} sdgNumber - The SDG number
 * @returns {string} - Formatted label
 */
export const getSDGLabel = (sdgNumber) => {
  const num = getSDGNumber(sdgNumber);
  const name = getSDGName(num);
  return name ? `SDG ${num}: ${name}` : `SDG ${num}`;
};

