import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore, useAuth, useSubscriptions } from '../authStore';
import type { Subscription } from '../../types';

// Mock user data
const mockUser = {
  id: 'user-123',
  name: 'John Doe',
  email: 'john.doe@example.com',
  tenantId: 'tenant-456',
};

// Mock subscription data
const mockSubscriptions: Subscription[] = [
  {
    subscriptionId: 'sub-1',
    displayName: 'Development Subscription',
    state: 'Enabled',
  },
  {
    subscriptionId: 'sub-2',
    displayName: 'Production Subscription',
    state: 'Enabled',
  },
];

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.getState().logout();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();
      
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.subscriptions).toEqual([]);
      expect(state.selectedSubscription).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Authentication Actions', () => {
    it('should login user successfully', () => {
      const { login } = useAuthStore.getState();
      
      login(mockUser);
      
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.error).toBeNull();
    });

    it('should logout user and reset state', () => {
      const { login, logout } = useAuthStore.getState();
      
      // First login
      login(mockUser);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      
      // Then logout
      logout();
      
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.subscriptions).toEqual([]);
      expect(state.selectedSubscription).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Subscription Management', () => {
    it('should set subscriptions and auto-select first one', () => {
      const { setSubscriptions } = useAuthStore.getState();
      
      setSubscriptions(mockSubscriptions);
      
      const state = useAuthStore.getState();
      expect(state.subscriptions).toEqual(mockSubscriptions);
      expect(state.selectedSubscription).toBe('sub-1');
      expect(state.error).toBeNull();
    });

    it('should not auto-select if subscription already selected', () => {
      const { setSubscriptions, selectSubscription } = useAuthStore.getState();
      
      // First set subscriptions
      setSubscriptions(mockSubscriptions);
      expect(useAuthStore.getState().selectedSubscription).toBe('sub-1');
      
      // Select different subscription
      selectSubscription('sub-2');
      expect(useAuthStore.getState().selectedSubscription).toBe('sub-2');
      
      // Set subscriptions again - should not change selection
      setSubscriptions(mockSubscriptions);
      expect(useAuthStore.getState().selectedSubscription).toBe('sub-2');
    });

    it('should select subscription successfully', () => {
      const { setSubscriptions, selectSubscription } = useAuthStore.getState();
      
      setSubscriptions(mockSubscriptions);
      selectSubscription('sub-2');
      
      const state = useAuthStore.getState();
      expect(state.selectedSubscription).toBe('sub-2');
      expect(state.error).toBeNull();
    });

    it('should set error when selecting non-existent subscription', () => {
      const { setSubscriptions, selectSubscription } = useAuthStore.getState();
      
      setSubscriptions(mockSubscriptions);
      selectSubscription('non-existent-sub');
      
      const state = useAuthStore.getState();
      expect(state.selectedSubscription).toBe('sub-1'); // Should remain unchanged
      expect(state.error).toBe('Subscription with ID non-existent-sub not found');
    });

    it('should handle empty subscriptions list', () => {
      const { setSubscriptions } = useAuthStore.getState();
      
      setSubscriptions([]);
      
      const state = useAuthStore.getState();
      expect(state.subscriptions).toEqual([]);
      expect(state.selectedSubscription).toBeNull();
    });
  });

  describe('Loading and Error States', () => {
    it('should set loading state', () => {
      const { setLoading } = useAuthStore.getState();
      
      setLoading(true);
      expect(useAuthStore.getState().loading).toBe(true);
      
      setLoading(false);
      expect(useAuthStore.getState().loading).toBe(false);
    });

    it('should set error state', () => {
      const { setError } = useAuthStore.getState();
      
      setError('Test error message');
      expect(useAuthStore.getState().error).toBe('Test error message');
    });

    it('should clear error state', () => {
      const { setError, clearError } = useAuthStore.getState();
      
      setError('Test error message');
      expect(useAuthStore.getState().error).toBe('Test error message');
      
      clearError();
      expect(useAuthStore.getState().error).toBeNull();
    });

    it('should clear error on successful actions', () => {
      const { setError, login, setSubscriptions, selectSubscription } = useAuthStore.getState();
      
      // Set initial error
      setError('Initial error');
      expect(useAuthStore.getState().error).toBe('Initial error');
      
      // Login should clear error
      login(mockUser);
      expect(useAuthStore.getState().error).toBeNull();
      
      // Set error again
      setError('Another error');
      expect(useAuthStore.getState().error).toBe('Another error');
      
      // Setting subscriptions should clear error
      setSubscriptions(mockSubscriptions);
      expect(useAuthStore.getState().error).toBeNull();
      
      // Set error again
      setError('Yet another error');
      expect(useAuthStore.getState().error).toBe('Yet another error');
      
      // Successful subscription selection should clear error
      selectSubscription('sub-2');
      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe('Store Structure', () => {
    it('should have all required actions available', () => {
      const store = useAuthStore.getState();
      
      expect(typeof store.login).toBe('function');
      expect(typeof store.logout).toBe('function');
      expect(typeof store.setSubscriptions).toBe('function');
      expect(typeof store.selectSubscription).toBe('function');
      expect(typeof store.setLoading).toBe('function');
      expect(typeof store.setError).toBe('function');
      expect(typeof store.clearError).toBe('function');
    });

    it('should export selector functions', () => {
      expect(typeof useAuth).toBe('function');
      expect(typeof useSubscriptions).toBe('function');
    });
  });
});