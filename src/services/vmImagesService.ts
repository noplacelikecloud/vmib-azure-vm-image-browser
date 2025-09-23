import type { Publisher, Offer, SKU } from '../types';
import type { TokenProvider } from './subscriptionService';
import {
  AppError,
  enhancedFetch,
  withRetry,
  DEFAULT_RETRY_CONFIG,
  CircuitBreaker,
  DEFAULT_CIRCUIT_BREAKER_CONFIG,
} from '../utils/errorHandling';
import type { RetryConfig, CircuitBreakerConfig } from '../utils/errorHandling';

// Azure Resource Manager API base URL
const ARM_BASE_URL = 'https://management.azure.com';

// Cache interface for API responses
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface VMImagesCache {
  publishers: Map<string, CacheEntry<Publisher[]>>;
  offers: Map<string, CacheEntry<Offer[]>>;
  skus: Map<string, CacheEntry<SKU[]>>;
}

// Rate limiting configuration
interface RateLimitConfig {
  maxRequestsPerMinute: number;
  requestWindow: number; // in milliseconds
}

const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  maxRequestsPerMinute: 60,
  requestWindow: 60000, // 1 minute
};

// Cache configuration
interface CacheConfig {
  publishersTTL: number;
  offersTTL: number;
  skusTTL: number;
}

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  publishersTTL: 300000, // 5 minutes
  offersTTL: 300000, // 5 minutes
  skusTTL: 300000, // 5 minutes
};

// Service configuration
interface VMImagesServiceConfig {
  rateLimitConfig: RateLimitConfig;
  cacheConfig: CacheConfig;
  retryConfig: RetryConfig;
  circuitBreakerConfig: CircuitBreakerConfig;
}

const DEFAULT_SERVICE_CONFIG: VMImagesServiceConfig = {
  rateLimitConfig: DEFAULT_RATE_LIMIT_CONFIG,
  cacheConfig: DEFAULT_CACHE_CONFIG,
  retryConfig: DEFAULT_RETRY_CONFIG,
  circuitBreakerConfig: DEFAULT_CIRCUIT_BREAKER_CONFIG,
};

// Request tracking for rate limiting
interface RequestTracker {
  timestamps: number[];
}

// Legacy error class for backward compatibility
export class VMImagesServiceError extends AppError {
  readonly code = 'VM_IMAGES_SERVICE_ERROR';
  readonly userMessage = 'Failed to load VM image data. Please try again.';
  readonly retryable = true;
}

export class VMImagesService {
  private tokenProvider: TokenProvider;
  private cache: VMImagesCache;
  private config: VMImagesServiceConfig;
  private requestTracker: RequestTracker;
  private circuitBreaker: CircuitBreaker;

  constructor(
    tokenProvider: TokenProvider,
    config: VMImagesServiceConfig = DEFAULT_SERVICE_CONFIG
  ) {
    this.tokenProvider = tokenProvider;
    this.config = config;
    this.requestTracker = { timestamps: [] };
    this.circuitBreaker = new CircuitBreaker(config.circuitBreakerConfig);
    this.cache = {
      publishers: new Map(),
      offers: new Map(),
      skus: new Map(),
    };
  }

  /**
   * Get all VM image publishers for a subscription
   */
  async getPublishers(
    subscriptionId: string,
    location: string = 'eastus'
  ): Promise<Publisher[]> {
    if (!subscriptionId) {
      throw new VMImagesServiceError('Subscription ID is required');
    }

    const cacheKey = `${subscriptionId}-${location}`;
    const cached = this.getCachedData(this.cache.publishers, cacheKey);
    if (cached) {
      return cached;
    }

    const url = `${ARM_BASE_URL}/subscriptions/${subscriptionId}/providers/Microsoft.Compute/locations/${location}/publishers?api-version=2023-07-01`;
    return this.circuitBreaker.execute(async () => {
      const response = await this.makeRateLimitedRequest(url);
      const data = await response.json();

      // Handle both response formats: direct array or wrapped in 'value' property
      const publishersArray = Array.isArray(data) ? data : data.value;

      if (!publishersArray || !Array.isArray(publishersArray)) {
        console.error('Publishers API Response:', data);
        throw new VMImagesServiceError(
          `Invalid response format from publishers API. Response: ${JSON.stringify(data)}`
        );
      }

      const publishers: Publisher[] = publishersArray.map((pub: any) => ({
        name: pub.name,
        displayName: pub.name, // Publishers typically don't have separate display names
        location: location,
      }));

      this.setCachedData(
        this.cache.publishers,
        cacheKey,
        publishers,
        this.config.cacheConfig.publishersTTL
      );
      return publishers;
    });
  }

