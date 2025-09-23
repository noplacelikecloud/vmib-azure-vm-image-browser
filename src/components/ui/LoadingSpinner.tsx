import React from 'react';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  className?: string;
  color?: string;
  text?: string;
  centered?: boolean;
}

const sizeClasses: Record<SpinnerSize, string> = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const textSizeClasses: Record<SpinnerSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  color = 'border-blue-600',
  text,
  centered = false,
}) => {
  const spinnerClasses = `animate-spin rounded-full border-2 border-gray-200 ${color} ${sizeClasses[size]}`;
  
  const content = (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={spinnerClasses} style={{ borderTopColor: 'transparent' }} />
      {text && (
        <span className={`text-gray-600 ${textSizeClasses[size]}`}>
          {text}
        </span>
      )}
    </div>
  );

  if (centered) {
    return (
      <div className="flex items-center justify-center min-h-32">
        {content}
      </div>
    );
  }

  return content;
};

// Skeleton loading component for content placeholders
interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width = '100%',
  height = '1rem',
  rounded = false,
}) => {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`animate-pulse bg-gray-200 ${rounded ? 'rounded-full' : 'rounded'} ${className}`}
      style={style}
    />
  );
};

// Loading overlay for full-screen loading states
interface LoadingOverlayProps {
  isVisible: boolean;
  text?: string;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  text = 'Loading...',
  className = '',
}) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <LoadingSpinner size="lg" text={text} centered />
      </div>
    </div>
  );
};

// Card skeleton for loading states in grids/lists
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`border rounded-lg p-4 space-y-3 ${className}`}>
      <Skeleton height="1.5rem" width="75%" />
      <Skeleton height="1rem" width="100%" />
      <Skeleton height="1rem" width="60%" />
      <div className="flex space-x-2 pt-2">
        <Skeleton height="2rem" width="4rem" rounded />
        <Skeleton height="2rem" width="4rem" rounded />
      </div>
    </div>
  );
};

// Enhanced loading spinner with different styles
interface EnhancedSpinnerProps {
  size?: SpinnerSize;
  variant?: 'default' | 'dots' | 'bars' | 'pulse';
  className?: string;
  color?: string;
}

export const EnhancedSpinner: React.FC<EnhancedSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className = '',
  color = 'text-blue-600'
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  if (variant === 'dots') {
    return (
      <div className={`flex space-x-1 ${className}`}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`${sizeClasses[size]} ${color} bg-current rounded-full animate-pulse`}
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1.4s'
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'bars') {
    return (
      <div className={`flex space-x-1 ${className}`}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-1 ${sizeClasses[size].split(' ')[1]} ${color} bg-current animate-pulse`}
            style={{
              animationDelay: `${i * 0.15}s`,
              animationDuration: '1.2s'
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div
        className={`${sizeClasses[size]} ${color} bg-current rounded-full animate-pulse ${className}`}
        style={{
          animationDuration: '2s'
        }}
      />
    );
  }

  // Default spinner
  return (
    <div
      className={`${sizeClasses[size]} border-2 border-gray-200 border-t-current ${color} rounded-full animate-spin ${className}`}
    />
  );
};

// Loading state with progress indication
interface ProgressLoadingProps {
  progress?: number;
  text?: string;
  className?: string;
}

export const ProgressLoading: React.FC<ProgressLoadingProps> = ({
  progress = 0,
  text = 'Loading...',
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <div className="w-full max-w-xs">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>{text}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// Skeleton with wave animation
interface WaveSkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
}

export const WaveSkeleton: React.FC<WaveSkeletonProps> = ({
  className = '',
  width = '100%',
  height = '1rem',
  rounded = false
}) => {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite] ${
        rounded ? 'rounded-full' : 'rounded'
      } ${className}`}
      style={style}
    />
  );
};