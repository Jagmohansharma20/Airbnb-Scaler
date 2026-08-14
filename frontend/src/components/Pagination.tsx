'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
}: PaginationProps) {
  // Option A (Recommended): If only 1 page or 0 results, hide pagination entirely for a clean UI
  if (totalPages <= 1) {
    return null;
  }

  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  const handlePrevious = () => {
    if (!isFirstPage && !isLoading) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (!isLastPage && !isLoading) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex items-center justify-center gap-4 pt-8 pb-4 select-none">
      {/* Previous Button */}
      <button
        type="button"
        onClick={handlePrevious}
        disabled={isFirstPage || isLoading}
        aria-label="Previous Page"
        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full border text-sm font-semibold transition-all ${
          isFirstPage || isLoading
            ? 'border-gray-200 text-gray-300 bg-gray-50/50 cursor-not-allowed shadow-none'
            : 'border-gray-300 text-gray-800 bg-white hover:bg-gray-100 hover:border-gray-400 active:scale-95 shadow-sm'
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Previous</span>
      </button>

      {/* Page Indicator */}
      <div className="px-3.5 py-1.5 rounded-full bg-gray-100/80 border border-gray-200/60 text-xs sm:text-sm font-semibold text-gray-700">
        Page {currentPage} of {totalPages}
      </div>

      {/* Next Button */}
      <button
        type="button"
        onClick={handleNext}
        disabled={isLastPage || isLoading}
        aria-label="Next Page"
        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full border text-sm font-semibold transition-all ${
          isLastPage || isLoading
            ? 'border-gray-200 text-gray-300 bg-gray-50/50 cursor-not-allowed shadow-none'
            : 'border-gray-300 text-gray-800 bg-white hover:bg-gray-100 hover:border-gray-400 active:scale-95 shadow-sm'
        }`}
      >
        <span>Next</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
