import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  NetworkMonitor,
  NetworkStatus,
  retryWithNetworkAwareness,
  waitForOnline,
  globalNetworkMonitor,
  isOnline,
  getNetworkStatus,
  onNetworkChange,
  onOnline,
  onOffline,
} from '../networkStatus';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock navigator
const mockNavigator = {
  onLine: true,
  connection: {
    type: 'wifi',
    effectiveType: '4g',
    downlink: 10,
    rtt: 100,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
};

Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true,
});

// Mock window events
const mockWindow = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true,
});

describe('NetworkMonitor', () => {
  let networkMonitor: NetworkMonitor;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    networkMonitor = new NetworkMonitor({
      checkInterval: 1000,
      timeoutDuration: 500,
      testUrls: ['https://test.com/favicon.ico'],
      retryAttempts: 1,
    });
  });

  afterEach(() => {
    networkMonitor.stopMonitoring();
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('should initialize with correct default status', () => {
      const status = networkMonitor.getNetworkStatus();
      expect(status.isOnline).toBe(true);
      expect(status.connectionType).toBe('wifi');
      expect(status.effectiveType).toBe('4g');
    });

    it('should handle missing connection API', () => {
      const originalConnection = mockNavigator.connection;
      delete (mockNavigator as any).connection;
      
      const monitor = new NetworkMonitor();
      const status = monitor.getNetworkStatus();
      
      expect(status.isOnline).toBe(true);
      expect(status.connectionType).toBeUndefined();
      
      mockNavigator.connection = originalConnection;
    });
  });

  describe('monitoring', () => {
    it('should start monitoring and add event listeners', () => {
      networkMonitor.startMonitoring();
      
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
      expect(mockNavigator.connection.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should stop monitoring and remove event listeners', () => {
      networkMonitor.startMonitoring();
      networkMonitor.stopMonitoring();
      
      expect(mockWindow.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockWindow.removeEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
      expect(mockNavigator.connection.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should not start monitoring twice', () => {
      networkMonitor.startMonitoring();
      networkMonitor.startMonitoring();
      
      // Should only be called once
      expect(mockWindow.addEventListener).toHaveBeenCalledTimes(2); // online + offline
    });
  });

  describe('connectivity checking', () => {
    it('should check connectivity successfully', async () => {
      mockFetch.mockResolvedValue(new Response('', { status: 200 }));
      
      const status = await networkMonitor.checkConnectivity();
      
      expect(status.isOnline).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.com/favicon.ico',
        expect.objectContaining({
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache',
        })
      );
    });

    it('should detect offline when fetch fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      const status = await networkMonitor.checkConnectivity();
      
      expect(status.isOnline).toBe(false);
    });

    it('should respect timeout', async () => {
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );
      
      const statusPromise = networkMonitor.checkConnectivity();
      
      // Fast-forward past timeout
      vi.advanceTimersByTime(600);
      
      const status = await statusPromise;
      expect(status.isOnline).toBe(false);
    });

    it('should trust navigator.onLine when offline', async () => {
      mockNavigator.onLine = false;
      
      const status = await networkMonitor.checkConnectivity();
      
      expect(status.isOnline).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
      
      mockNavigator.onLine = true; // Reset
    });
  });

  describe('event listeners', () => {
    it('should add and remove event listeners', () => {
      const listener = vi.fn();
      
      networkMonitor.addEventListener('online', listener);
      networkMonitor.addEventListener('offline', listener);
      networkMonitor.addEventListener('change', listener);
      
      networkMonitor.removeEventListener('online', listener);
      networkMonitor.removeEventListener('offline', listener);
      networkMonitor.removeEventListener('change', listener);
      
      // Should not throw
      expect(true).toBe(true);
    });

    it('should notify listeners on status change', async () => {
      const onlineListener = vi.fn();
      const offlineListener = vi.fn();
      const changeListener = vi.fn();
      
      networkMonitor.addEventListener('online', onlineListener);
      networkMonitor.addEventListener('offline', offlineListener);
      networkMonitor.addEventListener('change', changeListener);
      
      // Simulate going offline
      mockFetch.mockRejectedValue(new Error('Network error'));
      await networkMonitor.checkConnectivity();
      
      expect(offlineListener).toHaveBeenCalledWith(expect.objectContaining({
        isOnline: false,
      }));
      expect(changeListener).toHaveBeenCalled();
      
      // Simulate coming back online
      mockFetch.mockResolvedValue(new Response('', { status: 200 }));
      await networkMonitor.checkConnectivity();
      
      expect(onlineListener).toHaveBeenCalledWith(expect.objectContaining({
        isOnline: true,
      }));
    });

    it('should handle listener errors gracefully', async () => {
      const faultyListener = vi.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      networkMonitor.addEventListener('change', faultyListener);
      
      mockFetch.mockRejectedValue(new Error('Network error'));
      await networkMonitor.checkConnectivity();
      
      expect(consoleSpy).toHaveBeenCalledWith('Error in network status listener:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('periodic checks', () => {
    it('should perform periodic connectivity checks', async () => {
      mockFetch.mockResolvedValue(new Response('', { status: 200 }));
      
      networkMonitor.startMonitoring();
      
      // Fast-forward past check interval
      vi.advanceTimersByTime(1100);
      
      expect(mockFetch).toHaveBeenCalled();
    });
  });
});

describe('retryWithNetworkAwareness', () => {
  let networkMonitor: NetworkMonitor;

  beforeEach(() => {
    vi.useFakeTimers();
    networkMonitor = new NetworkMonitor();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should succeed on first attempt when online', async () => {
    const operation = vi.fn().mockResolvedValue('success');
    vi.spyOn(networkMonitor, 'isOnline').mockReturnValue(true);
    
    const result = await retryWithNetworkAwareness(operation, networkMonitor, {
      maxRetries: 2,
      baseDelay: 100,
      maxDelay: 1000,
      backoffMultiplier: 2,
      networkCheckInterval: 100,
      waitForOnline: true,
    });
    
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure when online', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('Temporary failure'))
      .mockResolvedValueOnce('success');
    
    vi.spyOn(networkMonitor, 'isOnline').mockReturnValue(true);
    
    const resultPromise = retryWithNetworkAwareness(operation, networkMonitor, {
      maxRetries: 2,
      baseDelay: 100,
      maxDelay: 1000,
      backoffMultiplier: 2,
      networkCheckInterval: 100,
      waitForOnline: true,
    });
    
    // Fast-forward past retry delay
    vi.advanceTimersByTime(200);
    
    const result = await resultPromise;
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('should wait for online when offline and waitForOnline is true', async () => {
    const operation = vi.fn().mockResolvedValue('success');
    const isOnlineSpy = vi.spyOn(networkMonitor, 'isOnline')
      .mockReturnValueOnce(false)
      .mockReturnValue(true);
    
    const addEventListenerSpy = vi.spyOn(networkMonitor, 'addEventListener')
      .mockImplementation((event, listener) => {
        if (event === 'online') {
          // Simulate coming online after a delay
          setTimeout(() => listener({ isOnline: true }), 50);
        }
      });
    
    const removeEventListenerSpy = vi.spyOn(networkMonitor, 'removeEventListener');
    
    const resultPromise = retryWithNetworkAwareness(operation, networkMonitor, {
      maxRetries: 1,
      baseDelay: 100,
      maxDelay: 1000,
      backoffMultiplier: 2,
      networkCheckInterval: 100,
      waitForOnline: true,
    });
    
    // Fast-forward to trigger online event
    vi.advanceTimersByTime(100);
    
    const result = await resultPromise;
    expect(result).toBe('success');
    expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
  });

  it('should throw immediately when offline and waitForOnline is false', async () => {
    const operation = vi.fn().mockResolvedValue('success');
    vi.spyOn(networkMonitor, 'isOnline').mockReturnValue(false);
    
    await expect(retryWithNetworkAwareness(operation, networkMonitor, {
      maxRetries: 2,
      baseDelay: 100,
      maxDelay: 1000,
      backoffMultiplier: 2,
      networkCheckInterval: 100,
      waitForOnline: false,
    })).rejects.toThrow('Network is offline');
    
    expect(operation).not.toHaveBeenCalled();
  });

  it('should respect max retries', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Always fails'));
    vi.spyOn(networkMonitor, 'isOnline').mockReturnValue(true);
    
    await expect(retryWithNetworkAwareness(operation, networkMonitor, {
      maxRetries: 2,
      baseDelay: 1,
      maxDelay: 1000,
      backoffMultiplier: 2,
      networkCheckInterval: 100,
      waitForOnline: true,
    })).rejects.toThrow('Always fails');
    
    expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });
});

describe('waitForOnline', () => {
  let networkMonitor: NetworkMonitor;

  beforeEach(() => {
    networkMonitor = new NetworkMonitor();
  });

  it('should resolve immediately if already online', async () => {
    vi.spyOn(networkMonitor, 'isOnline').mockReturnValue(true);
    
    await expect(waitForOnline(networkMonitor)).resolves.toBeUndefined();
  });

  it('should wait for online event when offline', async () => {
    vi.spyOn(networkMonitor, 'isOnline').mockReturnValue(false);
    
    const addEventListenerSpy = vi.spyOn(networkMonitor, 'addEventListener')
      .mockImplementation((event, listener) => {
        if (event === 'online') {
          // Simulate coming online after a delay
          setTimeout(() => listener({ isOnline: true }), 10);
        }
      });
    
    const removeEventListenerSpy = vi.spyOn(networkMonitor, 'removeEventListener');
    
    await waitForOnline(networkMonitor);
    
    expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
  });
});

describe('global utilities', () => {
  it('should provide global network status functions', () => {
    expect(typeof isOnline).toBe('function');
    expect(typeof getNetworkStatus).toBe('function');
    expect(typeof onNetworkChange).toBe('function');
    expect(typeof onOnline).toBe('function');
    expect(typeof onOffline).toBe('function');
  });

  it('should return cleanup functions for event listeners', () => {
    const cleanup1 = onNetworkChange(() => {});
    const cleanup2 = onOnline(() => {});
    const cleanup3 = onOffline(() => {});
    
    expect(typeof cleanup1).toBe('function');
    expect(typeof cleanup2).toBe('function');
    expect(typeof cleanup3).toBe('function');
    
    // Should not throw when called
    cleanup1();
    cleanup2();
    cleanup3();
  });
});