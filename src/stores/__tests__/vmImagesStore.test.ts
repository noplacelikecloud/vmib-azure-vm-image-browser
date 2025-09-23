import { describe, it, expect, beforeEach } from 'vitest';
import { useVMImagesStore, usePublishers, useOffers, useSkus, useVMImagesLoading, useVMImagesSearch, useVMImagesPagination } from '../vmImagesStore';
import type { Publisher, Offer, SKU } from '../../types';

// Mock data
const mockPublishers: Publisher[] = [
  {
    name: 'microsoft',
    displayName: 'Microsoft',
    location: 'eastus',
  },
  {
    name: 'canonical',
    displayName: 'Canonical',
    location: 'eastus',
  },
];

const mockOffers: Offer[] = [
  {
    name: 'windows-server',
    displayName: 'Windows Server',
    publisher: 'microsoft',
    location: 'eastus',
  },
  {
    name: 'sql-server',
    displayName: 'SQL Server',
    publisher: 'microsoft',
    location: 'eastus',
  },
];

const mockSkus: SKU[] = [
  {
    name: '2022-datacenter',
    displayName: '2022 Datacenter',
    publisher: 'microsoft',
    offer: 'windows-server',
    location: 'eastus',
    versions: ['latest', '20348.1006.220908'],
  },
  {
    name: '2019-datacenter',
    displayName: '2019 Datacenter',
    publisher: 'microsoft',
    offer: 'windows-server',
    location: 'eastus',
    versions: ['latest', '17763.3406.220908'],
  },
];

