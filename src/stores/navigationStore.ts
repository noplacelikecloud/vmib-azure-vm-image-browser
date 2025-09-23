import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { NavigationLevel, BreadcrumbItem } from '../types';

interface NavigationState {
  currentLevel: NavigationLevel;
  selectedPublisher: string | null;
  selectedOffer: string | null;
  breadcrumb: BreadcrumbItem[];
}

interface NavigationActions {
  // Navigation actions
  navigateToPublishers: () => void;
  navigateToOffers: (publisher: string, publisherDisplayName?: string) => void;
  navigateToSkus: (publisher: string, offer: string, publisherDisplayName?: string, offerDisplayName?: string) => void;
  
  // Direct navigation (for URL routing)
  setCurrentLevel: (level: NavigationLevel) => void;
  setSelectedPublisher: (publisher: string | null) => void;
  setSelectedOffer: (offer: string | null) => void;
  
  // Breadcrumb management
  setBreadcrumb: (breadcrumb: BreadcrumbItem[]) => void;
  updateBreadcrumb: () => void;
  
  // Utility actions
  reset: () => void;
  goBack: () => void;
}

type NavigationStore = NavigationState & NavigationActions;

const initialState: NavigationState = {
  currentLevel: 'publishers',
  selectedPublisher: null,
  selectedOffer: null,
  breadcrumb: [],
};

export const useNavigationStore = create<NavigationStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      navigateToPublishers: () => {
        set(
          {
            currentLevel: 'publishers',
            selectedPublisher: null,
            selectedOffer: null,
          },
          false,
          'navigation/navigateToPublishers'
        );
      },

      navigateToOffers: (publisher: string, publisherDisplayName?: string) => {
        set(
          {
            currentLevel: 'offers',
            selectedPublisher: publisher,
            selectedOffer: null,
          },
          false,
          'navigation/navigateToOffers'
        );
      },

      navigateToSkus: (publisher: string, offer: string, publisherDisplayName?: string, offerDisplayName?: string) => {
        set(
          {
            currentLevel: 'skus',
            selectedPublisher: publisher,
            selectedOffer: offer,
          },
          false,
          'navigation/navigateToSkus'
        );
      },

      setCurrentLevel: (level: NavigationLevel) => {
        set(
          {
            currentLevel: level,
          },
          false,
          'navigation/setCurrentLevel'
        );
      },

      setSelectedPublisher: (publisher: string | null) => {
        set(
          {
            selectedPublisher: publisher,
          },
          false,
          'navigation/setSelectedPublisher'
        );
      },

      setSelectedOffer: (offer: string | null) => {
        set(
          {
            selectedOffer: offer,
          },
          false,
          'navigation/setSelectedOffer'
        );
      },

      setBreadcrumb: (breadcrumb: BreadcrumbItem[]) => {
        set(
          {
            breadcrumb,
          },
          false,
          'navigation/setBreadcrumb'
        );
      },

      updateBreadcrumb: () => {
        const { currentLevel, selectedPublisher, selectedOffer } = get();
        const breadcrumb: BreadcrumbItem[] = [];

        // Always include Publishers as the root
        breadcrumb.push({
          label: 'Publishers',
          level: 'publishers',
          // Don't call navigation functions from breadcrumb to avoid infinite loops
        });

        // Add Offers if we have a selected publisher
        if (selectedPublisher && (currentLevel === 'offers' || currentLevel === 'skus')) {
          breadcrumb.push({
            label: selectedPublisher,
            level: 'offers',
          });
        }

        // Add SKUs if we have a selected offer
        if (selectedPublisher && selectedOffer && currentLevel === 'skus') {
          breadcrumb.push({
            label: selectedOffer,
            level: 'skus',
          });
        }

        set(
          {
            breadcrumb,
          },
          false,
          'navigation/updateBreadcrumb'
        );
      },

      reset: () => {
        set(
          {
            ...initialState,
          },
          false,
          'navigation/reset'
        );
      },

      goBack: () => {
        const { currentLevel, selectedPublisher, selectedOffer } = get();
        
        switch (currentLevel) {
          case 'skus':
            if (selectedPublisher) {
              get().navigateToOffers(selectedPublisher);
            } else {
              get().navigateToPublishers();
            }
            break;
          case 'offers':
            get().navigateToPublishers();
            break;
          case 'publishers':
            // Already at root level, nothing to do
            break;
        }
      },
    }),
    {
      name: 'navigation-store',
    }
  )
);

// Selectors for common use cases
export const useCurrentNavigation = () => {
  const currentLevel = useNavigationStore((state) => state.currentLevel);
  const selectedPublisher = useNavigationStore((state) => state.selectedPublisher);
  const selectedOffer = useNavigationStore((state) => state.selectedOffer);
  
  return { currentLevel, selectedPublisher, selectedOffer };
};

export const useBreadcrumb = () => {
  const breadcrumb = useNavigationStore((state) => state.breadcrumb);
  const updateBreadcrumb = useNavigationStore((state) => state.updateBreadcrumb);
  
  return { breadcrumb, updateBreadcrumb };
};

export const useNavigationActions = () => {
  const navigateToPublishers = useNavigationStore((state) => state.navigateToPublishers);
  const navigateToOffers = useNavigationStore((state) => state.navigateToOffers);
  const navigateToSkus = useNavigationStore((state) => state.navigateToSkus);
  const goBack = useNavigationStore((state) => state.goBack);
  
  return { navigateToPublishers, navigateToOffers, navigateToSkus, goBack };
};