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
  clearTenantData: () => void;
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
          const currentUser = get().user;
          
          // Check if this is a different user (different tenant or user ID)
          const isDifferentUser = !currentUser || 
            currentUser.id !== user.id || 
            currentUser.tenantId !== user.tenantId;
          
          if (isDifferentUser) {
            console.log('Different user/tenant detected, clearing all tenant-specific data', {
              previousUser: currentUser,
              newUser: user,
            });
            
            // Clear all tenant-specific data when switching users/tenants
            set(
              {
                isAuthenticated: true,
                user,
                subscriptions: [], // Clear previous tenant's subscriptions
                selectedSubscription: null, // Clear selected subscription
                locations: [], // Clear previous tenant's locations
                selectedLocation: 'eastus', // Reset to default location
                loading: false,
                error: null,
              },
              false,
              'auth/login/newUser'
            );
            
            // Also clear VM images cache - we'll do this via a callback mechanism
            // The component that handles login should call clearAllTenantData
          } else {
            // Same user, just update authentication state
            set(
              {
                isAuthenticated: true,
                user,
                error: null,
              },
              false,
              'auth/login/sameUser'
            );
          }
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
          const { subscriptions, selectedSubscription: currentSubscription } = get();
          const subscription = subscriptions.find(
            (sub) => sub.subscriptionId === subscriptionId
          );

          if (subscription) {
            // Check if this is a different subscription
            const isDifferentSubscription = currentSubscription !== subscriptionId;
            
            if (isDifferentSubscription) {
              console.log('Different subscription selected, clearing VM images cache', {
                previous: currentSubscription,
                new: subscriptionId,
              });
            }
            
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
          const { selectedLocation: currentLocation } = get();
          const isDifferentLocation = currentLocation !== location;
          
          if (isDifferentLocation) {
            console.log('Different location selected, clearing VM images cache', {
              previous: currentLocation,
              new: location,
            });
          }
          
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

        // Clear all tenant-specific data (subscriptions, locations, etc.)
        clearTenantData: () => {
          set(
            {
              subscriptions: [],
              selectedSubscription: null,
              locations: [],
              selectedLocation: 'eastus',
              error: null,
            },
            false,
            'auth/clearTenantData'
          );
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

// Enhanced subscription selector that also clears VM images cache
export const useSubscriptionSelector = () => {
  const subscriptions = useAuthStore((state) => state.subscriptions);
  const selectedSubscription = useAuthStore(
    (state) => state.selectedSubscription
  );
  const selectSubscriptionBase = useAuthStore((state) => state.selectSubscription);
  
  const selectSubscription = (subscriptionId: string) => {
    const currentSubscription = useAuthStore.getState().selectedSubscription;
    const isDifferentSubscription = currentSubscription !== subscriptionId;
    
    // Select the subscription
    selectSubscriptionBase(subscriptionId);
    
    // Clear VM images cache if switching to a different subscription
    if (isDifferentSubscription) {
      // We'll import this dynamically to avoid circular dependencies
      import('../stores/vmImagesStore').then(({ useVMImagesStore }) => {
        useVMImagesStore.getState().clearAll();
      });
    }
  };

  return {
    subscriptions,
    selectedSubscription,
    selectSubscription,
  };
};

// Enhanced location selector that also clears VM images cache
export const useLocationSelector = () => {
  const locations = useAuthStore((state) => state.locations);
  const selectedLocation = useAuthStore((state) => state.selectedLocation);
  const setLocations = useAuthStore((state) => state.setLocations);
  const selectLocationBase = useAuthStore((state) => state.selectLocation);
  
  const selectLocation = (location: string) => {
    const currentLocation = useAuthStore.getState().selectedLocation;
    const isDifferentLocation = currentLocation !== location;
    
    // Select the location
    selectLocationBase(location);
    
    // Clear VM images cache if switching to a different location
    if (isDifferentLocation) {
      // We'll import this dynamically to avoid circular dependencies
      import('../stores/vmImagesStore').then(({ useVMImagesStore }) => {
        useVMImagesStore.getState().clearAll();
      });
    }
  };

  return {
    locations,
    selectedLocation,
    setLocations,
    selectLocation,
  };
};
