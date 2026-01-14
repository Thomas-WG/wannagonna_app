'use client';

import { Button } from 'flowbite-react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { useTranslations } from 'next-intl';

/**
 * Pagination component for members page
 * Displays page numbers, Previous/Next buttons, and current page info
 * 
 * @param {number} currentPage - Current page number (1-indexed)
 * @param {number} totalPages - Total number of pages
 * @param {boolean} hasNextPage - Whether there's a next page
 * @param {boolean} hasPreviousPage - Whether there's a previous page
 * @param {function} onPageChange - Callback function when page changes
 * @param {string} variant - 'top' or 'bottom' (default: 'bottom') - controls border position
 */
export default function MembersPagination({
  currentPage,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
  variant = 'bottom',
}) {
  const t = useTranslations('Members');

  if (totalPages <= 1) {
    return null; // Don't show pagination if there's only one page or no pages
  }

  // Calculate which page numbers to show (current page ± 2 pages, max 5 pages)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages if total is 5 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else if (currentPage <= 3) {
      // Show first 5 pages if we're near the start
      for (let i = 1; i <= maxVisible; i++) {
        pages.push(i);
      }
    } else if (currentPage >= totalPages - 2) {
      // Show last 5 pages if we're near the end
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show current page ± 2 pages
      for (let i = currentPage - 2; i <= currentPage + 2; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  // Determine border and spacing based on variant
  const borderClass = variant === 'top' 
    ? 'mb-6 pb-6 border-b border-border-light dark:border-border-dark'
    : 'mt-6 pt-6 border-t border-border-light dark:border-border-dark';

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${borderClass}`}>
      <div className="text-sm text-text-secondary dark:text-text-secondary">
        {t('page')} {currentPage} {t('of')} {totalPages}
      </div>
      <div className="flex items-center gap-2">
        <Button
          color="gray"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={!hasPreviousPage}
          className="bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border-border-light dark:border-border-dark"
        >
          <HiChevronLeft className="h-4 w-4 mr-1" />
          {t('previous')}
        </Button>
        <div className="flex items-center gap-1">
          {pageNumbers.map((pageNum) => (
            <Button
              key={pageNum}
              color={currentPage === pageNum ? 'blue' : 'gray'}
              size="sm"
              onClick={() => onPageChange(pageNum)}
              className={
                currentPage === pageNum
                  ? 'bg-primary-500 hover:bg-primary-600 text-white'
                  : 'bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border-border-light dark:border-border-dark'
              }
            >
              {pageNum}
            </Button>
          ))}
        </div>
        <Button
          color="gray"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={!hasNextPage}
          className="bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border-border-light dark:border-border-dark"
        >
          {t('next')}
          <HiChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

