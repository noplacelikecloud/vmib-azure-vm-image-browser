import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useVMImagesStore } from '../../stores/vmImagesStore';
import { BackButton } from '../ui/BackButton';
import { useTenantAwareServices } from '../../hooks/useTenantAwareServices';
import { useSubscriptions } from '../../stores/authStore';
import { useMsal } from '@azure/msal-react';

import { ErrorMessage } from '../ui/ErrorMessage';
import { SearchFilter } from '../ui/SearchFilter';
import { Pagination } from '../ui/Pagination';
import { CopyButton } from '../ui/CopyButton';
import { SKUsDetailsSkeleton } from '../ui/SkeletonScreens';
import { PageTransition, StaggeredAnimation, HoverTransition } from '../ui/PageTransition';
import { ResponsiveGrid, Card, Stack } from '../layout';
import { SKUVersionsModal } from './SKUVersionsModal';
import type { SKU } from '../../types';

interface SKUsDetailsProps {
  className?: string;
}

interface SKUCardProps {
  sku: SKU;
  onViewVersions: (sku: SKU) => void;
}

const SKUCard: React.FC<SKUCardProps> = ({ sku, onViewVersions }) => {
  const handleViewVersions = () => {
    onViewVersions(sku);
  };

  const hasVersions = sku.versions && sku.versions.length > 0;
  const versionCount = hasVersions ? sku.versions!.length : 0;

  return (
    <HoverTransition hoverShadow hoverBorder>
      <Card variant="default" padding="md" className="h-full">
        <Stack direction="vertical" spacing="md" className="h-full">
          {/* Header */}
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
              {sku.displayName}
            </h3>
            <Stack direction="vertical" spacing="xs">
              <p className="text-xs sm:text-sm text-gray-600">
                <span className="font-medium">SKU Name:</span> {sku.name}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                <span className="font-medium">Publisher:</span> {sku.publisher}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                <span className="font-medium">Offer:</span> {sku.offer}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                <span className="font-medium">Location:</span> {sku.location}
              </p>
            </Stack>
          </div>

          {/* Versions Section */}
          <div className="flex-1">
            <button
              onClick={handleViewVersions}
              className="flex items-center justify-between w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-150 group"
            >
              <div>
                <h4 className="text-base sm:text-lg font-medium text-gray-900 group-hover:text-blue-900">
                  Available Versions
                </h4>
                <p className="text-xs sm:text-sm text-gray-500 group-hover:text-blue-700">
                  {hasVersions 
                    ? `${versionCount} version${versionCount !== 1 ? 's' : ''} available`
                    : 'Click to load versions'
                  }
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {hasVersions && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {versionCount}
                  </span>
                )}
                <svg
                  className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors duration-150"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </div>
            </button>
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
              <div className="text-xs sm:text-sm text-gray-600">
                Ready for Infrastructure as Code
              </div>
              {hasVersions && (
                <CopyButton 
                  imageReference={{
                    publisher: sku.publisher,
                    offer: sku.offer,
                    sku: sku.name,
                    version: sku.versions![0] // Use first version as default
                  }}
                  className="w-full sm:w-auto"
                />
              )}
            </Stack>
          </div>
        </Stack>
      </Card>
    </HoverTransition>
  );
};

