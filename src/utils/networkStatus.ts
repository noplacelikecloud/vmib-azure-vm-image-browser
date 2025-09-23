/**
 * Network connectivity handling utilities
 * Provides offline detection, retry functionality, and fallback UI support
 */

// Network status types
export interface NetworkStatus {
  isOnline: boolean;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

// Network event types
export type NetworkEventType = 'online' | 'offline' | 'change';

export type NetworkEventListener = (status: NetworkStatus) => void;

// Network monitor configuration
export interface NetworkMonitorConfig {
  checkInterval: number; // milliseconds
  timeoutDuration: number; // milliseconds
  testUrls: string[];
  retryAttempts: number;
}

const DEFAULT_NETWORK_CONFIG: NetworkMonitorConfig = {
  checkInterval: 30000, // 30 seconds
  timeoutDuration: 5000, // 5 seconds
  testUrls: [
    'https://www.google.com/favicon.ico',
    'https://www.microsoft.com/favicon.ico',
    'https://httpbin.org/status/200'
  ],
  retryAttempts: 3,
};

// Network monitor class
export class NetworkMonitor {
  private config: NetworkMonitorConfig;
  private listeners: Map<NetworkEventType, Set<NetworkEventListener>>;
  private currentStatus: NetworkStatus;
  private checkInterval?: ReturnType<typeof setInterval>;
  private isMonitoring = false;

  constructor(config: NetworkMonitorConfig = DEFAULT_NETWORK_CONFIG) {
    this.config = config;
    this.listeners = new Map();
    this.currentStatus = this.getInitialNetworkStatus();
    
    // Initialize listener sets
    this.listeners.set('online', new Set());
    this.listeners.set('offline', new Set());
    this.listeners.set('change', new Set());
  }

  /**
   * Start monitoring network status
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;

    // Listen to browser events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
      
      // Listen to connection changes if available
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connection?.addEventListener('change', this.handleConnectionChange);
      }
    }

    // Start periodic connectivity checks
    this.checkInterval = setInterval(() => {
      this.checkConnectivity();
    }, this.config.checkInterval);

    // Initial connectivity check
    this.checkConnectivity();
  }

  /**
   * Stop monitoring network status
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    // Remove browser event listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
      
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connection?.removeEventListener('change', this.handleConnectionChange);
      }
    }

    // Clear interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }
  }

  /**
   * Add event listener
   */
  addEventListener(event: NetworkEventType, listener: NetworkEventListener): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.add(listener);
    }
  }

  /**
   * Remove event listener
   */
  removeEventListener(event: NetworkEventType, listener: NetworkEventListener): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * Get current network status
   */
  getNetworkStatus(): NetworkStatus {
    return { ...this.currentStatus };
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return this.currentStatus.isOnline;
  }

  /**
   * Manually trigger connectivity check
   */
  async checkConnectivity(): Promise<NetworkStatus> {
    const status = await this.performConnectivityCheck();
    this.updateNetworkStatus(status);
    return status;
  }

  /**
   * Get initial network status from browser APIs
   */
  private getInitialNetworkStatus(): NetworkStatus {
    const status: NetworkStatus = {
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    };

    // Add connection information if available
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        status.connectionType = connection.type;
        status.effectiveType = connection.effectiveType;
        status.downlink = connection.downlink;
        status.rtt = connection.rtt;
      }
    }

    return status;
  }

  /**
   * Perform actual connectivity check by testing URLs
   */
  private async performConnectivityCheck(): Promise<NetworkStatus> {
    const status = this.getInitialNetworkStatus();

    // If browser says we're offline, trust it
    if (!status.isOnline) {
      return status;
    }

    // Test actual connectivity
    let isReallyOnline = false;
    
    for (const url of this.config.testUrls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutDuration);
        
        const _response = await fetch(url, {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        // If we get any response, we're online
        isReallyOnline = true;
        break;
      } catch (error) {
        // Continue to next URL
        continue;
      }
    }

    status.isOnline = isReallyOnline;
    return status;
  }

  /**
   * Update network status and notify listeners
   */
  private updateNetworkStatus(newStatus: NetworkStatus): void {
    const wasOnline = this.currentStatus.isOnline;
    const isOnline = newStatus.isOnline;
    
    this.currentStatus = newStatus;

    // Notify change listeners
    this.notifyListeners('change', newStatus);

    // Notify specific status listeners
    if (wasOnline !== isOnline) {
      if (isOnline) {
        this.notifyListeners('online', newStatus);
      } else {
        this.notifyListeners('offline', newStatus);
      }
    }
  }

  /**
   * Notify listeners of network events
   */
  private notifyListeners(event: NetworkEventType, status: NetworkStatus): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(status);
        } catch (error) {
          console.error('Error in network status listener:', error);
        }
      });
    }
  }

  /**
   * Handle browser online event
   */
  private handleOnline = (): void => {
    this.checkConnectivity();
  };

  /**
   * Handle browser offline event
   */
  private handleOffline = (): void => {
    const status: NetworkStatus = {
      ...this.currentStatus,
      isOnline: false,
    };
    this.updateNetworkStatus(status);
  };

  /**
   * Handle connection change event
   */
  private handleConnectionChange = (): void => {
    this.checkConnectivity();
  };
}

