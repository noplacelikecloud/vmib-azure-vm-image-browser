import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useVMImagesStore } from '../../stores/vmImagesStore';
import { BackButton } from '../ui/BackButton';

import { ErrorMessage } from '../ui/ErrorMessage';
import { SearchFilter } from '../ui/SearchFilter';
import { Pagination } from '../ui/Pagination';
import { OffersListSkeleton } from '../ui/SkeletonScreens';
import { PageTransition, StaggeredAnimation, HoverTransition } from '../ui/PageTransition';
import { Card, Stack } from '../layout';
import type { Offer } from '../../types';

interface OffersListProps {
  className?: string;
}

interface OfferItemProps {
  offer: Offer;
  onClick: (offer: Offer) => void;
}

const OfferItem: React.FC<OfferItemProps> = ({ offer, onClick }) => {
  return (
    <HoverTransition hoverShadow hoverBorder>
      <Card
        variant="default"
        padding="md"
        clickable
        onClick={() => onClick(offer)}
        aria-label={`View SKUs for ${offer.displayName}`}
      >
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
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 truncate">
              {offer.displayName}
            </h3>
            <Stack direction="vertical" spacing="xs">
              <p className="text-xs sm:text-sm text-gray-600">
                <span className="font-medium">Name:</span> {offer.name}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                <span className="font-medium">Publisher:</span> {offer.publisher}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                <span className="font-medium">Location:</span> {offer.location}
              </p>
            </Stack>
          </div>
          
          <div className="flex-shrink-0 w-full sm:w-auto">
            <div className="flex items-center justify-center sm:justify-end text-blue-600 text-xs sm:text-sm font-medium">
              View SKUs
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

export const OffersList: React.FC<OffersListProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const { publisherName } = useParams<{ publisherName: string }>();
  
  // Get individual state pieces to avoid object recreation
  const allOffers = useVMImagesStore((state) => state.offers);
  const filteredOffers = useVMImagesStore((state) => state.filteredOffers);
  const loading = useVMImagesStore((state) => state.loading);
  const error = useVMImagesStore((state) => state.error);
  const loadedFor = useVMImagesStore((state) => state.loadedOffers);
  const searchQuery = useVMImagesStore((state) => state.searchQuery);
  const paginationState = useVMImagesStore((state) => state.pagination.offers);
  const setSearchQuery = useVMImagesStore((state) => state.setOffersSearch);
  const setOffersPage = useVMImagesStore((state) => state.setOffersPage);
  const clearSearch = useVMImagesStore((state) => state.clearSearch);
  
  // Clear search when component mounts (when navigating to offers)
  React.useEffect(() => {
    clearSearch();
  }, []); // Only run on mount
  
  // Memoize computed values
  const paginatedData = useMemo(() => {
    const { currentPage, itemsPerPage } = paginationState;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const offers = filteredOffers.slice(startIndex, endIndex);
    
    return {
      offers,
      pagination: {
        currentPage,
        itemsPerPage,
        totalItems: filteredOffers.length,
        totalPages: Math.ceil(filteredOffers.length / itemsPerPage),
      },
    };
  }, [filteredOffers, paginationState]);
  
  const { offers, pagination } = paginatedData;

  const handleOfferClick = (offer: Offer) => {
    if (publisherName) {
      navigate(`/publishers/${publisherName}/offers/${encodeURIComponent(offer.name)}/skus`);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Reset to first page when searching
    setOffersPage(1);
  };

  const handlePageChange = (page: number) => {
    setOffersPage(page);
  };

  if (loading) {
    return (
      <PageTransition isLoading={loading} className={className}>
        <OffersListSkeleton />
      </PageTransition>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <ErrorMessage
          message={error}
          title="Failed to load offers"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (loadedFor && allOffers.length === 0) {
    return (
      <div className={className}>
        <Stack direction="vertical" spacing="lg">
          {/* Header */}
          <div>
            <div className="flex items-center gap-4 mb-4">
              <BackButton to="/publishers" label="Back to Publishers" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Offers for {loadedFor.publisher}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Select an offer to view its available SKUs
            </p>
          </div>
          
          {/* Search Filter - Always show when data is loaded */}
          <SearchFilter
            placeholder="Search offers..."
            value={searchQuery}
            onSearch={handleSearch}
            className="max-w-md"
          />
          
          {/* No Offers Found Message */}
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Offers Found</h3>
              <p className="text-gray-600">
                No offers are available for the selected publisher.
              </p>
            </div>
          </div>
        </Stack>
      </div>
    );
  }

  if (!loadedFor) {
    return (
      <div className={`text-center py-12 ${className}`}>
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
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Publisher</h3>
          <p className="text-gray-600">
            Please select a publisher to view their available offers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Stack direction="vertical" spacing="lg">
        {/* Header */}
        <div>
          <div className="flex items-center gap-4 mb-4">
            <BackButton to="/publishers" label="Back to Publishers" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Offers for {loadedFor.publisher}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Select an offer to view its available SKUs
          </p>
        </div>
        
        {/* Search Filter - Always show when data is loaded */}
        {loadedFor && (
          <SearchFilter
            placeholder="Search offers..."
            value={searchQuery}
            onSearch={handleSearch}
            className="max-w-md"
          />
        )}
        
        {/* Offers List */}
        <PageTransition transitionKey={`offers-${offers.length}`}>
          <StaggeredAnimation staggerDelay={75}>
            <Stack direction="vertical" spacing="md" className="min-h-[200px]">
              {offers.map((offer) => (
                <OfferItem
                  key={`${offer.publisher}-${offer.name}`}
                  offer={offer}
                  onClick={handleOfferClick}
                />
              ))}
            </Stack>
          </StaggeredAnimation>
        </PageTransition>
        
        {/* Pagination */}
        {loadedFor && filteredOffers.length > 0 && (
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
        {loadedFor && allOffers.length > 0 && filteredOffers.length === 0 && searchQuery && (
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
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Offers Found</h3>
              <p className="text-sm sm:text-base text-gray-600 px-4">
                No offers match your search for "{searchQuery}". Try a different search term.
              </p>
            </div>
          </div>
        )}
      </Stack>
    </div>
  );
};