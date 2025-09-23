import React, { useEffect } from 'react';
import { PublishersGrid } from '../components/data-display/PublishersGrid';
import { useVMImagesStore } from '../stores/vmImagesStore';
import { useSubscriptions } from '../stores/authStore';

import { useTenantAwareServices } from '../hooks/useTenantAwareServices';
import { EnhancedPageTransition } from '../components/ui/PageTransition';
import { PublishersGridSkeleton } from '../components/ui/SkeletonScreens';
import { ErrorMessage } from '../components/ui/ErrorMessage';

/**
 * PublishersPage component that displays the list of VM image publishers
 * This is the main landing page after authentication and subscription selection
 */
export const PublishersPage: React.FC = () => {
  const { selectedSubscription, selectedLocation } = useSubscriptions();
  const { setPublishers, setLoading, setError, loading, error } = useVMImagesStore();
  const tenantAwareServices = useTenantAwareServices();
  // Navigation state is now handled by React Router automatically

  useEffect(() => {
    const loadPublishers = async () => {
      if (!selectedSubscription || !selectedLocation || !tenantAwareServices) return;

      // Clear existing data when subscription or location changes
      const { clearAll } = useVMImagesStore.getState();
      clearAll();

      setLoading(true);
      setError(null);

      try {
        // Use tenant-aware VM images service
        const publishers = await tenantAwareServices.vmImagesService.getPublishers(
          selectedSubscription, 
          selectedLocation
        );
        setPublishers(publishers);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load publishers';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadPublishers();
  }, [selectedSubscription, selectedLocation, tenantAwareServices]); // Include tenant-aware services dependency

  return (
    <EnhancedPageTransition
      isLoading={loading}
      error={error}
      loadingComponent={<PublishersGridSkeleton />}
      errorComponent={
        <ErrorMessage
          message={error || 'Failed to load publishers'}
          title="Failed to load publishers"
          onRetry={() => window.location.reload()}
        />
      }
      duration="normal"
      type="fade"
      className="fade-in"
    >
      <PublishersGrid />
    </EnhancedPageTransition>
  );
};