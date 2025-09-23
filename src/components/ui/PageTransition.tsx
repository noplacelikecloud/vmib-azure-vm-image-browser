import React, { useEffect, useState } from 'react';
import { cn } from '../../utils';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  isLoading?: boolean;
  transitionKey?: string | number;
  duration?: 'fast' | 'normal' | 'slow';
  type?: 'fade' | 'slide' | 'scale';
}

/**
 * Page transition component for smooth navigation between different views
 */
export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className = '',
  isLoading = false,
  transitionKey,
  duration = 'normal',
  type = 'fade'
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [currentKey, setCurrentKey] = useState(transitionKey);

  const durationClasses = {
    fast: 'duration-150',
    normal: 'duration-300',
    slow: 'duration-500'
  };

  const getTransitionClasses = (visible: boolean) => {
    const baseClasses = `transition-all ease-in-out ${durationClasses[duration]}`;
    
    switch (type) {
      case 'slide':
        return cn(
          baseClasses,
          visible 
            ? 'transform translate-x-0 opacity-100' 
            : 'transform translate-x-4 opacity-0'
        );
      case 'scale':
        return cn(
          baseClasses,
          visible 
            ? 'transform scale-100 opacity-100' 
            : 'transform scale-95 opacity-0'
        );
      case 'fade':
      default:
        return cn(
          baseClasses,
          visible ? 'opacity-100' : 'opacity-0'
        );
    }
  };

  useEffect(() => {
    if (transitionKey !== currentKey) {
      setIsVisible(false);
      
      const timer = setTimeout(() => {
        setCurrentKey(transitionKey);
        setIsVisible(true);
      }, duration === 'fast' ? 150 : duration === 'slow' ? 500 : 300);

      return () => clearTimeout(timer);
    }
  }, [transitionKey, currentKey, duration]);

  useEffect(() => {
    if (!isLoading && !isVisible) {
      setIsVisible(true);
    }
  }, [isLoading, isVisible]);

  return (
    <div
      className={cn(
        getTransitionClasses(isVisible && !isLoading),
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * Staggered animation container for list items
 */
interface StaggeredAnimationProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  staggerDelay?: number;
}

export const StaggeredAnimation: React.FC<StaggeredAnimationProps> = ({
  children,
  className = '',
  delay = 0,
  staggerDelay = 100
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <div
          className={cn(
            'transition-all duration-300 ease-out',
            isVisible 
              ? 'transform translate-y-0 opacity-100' 
              : 'transform translate-y-4 opacity-0'
          )}
          style={{
            transitionDelay: isVisible ? `${index * staggerDelay}ms` : '0ms'
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

/**
 * Loading state transition component
 */
interface LoadingTransitionProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingComponent: React.ReactNode;
  className?: string;
  minLoadingTime?: number;
}

export const LoadingTransition: React.FC<LoadingTransitionProps> = ({
  isLoading,
  children,
  loadingComponent,
  className = '',
  minLoadingTime = 300
}) => {
  const [showLoading, setShowLoading] = useState(isLoading);
  const [hasMinTimeElapsed, setHasMinTimeElapsed] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShowLoading(true);
      setHasMinTimeElapsed(false);
      
      const timer = setTimeout(() => {
        setHasMinTimeElapsed(true);
      }, minLoadingTime);

      return () => clearTimeout(timer);
    } else if (hasMinTimeElapsed) {
      setShowLoading(false);
    }
  }, [isLoading, hasMinTimeElapsed, minLoadingTime]);

  return (
    <div className={className}>
      <div
        className={cn(
          'transition-opacity duration-300',
          showLoading ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0'
        )}
      >
        {loadingComponent}
      </div>
      <div
        className={cn(
          'transition-opacity duration-300',
          !showLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        {children}
      </div>
    </div>
  );
};

/**
 * Enhanced page transition with loading states and error handling
 */
interface EnhancedPageTransitionProps {
  children: React.ReactNode;
  isLoading?: boolean;
  error?: string | null;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  className?: string;
  transitionKey?: string | number;
  duration?: 'fast' | 'normal' | 'slow';
  type?: 'fade' | 'slide' | 'scale';
  minLoadingTime?: number;
}

export const EnhancedPageTransition: React.FC<EnhancedPageTransitionProps> = ({
  children,
  isLoading = false,
  error = null,
  loadingComponent,
  errorComponent,
  className = '',
  transitionKey,
  duration = 'normal',
  type = 'fade',
  minLoadingTime = 300
}) => {
  if (error && errorComponent) {
    return (
      <PageTransition
        className={className}
        transitionKey={`error-${error}`}
        duration={duration}
        type={type}
      >
        {errorComponent}
      </PageTransition>
    );
  }

  if (isLoading && loadingComponent) {
    return (
      <LoadingTransition
        isLoading={isLoading}
        loadingComponent={loadingComponent}
        className={className}
        minLoadingTime={minLoadingTime}
      >
        <PageTransition
          transitionKey={transitionKey}
          duration={duration}
          type={type}
        >
          {children}
        </PageTransition>
      </LoadingTransition>
    );
  }

  return (
    <PageTransition
      className={className}
      transitionKey={transitionKey}
      duration={duration}
      type={type}
      isLoading={isLoading}
    >
      {children}
    </PageTransition>
  );
};

/**
 * Smooth content transition for data changes
 */
interface ContentTransitionProps {
  children: React.ReactNode;
  contentKey: string | number;
  className?: string;
  duration?: 'fast' | 'normal' | 'slow';
  type?: 'fade' | 'slide' | 'scale';
}

export const ContentTransition: React.FC<ContentTransitionProps> = ({
  children,
  contentKey,
  className = '',
  duration = 'normal',
  type = 'fade'
}) => {
  const [currentContent, setCurrentContent] = useState(children);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (contentKey !== undefined) {
      setIsTransitioning(true);
      
      const transitionDuration = duration === 'fast' ? 150 : duration === 'slow' ? 500 : 300;
      
      const timer = setTimeout(() => {
        setCurrentContent(children);
        setIsTransitioning(false);
      }, transitionDuration / 2);

      return () => clearTimeout(timer);
    }
  }, [contentKey, children, duration]);

  return (
    <PageTransition
      className={className}
      isLoading={isTransitioning}
      duration={duration}
      type={type}
    >
      {currentContent}
    </PageTransition>
  );
};

/**
 * Hover transition component for interactive elements
 */
interface HoverTransitionProps {
  children: React.ReactNode;
  className?: string;
  hoverScale?: boolean;
  hoverShadow?: boolean;
  hoverBorder?: boolean;
}

export const HoverTransition: React.FC<HoverTransitionProps> = ({
  children,
  className = '',
  hoverScale = false,
  hoverShadow = true,
  hoverBorder = true
}) => {
  const hoverClasses = cn(
    'transition-all duration-200 ease-in-out',
    hoverScale && 'hover:scale-105',
    hoverShadow && 'hover:shadow-md',
    hoverBorder && 'hover:border-blue-500'
  );

  return (
    <div className={cn(hoverClasses, className)}>
      {children}
    </div>
  );
};