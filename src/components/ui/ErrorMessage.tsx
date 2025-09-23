import React from 'react';

export type ErrorType = 'error' | 'warning' | 'info';

interface ErrorMessageProps {
  title?: string;
  message: string;
  type?: ErrorType;
  className?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryText?: string;
  dismissText?: string;
  showIcon?: boolean;
}

const typeStyles: Record<ErrorType, { bg: string; border: string; text: string; icon: string }> = {
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: 'text-red-600',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    icon: 'text-yellow-600',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: 'text-blue-600',
  },
};

const icons: Record<ErrorType, React.ReactNode> = {
  error: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
      />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  type = 'error',
  className = '',
  onRetry,
  onDismiss,
  retryText = 'Try Again',
  dismissText = 'Dismiss',
  showIcon = true,
}) => {
  const styles = typeStyles[type];

  return (
    <div className={`border rounded-lg p-4 ${styles.bg} ${styles.border} ${className}`}>
      <div className="flex items-start space-x-3">
        {showIcon && (
          <div className={`flex-shrink-0 ${styles.icon}`}>
            {icons[type]}
          </div>
        )}
        
        <div className="flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${styles.text} mb-1`}>
              {title}
            </h3>
          )}
          
          <p className={`text-sm ${styles.text}`}>
            {message}
          </p>
          
          {(onRetry || onDismiss) && (
            <div className="mt-3 flex space-x-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded ${
                    type === 'error'
                      ? 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500'
                      : type === 'warning'
                      ? 'text-white bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                      : 'text-white bg-blue-600 hover:bg-blue-700 focus:bg-blue-700'
                  } focus:outline-none transition-colors`}
                >
                  {retryText}
                </button>
              )}
              
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className={`inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded transition-colors ${
                    type === 'error'
                      ? 'border-red-300 text-red-700 bg-red-100 hover:bg-red-200 focus:ring-red-500'
                      : type === 'warning'
                      ? 'border-yellow-300 text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:ring-yellow-500'
                      : 'border-blue-300 text-blue-700 bg-blue-100 hover:bg-blue-200 focus:bg-blue-200'
                  } focus:outline-none`}
                >
                  {dismissText}
                </button>
              )}
            </div>
          )}
        </div>
        
        {onDismiss && (
          <div className="flex-shrink-0">
            <button
              onClick={onDismiss}
              className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                type === 'error'
                  ? 'text-red-500 hover:bg-red-100 focus:ring-red-500'
                  : type === 'warning'
                  ? 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-500'
                  : 'text-blue-500 hover:bg-blue-100 focus:bg-blue-100'
              }`}
              aria-label="Dismiss"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Inline error message for form fields
interface InlineErrorProps {
  message: string;
  className?: string;
}

export const InlineError: React.FC<InlineErrorProps> = ({
  message,
  className = '',
}) => {
  return (
    <p className={`text-sm text-red-600 mt-1 ${className}`}>
      {message}
    </p>
  );
};

// Empty state component for when no data is available
interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = '',
}) => {
  const defaultIcon = (
    <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );

  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="flex justify-center mb-4">
        {icon || defaultIcon}
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
          {description}
        </p>
      )}
      
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:bg-blue-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};