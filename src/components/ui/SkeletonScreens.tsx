import React, { useState, useEffect } from 'react';
import { ResponsiveGrid, Card, Stack } from '../layout';
import { Skeleton } from './LoadingSpinner';
import { cn } from '../../utils';

interface SkeletonScreenProps {
  className?: string;
}

/**
 * Skeleton screen for Publishers Grid
 */
export const PublishersGridSkeleton: React.FC<SkeletonScreenProps> = ({ className = '' }) => {
  return (
    <div className={className}>
      <Stack direction="vertical" spacing="lg">
        {/* Header Skeleton */}
        <div>
          <Skeleton height="2rem" width="300px" className="mb-2" />
          <Skeleton height="1.25rem" width="400px" />
        </div>
        
        {/* Search Filter Skeleton */}
        <Skeleton height="2.5rem" width="300px" />
        
        {/* Grid Skeleton */}
        <ResponsiveGrid
          cols={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 4, '2xl': 5 }}
          gap="md"
        >
          {Array.from({ length: 8 }).map((_, index) => (
            <PublisherCardSkeleton key={index} />
          ))}
        </ResponsiveGrid>
      </Stack>
    </div>
  );
};

/**
 * Skeleton for individual Publisher Card
 */
export const PublisherCardSkeleton: React.FC<SkeletonScreenProps> = ({ className = '' }) => {
  return (
    <Card variant="default" padding="md" className={`h-full ${className}`}>
      <Stack direction="vertical" spacing="sm" className="h-full">
        <div className="flex-1">
          <Skeleton height="1.5rem" width="85%" className="mb-3" />
          <Stack direction="vertical" spacing="xs">
            <Skeleton height="1rem" width="70%" />
            <Skeleton height="1rem" width="60%" />
          </Stack>
        </div>
        
        <div className="pt-3 border-t border-gray-100">
          <Skeleton height="1rem" width="80px" />
        </div>
      </Stack>
    </Card>
  );
};

/**
 * Skeleton screen for Offers List
 */
export const OffersListSkeleton: React.FC<SkeletonScreenProps> = ({ className = '' }) => {
  return (
    <div className={className}>
      <Stack direction="vertical" spacing="lg">
        {/* Header Skeleton */}
        <div>
          <Skeleton height="2rem" width="350px" className="mb-2" />
          <Skeleton height="1.25rem" width="300px" />
        </div>
        
        {/* Search Filter Skeleton */}
        <Skeleton height="2.5rem" width="300px" />
        
        {/* List Skeleton */}
        <Stack direction="vertical" spacing="md">
          {Array.from({ length: 6 }).map((_, index) => (
            <OfferItemSkeleton key={index} />
          ))}
        </Stack>
      </Stack>
    </div>
  );
};

/**
 * Skeleton for individual Offer Item
 */
export const OfferItemSkeleton: React.FC<SkeletonScreenProps> = ({ className = '' }) => {
  return (
    <Card variant="default" padding="md" className={className}>
      <Stack
        direction="horizontal"
        justify="between"
        align="center"
        spacing="md"
        responsive={{
          sm: { direction: 'vertical', align: 'start', spacing: 'sm' },
          md: { direction: 'horizontal', align: 'center', spacing: 'md' }
        }}
      >
        <div className="flex-1 min-w-0">
          <Skeleton height="1.5rem" width="75%" className="mb-2" />
          <Stack direction="vertical" spacing="xs">
            <Skeleton height="1rem" width="60%" />
            <Skeleton height="1rem" width="70%" />
            <Skeleton height="1rem" width="50%" />
          </Stack>
        </div>
        
        <div className="flex-shrink-0 w-full sm:w-auto">
          <Skeleton height="1rem" width="80px" className="ml-auto" />
        </div>
      </Stack>
    </Card>
  );
};

/**
 * Skeleton screen for SKUs Details
 */
