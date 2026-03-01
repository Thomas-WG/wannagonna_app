/**
 * Design Tokens Configuration
 * 
 * Centralized design system tokens for consistent UI/UX across the application.
 * All colors, typography, spacing, and other design elements are defined here.
 * Aligned with landing page: Teal primary, warm backgrounds, Montserrat Alt headings.
 * 
 * Design Philosophy: Dynamic, Joyful, Warm & Professional
 */

export const designTokens = {
  // Color Palette - Teal primary (landing-aligned), warm accents
  colors: {
    // Primary Brand Colors - Teal (landing #009AA2)
    primary: {
      50: '#e6f7f8',
      100: '#b3ebef',
      200: '#80dfe5',
      300: '#4dd3dc',
      400: '#26b8c4',
      500: '#009AA2', // Primary - teal (landing)
      600: '#007a81', // Primary Dark - hover state
      700: '#005f65',
      800: '#004448',
      900: '#002a2d',
    },

    // Accent Colors - Orange (landing #F08602), yellow, pink
    accent: {
      orange: '#F08602',  // Landing orange accent
      yellow: '#fbbf24',  // Warm Yellow - highlights
      pink: '#fb7185',    // Warm Pink - special elements
      teal: '#009AA2',    // Alias to primary
    },

    // Semantic Colors - with warm undertones
    semantic: {
      success: {
        50: '#ecfdf5',
        100: '#d1fae5',
        200: '#a7f3d0',
        300: '#6ee7b7',
        400: '#34d399',
        500: '#10b981', // Success - warm, vibrant green
        600: '#059669',
        700: '#047857',
        800: '#065f46',
        900: '#064e3b',
      },
      warning: {
        50: '#fffbeb',
        100: '#fef3c7',
        200: '#fde68a',
        300: '#fcd34d',
        400: '#fbbf24',
        500: '#f59e0b', // Warning - warm, friendly yellow
        600: '#d97706',
        700: '#b45309',
        800: '#92400e',
        900: '#78350f',
      },
      error: {
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fecaca',
        300: '#fca5a5',
        400: '#f87171',
        500: '#ef4444', // Error - clear but not harsh
        600: '#dc2626',
        700: '#b91c1c',
        800: '#991b1b',
        900: '#7f1d1d',
      },
      info: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9', // Info - bright, friendly blue
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e',
      },
    },

    // Activity Type Colors - vibrant and distinct
    activityType: {
      online: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9', // Online - bright, energetic blue
        600: '#0284c7',
        700: '#0369a1',
      },
      local: {
        50: '#ecfdf5',
        100: '#d1fae5',
        200: '#a7f3d0',
        300: '#6ee7b7',
        400: '#34d399',
        500: '#10b981', // Local - warm, growth-oriented green
        600: '#059669',
        700: '#047857',
      },
      event: {
        50: '#faf5ff',
        100: '#f3e8ff',
        200: '#e9d5ff',
        300: '#d8b4fe',
        400: '#c084fc',
        500: '#8b5cf6', // Event - creative, celebratory purple
        600: '#7c3aed',
        700: '#6d28d9',
      },
    },

    // Status Colors - clear and warm
    status: {
      draft: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b', // Draft - neutral but warm
        600: '#475569',
        700: '#334155',
      },
      open: {
        50: '#ecfdf5',
        100: '#d1fae5',
        200: '#a7f3d0',
        300: '#6ee7b7',
        400: '#34d399',
        500: '#10b981', // Open - inviting, active green
        600: '#059669',
        700: '#047857',
      },
      closed: {
        50: '#eef2ff',
        100: '#e0e7ff',
        200: '#c7d2fe',
        300: '#a5b4fc',
        400: '#818cf8',
        500: '#6366f1', // Closed - professional purple
        600: '#4f46e5',
        700: '#4338ca',
      },
    },

    // Neutral Colors - warm grays (Slate)
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },

    // Background Colors (landing-aligned: #fafaf9 light, teal-tinted dark)
    background: {
      page: {
        light: '#fafaf9', // Warm off-white (landing)
        dark: '#0d1a1d', // Dark teal-tinted slate
      },
      card: {
        light: '#ffffff',
        dark: '#152a30', // Slightly lighter than page for hierarchy
      },
      modal: {
        light: '#ffffff',
        dark: '#152a30',
      },
      sidebar: {
        light: '#f5fafb', // Subtle teal tint (landing-aligned)
        dark: '#152a30',
      },
      hover: {
        light: '#f1f5f5',
        dark: '#1e3a42',
      },
    },

    // Text Colors (landing: #1A1A1A primary, #6b7280 secondary)
    text: {
      primary: {
        light: '#1A1A1A',
        dark: '#f0f7f8',
      },
      secondary: {
        light: '#6b7280',
        dark: '#a8bcc4',
      },
      tertiary: {
        light: '#9ca3af',
        dark: '#7a8f99',
      },
      disabled: {
        light: '#9ca3af',
        dark: '#4a5e68',
      },
    },

    // Border Colors (landing: #e5e7eb, teal focus)
    border: {
      light: '#e5e7eb',
      dark: '#2a4a54',
      focus: {
        light: '#009AA2',
        dark: '#26b8c4',
      },
    },

    // Shadow Colors (with warm tints)
    shadow: {
      sm: {
        light: 'rgba(15, 23, 42, 0.05)',
        dark: 'rgba(0, 0, 0, 0.3)',
      },
      md: {
        light: 'rgba(15, 23, 42, 0.1)',
        dark: 'rgba(0, 0, 0, 0.4)',
      },
      lg: {
        light: 'rgba(15, 23, 42, 0.15)',
        dark: 'rgba(0, 0, 0, 0.5)',
      },
      xl: {
        light: 'rgba(15, 23, 42, 0.2)',
        dark: 'rgba(0, 0, 0, 0.6)',
      },
    },
  },

  // Typography (Montserrat Alt for headings, Roboto for body - landing-aligned)
  typography: {
    fontFamily: {
      primary: ['var(--font-roboto)', 'Roboto', 'Arial', 'sans-serif'],
      heading: ['var(--font-montserrat-alt)', 'Montserrat Alternates', 'sans-serif'],
      fallback: ['system-ui', '-apple-system', 'sans-serif'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.025em' }],      // 12px
      sm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.025em' }], // 14px
      base: ['1rem', { lineHeight: '1.5rem', letterSpacing: '0em' }],         // 16px
      lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }], // 18px
      xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }], // 20px
      '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.025em' }],  // 24px
      '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.025em' }], // 30px
      '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.025em' }], // 36px
    },
    fontWeight: {
      thin: '100',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  // Spacing Scale
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    // Teal shadow variants (landing-aligned)
    warm: {
      sm: '0 1px 3px 0 rgba(0, 154, 162, 0.1)',
      md: '0 4px 6px -1px rgba(0, 154, 162, 0.1), 0 2px 4px -1px rgba(0, 154, 162, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 154, 162, 0.1), 0 4px 6px -2px rgba(0, 154, 162, 0.05)',
    },
  },

  // Transitions
  transitions: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
      slower: '500ms',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Joyful bounce
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    },
  },

  // Z-Index Scale
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },

  // Breakpoints (Tailwind defaults)
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
};

// Export helper functions for accessing tokens
export const getColorToken = (category, shade = 500, variant = 'light') => {
  const colorPath = designTokens.colors[category];
  if (!colorPath) return null;
  
  if (typeof shade === 'string' && (shade === 'light' || shade === 'dark')) {
    return colorPath[shade];
  }
  
  if (colorPath[shade]) {
    return colorPath[shade];
  }
  
  return null;
};

export const getTypographyToken = (type, size = 'base') => {
  return designTokens.typography[type]?.[size] || null;
};

export const getSpacingToken = (size = 4) => {
  return designTokens.spacing[size] || designTokens.spacing[4];
};

export default designTokens;
