import { useTheme } from '@/utils/theme/ThemeContext';

/**
 * FormError component for displaying form validation errors
 * Supports responsive design and dark mode
 */
export default function FormError({ message, className = '' }) {
  const { isDark } = useTheme();

  if (!message) return null;

  return (
    <p
      className={`mt-1 text-sm text-red-600 dark:text-red-400 ${className}`}
      role="alert"
      aria-live="polite"
    >
      {message}
    </p>
  );
}