export const SKUsDetailsSkeleton: React.FC<SkeletonScreenProps> = ({ className = '' }) => {
  return (
    <div className={className}>
      <Stack direction="vertical" spacing="lg">
        {/* Header Skeleton */}
        <div>
          <Skeleton height="2rem" width="300px" className="mb-2" />
          <Stack direction="vertical" spacing="xs" className="mt-2">
            <Skeleton height="1.25rem" width="250px" />
            <Skeleton height="1.25rem" width="400px" />
          </Stack>
        </div>
        
        {/* Search Filter Skeleton */}
        <Skeleton height="2.5rem" width="300px" />
        
        {/* SKUs Grid Skeleton */}
        <ResponsiveGrid
          cols={{ xs: 1, sm: 1, md: 1, lg: 2, xl: 2, '2xl': 3 }}
          gap="lg"
        >
          {Array.from({ length: 4 }).map((_, index) => (
            <SKUCardSkeleton key={index} />
          ))}
        </ResponsiveGrid>
      </Stack>
    </div>
  );
};

/**
 * Skeleton for individual SKU Card
 */
export const SKUCardSkeleton: React.FC<SkeletonScreenProps> = ({ className = '' }) => {
  return (
    <Card variant="default" padding="md" className={`h-full ${className}`}>
      <Stack direction="vertical" spacing="md" className="h-full">
        {/* Header */}
        <div>
          <Skeleton height="1.75rem" width="80%" className="mb-3" />
          <Stack direction="vertical" spacing="xs">
            <Skeleton height="1rem" width="70%" />
            <Skeleton height="1rem" width="60%" />
            <Skeleton height="1rem" width="65%" />
            <Skeleton height="1rem" width="55%" />
          </Stack>
        </div>

        {/* Versions Section */}
        <div className="flex-1">
          <Skeleton height="1.5rem" width="150px" className="mb-3" />
          <Stack direction="vertical" spacing="sm">
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md"
                >
                  <div className="flex-1 min-w-0">
                    <Skeleton height="1rem" width="120px" className="mb-1" />
                    <Skeleton height="0.75rem" width="60px" />
                  </div>
                  <Skeleton height="2rem" width="2rem" rounded />
                </div>
              ))}
            </div>
            <Skeleton height="0.75rem" width="100px" />
          </Stack>
        </div>

        {/* Actions Section */}
        <div className="pt-4 border-t border-gray-200">
          <Stack
            direction="horizontal"
            justify="between"
            align="center"
            responsive={{
              sm: { direction: 'vertical', align: 'start', spacing: 'sm' },
              md: { direction: 'horizontal', align: 'center' }
            }}
          >
            <Skeleton height="1rem" width="180px" />
            <Skeleton height="2.5rem" width="100px" />
          </Stack>
        </div>
      </Stack>
    </Card>
  );
};

/**
 * Generic list skeleton for various loading states
 */
export const ListSkeleton: React.FC<SkeletonScreenProps & { items?: number }> = ({ 
  className = '', 
  items = 5 
}) => {
  return (
    <Stack direction="vertical" spacing="md" className={className}>
      {Array.from({ length: items }).map((_, index) => (
        <Card key={index} variant="default" padding="md">
          <Stack direction="vertical" spacing="sm">
            <Skeleton height="1.5rem" width="75%" />
            <Skeleton height="1rem" width="100%" />
            <Skeleton height="1rem" width="60%" />
          </Stack>
        </Card>
      ))}
    </Stack>
  );
};

/**
 * Generic grid skeleton for various loading states
 */
