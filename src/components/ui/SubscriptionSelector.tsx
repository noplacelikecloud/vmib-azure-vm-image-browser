import React, { useEffect } from 'react';
import { useAuthStore, useSubscriptionSelector } from '../../stores/authStore';
import { createSubscriptionService } from '../../services/subscriptionService';
import { useMsal } from '@azure/msal-react';
import { SearchableDropdown } from './SearchableDropdown';

interface SubscriptionSelectorProps {
  className?: string;
  disabled?: boolean;
}

export const SubscriptionSelector: React.FC<SubscriptionSelectorProps> = ({
  className = '',
  disabled = false,
}) => {
  const { loading, error, setLoading, setError, setSubscriptions } =
    useAuthStore();
  const { subscriptions, selectedSubscription, selectSubscription } =
    useSubscriptionSelector();
  const { instance, accounts, inProgress } = useMsal();

  useEffect(() => {
    const loadSubscriptions = async () => {
      // Add proper null checks for accounts array and MSAL initialization state
      if (subscriptions.length === 0 && accounts && accounts.length > 0 && inProgress === 'none') {
        setLoading(true);
        setError(null);

        try {
          const subscriptionService = createSubscriptionService(
            instance,
            accounts[0]
          );
          const subs = await subscriptionService.getSubscriptions();
          setSubscriptions(subs);
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : 'Failed to load subscriptions';
          setError(errorMessage);
        } finally {
          setLoading(false);
        }
      }
    };

    loadSubscriptions();
  }, [
    subscriptions.length,
    accounts?.length, // Use optional chaining
    inProgress,
    instance,
    setLoading,
    setError,
    setSubscriptions,
  ]); // Include all dependencies

  const handleSubscriptionSelect = (subscriptionId: string) => {
    if (subscriptionId) {
      selectSubscription(subscriptionId);
    }
  };

  const handleRetry = () => {
    setError(null);
    setSubscriptions([]);
    // Force re-fetch by clearing subscriptions
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600">Loading subscriptions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center space-x-2 text-red-600">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm">{error}</span>
        </div>
        <button
          onClick={handleRetry}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className={`text-sm text-gray-600 ${className}`}>
        No subscriptions available. Please ensure you have access to at least
        one Azure subscription.
      </div>
    );
  }

  // Convert subscriptions to dropdown options
  const subscriptionOptions = subscriptions.map((subscription) => ({
    value: subscription.subscriptionId,
    label: subscription.displayName,
    description: subscription.state,
  }));

  return (
    <div className={`space-y-1 ${className}`}>
      <label
        htmlFor="subscription-select"
        className="block text-sm font-medium text-gray-700"
      >
        Azure Subscription
      </label>
      <SearchableDropdown
        options={subscriptionOptions}
        value={selectedSubscription || ''}
        placeholder="Select a subscription..."
        onSelect={handleSubscriptionSelect}
        disabled={disabled || loading}
        searchPlaceholder="Search subscriptions..."
        emptyMessage="No subscriptions found"
        className="w-full"
      />
    </div>
  );
};
