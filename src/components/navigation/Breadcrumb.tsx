import React from 'react';
import { useBreadcrumb } from '../../stores/navigationStore';
import type { BreadcrumbItem } from '../../types';

interface BreadcrumbProps {
  className?: string;
  separator?: React.ReactNode;
  showHome?: boolean;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  className = '',
  separator = '/',
  showHome = true,
}) => {
  const { breadcrumb } = useBreadcrumb();

  if (breadcrumb.length === 0) {
    return null;
  }

  const handleItemClick = (item: BreadcrumbItem, index: number) => {
    // Don't navigate if it's the last item (current page)
    if (index === breadcrumb.length - 1) {
      return;
    }
    
    if (item.onClick) {
      item.onClick();
    }
  };

  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`} aria-label="Breadcrumb">
      {showHome && (
        <>
          <button
            onClick={() => breadcrumb[0]?.onClick?.()}
            className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Go to home"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 5a2 2 0 012-2h4a2 2 0 012 2v14H8V5z"
              />
            </svg>
          </button>
          {breadcrumb.length > 0 && (
            <span className="text-gray-400" aria-hidden="true">
              {separator}
            </span>
          )}
        </>
      )}
      
      <ol className="flex items-center space-x-2">
        {breadcrumb.map((item, index) => (
          <li key={`${item.level}-${item.label}`} className="flex items-center">
            {index > 0 && (
              <span className="text-gray-400 mr-2" aria-hidden="true">
                {separator}
              </span>
            )}
            
            {index === breadcrumb.length - 1 ? (
              // Current page - not clickable
              <span
                className="text-gray-900 font-medium"
                aria-current="page"
              >
                {item.label}
              </span>
            ) : (
              // Clickable breadcrumb item
              <button
                onClick={() => handleItemClick(item, index)}
                className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                aria-label={`Go to ${item.label}`}
              >
                {item.label}
              </button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

// Compact version for mobile or small spaces
export const CompactBreadcrumb: React.FC<BreadcrumbProps> = ({
  className = '',
}) => {
  const { breadcrumb } = useBreadcrumb();

  if (breadcrumb.length === 0) {
    return null;
  }

  const currentItem = breadcrumb[breadcrumb.length - 1];
  const parentItem = breadcrumb.length > 1 ? breadcrumb[breadcrumb.length - 2] : null;

  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`} aria-label="Breadcrumb">
      {parentItem && (
        <>
          <button
            onClick={parentItem.onClick}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            aria-label={`Go back to ${parentItem.label}`}
          >
            <svg
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            {parentItem.label}
          </button>
          <span className="text-gray-400" aria-hidden="true">
            /
          </span>
        </>
      )}
      
      <span className="text-gray-900 font-medium" aria-current="page">
        {currentItem.label}
      </span>
    </nav>
  );
};