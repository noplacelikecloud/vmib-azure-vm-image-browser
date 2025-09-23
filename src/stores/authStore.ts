import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Subscription, AzureLocation } from '../types';

interface User {
  id: string;
  name?: string;
  email?: string;
  tenantId?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  subscriptions: Subscription[];
  selectedSubscription: string | null;
  locations: AzureLocation[];
  selectedLocation: string;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (user: User) => void;
  logout: () => void;
  setSubscriptions: (subscriptions: Subscription[]) => void;
  selectSubscription: (subscriptionId: string) => void;
  setLocations: (locations: AzureLocation[]) => void;
  selectLocation: (location: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  validateAndFixStoredData: () => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  subscriptions: [],
  selectedSubscription: null,
  locations: [],
  selectedLocation: 'eastus', // Default to East US
  loading: false,
  error: null,
};

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        login: (user: User) => {
          set(
            {
              isAuthenticated: true,
              user,
              error: null,
            },
            false,
            'auth/login'
          );
        },

        logout: () => {
          set(
            {
              ...initialState,
            },
            false,
            'auth/logout'
          );
        },

        setSubscriptions: (subscriptions: Subscription[]) => {
          set(
            {
              subscriptions,
              // Auto-select first subscription if none selected
              selectedSubscription:
                get().selectedSubscription ||
                (subscriptions.length > 0
                  ? subscriptions[0].subscriptionId
                  : null),
              error: null,
            },
            false,
            'auth/setSubscriptions'
          );
        },

        selectSubscription: (subscriptionId: string) => {
          const { subscriptions } = get();
          const subscription = subscriptions.find(
            (sub) => sub.subscriptionId === subscriptionId
          );

          if (subscription) {
            set(
              {
                selectedSubscription: subscriptionId,
                error: null,
              },
              false,
              'auth/selectSubscription'
            );
          } else {
            set(
              {
                error: `Subscription with ID ${subscriptionId} not found`,
              },
              false,
              'auth/selectSubscription/error'
            );
          }
        },

        setLocations: (locations: AzureLocation[]) => {
          set(
            {
              locations,
              // Auto-select first location if none selected and locations available
              selectedLocation:
                get().selectedLocation ||
                (locations.length > 0 ? locations[0].name : 'eastus'),
              error: null,
            },
            false,
            'auth/setLocations'
          );
        },

        selectLocation: (location: string) => {
          // Location validation is handled by the API - only valid locations are provided
          set(
            {
              selectedLocation: location,
              error: null,
            },
            false,
            'auth/selectLocation'
          );
        },

        setLoading: (loading: boolean) => {
          set(
            {
              loading,
            },
            false,
            'auth/setLoading'
          );
        },

        setError: (error: string | null) => {
          set(
            {
              error,
            },
            false,
            'auth/setError'
          );
        },

        clearError: () => {
          set(
            {
              error: null,
            },
            false,
            'auth/clearError'
          );
        },

        // Cleanup function to fix invalid stored data
        validateAndFixStoredData: () => {
          const state = get();
          const { locations } = state;

          // If we have locations loaded and the selected location is not in the list, reset to first available or eastus
          if (locations.length > 0) {
            const isValidLocation = locations.some(
              (loc) => loc.name === state.selectedLocation
            );
            if (!isValidLocation) {
              const fallbackLocation = locations[0]?.name || 'eastus';
              console.warn(
                `Fixing invalid stored location "${state.selectedLocation}" to "${fallbackLocation}"`
              );
              set(
                {
                  selectedLocation: fallbackLocation,
                },
                false,
                'auth/validateAndFixStoredData'
              );
            }
          }
        },
      }),
      {
        name: 'auth-store',
        // Only persist certain fields, not sensitive data like user info
        partialize: (state) => ({
          selectedSubscription: state.selectedSubscription,
          selectedLocation: state.selectedLocation,
          subscriptions: state.subscriptions,
          locations: state.locations,
        }),
      }
    ),
    {
      name: 'auth-store-devtools',
    }
  )
);

// Selectors for common use cases
export const useAuth = () =>
  useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    loading: state.loading,
    error: state.error,
  }));

export const useSubscriptions = () => {
  const subscriptions = useAuthStore((state) => state.subscriptions);
  const selectedSubscription = useAuthStore(
    (state) => state.selectedSubscription
  );
  const selectSubscription = useAuthStore((state) => state.selectSubscription);
  const locations = useAuthStore((state) => state.locations);
  const selectedLocation = useAuthStore((state) => state.selectedLocation);
  const setLocations = useAuthStore((state) => state.setLocations);
  const selectLocation = useAuthStore((state) => state.selectLocation);

  return {
    subscriptions,
    selectedSubscription,
    selectSubscription,
    locations,
    selectedLocation,
    setLocations,
    selectLocation,
  };
};