export const SKUsDetails: React.FC<SKUsDetailsProps> = ({ className = '' }) => {
  const { publisherName, offerName } = useParams<{ publisherName: string; offerName: string }>();
  const { selectedSubscription, selectedLocation } = useSubscriptions();
  const tenantAwareServices = useTenantAwareServices();
  
  // Modal state
  const [selectedSku, setSelectedSku] = useState<SKU | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Get individual state pieces to avoid object recreation
  const allSkus = useVMImagesStore((state) => state.skus);
  const filteredSkus = useVMImagesStore((state) => state.filteredSkus);
  const loading = useVMImagesStore((state) => state.loading);
  const error = useVMImagesStore((state) => state.error);
  const loadedFor = useVMImagesStore((state) => state.loadedSkus);
  const searchQuery = useVMImagesStore((state) => state.searchQuery);
  const paginationState = useVMImagesStore((state) => state.pagination.skus);
  const setSearchQuery = useVMImagesStore((state) => state.setSkusSearch);
  const setSkusPage = useVMImagesStore((state) => state.setSkusPage);
  const clearSearch = useVMImagesStore((state) => state.clearSearch);
  
  // Clear search when component mounts (when navigating to SKUs)
  React.useEffect(() => {
    clearSearch();
  }, []); // Only run on mount
  
  // Decode URL parameters
  const decodedPublisherName = publisherName ? decodeURIComponent(publisherName) : null;
  const decodedOfferName = offerName ? decodeURIComponent(offerName) : null;

  // Function to load versions on demand
  const handleLoadVersions = async (sku: SKU): Promise<string[]> => {
    console.log('handleLoadVersions called with:', {
      sku,
      selectedSubscription,
      selectedLocation,
      accountsLength: accounts.length
    });

    if (!selectedSubscription || !selectedLocation || !tenantAwareServices) {
      throw new Error('Missing authentication or subscription information');
    }
    
    console.log('Calling getSKUVersions with:', {
      subscriptionId: selectedSubscription,
      publisher: sku.publisher,
      offer: sku.offer,
      skuName: sku.name,
      location: selectedLocation
    });

    return await tenantAwareServices.vmImagesService.getSKUVersions(
      selectedSubscription,
      sku.publisher,
      sku.offer,
      sku.name,
      selectedLocation
    );
  };

  // Handle opening the versions modal
  const handleViewVersions = (sku: SKU) => {
    setSelectedSku(sku);
    setIsModalOpen(true);
  };

  // Handle closing the modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSku(null);
  };
  
  // Memoize computed values
  const paginatedData = useMemo(() => {
    const { currentPage = 1, itemsPerPage = 8 } = paginationState || {};
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const skus = filteredSkus.slice(startIndex, endIndex);
    
    return {
      skus,
      pagination: {
        currentPage,
        itemsPerPage,
        totalItems: filteredSkus.length,
        totalPages: Math.ceil(filteredSkus.length / itemsPerPage),
      },
    };
  }, [filteredSkus, paginationState]);
  
  const { skus, pagination } = paginatedData;

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Reset to first page when searching
    setSkusPage(1);
  };

  const handlePageChange = (page: number) => {
    setSkusPage(page);
  };

  if (loading) {
    return (
      <PageTransition isLoading={loading} className={className}>
        <SKUsDetailsSkeleton />
      </PageTransition>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <ErrorMessage
          message={error}
          title="Failed to load SKUs"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  // Only show "No SKUs Found" if we have no data at all, not just empty filtered results
  if (loadedFor && allSkus.length === 0) {
    return (
      <div className={className}>
        <Stack direction="vertical" spacing="lg">
          {/* Header with Back Button - Always show */}
          <div>
            <div className="flex items-center gap-4 mb-4">
              <BackButton 
                to={`/publishers/${publisherName}/offers`} 
                label="Back to Offers" 
              />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              SKUs for {decodedOfferName}
            </h2>
            <Stack direction="vertical" spacing="xs" className="mt-2">
              <p className="text-sm sm:text-base text-gray-600">
                <span className="font-medium">Publisher:</span> {decodedPublisherName}
              </p>
              <p className="text-sm sm:text-base text-gray-600">
                Available SKUs and their versions for Infrastructure as Code deployment
              </p>
            </Stack>
          </div>
          
          {/* Search Filter - Always show when data is loaded */}
          <SearchFilter
            placeholder="Search SKUs..."
            value={searchQuery}
            onSearch={handleSearch}
            className="max-w-md"
          />
          
          {/* No SKUs Found Message */}
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">No SKUs Found</h3>
              <p className="text-gray-600">
                No SKUs are available for the selected offer.
              </p>
            </div>
          </div>
        </Stack>
      </div>
    );
  }

  // Show error message if URL parameters are missing
  if (!decodedPublisherName || !decodedOfferName) {
    return (
      <div className={className}>
        <div className="flex items-center gap-4 mb-4">
          <BackButton 
            to="/publishers" 
            label="Back to Publishers" 
          />
        </div>
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
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Invalid URL</h3>
            <p className="text-gray-600">
              Please navigate to this page through the proper publisher and offer selection.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Stack direction="vertical" spacing="lg">
        {/* Header with Back Button - Always show */}
        <div>
          <div className="flex items-center gap-4 mb-4">
            <BackButton 
              to={`/publishers/${publisherName}/offers`} 
              label="Back to Offers" 
            />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            SKUs for {decodedOfferName}
          </h2>
          <Stack direction="vertical" spacing="xs" className="mt-2">
            <p className="text-sm sm:text-base text-gray-600">
              <span className="font-medium">Publisher:</span> {decodedPublisherName}
            </p>
            <p className="text-sm sm:text-base text-gray-600">
              Available SKUs and their versions for Infrastructure as Code deployment
            </p>
          </Stack>
        </div>
        
        {/* Search Filter - Always show when data is loaded */}
        {loadedFor && (
          <SearchFilter
            placeholder="Search SKUs..."
            value={searchQuery}
            onSearch={handleSearch}
            className="max-w-md"
          />
        )}
        
        {/* SKUs Grid */}
        <PageTransition transitionKey={`skus-${skus.length}`}>
          <StaggeredAnimation staggerDelay={100}>
            <ResponsiveGrid
              cols={{ xs: 1, sm: 1, md: 1, lg: 2, xl: 2, '2xl': 3 }}
              gap="lg"
              className="min-h-[200px]"
            >
              {skus.map((sku) => (
                <SKUCard
                  key={`${sku.publisher}-${sku.offer}-${sku.name}`}
                  sku={sku}
                  onViewVersions={handleViewVersions}
                />
              ))}
            </ResponsiveGrid>
          </StaggeredAnimation>
        </PageTransition>
        
        {/* Pagination */}
        {loadedFor && filteredSkus.length > 0 && (
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
        {loadedFor && allSkus.length > 0 && filteredSkus.length === 0 && searchQuery && (
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
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No SKUs Found</h3>
              <p className="text-sm sm:text-base text-gray-600 px-4">
                No SKUs match your search for "{searchQuery}". Try a different search term.
              </p>
            </div>
          </div>
        )}
      </Stack>

      {/* SKU Versions Modal */}
      <SKUVersionsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        sku={selectedSku}
        onLoadVersions={handleLoadVersions}
      />
    </div>
  );
};