  /**
   * Get all offers for a specific publisher
   */
  async getOffers(
    subscriptionId: string,
    publisherName: string,
    location: string = 'eastus'
  ): Promise<Offer[]> {
    if (!subscriptionId || !publisherName) {
      throw new VMImagesServiceError(
        'Subscription ID and publisher name are required'
      );
    }

    const cacheKey = `${subscriptionId}-${publisherName}-${location}`;
    const cached = this.getCachedData(this.cache.offers, cacheKey);
    if (cached) {
      return cached;
    }

    const url = `${ARM_BASE_URL}/subscriptions/${subscriptionId}/providers/Microsoft.Compute/locations/${location}/publishers/${publisherName}/artifacttypes/vmimage/offers?api-version=2023-07-01`;

    return this.circuitBreaker.execute(async () => {
      const response = await this.makeRateLimitedRequest(url);
      const data = await response.json();

      // Handle both response formats: direct array or wrapped in 'value' property
      const offersArray = Array.isArray(data) ? data : data.value;

      if (!offersArray || !Array.isArray(offersArray)) {
        console.error('Offers API Response:', data);
        throw new VMImagesServiceError(
          `Invalid response format from offers API. Response: ${JSON.stringify(data)}`
        );
      }

      const offers: Offer[] = offersArray.map((offer: any) => ({
        name: offer.name,
        displayName: offer.name,
        publisher: publisherName,
        location: location,
      }));

      this.setCachedData(
        this.cache.offers,
        cacheKey,
        offers,
        this.config.cacheConfig.offersTTL
      );
      return offers;
    });
  }

  /**
   * Get all SKUs for a specific offer
   */
  async getSKUs(
    subscriptionId: string,
    publisherName: string,
    offerName: string,
    location: string = 'eastus'
  ): Promise<SKU[]> {
    if (!subscriptionId || !publisherName || !offerName) {
      throw new VMImagesServiceError(
        'Subscription ID, publisher name, and offer name are required'
      );
    }

    const cacheKey = `${subscriptionId}-${publisherName}-${offerName}-${location}`;
    const cached = this.getCachedData(this.cache.skus, cacheKey);
    if (cached) {
      return cached;
    }

    const url = `${ARM_BASE_URL}/subscriptions/${subscriptionId}/providers/Microsoft.Compute/locations/${location}/publishers/${publisherName}/artifacttypes/vmimage/offers/${offerName}/skus?api-version=2023-07-01`;
    console.log('Fetching SKUs from URL:', url);

    return this.circuitBreaker.execute(async () => {
      const response = await this.makeRateLimitedRequest(url);
      console.log(
        'SKUs API Response Status:',
        response.status,
        response.statusText
      );
      const data = await response.json();
      console.log('SKUs API Response Data:', data);

      // Handle both response formats: direct array or wrapped in 'value' property
      const skusArray = Array.isArray(data) ? data : data.value;

      if (!skusArray || !Array.isArray(skusArray)) {
        console.error('SKUs API Response:', data);
        throw new VMImagesServiceError(
          `Invalid response format from SKUs API. Response: ${JSON.stringify(data)}`
        );
      }

      // Return SKUs without versions - versions will be loaded on demand
      const skus = skusArray.map((sku: any) => ({
        name: sku.name,
        displayName: sku.name,
        publisher: publisherName,
        offer: offerName,
        location: location,
        versions: [], // Empty array - versions loaded on demand
      }));

      this.setCachedData(
        this.cache.skus,
        cacheKey,
        skus,
        this.config.cacheConfig.skusTTL
      );
      return skus;
    });
  }