describe('VMImagesStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useVMImagesStore.getState().reset();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useVMImagesStore.getState();
      
      expect(state.publishers).toEqual([]);
      expect(state.offers).toEqual([]);
      expect(state.skus).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.loadedPublishers).toBe(false);
      expect(state.loadedOffers).toBeNull();
      expect(state.loadedSkus).toBeNull();
      expect(state.searchQuery).toBe('');
      expect(state.filteredPublishers).toEqual([]);
      expect(state.filteredOffers).toEqual([]);
      expect(state.filteredSkus).toEqual([]);
      expect(state.pagination).toEqual({
        publishers: { currentPage: 1, itemsPerPage: 12 },
        offers: { currentPage: 1, itemsPerPage: 10 },
        skus: { currentPage: 1, itemsPerPage: 8 },
      });
    });
  });

  describe('Publishers Management', () => {
    it('should set publishers successfully', () => {
      const { setPublishers } = useVMImagesStore.getState();
      
      setPublishers(mockPublishers);
      
      const state = useVMImagesStore.getState();
      expect(state.publishers).toEqual(mockPublishers);
      expect(state.loadedPublishers).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should clear publishers', () => {
      const { setPublishers, clearPublishers } = useVMImagesStore.getState();
      
      // First set publishers
      setPublishers(mockPublishers);
      expect(useVMImagesStore.getState().publishers).toEqual(mockPublishers);
      
      // Then clear them
      clearPublishers();
      
      const state = useVMImagesStore.getState();
      expect(state.publishers).toEqual([]);
      expect(state.loadedPublishers).toBe(false);
    });
  });

  describe('Offers Management', () => {
    it('should set offers successfully', () => {
      const { setOffers } = useVMImagesStore.getState();
      
      setOffers(mockOffers, 'microsoft');
      
      const state = useVMImagesStore.getState();
      expect(state.offers).toEqual(mockOffers);
      expect(state.loadedOffers).toEqual({ publisher: 'microsoft' });
      expect(state.error).toBeNull();
    });

    it('should clear SKUs when setting new offers', () => {
      const { setOffers, setSkus } = useVMImagesStore.getState();
      
      // First set some SKUs
      setSkus(mockSkus, 'microsoft', 'windows-server');
      expect(useVMImagesStore.getState().skus).toEqual(mockSkus);
      
      // Then set offers - should clear SKUs
      setOffers(mockOffers, 'microsoft');
      
      const state = useVMImagesStore.getState();
      expect(state.offers).toEqual(mockOffers);
      expect(state.skus).toEqual([]);
      expect(state.loadedSkus).toBeNull();
    });

    it('should clear offers', () => {
      const { setOffers, clearOffers } = useVMImagesStore.getState();
      
      // First set offers
      setOffers(mockOffers, 'microsoft');
      expect(useVMImagesStore.getState().offers).toEqual(mockOffers);
      
      // Then clear them
      clearOffers();
      
      const state = useVMImagesStore.getState();
      expect(state.offers).toEqual([]);
      expect(state.loadedOffers).toBeNull();
    });

    it('should clear SKUs when clearing offers', () => {
      const { setOffers, setSkus, clearOffers } = useVMImagesStore.getState();
      
      // Set offers and SKUs
      setOffers(mockOffers, 'microsoft');
      setSkus(mockSkus, 'microsoft', 'windows-server');
      
      // Clear offers should also clear SKUs
      clearOffers();
      
      const state = useVMImagesStore.getState();
      expect(state.offers).toEqual([]);
      expect(state.skus).toEqual([]);
      expect(state.loadedOffers).toBeNull();
      expect(state.loadedSkus).toBeNull();
    });
  });

  describe('SKUs Management', () => {
    it('should set SKUs successfully', () => {
      const { setSkus } = useVMImagesStore.getState();
      
      setSkus(mockSkus, 'microsoft', 'windows-server');
      
      const state = useVMImagesStore.getState();
      expect(state.skus).toEqual(mockSkus);
      expect(state.loadedSkus).toEqual({ publisher: 'microsoft', offer: 'windows-server' });
      expect(state.error).toBeNull();
    });

    it('should clear SKUs', () => {
      const { setSkus, clearSkus } = useVMImagesStore.getState();
      
      // First set SKUs
      setSkus(mockSkus, 'microsoft', 'windows-server');
      expect(useVMImagesStore.getState().skus).toEqual(mockSkus);
      
      // Then clear them
      clearSkus();
      
      const state = useVMImagesStore.getState();
      expect(state.skus).toEqual([]);
      expect(state.loadedSkus).toBeNull();
    });
  });

  describe('Loading and Error States', () => {
    it('should set loading state', () => {
      const { setLoading } = useVMImagesStore.getState();
      
      setLoading(true);
      expect(useVMImagesStore.getState().loading).toBe(true);
      
      setLoading(false);
      expect(useVMImagesStore.getState().loading).toBe(false);
    });

    it('should set error state and stop loading', () => {
      const { setError, setLoading } = useVMImagesStore.getState();
      
      // Start loading
      setLoading(true);
      expect(useVMImagesStore.getState().loading).toBe(true);
      
      // Set error should stop loading
      setError('Test error message');
      
      const state = useVMImagesStore.getState();
      expect(state.error).toBe('Test error message');
      expect(state.loading).toBe(false);
    });

    it('should clear error state', () => {
      const { setError, clearError } = useVMImagesStore.getState();
      
      setError('Test error message');
      expect(useVMImagesStore.getState().error).toBe('Test error message');
      
      clearError();
      expect(useVMImagesStore.getState().error).toBeNull();
    });

    it('should clear error on successful data operations', () => {
      const { setError, setPublishers, setOffers, setSkus } = useVMImagesStore.getState();
      
      // Set initial error
      setError('Initial error');
      expect(useVMImagesStore.getState().error).toBe('Initial error');
      
      // Setting publishers should clear error
      setPublishers(mockPublishers);
      expect(useVMImagesStore.getState().error).toBeNull();
      
      // Set error again
      setError('Another error');
      expect(useVMImagesStore.getState().error).toBe('Another error');
      
      // Setting offers should clear error
      setOffers(mockOffers, 'microsoft');
      expect(useVMImagesStore.getState().error).toBeNull();
      
      // Set error again
      setError('Yet another error');
      expect(useVMImagesStore.getState().error).toBe('Yet another error');
      
      // Setting SKUs should clear error
      setSkus(mockSkus, 'microsoft', 'windows-server');
      expect(useVMImagesStore.getState().error).toBeNull();
    });
  });

  describe('Utility Actions', () => {
    it('should reset to initial state', () => {
      const { setPublishers, setOffers, setSkus, setLoading, setError, reset } = useVMImagesStore.getState();
      
      // Set some data
      setPublishers(mockPublishers);
      setOffers(mockOffers, 'microsoft');
      setSkus(mockSkus, 'microsoft', 'windows-server');
      setLoading(true);
      setError('Test error');
      
      // Reset should restore initial state
      reset();
      
      const state = useVMImagesStore.getState();
      expect(state.publishers).toEqual([]);
      expect(state.offers).toEqual([]);
      expect(state.skus).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.loadedPublishers).toBe(false);
      expect(state.loadedOffers).toBeNull();
      expect(state.loadedSkus).toBeNull();
    });

    it('should clear all data but preserve loading state', () => {
      const { setPublishers, setOffers, setSkus, setLoading, clearAll } = useVMImagesStore.getState();
      
      // Set some data and loading state
      setPublishers(mockPublishers);
      setOffers(mockOffers, 'microsoft');
      setSkus(mockSkus, 'microsoft', 'windows-server');
      setLoading(true);
      
      // Verify loading is true before clearAll
      expect(useVMImagesStore.getState().loading).toBe(true);
      
      // clearAll should clear data but preserve loading state
      clearAll();
      
      const state = useVMImagesStore.getState();
      expect(state.publishers).toEqual([]);
      expect(state.offers).toEqual([]);
      expect(state.skus).toEqual([]);
      expect(state.loadedPublishers).toBe(false);
      expect(state.loadedOffers).toBeNull();
      expect(state.loadedSkus).toBeNull();
      expect(state.error).toBeNull();
      // Loading state should be preserved
      expect(state.loading).toBe(true);
    });
  });

  describe('Store Structure', () => {
    it('should have all required actions available', () => {
      const store = useVMImagesStore.getState();
      
      expect(typeof store.setPublishers).toBe('function');
      expect(typeof store.clearPublishers).toBe('function');
      expect(typeof store.setOffers).toBe('function');
      expect(typeof store.clearOffers).toBe('function');
      expect(typeof store.setSkus).toBe('function');
      expect(typeof store.clearSkus).toBe('function');
      expect(typeof store.setLoading).toBe('function');
      expect(typeof store.setError).toBe('function');
      expect(typeof store.clearError).toBe('function');
      expect(typeof store.reset).toBe('function');
      expect(typeof store.clearAll).toBe('function');
    });

    it('should export selector functions', () => {
      expect(typeof usePublishers).toBe('function');
      expect(typeof useOffers).toBe('function');
      expect(typeof useSkus).toBe('function');
      expect(typeof useVMImagesLoading).toBe('function');
    });
  });

  describe('Data Tracking', () => {
    it('should track loaded publishers correctly', () => {
      const { setPublishers, clearPublishers } = useVMImagesStore.getState();
      
      expect(useVMImagesStore.getState().loadedPublishers).toBe(false);
      
      setPublishers(mockPublishers);
      expect(useVMImagesStore.getState().loadedPublishers).toBe(true);
      
      clearPublishers();
      expect(useVMImagesStore.getState().loadedPublishers).toBe(false);
    });

    it('should track loaded offers correctly', () => {
      const { setOffers, clearOffers } = useVMImagesStore.getState();
      
      expect(useVMImagesStore.getState().loadedOffers).toBeNull();
      
      setOffers(mockOffers, 'microsoft');
      expect(useVMImagesStore.getState().loadedOffers).toEqual({ publisher: 'microsoft' });
      
      clearOffers();
      expect(useVMImagesStore.getState().loadedOffers).toBeNull();
    });

    it('should track loaded SKUs correctly', () => {
      const { setSkus, clearSkus } = useVMImagesStore.getState();
      
      expect(useVMImagesStore.getState().loadedSkus).toBeNull();
      
      setSkus(mockSkus, 'microsoft', 'windows-server');
      expect(useVMImagesStore.getState().loadedSkus).toEqual({ 
        publisher: 'microsoft', 
        offer: 'windows-server' 
      });
      
      clearSkus();
      expect(useVMImagesStore.getState().loadedSkus).toBeNull();
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      const { setPublishers, setOffers, setSkus } = useVMImagesStore.getState();
      
      // Set up test data
      setPublishers(mockPublishers);
      setOffers(mockOffers, 'microsoft');
      setSkus(mockSkus, 'microsoft', 'windows-server');
    });

    it('should filter publishers by search query', () => {
      const { setSearchQuery } = useVMImagesStore.getState();
      
      setSearchQuery('microsoft');
      
      const state = useVMImagesStore.getState();
      expect(state.searchQuery).toBe('microsoft');
      expect(state.filteredPublishers).toHaveLength(1);
      expect(state.filteredPublishers[0].name).toBe('microsoft');
    });

    it('should filter publishers by display name', () => {
      const { setSearchQuery } = useVMImagesStore.getState();
      
      setSearchQuery('Canonical');
      
      const state = useVMImagesStore.getState();
      expect(state.filteredPublishers).toHaveLength(1);
      expect(state.filteredPublishers[0].displayName).toBe('Canonical');
    });

    it('should filter offers by search query', () => {
      const { setSearchQuery } = useVMImagesStore.getState();
      
      setSearchQuery('windows');
      
      const state = useVMImagesStore.getState();
      expect(state.filteredOffers).toHaveLength(1);
      expect(state.filteredOffers[0].name).toBe('windows-server');
    });

    it('should filter SKUs by search query', () => {
      const { setSearchQuery } = useVMImagesStore.getState();
      
      setSearchQuery('2022');
      
      const state = useVMImagesStore.getState();
      expect(state.filteredSkus).toHaveLength(1);
      expect(state.filteredSkus[0].name).toBe('2022-datacenter');
    });

    it('should be case insensitive', () => {
      const { setSearchQuery } = useVMImagesStore.getState();
      
      setSearchQuery('MICROSOFT');
      
      const state = useVMImagesStore.getState();
      expect(state.filteredPublishers).toHaveLength(1);
      expect(state.filteredPublishers[0].name).toBe('microsoft');
    });

    it('should return all items when search query is empty', () => {
      const { setSearchQuery } = useVMImagesStore.getState();
      
      setSearchQuery('');
      
      const state = useVMImagesStore.getState();
      expect(state.filteredPublishers).toEqual(mockPublishers);
      expect(state.filteredOffers).toEqual(mockOffers);
      expect(state.filteredSkus).toEqual(mockSkus);
    });

    it('should return empty array when no matches found', () => {
      const { setSearchQuery } = useVMImagesStore.getState();
      
      setSearchQuery('nonexistent');
      
      const state = useVMImagesStore.getState();
      expect(state.filteredPublishers).toEqual([]);
      expect(state.filteredOffers).toEqual([]);
      expect(state.filteredSkus).toEqual([]);
    });

    it('should clear search query and reset filters', () => {
      const { setSearchQuery, clearSearch } = useVMImagesStore.getState();
      
      // Set a search query first
      setSearchQuery('microsoft');
      expect(useVMImagesStore.getState().searchQuery).toBe('microsoft');
      
      // Clear search
      clearSearch();
      
      const state = useVMImagesStore.getState();
      expect(state.searchQuery).toBe('');
      expect(state.filteredPublishers).toEqual(mockPublishers);
      expect(state.filteredOffers).toEqual(mockOffers);
      expect(state.filteredSkus).toEqual(mockSkus);
    });

    it('should filter new data when search query is active', () => {
      const { setSearchQuery, setPublishers } = useVMImagesStore.getState();
      
      // Set search query first
      setSearchQuery('test');
      
      // Add new publishers - should be filtered immediately
      const newPublishers: Publisher[] = [
        ...mockPublishers,
        {
          name: 'test-publisher',
          displayName: 'Test Publisher',
          location: 'eastus',
        },
      ];
      
      setPublishers(newPublishers);
      
      const state = useVMImagesStore.getState();
      expect(state.publishers).toEqual(newPublishers);
      expect(state.filteredPublishers).toHaveLength(1);
      expect(state.filteredPublishers[0].name).toBe('test-publisher');
    });

    it('should handle whitespace in search queries', () => {
      const { setSearchQuery } = useVMImagesStore.getState();
      
      setSearchQuery('  microsoft  ');
      
      const state = useVMImagesStore.getState();
      expect(state.filteredPublishers).toHaveLength(1);
      expect(state.filteredPublishers[0].name).toBe('microsoft');
    });

    it('should export search selector function', () => {
      expect(typeof useVMImagesSearch).toBe('function');
      
      // Test the selector function exists and has the right structure
      const store = useVMImagesStore.getState();
      expect(typeof store.searchQuery).toBe('string');
      expect(typeof store.setSearchQuery).toBe('function');
      expect(typeof store.clearSearch).toBe('function');
    });
  });

  describe('Store Structure with Search', () => {
    it('should have all required search actions available', () => {
      const store = useVMImagesStore.getState();
      
      expect(typeof store.setSearchQuery).toBe('function');
      expect(typeof store.clearSearch).toBe('function');
    });

    it('should include filtered data in selectors', () => {
      const { setPublishers, setOffers, setSkus } = useVMImagesStore.getState();
      
      setPublishers(mockPublishers);
      setOffers(mockOffers, 'microsoft');
      setSkus(mockSkus, 'microsoft', 'windows-server');
      
      const state = useVMImagesStore.getState();
      
      expect(state.filteredPublishers).toEqual(mockPublishers);
      expect(state.publishers).toEqual(mockPublishers);
      expect(state.searchQuery).toBe('');
      
      expect(state.filteredOffers).toEqual(mockOffers);
      expect(state.offers).toEqual(mockOffers);
      
      expect(state.filteredSkus).toEqual(mockSkus);
      expect(state.skus).toEqual(mockSkus);
    });
  });

  describe('Pagination Functionality', () => {
    it('should set publishers page', () => {
      const { setPublishersPage } = useVMImagesStore.getState();
      
      setPublishersPage(3);
      
      const state = useVMImagesStore.getState();
      expect(state.pagination.publishers.currentPage).toBe(3);
      expect(state.pagination.publishers.itemsPerPage).toBe(12); // Should remain unchanged
    });

    it('should set offers page', () => {
      const { setOffersPage } = useVMImagesStore.getState();
      
      setOffersPage(2);
      
      const state = useVMImagesStore.getState();
      expect(state.pagination.offers.currentPage).toBe(2);
      expect(state.pagination.offers.itemsPerPage).toBe(10); // Should remain unchanged
    });

    it('should set SKUs page', () => {
      const { setSkusPage } = useVMImagesStore.getState();
      
      setSkusPage(4);
      
      const state = useVMImagesStore.getState();
      expect(state.pagination.skus.currentPage).toBe(4);
      expect(state.pagination.skus.itemsPerPage).toBe(8); // Should remain unchanged
    });

    it('should set items per page and reset to first page', () => {
      const { setItemsPerPage, setPublishersPage } = useVMImagesStore.getState();
      
      // First set to a different page
      setPublishersPage(3);
      expect(useVMImagesStore.getState().pagination.publishers.currentPage).toBe(3);
      
      // Then change items per page - should reset to page 1
      setItemsPerPage('publishers', 20);
      
      const state = useVMImagesStore.getState();
      expect(state.pagination.publishers.currentPage).toBe(1);
      expect(state.pagination.publishers.itemsPerPage).toBe(20);
    });

    it('should handle different pagination types independently', () => {
      const { setPublishersPage, setOffersPage, setSkusPage } = useVMImagesStore.getState();
      
      setPublishersPage(2);
      setOffersPage(3);
      setSkusPage(4);
      
      const state = useVMImagesStore.getState();
      expect(state.pagination.publishers.currentPage).toBe(2);
      expect(state.pagination.offers.currentPage).toBe(3);
      expect(state.pagination.skus.currentPage).toBe(4);
    });
  });

  describe('Store Structure with Pagination', () => {
    it('should have all required pagination actions available', () => {
      const store = useVMImagesStore.getState();
      
      expect(typeof store.setPublishersPage).toBe('function');
      expect(typeof store.setOffersPage).toBe('function');
      expect(typeof store.setSkusPage).toBe('function');
      expect(typeof store.setItemsPerPage).toBe('function');
    });

    it('should export pagination selector function', () => {
      expect(typeof useVMImagesPagination).toBe('function');
      
      const store = useVMImagesStore.getState();
      expect(typeof store.setPublishersPage).toBe('function');
      expect(typeof store.setOffersPage).toBe('function');
      expect(typeof store.setSkusPage).toBe('function');
      expect(typeof store.setItemsPerPage).toBe('function');
    });
  });
});