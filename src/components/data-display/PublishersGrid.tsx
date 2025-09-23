import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVMImagesStore } from '../../stores/vmImagesStore';

import { ErrorMessage } from '../ui/ErrorMessage';
import { SearchFilter } from '../ui/SearchFilter';
import { Pagination } from '../ui/Pagination';
import { PublishersGridSkeleton } from '../ui/SkeletonScreens';
import { PageTransition, StaggeredAnimation, HoverTransition } from '../ui/PageTransition';
import { ResponsiveGrid, Card, Stack } from '../layout';
import type { Publisher } from '../../types';

interface PublishersGridProps {
  className?: string;
}

interface PublisherCardProps {
  publisher: Publisher;
  onClick: (publisher: Publisher) => void;
}

const PublisherCard: React.FC<PublisherCardProps> = ({ publisher, onClick }) => {
  return (
    <HoverTransition hoverScale hoverShadow hoverBorder>
      <Card
        variant="default"
        padding="md"
        clickable
        onClick={() => onClick(publisher)}
        className="h-full"
        aria-label={`View offers for ${publisher.displayName}`}
      >
        <Stack direction="vertical" spacing="sm" className="h-full">
          <div className="flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
              {publisher.displayName}
            </h3>
            <Stack direction="vertical" spacing="xs">
              <p className="text-xs sm:text-sm text-gray-600">
                <span className="font-medium">Name:</span> {publisher.name}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                <span className="font-medium">Location:</span> {publisher.location}
              </p>
            </Stack>
          </div>
          
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center text-blue-600 text-xs sm:text-sm font-medium">
              View Offers
              <svg
                className="ml-1 w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-200 group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </Stack>
      </Card>
    </HoverTransition>
  );
};

export const PublishersGrid: React.FC<PublishersGridProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  
  // Get individual state pieces to avoid object recreation
  const allPublishers = useVMImagesStore((state) => state.publishers);
  const filteredPublishers = useVMImagesStore((state) => state.filteredPublishers);
  const loading = useVMImagesStore((state) => state.loading);
  const error = useVMImagesStore((state) => state.error);
  const loaded = useVMImagesStore((state) => state.loadedPublishers);
  const searchQuery = useVMImagesStore((state) => state.searchQuery);
  const paginationState = useVMImagesStore((state) => state.pagination.publishers);
  const setSearchQuery = useVMImagesStore((state) => state.setPublishersSearch);
  const setPublishersPage = useVMImagesStore((state) => state.setPublishersPage);
  const clearSearch = useVMImagesStore((state) => state.clearSearch);
  
  // Clear search when component mounts (when navigating to publishers)
  React.useEffect(() => {
    clearSearch();
  }, []); // Only run on mount
  
  // Memoize computed values
  const paginatedData = useMemo(() => {
    const { currentPage, itemsPerPage } = paginationState;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const publishers = filteredPublishers.slice(startIndex, endIndex);
    
    return {
      publishers,
      pagination: {
        currentPage,
        itemsPerPage,
        totalItems: filteredPublishers.length,
        totalPages: Math.ceil(filteredPublishers.length / itemsPerPage),
      },
    };
  }, [filteredPublishers, paginationState]);
  
  const { publishers, pagination } = paginatedData;

  const handlePublisherClick = useCallback((publisher: Publisher) => {
    navigate(`/publishers/${encodeURIComponent(publisher.name)}/offers`);
  }, [navigate]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Reset to first page when searching
    setPublishersPage(1);
  };

  const handlePageChange = (page: number) => {
    setPublishersPage(page);
  };

  if (loading) {
    return (
      <PageTransition isLoading={loading} className={className}>
        <PublishersGridSkeleton />
      </PageTransition>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <ErrorMessage
          message={error}
          title="Failed to load publishers"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (loaded && allPublishers.length === 0) {
    return (
      <div className={className}>
        <Stack direction="vertical" spacing="lg">
          {/* Header */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">VM Image Publishers</h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Select a publisher to view their available offers
            </p>
          </div>
          
          {/* Search Filter - Always show when data is loaded */}
          <SearchFilter
            placeholder="Search publishers..."
            value={searchQuery}
            onSearch={handleSearch}
            className="max-w-md"
          />
          
          {/* No Publishers Found Message */}
          <div className={`text-center py-12`}>
            <div className="text-gray-500">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4m0 0l-4-4m4 4V3"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Publishers Found</h3>
              <p className="text-gray-600">
                No VM image publishers are available for the selected subscription.
              </p>
            </div>
          </div>
        </Stack>
      </div>
    );
  }

  return (
    <div className={className}>
      <Stack direction="vertical" spacing="lg">
        {/* Header */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">VM Image Publishers</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Select a publisher to view their available offers
          </p>
        </div>
        
        {/* Search Filter - Always show when data is loaded */}
        {loaded && (
          <SearchFilter
            placeholder="Search publishers..."
            value={searchQuery}
            onSearch={handleSearch}
            className="max-w-md"
          />
        )}
        
        {/* Publishers Grid */}
        <PageTransition transitionKey={`publishers-${publishers.length}`}>
          <StaggeredAnimation staggerDelay={50}>
            <ResponsiveGrid
              cols={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 4, '2xl': 5 }}
              gap="md"
              className="min-h-[200px]"
            >
              {publishers.map((publisher) => (
                <PublisherCard
                  key={publisher.name}
                  publisher={publisher}
                  onClick={handlePublisherClick}
                />
              ))}
            </ResponsiveGrid>
          </StaggeredAnimation>
        </PageTransition>
        
        {/* Pagination */}
        {loaded && filteredPublishers.length > 0 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={pagination.itemsPerPage}
            totalItems={pagination.totalItems}
            showInfo={true}
          />
        )}
        
        {/* No Results Message */}
        {loaded && allPublishers.length > 0 && filteredPublishers.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <div className="text-gray-500 max-w-md mx-auto">
              <svg
                className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Publishers Found</h3>
              <p className="text-sm sm:text-base text-gray-600 px-4">
                No publishers match your search for "{searchQuery}". Try a different search term.
              </p>
            </div>
          </div>
        )}
      </Stack>
    </div>
  );
};