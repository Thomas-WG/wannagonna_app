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
import ErrorPage from './ErrorPage';

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
      // Custom fallback UI using shared ErrorPage component
      return (
        <ErrorPage
          statusCode={500}
          title="Something went wrong"
          description="We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists."
          iconType="error"
          actions={[
            {
              label: 'Try Again',
              onClick: this.handleReset,
              variant: 'primary',
            },
            {
              label: 'Refresh Page',
              onClick: () => window.location.reload(),
              variant: 'secondary',
            },
          ]}
        >
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="text-left">
              <summary className="cursor-pointer text-sm text-text-tertiary dark:text-text-tertiary mb-2">
                Error Details (Development Only)
              </summary>
              <pre className="text-xs bg-background-page dark:bg-background-page p-4 rounded overflow-auto max-h-48 text-semantic-error-600 dark:text-semantic-error-400 border border-border-light dark:border-border-dark">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </ErrorPage>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

