import { useMemo } from 'react';
import { useMsal } from '@azure/msal-react';
import { useSubscriptions } from '../stores/authStore';
import { 
  createTenantAwareSubscriptionService, 
  MSALTokenProvider 
} from '../services/subscriptionService';
import { createVMImagesService } from '../services/vmImagesService';
import type { Subscription } from '../types';

/**
 * Hook that provides tenant-aware services for the currently selected subscription
 * This ensures that API calls are made with the correct tenant context
 */
export function useTenantAwareServices() {
  const { instance, accounts } = useMsal();
  const { subscriptions, selectedSubscription } = useSubscriptions();

  const currentSubscription = useMemo(() => {
    if (!selectedSubscription) return null;
    return subscriptions.find(sub => sub.subscriptionId === selectedSubscription) || null;
  }, [subscriptions, selectedSubscription]);

  const services = useMemo(() => {
    if (!currentSubscription || accounts.length === 0) {
      return null;
    }

    // Create tenant-aware token provider
    const tokenProvider = new MSALTokenProvider(
      instance, 
      accounts[0], 
      currentSubscription.tenantId
    );

    // Create services with tenant-aware token provider
    const subscriptionService = createTenantAwareSubscriptionService(
      instance,
      accounts[0],
      currentSubscription
    );

    const vmImagesService = createVMImagesService(tokenProvider);

    return {
      subscriptionService,
      vmImagesService,
      tokenProvider,
      currentSubscription,
    };
  }, [instance, accounts, currentSubscription]);

  return services;
}

/**
 * Hook that provides a tenant-aware token provider for a specific subscription
 * Useful when you need to make API calls for a subscription different from the currently selected one
 */
export function useTenantAwareTokenProvider(subscription: Subscription | null) {
  const { instance, accounts } = useMsal();

  const tokenProvider = useMemo(() => {
    if (!subscription || accounts.length === 0) {
      return null;
    }

    return new MSALTokenProvider(
      instance,
      accounts[0],
      subscription.tenantId
    );
  }, [instance, accounts, subscription]);

  return tokenProvider;
}