import React, { useState, useEffect } from 'react';
import { globalNetworkMonitor } from '../../utils/networkStatus';
import type { NetworkStatus as NetworkStatusType } from '../../utils/networkStatus';

interface NetworkStatusProps {
  showWhenOnline?: boolean;
  className?: string;
  onStatusChange?: (status: NetworkStatusType) => void;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({
  showWhenOnline = false,
  className = '',
  onStatusChange,
}) => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatusType>(
    globalNetworkMonitor.getNetworkStatus()
  );

  useEffect(() => {
    const handleNetworkChange = (status: NetworkStatusType) => {
      setNetworkStatus(status);
      onStatusChange?.(status);
    };

    globalNetworkMonitor.addEventListener('change', handleNetworkChange);

    return () => {
      globalNetworkMonitor.removeEventListener('change', handleNetworkChange);
    };
  }, [onStatusChange]);

  // Don't show anything if online and showWhenOnline is false
  if (networkStatus.isOnline && !showWhenOnline) {
    return null;
  }

  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
        ${networkStatus.isOnline 
          ? 'bg-green-50 text-green-800 border border-green-200' 
          : 'bg-red-50 text-red-800 border border-red-200'
        }
        ${className}
      `}
      role="status"
      aria-live="polite"
    >
      <div
        className={`
          w-2 h-2 rounded-full
          ${networkStatus.isOnline ? 'bg-green-500' : 'bg-red-500'}
        `}
        aria-hidden="true"
      />
      
      <span>
        {networkStatus.isOnline ? 'Online' : 'Offline'}
      </span>
      
      {networkStatus.connectionType && (
        <span className="text-xs opacity-75">
          ({networkStatus.connectionType})
        </span>
      )}
    </div>
  );
};

interface OfflineFallbackProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export const OfflineFallback: React.FC<OfflineFallbackProps> = ({
  children,
  fallback,
  className = '',
}) => {
  const [isOnline, setIsOnline] = useState(globalNetworkMonitor.isOnline());

  useEffect(() => {
    const handleNetworkChange = (status: NetworkStatusType) => {
      setIsOnline(status.isOnline);
    };

    globalNetworkMonitor.addEventListener('change', handleNetworkChange);

    return () => {
      globalNetworkMonitor.removeEventListener('change', handleNetworkChange);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className={`offline-fallback ${className}`}>
        {fallback || <DefaultOfflineFallback />}
      </div>
    );
  }

  return <>{children}</>;
};

const DefaultOfflineFallback: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 mb-4 rounded-full bg-red-100 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728"
          />
        </svg>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No Internet Connection
      </h3>
      
      <p className="text-gray-600 mb-4 max-w-md">
        You're currently offline. Please check your internet connection and try again.
      </p>
      
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:bg-blue-700"
      >
        Try Again
      </button>
    </div>
  );
};

interface RetryButtonProps {
  onRetry: () => void;
  isRetrying?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const RetryButton: React.FC<RetryButtonProps> = ({
  onRetry,
  isRetrying = false,
  disabled = false,
  className = '',
  children = 'Retry',
}) => {
  const [isOnline, setIsOnline] = useState(globalNetworkMonitor.isOnline());

  useEffect(() => {
    const handleNetworkChange = (status: NetworkStatusType) => {
      setIsOnline(status.isOnline);
    };

    globalNetworkMonitor.addEventListener('change', handleNetworkChange);

    return () => {
      globalNetworkMonitor.removeEventListener('change', handleNetworkChange);
    };
  }, []);

  const handleRetry = () => {
    if (!disabled && !isRetrying && isOnline) {
      onRetry();
    }
  };

  return (
    <button
      onClick={handleRetry}
      disabled={disabled || isRetrying || !isOnline}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
        transition-colors duration-200
        ${!isOnline 
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
          : disabled || isRetrying
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:bg-blue-700'
        }
        ${className}
      `}
      aria-label={!isOnline ? 'Cannot retry while offline' : undefined}
    >
      {isRetrying && (
        <svg
          className="w-4 h-4 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      
      {!isOnline && (
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728"
          />
        </svg>
      )}
      
      <span>
        {!isOnline ? 'Offline' : isRetrying ? 'Retrying...' : children}
      </span>
    </button>
  );
};

// Hook for using network status in components
export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatusType>(
    globalNetworkMonitor.getNetworkStatus()
  );

  useEffect(() => {
    const handleNetworkChange = (status: NetworkStatusType) => {
      setNetworkStatus(status);
    };

    globalNetworkMonitor.addEventListener('change', handleNetworkChange);

    return () => {
      globalNetworkMonitor.removeEventListener('change', handleNetworkChange);
    };
  }, []);

  return networkStatus;
}

// Hook for network-aware operations
export function useNetworkAwareOperation<T>(
  operation: () => Promise<T>,
  _dependencies: React.DependencyList = []
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);
  const networkStatus = useNetworkStatus();

  const execute = React.useCallback(async () => {
    if (!networkStatus.isOnline) {
      setError(new Error('Cannot perform operation while offline'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await operation();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [operation, networkStatus.isOnline]);

  // Auto-retry when coming back online
  useEffect(() => {
    if (networkStatus.isOnline && error && !isLoading) {
      execute();
    }
  }, [networkStatus.isOnline, error, isLoading, execute]);

  return {
    execute,
    isLoading,
    error,
    data,
    isOnline: networkStatus.isOnline,
    networkStatus,
  };
}