/*
 * ErrorBoundary.js
 *
 * Purpose:
 * React Error Boundary component to catch and handle errors in the component tree.
 * Provides a fallback UI when errors occur, improving user experience.
 *
 * Key Functionalities:
 * - Catches JavaScript errors in child components
 * - Logs error information for debugging
 * - Displays user-friendly error message
 * - Provides option to reset error state
 *
 * Usage:
 * - Wrap components that might throw errors
 * - Place at strategic points in the component tree
 */

'use client';

import React from 'react';
import { Button } from 'flowbite-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-background-page dark:bg-background-page p-4">
          <div className="bg-background-card dark:bg-background-card p-8 rounded-lg shadow-lg max-w-2xl w-full border border-border-light dark:border-border-dark text-center">
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-semantic-error-600 dark:text-semantic-error-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-4 text-text-primary dark:text-text-primary">
              Something went wrong
            </h1>
            <p className="text-text-secondary dark:text-text-secondary mb-6">
              We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-text-tertiary dark:text-text-tertiary mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="text-xs bg-background-page dark:bg-background-page p-4 rounded overflow-auto max-h-48 text-semantic-error-600 dark:text-semantic-error-400">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <div className="flex gap-4 justify-center">
              <Button
                onClick={this.handleReset}
                className="bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-white"
              >
                Try Again
              </Button>
              <Button
                onClick={() => window.location.reload()}
                color="gray"
                className="bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600"
              >
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

