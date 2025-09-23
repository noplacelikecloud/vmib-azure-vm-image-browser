import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../stores/authStore';
import { useNavigationStore } from '../stores/navigationStore';
import { useVMImagesStore } from '../stores/vmImagesStore';

describe('Logout Integration Tests', () => {
  beforeEach(() => {
    // Reset all stores before each test
    useAuthStore.getState().logout();
    useNavigationStore.getState().reset();
    useVMImagesStore.getState().reset();
  });

  it('should clear auth store on logout', () => {
    const { login, logout } = useAuthStore.getState();
    
    // Set up some user data
    login({
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      tenantId: 'test-tenant-id',
    });
    
    // Verify user is logged in
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user).not.toBeNull();
    
    // Perform logout
    logout();
    
    // Verify state is cleared
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().subscriptions).toEqual([]);
    expect(useAuthStore.getState().selectedSubscription).toBeNull();
    expect(useAuthStore.getState().error).toBeNull();
  });

  it('should clear navigation store on reset', () => {
    const { navigateToOffers, reset } = useNavigationStore.getState();
    
    // Set up some navigation state
    navigateToOffers('test-publisher', 'Test Publisher');
    
    // Verify navigation state is set
    expect(useNavigationStore.getState().currentLevel).toBe('offers');
    expect(useNavigationStore.getState().selectedPublisher).toBe('test-publisher');
    
    // Perform reset
    reset();
    
    // Verify state is cleared
    expect(useNavigationStore.getState().currentLevel).toBe('publishers');
    expect(useNavigationStore.getState().selectedPublisher).toBeNull();
    expect(useNavigationStore.getState().selectedOffer).toBeNull();
    expect(useNavigationStore.getState().breadcrumb).toEqual([]);
  });

  it('should clear VM images store on reset', () => {
    const { setPublishers, setOffers, setSkus, reset } = useVMImagesStore.getState();
    
    // Set up some VM images data
    const mockPublishers = [
      { name: 'test-publisher', displayName: 'Test Publisher' },
    ];
    const mockOffers = [
      { name: 'test-offer', displayName: 'Test Offer' },
    ];
    const mockSkus = [
      { name: 'test-sku', displayName: 'Test SKU' },
    ];
    
    setPublishers(mockPublishers);
    setOffers(mockOffers, 'test-publisher');
    setSkus(mockSkus, 'test-publisher', 'test-offer');
    
    // Verify data is set
    expect(useVMImagesStore.getState().publishers).toEqual(mockPublishers);
    expect(useVMImagesStore.getState().offers).toEqual(mockOffers);
    expect(useVMImagesStore.getState().skus).toEqual(mockSkus);
    expect(useVMImagesStore.getState().loadedPublishers).toBe(true);
    
    // Perform reset
    reset();
    
    // Verify state is cleared
    expect(useVMImagesStore.getState().publishers).toEqual([]);
    expect(useVMImagesStore.getState().offers).toEqual([]);
    expect(useVMImagesStore.getState().skus).toEqual([]);
    expect(useVMImagesStore.getState().filteredPublishers).toEqual([]);
    expect(useVMImagesStore.getState().filteredOffers).toEqual([]);
    expect(useVMImagesStore.getState().filteredSkus).toEqual([]);
    expect(useVMImagesStore.getState().loadedPublishers).toBe(false);
    expect(useVMImagesStore.getState().loadedOffers).toBeNull();
    expect(useVMImagesStore.getState().loadedSkus).toBeNull();
    expect(useVMImagesStore.getState().searchQuery).toBe('');
    expect(useVMImagesStore.getState().error).toBeNull();
  });

  it('should clear all stores in sequence (simulating logout flow)', () => {
    const authStore = useAuthStore.getState();
    const navigationStore = useNavigationStore.getState();
    const vmImagesStore = useVMImagesStore.getState();
    
    // Set up data in all stores
    authStore.login({
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
    });
    
    navigationStore.navigateToOffers('test-publisher');
    
    vmImagesStore.setPublishers([
      { name: 'test-publisher', displayName: 'Test Publisher' },
    ]);
    
    // Verify all stores have data
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useNavigationStore.getState().currentLevel).toBe('offers');
    expect(useVMImagesStore.getState().publishers.length).toBe(1);
    
    // Simulate logout flow (clear all stores)
    authStore.logout();
    navigationStore.reset();
    vmImagesStore.reset();
    
    // Verify all stores are cleared
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useNavigationStore.getState().currentLevel).toBe('publishers');
    expect(useNavigationStore.getState().selectedPublisher).toBeNull();
    expect(useVMImagesStore.getState().publishers).toEqual([]);
    expect(useVMImagesStore.getState().loadedPublishers).toBe(false);
  });

  it('should preserve pagination settings after reset', () => {
    const { setItemsPerPage, reset } = useVMImagesStore.getState();
    
    // Modify pagination settings
    setItemsPerPage('publishers', 20);
    setItemsPerPage('offers', 15);
    
    // Verify pagination is set
    expect(useVMImagesStore.getState().pagination.publishers.itemsPerPage).toBe(20);
    expect(useVMImagesStore.getState().pagination.offers.itemsPerPage).toBe(15);
    
    // Perform reset
    reset();
    
    // Verify pagination is reset to defaults
    expect(useVMImagesStore.getState().pagination.publishers.itemsPerPage).toBe(12);
    expect(useVMImagesStore.getState().pagination.publishers.currentPage).toBe(1);
    expect(useVMImagesStore.getState().pagination.offers.itemsPerPage).toBe(10);
    expect(useVMImagesStore.getState().pagination.offers.currentPage).toBe(1);
  });
});