/**
 * ErrorPage.js
 *
 * Purpose:
 * Reusable error page component for displaying error states (404, 403, etc.)
 * Uses design tokens for consistent styling and full dark mode support.
 *
 * Key Functionalities:
 * - Displays error status code with appropriate icon
 * - Shows user-friendly error message
 * - Provides action buttons (go back, go home, etc.)
 * - Fully compatible with dark mode
 * - Uses design tokens for colors and spacing
 */

'use client';

import { useRouter } from 'next/navigation';
import { Button } from 'flowbite-react';

/**
 * ErrorPage Component
 * @param {Object} props
 * @param {number} props.statusCode - HTTP status code (404, 403, etc.)
 * @param {string} props.title - Main error title
 * @param {string|Array<string>} props.description - Error description(s)
 * @param {string} props.iconType - Icon type: 'notFound', 'forbidden', 'error', 'info'
 * @param {Array<Object>} props.actions - Array of action buttons { label, onClick, variant }
 * @param {React.ReactNode} props.children - Optional additional content to render after description
 */
export default function ErrorPage({
  statusCode = 404,
  title = 'Page Not Found',
  description = 'The page you are looking for does not exist.',
  iconType = 'notFound',
  actions = [],
  children,
}) {
  const router = useRouter();

  // Default actions if none provided
  const defaultActions = actions.length > 0 
    ? actions 
    : [
        {
          label: 'Go Back',
          onClick: () => router.back(),
          variant: 'primary',
        },
        {
          label: 'Go Home',
          onClick: () => router.push('/'),
          variant: 'secondary',
        },
      ];

  // Icon configuration based on error type
  const getIconConfig = () => {
    const configs = {
      notFound: {
        icon: (
          <svg
            className="mx-auto h-20 w-20 sm:h-24 sm:w-24"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
        colorClass: 'text-semantic-info-500 dark:text-semantic-info-400',
      },
      forbidden: {
        icon: (
          <svg
            className="mx-auto h-20 w-20 sm:h-24 sm:w-24"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
            />
          </svg>
        ),
        colorClass: 'text-semantic-error-500 dark:text-semantic-error-400',
      },
      error: {
        icon: (
          <svg
            className="mx-auto h-20 w-20 sm:h-24 sm:w-24"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        ),
        colorClass: 'text-semantic-error-600 dark:text-semantic-error-400',
      },
      info: {
        icon: (
          <svg
            className="mx-auto h-20 w-20 sm:h-24 sm:w-24"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
        colorClass: 'text-semantic-info-500 dark:text-semantic-info-400',
      },
    };

    return configs[iconType] || configs.notFound;
  };

  const iconConfig = getIconConfig();
  const descriptionArray = Array.isArray(description) ? description : [description];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-page dark:bg-background-page p-4 sm:p-6">
      <div className="w-full max-w-2xl">
        <div className="bg-background-card dark:bg-background-card rounded-xl shadow-lg border border-border-light dark:border-border-dark p-6 sm:p-8 md:p-10 text-center">
          {/* Status Code */}
          <div className="mb-6">
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold mb-4 text-text-primary dark:text-text-primary">
              {statusCode}
            </h1>
          </div>

          {/* Icon */}
          <div className={`mb-6 ${iconConfig.colorClass}`}>
            {iconConfig.icon}
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl font-semibold mb-6 text-text-primary dark:text-text-primary">
            {title}
          </h2>

          {/* Description */}
          <div className="mb-8 space-y-4">
            {descriptionArray.map((desc, index) => (
              <p
                key={index}
                className="text-base sm:text-lg text-text-secondary dark:text-text-secondary"
              >
                {desc}
              </p>
            ))}
          </div>

          {/* Additional Content (e.g., dev error details) */}
          {children && <div className="mb-8">{children}</div>}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {defaultActions.map((action, index) => {
              const isPrimary = action.variant === 'primary';
              return (
                <Button
                  key={index}
                  onClick={action.onClick}
                  className={
                    isPrimary
                      ? 'bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-white transition-all duration-200'
                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-all duration-200'
                  }
                >
                  {action.label}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

