import { describe, it, expect, beforeEach } from 'vitest';
import { useNavigationStore, useCurrentNavigation, useBreadcrumb, useNavigationActions } from '../navigationStore';
import type { NavigationLevel, BreadcrumbItem } from '../../types';

describe('NavigationStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useNavigationStore.getState().reset();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useNavigationStore.getState();
      
      expect(state.currentLevel).toBe('publishers');
      expect(state.selectedPublisher).toBeNull();
      expect(state.selectedOffer).toBeNull();
      expect(state.breadcrumb).toEqual([]);
    });
  });

  describe('Navigation Actions', () => {
    it('should navigate to publishers', () => {
      const { navigateToOffers, navigateToPublishers } = useNavigationStore.getState();
      
      // First navigate to offers to have something to navigate back from
      navigateToOffers('microsoft');
      expect(useNavigationStore.getState().currentLevel).toBe('offers');
      
      // Then navigate back to publishers
      navigateToPublishers();
      
      const state = useNavigationStore.getState();
      expect(state.currentLevel).toBe('publishers');
      expect(state.selectedPublisher).toBeNull();
      expect(state.selectedOffer).toBeNull();
      expect(state.breadcrumb).toEqual([
        {
          label: 'Publishers',
          level: 'publishers',
          onClick: expect.any(Function),
        },
      ]);
    });

    it('should navigate to offers', () => {
      const { navigateToOffers } = useNavigationStore.getState();
      
      navigateToOffers('microsoft', 'Microsoft');
      
      const state = useNavigationStore.getState();
      expect(state.currentLevel).toBe('offers');
      expect(state.selectedPublisher).toBe('microsoft');
      expect(state.selectedOffer).toBeNull();
      expect(state.breadcrumb).toEqual([
        {
          label: 'Publishers',
          level: 'publishers',
          onClick: expect.any(Function),
        },
        {
          label: 'microsoft',
          level: 'offers',
          onClick: expect.any(Function),
        },
      ]);
    });

    it('should navigate to SKUs', () => {
      const { navigateToSkus } = useNavigationStore.getState();
      
      navigateToSkus('microsoft', 'windows-server', 'Microsoft', 'Windows Server');
      
      const state = useNavigationStore.getState();
      expect(state.currentLevel).toBe('skus');
      expect(state.selectedPublisher).toBe('microsoft');
      expect(state.selectedOffer).toBe('windows-server');
      expect(state.breadcrumb).toEqual([
        {
          label: 'Publishers',
          level: 'publishers',
          onClick: expect.any(Function),
        },
        {
          label: 'microsoft',
          level: 'offers',
          onClick: expect.any(Function),
        },
        {
          label: 'windows-server',
          level: 'skus',
          onClick: expect.any(Function),
        },
      ]);
    });

    it('should clear selected offer when navigating to offers', () => {
      const { navigateToSkus, navigateToOffers } = useNavigationStore.getState();
      
      // First navigate to SKUs
      navigateToSkus('microsoft', 'windows-server');
      expect(useNavigationStore.getState().selectedOffer).toBe('windows-server');
      
      // Then navigate back to offers - should clear selected offer
      navigateToOffers('microsoft');
      
      const state = useNavigationStore.getState();
      expect(state.currentLevel).toBe('offers');
      expect(state.selectedPublisher).toBe('microsoft');
      expect(state.selectedOffer).toBeNull();
    });
  });

  describe('Direct Navigation Setters', () => {
    it('should set current level', () => {
      const { setCurrentLevel } = useNavigationStore.getState();
      
      setCurrentLevel('offers');
      expect(useNavigationStore.getState().currentLevel).toBe('offers');
      
      setCurrentLevel('skus');
      expect(useNavigationStore.getState().currentLevel).toBe('skus');
    });

    it('should set selected publisher', () => {
      const { setSelectedPublisher } = useNavigationStore.getState();
      
      setSelectedPublisher('microsoft');
      expect(useNavigationStore.getState().selectedPublisher).toBe('microsoft');
      
      setSelectedPublisher(null);
      expect(useNavigationStore.getState().selectedPublisher).toBeNull();
    });

    it('should set selected offer', () => {
      const { setSelectedOffer } = useNavigationStore.getState();
      
      setSelectedOffer('windows-server');
      expect(useNavigationStore.getState().selectedOffer).toBe('windows-server');
      
      setSelectedOffer(null);
      expect(useNavigationStore.getState().selectedOffer).toBeNull();
    });
  });

  describe('Breadcrumb Management', () => {
    it('should set custom breadcrumb', () => {
      const { setBreadcrumb } = useNavigationStore.getState();
      
      const customBreadcrumb: BreadcrumbItem[] = [
        { label: 'Custom', level: 'publishers' },
        { label: 'Breadcrumb', level: 'offers' },
      ];
      
      setBreadcrumb(customBreadcrumb);
      expect(useNavigationStore.getState().breadcrumb).toEqual(customBreadcrumb);
    });

    it('should update breadcrumb for publishers level', () => {
      const { setCurrentLevel, updateBreadcrumb } = useNavigationStore.getState();
      
      setCurrentLevel('publishers');
      updateBreadcrumb();
      
      expect(useNavigationStore.getState().breadcrumb).toEqual([
        {
          label: 'Publishers',
          level: 'publishers',
          onClick: expect.any(Function),
        },
      ]);
    });

    it('should update breadcrumb for offers level', () => {
      const { setCurrentLevel, setSelectedPublisher, updateBreadcrumb } = useNavigationStore.getState();
      
      setCurrentLevel('offers');
      setSelectedPublisher('microsoft');
      updateBreadcrumb();
      
      expect(useNavigationStore.getState().breadcrumb).toEqual([
        {
          label: 'Publishers',
          level: 'publishers',
          onClick: expect.any(Function),
        },
        {
          label: 'microsoft',
          level: 'offers',
          onClick: expect.any(Function),
        },
      ]);
    });

    it('should update breadcrumb for SKUs level', () => {
      const { setCurrentLevel, setSelectedPublisher, setSelectedOffer, updateBreadcrumb } = useNavigationStore.getState();
      
      setCurrentLevel('skus');
      setSelectedPublisher('microsoft');
      setSelectedOffer('windows-server');
      updateBreadcrumb();
      
      expect(useNavigationStore.getState().breadcrumb).toEqual([
        {
          label: 'Publishers',
          level: 'publishers',
          onClick: expect.any(Function),
        },
        {
          label: 'microsoft',
          level: 'offers',
          onClick: expect.any(Function),
        },
        {
          label: 'windows-server',
          level: 'skus',
          onClick: expect.any(Function),
        },
      ]);
    });

    it('should handle breadcrumb onClick functions', () => {
      const { navigateToOffers, updateBreadcrumb } = useNavigationStore.getState();
      
      navigateToOffers('microsoft');
      
      const breadcrumb = useNavigationStore.getState().breadcrumb;
      expect(breadcrumb).toHaveLength(2);
      
      // Click on Publishers breadcrumb
      breadcrumb[0].onClick?.();
      expect(useNavigationStore.getState().currentLevel).toBe('publishers');
    });
  });

  describe('Go Back Functionality', () => {
    it('should go back from SKUs to offers', () => {
      const { navigateToSkus, goBack } = useNavigationStore.getState();
      
      navigateToSkus('microsoft', 'windows-server');
      expect(useNavigationStore.getState().currentLevel).toBe('skus');
      
      goBack();
      
      const state = useNavigationStore.getState();
      expect(state.currentLevel).toBe('offers');
      expect(state.selectedPublisher).toBe('microsoft');
      expect(state.selectedOffer).toBeNull();
    });

    it('should go back from offers to publishers', () => {
      const { navigateToOffers, goBack } = useNavigationStore.getState();
      
      navigateToOffers('microsoft');
      expect(useNavigationStore.getState().currentLevel).toBe('offers');
      
      goBack();
      
      const state = useNavigationStore.getState();
      expect(state.currentLevel).toBe('publishers');
      expect(state.selectedPublisher).toBeNull();
      expect(state.selectedOffer).toBeNull();
    });

    it('should handle go back from publishers (no-op)', () => {
      const { goBack } = useNavigationStore.getState();
      
      // Already at publishers level
      expect(useNavigationStore.getState().currentLevel).toBe('publishers');
      
      goBack();
      
      // Should remain at publishers level
      expect(useNavigationStore.getState().currentLevel).toBe('publishers');
    });

    it('should go back from SKUs to publishers when no publisher selected', () => {
      const { setCurrentLevel, setSelectedOffer, goBack } = useNavigationStore.getState();
      
      // Manually set to SKUs without publisher (edge case)
      setCurrentLevel('skus');
      setSelectedOffer('some-offer');
      
      goBack();
      
      expect(useNavigationStore.getState().currentLevel).toBe('publishers');
    });
  });

  describe('Reset Functionality', () => {
    it('should reset to initial state', () => {
      const { navigateToSkus, reset } = useNavigationStore.getState();
      
      // Navigate to some state
      navigateToSkus('microsoft', 'windows-server');
      expect(useNavigationStore.getState().currentLevel).toBe('skus');
      
      // Reset should restore initial state
      reset();
      
      const state = useNavigationStore.getState();
      expect(state.currentLevel).toBe('publishers');
      expect(state.selectedPublisher).toBeNull();
      expect(state.selectedOffer).toBeNull();
      expect(state.breadcrumb).toEqual([]);
    });
  });

  describe('Store Structure', () => {
    it('should have all required actions available', () => {
      const store = useNavigationStore.getState();
      
      expect(typeof store.navigateToPublishers).toBe('function');
      expect(typeof store.navigateToOffers).toBe('function');
      expect(typeof store.navigateToSkus).toBe('function');
      expect(typeof store.setCurrentLevel).toBe('function');
      expect(typeof store.setSelectedPublisher).toBe('function');
      expect(typeof store.setSelectedOffer).toBe('function');
      expect(typeof store.setBreadcrumb).toBe('function');
      expect(typeof store.updateBreadcrumb).toBe('function');
      expect(typeof store.reset).toBe('function');
      expect(typeof store.goBack).toBe('function');
    });

    it('should export selector functions', () => {
      expect(typeof useCurrentNavigation).toBe('function');
      expect(typeof useBreadcrumb).toBe('function');
      expect(typeof useNavigationActions).toBe('function');
    });
  });

  describe('Navigation Flow', () => {
    it('should handle complete navigation flow', () => {
      const { navigateToPublishers, navigateToOffers, navigateToSkus } = useNavigationStore.getState();
      
      // Start at publishers
      navigateToPublishers();
      expect(useNavigationStore.getState().currentLevel).toBe('publishers');
      expect(useNavigationStore.getState().breadcrumb).toHaveLength(1);
      
      // Navigate to offers
      navigateToOffers('microsoft');
      expect(useNavigationStore.getState().currentLevel).toBe('offers');
      expect(useNavigationStore.getState().selectedPublisher).toBe('microsoft');
      expect(useNavigationStore.getState().breadcrumb).toHaveLength(2);
      
      // Navigate to SKUs
      navigateToSkus('microsoft', 'windows-server');
      expect(useNavigationStore.getState().currentLevel).toBe('skus');
      expect(useNavigationStore.getState().selectedPublisher).toBe('microsoft');
      expect(useNavigationStore.getState().selectedOffer).toBe('windows-server');
      expect(useNavigationStore.getState().breadcrumb).toHaveLength(3);
    });
  });
});