// Retry with network awareness
export interface NetworkAwareRetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  networkCheckInterval: number;
  waitForOnline: boolean;
}

const DEFAULT_NETWORK_RETRY_CONFIG: NetworkAwareRetryConfig = {
  maxRetries: 5,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  networkCheckInterval: 1000,
  waitForOnline: true,
};

/**
 * Retry operation with network awareness
 */
export async function retryWithNetworkAwareness<T>(
  operation: () => Promise<T>,
  networkMonitor: NetworkMonitor,
  config: NetworkAwareRetryConfig = DEFAULT_NETWORK_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // Check if we're online before attempting
      if (!networkMonitor.isOnline()) {
        if (config.waitForOnline) {
          await waitForOnline(networkMonitor, config.networkCheckInterval);
        } else {
          throw new Error('Network is offline');
        }
      }
      
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Don't retry on last attempt
      if (attempt === config.maxRetries) {
        break;
      }
      
      // Calculate delay for next attempt
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelay
      );
      
      // Add jitter
      const jitteredDelay = delay + Math.random() * 1000;
      
      await sleep(jitteredDelay);
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

/**
 * Wait for network to come online
 */
export function waitForOnline(
  networkMonitor: NetworkMonitor,
  checkInterval: number = 1000 // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<void> {
  return new Promise((resolve) => {
    if (networkMonitor.isOnline()) {
      resolve();
      return;
    }
    
    const onOnline = () => {
      networkMonitor.removeEventListener('online', onOnline);
      resolve();
    };
    
    networkMonitor.addEventListener('online', onOnline);
  });
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Note: React hook is available in the NetworkStatus component file

// Global network monitor instance
export const globalNetworkMonitor = new NetworkMonitor();

// Auto-start monitoring in browser environment
if (typeof window !== 'undefined') {
  globalNetworkMonitor.startMonitoring();
}

// Utility functions for common use cases
export function isOnline(): boolean {
  return globalNetworkMonitor.isOnline();
}

export function getNetworkStatus(): NetworkStatus {
  return globalNetworkMonitor.getNetworkStatus();
}

export function onNetworkChange(listener: NetworkEventListener): () => void {
  globalNetworkMonitor.addEventListener('change', listener);
  return () => globalNetworkMonitor.removeEventListener('change', listener);
}

export function onOnline(listener: NetworkEventListener): () => void {
  globalNetworkMonitor.addEventListener('online', listener);
  return () => globalNetworkMonitor.removeEventListener('online', listener);
}

export function onOffline(listener: NetworkEventListener): () => void {
  globalNetworkMonitor.addEventListener('offline', listener);
  return () => globalNetworkMonitor.removeEventListener('offline', listener);
}

