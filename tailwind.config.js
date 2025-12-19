/** @type {import('tailwindcss').Config} */
const flowbite = require("flowbite-react/tailwind");
const designTokens = require('./src/constant/designTokens.js').default;

module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/styles/**/*.css",
    flowbite.content(),
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Design token colors
        primary: designTokens.colors.primary,
        accent: designTokens.colors.accent,
        semantic: {
          success: designTokens.colors.semantic.success,
          warning: designTokens.colors.semantic.warning,
          error: designTokens.colors.semantic.error,
          info: designTokens.colors.semantic.info,
        },
        activityType: {
          online: designTokens.colors.activityType.online,
          local: designTokens.colors.activityType.local,
          event: designTokens.colors.activityType.event,
        },
        status: {
          draft: designTokens.colors.status.draft,
          open: designTokens.colors.status.open,
          closed: designTokens.colors.status.closed,
        },
        neutral: designTokens.colors.neutral,
        background: {
          page: designTokens.colors.background.page,
          card: designTokens.colors.background.card,
          modal: designTokens.colors.background.modal,
          sidebar: designTokens.colors.background.sidebar,
          hover: designTokens.colors.background.hover,
        },
        text: {
          primary: designTokens.colors.text.primary,
          secondary: designTokens.colors.text.secondary,
          tertiary: designTokens.colors.text.tertiary,
          disabled: designTokens.colors.text.disabled,
        },
        border: designTokens.colors.border,
        // Legacy support (keep for backward compatibility)
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: designTokens.typography.fontFamily.primary,
      },
      fontSize: designTokens.typography.fontSize,
      fontWeight: designTokens.typography.fontWeight,
      spacing: designTokens.spacing,
      borderRadius: designTokens.borderRadius,
      boxShadow: {
        ...designTokens.shadows,
        'warm-sm': designTokens.shadows.warm.sm,
        'warm-md': designTokens.shadows.warm.md,
        'warm-lg': designTokens.shadows.warm.lg,
      },
      transitionDuration: designTokens.transitions.duration,
      transitionTimingFunction: designTokens.transitions.easing,
      zIndex: designTokens.zIndex,
      animation: {
        'spin-slow': 'spin 2s linear infinite',
        'bounce-joyful': 'bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'pulse-warm': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [
    flowbite.plugin(),
  ],
};