  /**
   * Get versions for a specific SKU
   */
  async getSKUVersions(
    subscriptionId: string,
    publisherName: string,
    offerName: string,
    skuName: string,
    location: string = 'eastus'
  ): Promise<string[]> {
    if (!subscriptionId || !publisherName || !offerName || !skuName) {
      throw new VMImagesServiceError(
        'Subscription ID, publisher name, offer name, and SKU name are required'
      );
    }

    // Try multiple API versions in case one doesn't work
    const apiVersions = [
      '2023-07-01',
      '2023-03-01',
      '2022-11-01',
      '2022-08-01',
    ];

    for (const apiVersion of apiVersions) {
      const url = `${ARM_BASE_URL}/subscriptions/${subscriptionId}/providers/Microsoft.Compute/locations/${location}/publishers/${publisherName}/artifacttypes/vmimage/offers/${offerName}/skus/${skuName}/versions?api-version=${apiVersion}`;
      console.log(`Trying SKU versions API with version ${apiVersion}:`, url);

      try {
        const response = await this.makeRateLimitedRequest(url);
        console.log(
          `SKU Versions API Response Status (${apiVersion}):`,
          response.status,
          response.statusText
        );

        if (!response.ok) {
          console.warn(
            `API version ${apiVersion} failed:`,
            response.status,
            response.statusText
          );
          if (response.status === 404 || response.status === 400) {
            // Try next API version
            continue;
          }
          const errorText = await response.text();
          console.error('Error response body:', errorText);
          continue;
        }

        const data = await response.json();
        console.log(`SKU Versions API Response Data (${apiVersion}):`, data);

        // Handle both response formats: direct array or wrapped in 'value' property
        const versionsArray = Array.isArray(data) ? data : data.value;

        if (!versionsArray || !Array.isArray(versionsArray)) {
          console.warn(`API version ${apiVersion} returned non-array:`, data);
          continue;
        }

        const versions = versionsArray
          .map((version: any) => version.name)
          .filter((name: string) => name && typeof name === 'string')
          .sort((a: string, b: string) => {
            // Put 'latest' first, then sort others in descending order
            if (a === 'latest') return -1;
            if (b === 'latest') return 1;
            return b.localeCompare(a, undefined, { numeric: true });
          });

        console.log(
          `Successfully processed versions with API ${apiVersion}:`,
          versions
        );
        return versions;
      } catch (error) {
        console.warn(`Error with API version ${apiVersion}:`, error);
        continue;
      }
    }

    console.error('All API versions failed for getSKUVersions');
    return [];
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.publishers.clear();
    this.cache.offers.clear();
    this.cache.skus.clear();
  }

  /**
   * Clear cache for specific subscription
   */
  clearCacheForSubscription(subscriptionId: string): void {
    // Clear publishers cache
    for (const [key] of this.cache.publishers) {
      if (key.startsWith(subscriptionId)) {
        this.cache.publishers.delete(key);
      }
    }

    // Clear offers cache
    for (const [key] of this.cache.offers) {
      if (key.startsWith(subscriptionId)) {
        this.cache.offers.delete(key);
      }
    }

    // Clear SKUs cache
    for (const [key] of this.cache.skus) {
      if (key.startsWith(subscriptionId)) {
        this.cache.skus.delete(key);
      }
    }
  }

  /**
   * Get cached data if it exists and is not expired
   */
  private getCachedData<T>(
    cache: Map<string, CacheEntry<T>>,
    key: string
  ): T | null {
    const entry = cache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cached data with TTL
   */
  private setCachedData<T>(
    cache: Map<string, CacheEntry<T>>,
    key: string,
    data: T,
    ttl: number
  ): void {
    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Make a rate-limited HTTP request with enhanced error handling
   */
  private async makeRateLimitedRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    // Check rate limit
    await this.enforceRateLimit();

    return withRetry(async () => {
      const token = await this.tokenProvider.getAccessToken();

      const response = await enhancedFetch(
        url,
        {
          ...options,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers,
          },
        },
        this.config.retryConfig
      );

      // Track successful request
      this.trackRequest();
      return response;
    }, this.config.retryConfig);
  }

  /**
   * Enforce rate limiting
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const windowStart = now - this.config.rateLimitConfig.requestWindow;

    // Remove old timestamps
    this.requestTracker.timestamps = this.requestTracker.timestamps.filter(
      (timestamp) => timestamp > windowStart
    );

    // Check if we're at the limit
    if (
      this.requestTracker.timestamps.length >=
      this.config.rateLimitConfig.maxRequestsPerMinute
    ) {
      const oldestRequest = this.requestTracker.timestamps[0];
      const waitTime =
        this.config.rateLimitConfig.requestWindow - (now - oldestRequest);

      if (waitTime > 0) {
        await this.sleep(waitTime);
      }
    }
  }

  /**
   * Track a request for rate limiting
   */
  private trackRequest(): void {
    this.requestTracker.timestamps.push(Date.now());
  }

  /**
   * Sleep utility for rate limiting delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Factory function to create VM images service
export function createVMImagesService(
  tokenProvider: TokenProvider
): VMImagesService {
  return new VMImagesService(tokenProvider);
}

// Default instance for testing and development
// In a real app, this would be properly initialized with MSAL
export const vmImagesService = new VMImagesService({
  async getAccessToken(): Promise<string> {
    // This is a placeholder - in real usage, this would be replaced with proper MSAL integration
    throw new VMImagesServiceError('Token provider not initialized');
  },
});
