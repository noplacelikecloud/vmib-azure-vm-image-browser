import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  SubscriptionService, 
  SubscriptionServiceError, 
  TokenProvider,
  MSALTokenProvider,
  createSubscriptionService 
} from '../subscriptionService';
import { Subscription } from '../../types';

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

describe('SubscriptionService', () => {
  let tokenProvider: MockTokenProvider;
  let subscriptionService: SubscriptionService;

  beforeEach(() => {
    tokenProvider = new MockTokenProvider();
    subscriptionService = new SubscriptionService(tokenProvider);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getSubscriptions', () => {
    it('should fetch subscriptions successfully', async () => {
      const mockSubscriptions = {
        value: [
          {
            subscriptionId: 'sub-1',
            displayName: 'Test Subscription 1',
            state: 'Enabled',
          },
          {
            subscriptionId: 'sub-2',
            displayName: 'Test Subscription 2',
            state: 'Enabled',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubscriptions,
      });

      const result = await subscriptionService.getSubscriptions();

      expect(result).toEqual([
        {
          subscriptionId: 'sub-1',
          displayName: 'Test Subscription 1',
          state: 'Enabled',
        },
        {
          subscriptionId: 'sub-2',
          displayName: 'Test Subscription 2',
          state: 'Enabled',
        },
      ]);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://management.azure.com/subscriptions?api-version=2020-01-01',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle invalid response format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'response' }),
      });

      await expect(subscriptionService.getSubscriptions()).rejects.toThrow(
        SubscriptionServiceError
      );
    });

    it('should handle authentication failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(subscriptionService.getSubscriptions()).rejects.toThrow(
        new SubscriptionServiceError('Authentication failed', 401, false)
      );
    });

    it('should handle permission errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

      await expect(subscriptionService.getSubscriptions()).rejects.toThrow(
        new SubscriptionServiceError('Insufficient permissions to access subscriptions', 403, false)
      );
    });

    it('should retry on rate limit with Retry-After header', async () => {
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

      const result = await subscriptionService.getSubscriptions();

      expect(result).toEqual([]);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should retry on server errors', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ value: [] }),
        });

      const result = await subscriptionService.getSubscriptions();

      expect(result).toEqual([]);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      const retryConfig = { maxRetries: 2, baseDelay: 10, maxDelay: 100 };
      const service = new SubscriptionService(tokenProvider, retryConfig);

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(service.getSubscriptions()).rejects.toThrow(
        SubscriptionServiceError
      );

      expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should handle token provider failure', async () => {
      tokenProvider.setShouldFail(true);

      await expect(subscriptionService.getSubscriptions()).rejects.toThrow(
        SubscriptionServiceError
      );
      
      expect(mockFetch).not.toHaveBeenCalled();
    }, 10000);
  });

  describe('getSubscription', () => {
    it('should fetch single subscription successfully', async () => {
      const mockSubscription = {
        subscriptionId: 'sub-1',
        displayName: 'Test Subscription',
        state: 'Enabled',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubscription,
      });

      const result = await subscriptionService.getSubscription('sub-1');

      expect(result).toEqual({
        subscriptionId: 'sub-1',
        displayName: 'Test Subscription',
        state: 'Enabled',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://management.azure.com/subscriptions/sub-1?api-version=2020-01-01',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      );
    });

    it('should throw error for empty subscription ID', async () => {
      await expect(subscriptionService.getSubscription('')).rejects.toThrow(
        new SubscriptionServiceError('Subscription ID is required')
      );
    });

    it('should handle subscription not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Subscription not found',
      });

      await expect(subscriptionService.getSubscription('invalid-id')).rejects.toThrow(
        SubscriptionServiceError
      );
    });
  });
});

describe('MSALTokenProvider', () => {
  let mockMsalInstance: any;
  let mockAccount: any;
  let tokenProvider: MSALTokenProvider;

  beforeEach(() => {
    mockAccount = { homeAccountId: 'test-account' };
    mockMsalInstance = {
      acquireTokenSilent: vi.fn(),
      acquireTokenPopup: vi.fn(),
    };
    tokenProvider = new MSALTokenProvider(mockMsalInstance, mockAccount);
  });

  it('should acquire token silently', async () => {
    mockMsalInstance.acquireTokenSilent.mockResolvedValueOnce({
      accessToken: 'test-token',
    });

    const token = await tokenProvider.getAccessToken();

    expect(token).toBe('test-token');
    expect(mockMsalInstance.acquireTokenSilent).toHaveBeenCalledWith({
      scopes: ['https://management.azure.com/user_impersonation'],
      account: mockAccount,
      forceRefresh: false,
    });
  });

  it('should fallback to popup when silent fails', async () => {
    mockMsalInstance.acquireTokenSilent.mockRejectedValueOnce(new Error('Silent failed'));
    mockMsalInstance.acquireTokenPopup.mockResolvedValueOnce({
      accessToken: 'popup-token',
    });

    const token = await tokenProvider.getAccessToken();

    expect(token).toBe('popup-token');
    expect(mockMsalInstance.acquireTokenPopup).toHaveBeenCalledWith({
      scopes: ['https://management.azure.com/user_impersonation'],
      account: mockAccount,
    });
  });

  it('should throw error when no account is available', async () => {
    const providerWithoutAccount = new MSALTokenProvider(mockMsalInstance, null);

    await expect(providerWithoutAccount.getAccessToken()).rejects.toThrow(
      new SubscriptionServiceError('No authenticated account available')
    );
  });

  it('should throw error when both silent and popup fail', async () => {
    mockMsalInstance.acquireTokenSilent.mockRejectedValueOnce(new Error('Silent failed'));
    mockMsalInstance.acquireTokenPopup.mockRejectedValueOnce(new Error('Popup failed'));

    await expect(tokenProvider.getAccessToken()).rejects.toThrow(
      SubscriptionServiceError
    );
  });
});

describe('createSubscriptionService', () => {
  it('should create subscription service with MSAL token provider', () => {
    const mockMsalInstance = {};
    const mockAccount = { homeAccountId: 'test' };

    const service = createSubscriptionService(mockMsalInstance, mockAccount);

    expect(service).toBeInstanceOf(SubscriptionService);
  });
});