export const GridSkeleton: React.FC<SkeletonScreenProps & { 
  items?: number;
  cols?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number; '2xl'?: number };
}> = ({ 
  className = '', 
  items = 8,
  cols = { xs: 1, sm: 2, md: 2, lg: 3, xl: 4, '2xl': 5 }
}) => {
  return (
    <ResponsiveGrid cols={cols} gap="md" className={className}>
      {Array.from({ length: items }).map((_, index) => (
        <Card key={index} variant="default" padding="md" className="h-full">
          <Stack direction="vertical" spacing="sm" className="h-full">
            <div className="flex-1">
              <Skeleton height="1.5rem" width="85%" className="mb-3" />
              <Stack direction="vertical" spacing="xs">
                <Skeleton height="1rem" width="70%" />
                <Skeleton height="1rem" width="60%" />
              </Stack>
            </div>
            <div className="pt-3 border-t border-gray-100">
              <Skeleton height="1rem" width="80px" />
            </div>
          </Stack>
        </Card>
      ))}
    </ResponsiveGrid>
  );
};

/**
 * Animated skeleton with pulse effect
 */
export const AnimatedSkeleton: React.FC<SkeletonScreenProps & {
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  delay?: number;
}> = ({
  className = '',
  width = '100%',
  height = '1rem',
  rounded = false,
  delay = 0
}) => {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    animationDelay: `${delay}ms`
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]',
        'animate-[shimmer_2s_infinite]',
        rounded ? 'rounded-full' : 'rounded',
        className
      )}
      style={style}
    />
  );
};

/**
 * Progressive loading skeleton that reveals content gradually
 */
interface ProgressiveSkeletonProps {
  children: React.ReactNode;
  isLoading: boolean;
  className?: string;
  staggerDelay?: number;
}

export const ProgressiveSkeleton: React.FC<ProgressiveSkeletonProps> = ({
  children,
  isLoading,
  className = '',
  staggerDelay = 100
}) => {
  const [visibleItems, setVisibleItems] = useState(0);
  const childrenArray = React.Children.toArray(children);

  useEffect(() => {
    if (!isLoading) {
      let currentIndex = 0;
      const interval = setInterval(() => {
        setVisibleItems(prev => {
          currentIndex = prev + 1;
          if (currentIndex >= childrenArray.length) {
            clearInterval(interval);
            return childrenArray.length;
          }
          return currentIndex;
        });
      }, staggerDelay);

      return () => clearInterval(interval);
    } else {
      setVisibleItems(0);
    }
  }, [isLoading, childrenArray.length, staggerDelay]);

  if (isLoading) {
    return (
      <div className={className}>
        {childrenArray.map((_, index) => (
          <div key={index} className="mb-4">
            <AnimatedSkeleton height="4rem" delay={index * 50} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      {childrenArray.map((child, index) => (
        <div
          key={index}
          className={cn(
            'transition-all duration-300 ease-out',
            index < visibleItems
              ? 'opacity-100 transform translate-y-0'
              : 'opacity-0 transform translate-y-4'
          )}
          style={{
            transitionDelay: `${index * staggerDelay}ms`
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton screen for navigation breadcrumb
 */
export const BreadcrumbSkeleton: React.FC<SkeletonScreenProps> = ({ className = '' }) => {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Skeleton height="1rem" width="80px" />
      <span className="text-gray-400">/</span>
      <Skeleton height="1rem" width="100px" />
      <span className="text-gray-400">/</span>
      <Skeleton height="1rem" width="120px" />
    </div>
  );
};

/**
 * Skeleton screen for search filter
 */
export const SearchFilterSkeleton: React.FC<SkeletonScreenProps> = ({ className = '' }) => {
  return (
    <div className={className}>
      <Skeleton height="2.5rem" width="300px" />
    </div>
  );
};

/**
 * Skeleton screen for pagination
 */
export const PaginationSkeleton: React.FC<SkeletonScreenProps> = ({ className = '' }) => {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <Skeleton height="1rem" width="150px" />
      <div className="flex items-center space-x-2">
        <Skeleton height="2rem" width="2rem" />
        <Skeleton height="2rem" width="2rem" />
        <Skeleton height="2rem" width="2rem" />
        <Skeleton height="2rem" width="2rem" />
        <Skeleton height="2rem" width="2rem" />
      </div>
    </div>
  );
};