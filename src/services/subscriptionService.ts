import type { AccountInfo } from '@azure/msal-browser';
import type { Subscription, AzureLocation } from '../types';
import {
  AppError,
  AuthenticationError,
  enhancedFetch,
  withRetry,
  DEFAULT_RETRY_CONFIG,
  CircuitBreaker,
  DEFAULT_CIRCUIT_BREAKER_CONFIG,
} from '../utils/errorHandling';
import type { RetryConfig, CircuitBreakerConfig } from '../utils/errorHandling';

// Azure Resource Manager API base URL
const ARM_BASE_URL = 'https://management.azure.com';

// Legacy error class for backward compatibility
export class SubscriptionServiceError extends AppError {
  readonly code = 'SUBSCRIPTION_SERVICE_ERROR';
  readonly userMessage =
    'Failed to access subscription data. Please try again.';
  readonly retryable = true;
}

// Service configuration
interface SubscriptionServiceConfig {
  retryConfig: RetryConfig;
  circuitBreakerConfig: CircuitBreakerConfig;
}

const DEFAULT_SERVICE_CONFIG: SubscriptionServiceConfig = {
  retryConfig: DEFAULT_RETRY_CONFIG,
  circuitBreakerConfig: DEFAULT_CIRCUIT_BREAKER_CONFIG,
};

// Token provider interface for dependency injection
export interface TokenProvider {
  getAccessToken(): Promise<string>;
}

// Subscription service class
export class SubscriptionService {
  private tokenProvider: TokenProvider;
  private config: SubscriptionServiceConfig;
  private circuitBreaker: CircuitBreaker;

  constructor(
    tokenProvider: TokenProvider,
    config: SubscriptionServiceConfig = DEFAULT_SERVICE_CONFIG
  ) {
    this.tokenProvider = tokenProvider;
    this.config = config;
    this.circuitBreaker = new CircuitBreaker(config.circuitBreakerConfig);
  }

  /**
   * Get access token from the token provider
   */
  async getAccessToken(): Promise<string> {
    return this.tokenProvider.getAccessToken();
  }

  /**
   * Fetch all accessible Azure subscriptions for the authenticated user
   */
  async getSubscriptions(): Promise<Subscription[]> {
    const url = `${ARM_BASE_URL}/subscriptions?api-version=2020-01-01`;

    return this.circuitBreaker.execute(async () => {
      const response = await this.makeAuthenticatedRequest(url);
      const data = await response.json();

      if (!data.value || !Array.isArray(data.value)) {
        throw new SubscriptionServiceError(
          'Invalid response format from subscriptions API'
        );
      }

      return data.value.map((sub: any) => ({
        subscriptionId: sub.subscriptionId,
        displayName: sub.displayName,
        state: sub.state,
        tenantId: sub.tenantId, // Include tenant ID for tenant-aware operations
      }));
    });
  }

  /**
   * Get details for a specific subscription
   */
  async getSubscription(subscriptionId: string): Promise<Subscription> {
    if (!subscriptionId) {
      throw new SubscriptionServiceError('Subscription ID is required');
    }

    const url = `${ARM_BASE_URL}/subscriptions/${subscriptionId}?api-version=2020-01-01`;

    return this.circuitBreaker.execute(async () => {
      const response = await this.makeAuthenticatedRequest(url);
      const data = await response.json();

      return {
        subscriptionId: data.subscriptionId,
        displayName: data.displayName,
        state: data.state,
        tenantId: data.tenantId, // Include tenant ID for tenant-aware operations
      };
    });
  }

  /**
   * Get all available locations for a subscription
   */
  async getLocations(subscriptionId: string): Promise<AzureLocation[]> {
    if (!subscriptionId) {
      throw new SubscriptionServiceError('Subscription ID is required');
    }

    const url = `${ARM_BASE_URL}/subscriptions/${subscriptionId}/locations?api-version=2022-12-01`;
    
    return this.circuitBreaker.execute(async () => {
      const response = await this.makeAuthenticatedRequest(url);
      const data = await response.json();
      
      if (!data.value || !Array.isArray(data.value)) {
        throw new SubscriptionServiceError('Invalid response format from locations API');
      }

      return data.value.map((location: any) => ({
        name: location.name,
        displayName: location.displayName,
        regionalDisplayName: location.regionalDisplayName,
      }));
    });
  }

  /**
   * Make an authenticated HTTP request with enhanced error handling
   */
  private async makeAuthenticatedRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    return withRetry(async () => {
      const token = await this.tokenProvider.getAccessToken();

      return enhancedFetch(
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
    }, this.config.retryConfig);
  }
}

// MSAL Token Provider implementation
export class MSALTokenProvider implements TokenProvider {
  private msalInstance: any;
  private account: AccountInfo | null;
  private tenantId?: string;

  constructor(msalInstance: any, account: AccountInfo | null, tenantId?: string) {
    this.msalInstance = msalInstance;
    this.account = account;
    this.tenantId = tenantId;
  }

  async getAccessToken(): Promise<string> {
    if (!this.account) {
      throw new AuthenticationError('No authenticated account available');
    }

    try {
      const tokenRequest: any = {
        scopes: ['https://management.azure.com/user_impersonation'],
        account: this.account,
        forceRefresh: false,
      };

      // If a specific tenant is provided, use tenant-specific authority
      if (this.tenantId) {
        tokenRequest.authority = `https://login.microsoftonline.com/${this.tenantId}`;
      }

      const response = await this.msalInstance.acquireTokenSilent(tokenRequest);
      return response.accessToken;
    } catch (error) {
      // If silent token acquisition fails, try interactive
      try {
        const tokenRequest: any = {
          scopes: ['https://management.azure.com/user_impersonation'],
          account: this.account,
        };

        // If a specific tenant is provided, use tenant-specific authority
        if (this.tenantId) {
          tokenRequest.authority = `https://login.microsoftonline.com/${this.tenantId}`;
        }

        const response =
          await this.msalInstance.acquireTokenPopup(tokenRequest);
        return response.accessToken;
      } catch (interactiveError) {
        throw new AuthenticationError(
          `Failed to acquire access token: ${interactiveError instanceof Error ? interactiveError.message : 'Unknown error'}`
        );
      }
    }
  }
}

// Factory function to create subscription service with MSAL
export function createSubscriptionService(
  msalInstance: any,
  account: AccountInfo | null,
  tenantId?: string
): SubscriptionService {
  const tokenProvider = new MSALTokenProvider(msalInstance, account, tenantId);
  return new SubscriptionService(tokenProvider);
}

// Factory function to create tenant-aware subscription service
export function createTenantAwareSubscriptionService(
  msalInstance: any,
  account: AccountInfo | null,
  subscription: Subscription
): SubscriptionService {
  return createSubscriptionService(msalInstance, account, subscription.tenantId);
}

// Default instance for testing and development
// In a real app, this would be properly initialized with MSAL
export const subscriptionService = new SubscriptionService({
  async getAccessToken(): Promise<string> {
    // This is a placeholder - in real usage, this would be replaced with proper MSAL integration
    throw new AuthenticationError('Token provider not initialized');
  },
});
