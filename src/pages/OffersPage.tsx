import React, { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { OffersList } from '../components/data-display/OffersList';
import { useVMImagesStore } from '../stores/vmImagesStore';
import { useSubscriptions } from '../stores/authStore';
import { useTenantAwareServices } from '../hooks/useTenantAwareServices';
import { EnhancedPageTransition } from '../components/ui/PageTransition';
import { OffersListSkeleton } from '../components/ui/SkeletonScreens';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { useMsal } from '@azure/msal-react';

/**
 * OffersPage component that displays offers for a selected publisher
 * Route: /publishers/:publisherName/offers
 */
export const OffersPage: React.FC = () => {
  const { publisherName } = useParams<{ publisherName: string }>();
  const { selectedSubscription, selectedLocation } = useSubscriptions();
  const { setOffers, setLoading, setError, loading, error } = useVMImagesStore();
  const tenantAwareServices = useTenantAwareServices();

  // Redirect if no publisher name in URL
  if (!publisherName) {
    return <Navigate to="/publishers" replace />;
  }

  useEffect(() => {
    const loadOffers = async () => {
      if (!selectedSubscription || !selectedLocation || !publisherName || !tenantAwareServices) return;

      const decodedPublisherName = decodeURIComponent(publisherName);
      
      // Clear existing offers when loading new ones
      const { clearOffers } = useVMImagesStore.getState();
      clearOffers();
      
      setLoading(true);
      setError(null);

      try {
        // Use tenant-aware VM images service
        const offers = await tenantAwareServices.vmImagesService.getOffers(
          selectedSubscription, 
          decodedPublisherName, 
          selectedLocation
        );
        setOffers(offers, decodedPublisherName);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load offers';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadOffers();
  }, [selectedSubscription, selectedLocation, publisherName, tenantAwareServices]); // Include tenant-aware services dependency

  return (
    <EnhancedPageTransition
      isLoading={loading}
      error={error}
      loadingComponent={<OffersListSkeleton />}
      errorComponent={
        <ErrorMessage
          message={error || 'Failed to load offers'}
          title="Failed to load offers"
          onRetry={() => window.location.reload()}
        />
      }

      duration="normal"
      type="slide"
      className="fade-in"
    >
      <OffersList />
    </EnhancedPageTransition>
  );
};