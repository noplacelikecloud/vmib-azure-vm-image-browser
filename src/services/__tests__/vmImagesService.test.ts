import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  VMImagesService, 
  VMImagesServiceError,
  createVMImagesService 
} from '../vmImagesService';
import { TokenProvider } from '../subscriptionService';
import { Publisher, Offer, SKU } from '../../types';

// Mock token provider for testing
class MockTokenProvider implements TokenProvider {
  private token: string;
  private shouldFail: boolean;

  constructor(token: string = 'mock-token', shouldFail: boolean = false) {
    this.token = token;
    this.shouldFail = shouldFail;
  }

  async getAccessToken(): Promise<string> {
    if (this.shouldFail) {
      throw new Error('Token acquisition failed');
    }
    return this.token;
  }

  setToken(token: string) {
    this.token = token;
  }

  setShouldFail(shouldFail: boolean) {
    this.shouldFail = shouldFail;
  }
}

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('VMImagesService', () => {
  let tokenProvider: MockTokenProvider;
  let vmImagesService: VMImagesService;

  beforeEach(() => {
    tokenProvider = new MockTokenProvider();
    vmImagesService = new VMImagesService(tokenProvider);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getPublishers', () => {
    it('should fetch publishers successfully', async () => {
      const mockPublishers = {
        value: [
          { name: 'Microsoft' },
          { name: 'Canonical' },
          { name: 'RedHat' },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPublishers,
      });

      const result = await vmImagesService.getPublishers('sub-1', 'eastus');

      expect(result).toEqual([
        { name: 'Microsoft', displayName: 'Microsoft', location: 'eastus' },
        { name: 'Canonical', displayName: 'Canonical', location: 'eastus' },
        { name: 'RedHat', displayName: 'RedHat', location: 'eastus' },
      ]);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://management.azure.com/subscriptions/sub-1/providers/Microsoft.Compute/locations/eastus/publishers?api-version=2023-07-01',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should use default location when not specified', async () => {
      const mockPublishers = { value: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPublishers,
      });

      await vmImagesService.getPublishers('sub-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/locations/eastus/publishers'),
        expect.any(Object)
      );
    });

    it('should throw error for missing subscription ID', async () => {
      await expect(vmImagesService.getPublishers('')).rejects.toThrow(
        new VMImagesServiceError('Subscription ID is required')
      );
    });

    it('should handle invalid response format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'response' }),
      });

      await expect(vmImagesService.getPublishers('sub-1')).rejects.toThrow(
        VMImagesServiceError
      );
    });

    it('should cache publishers data', async () => {
      const mockPublishers = { value: [{ name: 'Microsoft' }] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPublishers,
      });

      // First call
      const result1 = await vmImagesService.getPublishers('sub-1', 'eastus');
      
      // Second call should use cache
      const result2 = await vmImagesService.getPublishers('sub-1', 'eastus');

      expect(result1).toEqual(result2);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getOffers', () => {
    it('should fetch offers successfully', async () => {
      const mockOffers = {
        value: [
          { name: 'WindowsServer' },
          { name: 'SQL2019-WS2019' },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOffers,
      });

      const result = await vmImagesService.getOffers('sub-1', 'Microsoft', 'eastus');

      expect(result).toEqual([
        { name: 'WindowsServer', displayName: 'WindowsServer', publisher: 'Microsoft', location: 'eastus' },
        { name: 'SQL2019-WS2019', displayName: 'SQL2019-WS2019', publisher: 'Microsoft', location: 'eastus' },
      ]);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://management.azure.com/subscriptions/sub-1/providers/Microsoft.Compute/locations/eastus/publishers/Microsoft/artifacttypes/vmimage/offers?api-version=2023-07-01',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      );
    });

    it('should throw error for missing required parameters', async () => {
      await expect(vmImagesService.getOffers('', 'Microsoft')).rejects.toThrow(
        new VMImagesServiceError('Subscription ID and publisher name are required')
      );

      await expect(vmImagesService.getOffers('sub-1', '')).rejects.toThrow(
        new VMImagesServiceError('Subscription ID and publisher name are required')
      );
    });

    it('should cache offers data', async () => {
      const mockOffers = { value: [{ name: 'WindowsServer' }] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOffers,
      });

      // First call
      const result1 = await vmImagesService.getOffers('sub-1', 'Microsoft', 'eastus');
      
      // Second call should use cache
      const result2 = await vmImagesService.getOffers('sub-1', 'Microsoft', 'eastus');

      expect(result1).toEqual(result2);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getSKUs', () => {
    it('should fetch SKUs with versions successfully', async () => {
      const mockSKUs = {
        value: [
          { name: '2019-Datacenter' },
          { name: '2022-Datacenter' },
        ],
      };

      const mockVersions = {
        value: [
          { name: '17763.1.190108' },
          { name: '17763.2.190208' },
        ],
      };

      // Mock SKUs call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSKUs,
      });

      // Mock versions calls for each SKU
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVersions,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVersions,
      });

      const result = await vmImagesService.getSKUs('sub-1', 'Microsoft', 'WindowsServer', 'eastus');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: '2019-Datacenter',
        displayName: '2019-Datacenter',
        publisher: 'Microsoft',
        offer: 'WindowsServer',
        location: 'eastus',
        versions: ['17763.2.190208', '17763.1.190108'], // Sorted descending
      });

      expect(mockFetch).toHaveBeenCalledTimes(3); // 1 for SKUs + 2 for versions
    });

    it('should handle SKUs with no versions gracefully', async () => {
      const mockSKUs = {
        value: [{ name: '2019-Datacenter' }],
      };

      // Mock SKUs call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSKUs,
      });

      // Mock versions call that fails
      mockFetch.mockRejectedValueOnce(new Error('Versions not found'));

      const result = await vmImagesService.getSKUs('sub-1', 'Microsoft', 'WindowsServer', 'eastus');

      expect(result).toHaveLength(1);
      expect(result[0].versions).toEqual([]);
    }, 10000);

    it('should throw error for missing required parameters', async () => {
      await expect(vmImagesService.getSKUs('', 'Microsoft', 'WindowsServer')).rejects.toThrow(
        new VMImagesServiceError('Subscription ID, publisher name, and offer name are required')
      );

      await expect(vmImagesService.getSKUs('sub-1', '', 'WindowsServer')).rejects.toThrow(
        new VMImagesServiceError('Subscription ID, publisher name, and offer name are required')
      );

      await expect(vmImagesService.getSKUs('sub-1', 'Microsoft', '')).rejects.toThrow(
        new VMImagesServiceError('Subscription ID, publisher name, and offer name are required')
      );
    });

    it('should cache SKUs data', async () => {
      const mockSKUs = { value: [{ name: '2019-Datacenter' }] };
      const mockVersions = { value: [{ name: '17763.1.190108' }] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSKUs,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVersions,
      });

      // First call
      const result1 = await vmImagesService.getSKUs('sub-1', 'Microsoft', 'WindowsServer', 'eastus');
      
      // Second call should use cache
      const result2 = await vmImagesService.getSKUs('sub-1', 'Microsoft', 'WindowsServer', 'eastus');

      expect(result1).toEqual(result2);
      expect(mockFetch).toHaveBeenCalledTimes(2); // Only initial calls, no cache calls
    });
  });

  describe('error handling', () => {
    it('should handle authentication failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(vmImagesService.getPublishers('sub-1')).rejects.toThrow(
        new VMImagesServiceError('Authentication failed', 401, false)
      );
    });

    it('should handle permission errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

      await expect(vmImagesService.getPublishers('sub-1')).rejects.toThrow(
        new VMImagesServiceError('Insufficient permissions to access VM images', 403, false)
      );
    });

    it('should retry on rate limit', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Map([['Retry-After', '1']]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ value: [] }),
        });

      const result = await vmImagesService.getPublishers('sub-1');

      expect(result).toEqual([]);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should retry on server errors', async () => {
      const retryConfig = { maxRetries: 1, baseDelay: 10, maxDelay: 100 };
      const service = new VMImagesService(tokenProvider, undefined, undefined, retryConfig);

      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ value: [] }),
        });

      const result = await service.getPublishers('sub-1');

      expect(result).toEqual([]);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    }, 10000);

    it('should handle token provider failure', async () => {
      tokenProvider.setShouldFail(true);

      await expect(vmImagesService.getPublishers('sub-1')).rejects.toThrow(
        VMImagesServiceError
      );
      
      expect(mockFetch).not.toHaveBeenCalled();
    }, 10000);
  });

  describe('cache management', () => {
    it('should clear all cache', async () => {
      const mockData = { value: [{ name: 'test' }] };

      // Populate cache
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      await vmImagesService.getPublishers('sub-1');
      await vmImagesService.getOffers('sub-1', 'Microsoft');

      // Clear cache
      vmImagesService.clearCache();

      // Next calls should hit API again
      await vmImagesService.getPublishers('sub-1');
      await vmImagesService.getOffers('sub-1', 'Microsoft');

      expect(mockFetch).toHaveBeenCalledTimes(4); // 2 initial + 2 after cache clear
    });

    it('should clear cache for specific subscription', async () => {
      const mockData = { value: [{ name: 'test' }] };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      // Populate cache for different subscriptions
      await vmImagesService.getPublishers('sub-1');
      await vmImagesService.getPublishers('sub-2');

      // Clear cache for sub-1 only
      vmImagesService.clearCacheForSubscription('sub-1');

      // sub-1 should hit API, sub-2 should use cache
      await vmImagesService.getPublishers('sub-1');
      await vmImagesService.getPublishers('sub-2');

      expect(mockFetch).toHaveBeenCalledTimes(3); // 2 initial + 1 for sub-1 after clear
    });
  });

  describe('rate limiting', () => {
    it('should enforce rate limits', async () => {
      const rateLimitConfig = {
        maxRequestsPerMinute: 2,
        requestWindow: 1000, // 1 second for testing
      };

      const service = new VMImagesService(tokenProvider, rateLimitConfig);
      const mockData = { value: [] };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const startTime = Date.now();

      // Make 3 requests quickly
      await service.getPublishers('sub-1');
      await service.getPublishers('sub-2');
      await service.getPublishers('sub-3'); // This should be delayed

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should take at least 1 second due to rate limiting
      expect(duration).toBeGreaterThan(900);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    }, 10000);
  });
});

describe('createVMImagesService', () => {
  it('should create VM images service', () => {
    const mockTokenProvider = new MockTokenProvider();
    const service = createVMImagesService(mockTokenProvider);

    expect(service).toBeInstanceOf(VMImagesService);
  });
});