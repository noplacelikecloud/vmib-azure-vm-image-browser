/**
 * Centralized error handling utilities for API failures
 * Provides retry logic with exponential backoff and user-friendly error messages
 */

// Base error types
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly userMessage: string;
  abstract readonly retryable: boolean;
  
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Specific error types
export class NetworkError extends AppError {
  readonly code = 'NETWORK_ERROR';
  readonly userMessage = 'Network connection failed. Please check your internet connection and try again.';
  readonly retryable = true;
}

export class AuthenticationError extends AppError {
  readonly code = 'AUTHENTICATION_ERROR';
  readonly userMessage = 'Authentication failed. Please sign in again.';
  readonly retryable = false;
}

export class AuthorizationError extends AppError {
  readonly code = 'AUTHORIZATION_ERROR';
  readonly userMessage = 'You don\'t have permission to access this resource. Please contact your administrator.';
  readonly retryable = false;
}

export class RateLimitError extends AppError {
  readonly code = 'RATE_LIMIT_ERROR';
  readonly userMessage = 'Too many requests. Please wait a moment and try again.';
  readonly retryable = true;
  
  constructor(
    message: string,
    public readonly retryAfter?: number,
    statusCode?: number,
    originalError?: Error
  ) {
    super(message, statusCode, originalError);
  }
}

export class ServerError extends AppError {
  readonly code = 'SERVER_ERROR';
  readonly userMessage = 'Server is temporarily unavailable. Please try again in a few moments.';
  readonly retryable = true;
}

export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly userMessage = 'Invalid data provided. Please check your input and try again.';
  readonly retryable = false;
}

export class ServiceUnavailableError extends AppError {
  readonly code = 'SERVICE_UNAVAILABLE';
  readonly userMessage = 'Service is temporarily unavailable. Please try again later.';
  readonly retryable = true;
}

// Retry configuration
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  retryableErrors: [
    'NETWORK_ERROR',
    'RATE_LIMIT_ERROR',
    'SERVER_ERROR',
    'SERVICE_UNAVAILABLE'
  ]
};

// Circuit breaker configuration
export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
  monitoringPeriod: 300000, // 5 minutes
};

// Circuit breaker states
export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

// Circuit breaker implementation
export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private _lastFailureTime = 0;
  private nextAttemptTime = 0;

  constructor(private config: CircuitBreakerConfig = DEFAULT_CIRCUIT_BREAKER_CONFIG) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        throw new ServiceUnavailableError(
          'Circuit breaker is open - service temporarily unavailable'
        );
      }
      this.state = CircuitBreakerState.HALF_OPEN;
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = CircuitBreakerState.CLOSED;
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitBreakerState.OPEN;
      this.nextAttemptTime = Date.now() + this.config.resetTimeout;
    }
  }

  getState(): CircuitBreakerState {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }
}

// Error classification utility
export function classifyError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new NetworkError('Network request failed', undefined, error as Error);
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('connection')) {
      return new NetworkError('Network connection failed', undefined, error);
    }
    
    if (message.includes('timeout')) {
      return new NetworkError('Request timed out', undefined, error);
    }
    
    if (message.includes('unauthorized') || message.includes('401')) {
      return new AuthenticationError('Authentication failed', 401, error);
    }
    
    if (message.includes('forbidden') || message.includes('403')) {
      return new AuthorizationError('Access forbidden', 403, error);
    }
    
    if (message.includes('rate limit') || message.includes('429')) {
      return new RateLimitError('Rate limit exceeded', undefined, 429, error);
    }
    
    if (message.includes('server error') || message.includes('500')) {
      return new ServerError('Internal server error', 500, error);
    }
    
    if (message.includes('service unavailable') || message.includes('503')) {
      return new ServiceUnavailableError('Service unavailable', 503, error);
    }
  }

  // Default to server error for unknown errors
  return new ServerError(
    `Unknown error: ${error instanceof Error ? error.message : String(error)}`,
    undefined,
    error instanceof Error ? error : undefined
  );
}

// HTTP response error classification
export function classifyHttpError(response: Response, responseText?: string): AppError {
  const status = response.status;
  const statusText = response.statusText;
  const message = responseText || statusText;

  switch (status) {
    case 400:
      return new ValidationError(`Bad request: ${message}`, status);
    case 401:
      return new AuthenticationError(`Authentication failed: ${message}`, status);
    case 403:
      return new AuthorizationError(`Access forbidden: ${message}`, status);
    case 404:
      return new ValidationError(`Resource not found: ${message}`, status);
    case 429:
      const retryAfter = response.headers.get('Retry-After');
      return new RateLimitError(
        `Rate limit exceeded: ${message}`,
        retryAfter ? parseInt(retryAfter) * 1000 : undefined,
        status
      );
    case 500:
      return new ServerError(`Internal server error: ${message}`, status);
    case 502:
      return new ServerError(`Bad gateway: ${message}`, status);
    case 503:
      return new ServiceUnavailableError(`Service unavailable: ${message}`, status);
    case 504:
      return new ServerError(`Gateway timeout: ${message}`, status);
    default:
      if (status >= 500) {
        return new ServerError(`Server error ${status}: ${message}`, status);
      } else if (status >= 400) {
        return new ValidationError(`Client error ${status}: ${message}`, status);
      } else {
        return new ServerError(`Unexpected status ${status}: ${message}`, status);
      }
  }
}

// Retry utility with exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: AppError | null = null;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const appError = classifyError(error);
      lastError = appError;
      
      // Don't retry if error is not retryable
      if (!appError.retryable || !config.retryableErrors.includes(appError.code)) {
        throw appError;
      }
      
      // Don't retry on last attempt
      if (attempt === config.maxRetries) {
        throw appError;
      }
      
      // Calculate delay for next attempt
      let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
      
      // Handle rate limit specific delay
      if (appError instanceof RateLimitError && appError.retryAfter) {
        delay = Math.max(delay, appError.retryAfter);
      }
      
      // Cap the delay
      delay = Math.min(delay, config.maxDelay);
      
      // Add jitter to prevent thundering herd
      delay = delay + Math.random() * 1000;
      
      await sleep(delay);
    }
  }
  
  throw lastError || new ServerError('Max retries exceeded');
}

// Enhanced fetch wrapper with error handling
export async function enhancedFetch(
  url: string,
  options: RequestInit = {},
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<Response> {
  return withRetry(async () => {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        let responseText: string | undefined;
        try {
          responseText = await response.text();
        } catch {
          // Ignore errors when reading response text
        }
        throw classifyHttpError(response, responseText);
      }
      
      return response;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw classifyError(error);
    }
  }, retryConfig);
}

// Utility functions
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.retryable;
  }
  return false;
}

export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.userMessage;
  }
  return 'An unexpected error occurred. Please try again.';
}

// Error reporting utility
export interface ErrorReport {
  code: string;
  message: string;
  userMessage: string;
  statusCode?: number;
  retryable: boolean;
  timestamp: number;
  url?: string;
  userAgent?: string;
}

export function createErrorReport(error: unknown, context?: { url?: string }): ErrorReport {
  const appError = classifyError(error);
  
  return {
    code: appError.code,
    message: appError.message,
    userMessage: appError.userMessage,
    statusCode: appError.statusCode,
    retryable: appError.retryable,
    timestamp: Date.now(),
    url: context?.url,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
  };
}