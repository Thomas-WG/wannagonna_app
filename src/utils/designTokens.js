/**
 * Design Token Utilities
 * 
 * Helper functions for accessing design tokens programmatically
 */

import designTokens from '@/constant/designTokens';

/**
 * Get a color token by category and shade
 * @param {string} category - Color category (primary, semantic, activityType, etc.)
 * @param {number|string} shade - Color shade (50-900) or 'light'/'dark' for variants
 * @param {string} variant - 'light' or 'dark' mode variant
 * @returns {string|null} Color value or null if not found
 */
export const getColorToken = (category, shade = 500, variant = 'light') => {
  const colorPath = designTokens.colors[category];
  if (!colorPath) return null;
  
  // Handle light/dark variants
  if (typeof shade === 'string' && (shade === 'light' || shade === 'dark')) {
    return colorPath[shade];
  }
  
  // Handle numeric shades
  if (colorPath[shade]) {
    return colorPath[shade];
  }
  
  return null;
};

/**
 * Get typography token
 * @param {string} type - Typography type (fontSize, fontWeight, fontFamily)
 * @param {string} size - Size key (xs, sm, base, lg, etc.)
 * @returns {any|null} Typography value or null if not found
 */
export const getTypographyToken = (type, size = 'base') => {
  return designTokens.typography[type]?.[size] || null;
};

/**
 * Get spacing token
 * @param {number} size - Spacing size (0-24)
 * @returns {string} Spacing value
 */
export const getSpacingToken = (size = 4) => {
  return designTokens.spacing[size] || designTokens.spacing[4];
};

/**
 * Get component styles - Button
 * @param {string} variant - Button variant (primary, secondary, etc.)
 * @param {boolean} isDark - Dark mode flag
 * @returns {object} Button style classes
 */
export const getButtonStyles = (variant = 'primary', isDark = false) => {
  const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-all duration-200';
  const mode = isDark ? 'dark' : 'light';
  
  const variants = {
    primary: {
      base: `${baseStyles} bg-gradient-to-r from-primary-500 to-primary-600 text-white`,
      hover: 'hover:from-primary-600 hover:to-primary-700 hover:scale-105 hover:shadow-warm-md',
      active: 'active:scale-95',
    },
    secondary: {
      base: `${baseStyles} bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100`,
      hover: 'hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:scale-105',
      active: 'active:scale-95',
    },
    success: {
      base: `${baseStyles} bg-gradient-to-r from-semantic-success-500 to-semantic-success-600 text-white`,
      hover: 'hover:from-semantic-success-600 hover:to-semantic-success-700 hover:scale-105',
      active: 'active:scale-95',
    },
    danger: {
      base: `${baseStyles} bg-gradient-to-r from-semantic-error-500 to-semantic-error-600 text-white`,
      hover: 'hover:from-semantic-error-600 hover:to-semantic-error-700 hover:scale-105',
      active: 'active:scale-95',
    },
  };
  
  const variantStyles = variants[variant] || variants.primary;
  return `${variantStyles.base} ${variantStyles.hover} ${variantStyles.active}`;
};

/**
 * Get component styles - Card
 * @param {boolean} isDark - Dark mode flag
 * @param {boolean} interactive - Whether card is interactive (hover effects)
 * @returns {string} Card style classes
 */
export const getCardStyles = (isDark = false, interactive = true) => {
  const baseStyles = 'bg-background-card dark:bg-background-card rounded-xl shadow-md';
  const interactiveStyles = interactive 
    ? 'hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer' 
    : '';
  return `${baseStyles} ${interactiveStyles}`;
};

/**
 * Get component styles - Input
 * @param {boolean} isDark - Dark mode flag
 * @param {boolean} hasError - Whether input has error
 * @returns {string} Input style classes
 */
export const getInputStyles = (isDark = false, hasError = false) => {
  const baseStyles = 'w-full px-4 py-2 rounded-lg border transition-all duration-200';
  const normalStyles = 'border-border-light dark:border-border-dark bg-white dark:bg-neutral-800 text-text-primary dark:text-text-primary';
  const focusStyles = 'focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400';
  const errorStyles = hasError 
    ? 'border-semantic-error-500 dark:border-semantic-error-400 focus:ring-semantic-error-500 dark:focus:ring-semantic-error-400' 
    : '';
  
  return `${baseStyles} ${normalStyles} ${focusStyles} ${errorStyles}`;
};

/**
 * Get component styles - Badge
 * @param {string} variant - Badge variant (status, activityType, etc.)
 * @param {string} type - Badge type (draft, open, closed, online, local, event)
 * @param {boolean} isDark - Dark mode flag
 * @returns {string} Badge style classes
 */
export const getBadgeStyles = (variant = 'status', type = 'draft', isDark = false) => {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  
  if (variant === 'status') {
    const statusColors = {
      draft: 'bg-status-draft-100 dark:bg-status-draft-800 text-status-draft-800 dark:text-status-draft-200',
      open: 'bg-status-open-100 dark:bg-status-open-800 text-status-open-800 dark:text-status-open-200',
      closed: 'bg-status-closed-100 dark:bg-status-closed-800 text-status-closed-800 dark:text-status-closed-200',
    };
    return `${baseStyles} ${statusColors[type] || statusColors.draft}`;
  }
  
  if (variant === 'activityType') {
    const typeColors = {
      online: 'bg-activityType-online-100 dark:bg-activityType-online-800 text-activityType-online-800 dark:text-activityType-online-200',
      local: 'bg-activityType-local-100 dark:bg-activityType-local-800 text-activityType-local-800 dark:text-activityType-local-200',
      event: 'bg-activityType-event-100 dark:bg-activityType-event-800 text-activityType-event-800 dark:text-activityType-event-200',
    };
    return `${baseStyles} ${typeColors[type] || typeColors.online}`;
  }
  
  return baseStyles;
};

/**
 * Get transition classes
 * @param {string} duration - Transition duration (fast, normal, slow, slower)
 * @param {string} easing - Transition easing (default, bounce, easeOut, easeIn)
 * @returns {string} Transition classes
 */
export const getTransitionClasses = (duration = 'normal', easing = 'default') => {
  const durations = {
    fast: 'duration-150',
    normal: 'duration-200',
    slow: 'duration-300',
    slower: 'duration-500',
  };
  
  // Note: Tailwind doesn't support custom easing directly in classes
  // This would need to be added via CSS or inline styles
  return `transition-all ${durations[duration] || durations.normal}`;
};

export default {
  getColorToken,
  getTypographyToken,
  getSpacingToken,
  getButtonStyles,
  getCardStyles,
  getInputStyles,
  getBadgeStyles,
  getTransitionClasses,
};
