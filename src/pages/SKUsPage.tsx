import React, { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { SKUsDetails } from '../components/data-display/SKUsDetails';
import { useVMImagesStore } from '../stores/vmImagesStore';
import { useSubscriptions } from '../stores/authStore';
import { useTenantAwareServices } from '../hooks/useTenantAwareServices';
import { EnhancedPageTransition } from '../components/ui/PageTransition';
import { SKUsDetailsSkeleton } from '../components/ui/SkeletonScreens';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { useMsal } from '@azure/msal-react';

/**
 * SKUsPage component that displays SKUs for a selected offer
 * Route: /publishers/:publisherName/offers/:offerName/skus
 */
export const SKUsPage: React.FC = () => {
  const { publisherName, offerName } = useParams<{ publisherName: string; offerName: string }>();
  const { selectedSubscription, selectedLocation } = useSubscriptions();
  const { setSkus, setLoading, setError, loading, error } = useVMImagesStore();
  const tenantAwareServices = useTenantAwareServices();

  // Redirect if no publisher or offer name in URL
  if (!publisherName || !offerName) {
    return <Navigate to="/publishers" replace />;
  }

  useEffect(() => {
    const loadSkus = async () => {
      if (!selectedSubscription || !selectedLocation || !publisherName || !offerName || !tenantAwareServices) return;

      const decodedPublisherName = decodeURIComponent(publisherName);
      const decodedOfferName = decodeURIComponent(offerName);
      
      setLoading(true);
      setError(null);

      try {
        // Use tenant-aware VM images service
        const skus = await tenantAwareServices.vmImagesService.getSKUs(
          selectedSubscription, 
          decodedPublisherName, 
          decodedOfferName, 
          selectedLocation
        );
        setSkus(skus, decodedPublisherName, decodedOfferName);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load SKUs';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadSkus();
  }, [selectedSubscription, selectedLocation, publisherName, offerName, tenantAwareServices]); // Include tenant-aware services dependency

  return (
    <EnhancedPageTransition
      isLoading={loading}
      error={error}
      loadingComponent={<SKUsDetailsSkeleton />}
      errorComponent={
        <ErrorMessage
          message={error || 'Failed to load SKUs'}
          title="Failed to load SKUs"
          onRetry={() => window.location.reload()}
        />
      }

      duration="normal"
      type="scale"
      className="fade-in"
    >
      <SKUsDetails />
    </EnhancedPageTransition>
  );
};