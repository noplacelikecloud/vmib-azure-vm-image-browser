import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AppError,
  NetworkError,
  AuthenticationError,
  AuthorizationError,
  RateLimitError,
  ServerError,
  ValidationError,
  ServiceUnavailableError,
  CircuitBreaker,
  CircuitBreakerState,
  classifyError,
  classifyHttpError,
  withRetry,
  enhancedFetch,
  getUserFriendlyMessage,
  createErrorReport,
  DEFAULT_RETRY_CONFIG,
} from '../errorHandling';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Error Classes', () => {
  it('should create NetworkError with correct properties', () => {
    const error = new NetworkError('Network failed');
    expect(error.code).toBe('NETWORK_ERROR');
    expect(error.userMessage).toBe('Network connection failed. Please check your internet connection and try again.');
    expect(error.retryable).toBe(true);
    expect(error.message).toBe('Network failed');
  });

  it('should create AuthenticationError with correct properties', () => {
    const error = new AuthenticationError('Auth failed', 401);
    expect(error.code).toBe('AUTHENTICATION_ERROR');
    expect(error.userMessage).toBe('Authentication failed. Please sign in again.');
    expect(error.retryable).toBe(false);
    expect(error.statusCode).toBe(401);
  });

  it('should create RateLimitError with retry after', () => {
    const error = new RateLimitError('Rate limited', 5000, 429);
    expect(error.code).toBe('RATE_LIMIT_ERROR');
    expect(error.retryAfter).toBe(5000);
    expect(error.retryable).toBe(true);
  });
});

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 1000,
      monitoringPeriod: 5000,
    });
  });

  it('should start in CLOSED state', () => {
    expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
    expect(circuitBreaker.getFailureCount()).toBe(0);
  });

  it('should execute successful operations', async () => {
    const operation = vi.fn().mockResolvedValue('success');
    const result = await circuitBreaker.execute(operation);
    
    expect(result).toBe('success');
    expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
    expect(circuitBreaker.getFailureCount()).toBe(0);
  });

  it('should track failures and open circuit', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('failure'));
    
    // First two failures should keep circuit closed
    await expect(circuitBreaker.execute(operation)).rejects.toThrow('failure');
    expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
    expect(circuitBreaker.getFailureCount()).toBe(1);

    await expect(circuitBreaker.execute(operation)).rejects.toThrow('failure');
    expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
    expect(circuitBreaker.getFailureCount()).toBe(2);

    // Third failure should open circuit
    await expect(circuitBreaker.execute(operation)).rejects.toThrow('failure');
    expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
    expect(circuitBreaker.getFailureCount()).toBe(3);
  });

  it('should reject requests when circuit is open', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('failure'));
    
    // Trigger circuit to open
    for (let i = 0; i < 3; i++) {
      await expect(circuitBreaker.execute(operation)).rejects.toThrow();
    }
    
    expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
    
    // Next request should be rejected immediately
    await expect(circuitBreaker.execute(operation)).rejects.toThrow('Circuit breaker is open');
    expect(operation).toHaveBeenCalledTimes(3); // Should not call operation again
  });

  it('should transition to half-open after timeout', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('failure'))
      .mockRejectedValueOnce(new Error('failure'))
      .mockRejectedValueOnce(new Error('failure'))
      .mockResolvedValueOnce('success');
    
    // Open the circuit
    for (let i = 0; i < 3; i++) {
      await expect(circuitBreaker.execute(operation)).rejects.toThrow();
    }
    
    expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
    
    // Wait for reset timeout
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    // Next request should transition to half-open and succeed
    const result = await circuitBreaker.execute(operation);
    expect(result).toBe('success');
    expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
    expect(circuitBreaker.getFailureCount()).toBe(0);
  });
});

describe('classifyError', () => {
  it('should return AppError as-is', () => {
    const originalError = new NetworkError('Network failed');
    const classified = classifyError(originalError);
    expect(classified).toBe(originalError);
  });

  it('should classify fetch TypeError as NetworkError', () => {
    const error = new TypeError('fetch failed');
    const classified = classifyError(error);
    expect(classified).toBeInstanceOf(NetworkError);
    expect(classified.originalError).toBe(error);
  });

  it('should classify network-related errors', () => {
    const error = new Error('Network connection failed');
    const classified = classifyError(error);
    expect(classified).toBeInstanceOf(NetworkError);
  });

  it('should classify timeout errors', () => {
    const error = new Error('Request timeout');
    const classified = classifyError(error);
    expect(classified).toBeInstanceOf(NetworkError);
  });

  it('should classify authentication errors', () => {
    const error = new Error('Unauthorized access');
    const classified = classifyError(error);
    expect(classified).toBeInstanceOf(AuthenticationError);
  });

  it('should classify authorization errors', () => {
    const error = new Error('Forbidden resource');
    const classified = classifyError(error);
    expect(classified).toBeInstanceOf(AuthorizationError);
  });

  it('should classify rate limit errors', () => {
    const error = new Error('Rate limit exceeded');
    const classified = classifyError(error);
    expect(classified).toBeInstanceOf(RateLimitError);
  });

  it('should classify server errors', () => {
    const error = new Error('Internal server error');
    const classified = classifyError(error);
    expect(classified).toBeInstanceOf(ServerError);
  });

  it('should default to ServerError for unknown errors', () => {
    const error = new Error('Unknown error');
    const classified = classifyError(error);
    expect(classified).toBeInstanceOf(ServerError);
  });

  it('should handle non-Error objects', () => {
    const classified = classifyError('string error');
    expect(classified).toBeInstanceOf(ServerError);
    expect(classified.message).toContain('string error');
  });
});

describe('classifyHttpError', () => {
  it('should classify 400 as ValidationError', () => {
    const response = new Response('Bad request', { status: 400, statusText: 'Bad Request' });
    const error = classifyHttpError(response);
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.statusCode).toBe(400);
  });

  it('should classify 401 as AuthenticationError', () => {
    const response = new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    const error = classifyHttpError(response);
    expect(error).toBeInstanceOf(AuthenticationError);
    expect(error.statusCode).toBe(401);
  });

  it('should classify 403 as AuthorizationError', () => {
    const response = new Response('Forbidden', { status: 403, statusText: 'Forbidden' });
    const error = classifyHttpError(response);
    expect(error).toBeInstanceOf(AuthorizationError);
    expect(error.statusCode).toBe(403);
  });

  it('should classify 429 as RateLimitError with retry-after', () => {
    const response = new Response('Too Many Requests', {
      status: 429,
      statusText: 'Too Many Requests',
      headers: { 'Retry-After': '60' }
    });
    const error = classifyHttpError(response);
    expect(error).toBeInstanceOf(RateLimitError);
    expect((error as RateLimitError).retryAfter).toBe(60000);
  });

  it('should classify 500 as ServerError', () => {
    const response = new Response('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });
    const error = classifyHttpError(response);
    expect(error).toBeInstanceOf(ServerError);
    expect(error.statusCode).toBe(500);
  });

  it('should classify 503 as ServiceUnavailableError', () => {
    const response = new Response('Service Unavailable', { status: 503, statusText: 'Service Unavailable' });
    const error = classifyHttpError(response);
    expect(error).toBeInstanceOf(ServiceUnavailableError);
    expect(error.statusCode).toBe(503);
  });

  it('should use custom response text', () => {
    const response = new Response('', { status: 400, statusText: 'Bad Request' });
    const error = classifyHttpError(response, 'Custom error message');
    expect(error.message).toContain('Custom error message');
  });
});

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return result on first success', async () => {
    const operation = vi.fn().mockResolvedValue('success');
    const result = await withRetry(operation);
    
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should retry on retryable errors', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new NetworkError('Network failed'))
      .mockResolvedValueOnce('success');
    
    const resultPromise = withRetry(operation, {
      ...DEFAULT_RETRY_CONFIG,
      maxRetries: 1,
      baseDelay: 100,
    });
    
    // Fast-forward time to complete retry delay
    await vi.advanceTimersByTimeAsync(2000);
    
    const result = await resultPromise;
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(2);
  }, 10000);

  it('should not retry on non-retryable errors', async () => {
    const operation = vi.fn().mockRejectedValue(new AuthenticationError('Auth failed'));
    
    await expect(withRetry(operation)).rejects.toThrow(AuthenticationError);
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should respect max retries', async () => {
    const operation = vi.fn().mockRejectedValue(new NetworkError('Network failed'));
    
    await expect(withRetry(operation, {
      ...DEFAULT_RETRY_CONFIG,
      maxRetries: 2,
      baseDelay: 1,
    })).rejects.toThrow(NetworkError);
    
    expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it('should use exponential backoff', async () => {
    const operation = vi.fn().mockRejectedValue(new NetworkError('Network failed'));
    
    const resultPromise = withRetry(operation, {
      ...DEFAULT_RETRY_CONFIG,
      maxRetries: 2,
      baseDelay: 100,
      backoffMultiplier: 2,
    });
    
    // Wait for all retries to complete
    await vi.advanceTimersByTimeAsync(1000);
    
    await expect(resultPromise).rejects.toThrow(NetworkError);
    expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
  }, 10000);

  it('should handle rate limit retry-after', async () => {
    const operation = vi.fn().mockRejectedValue(new RateLimitError('Rate limited', 1000));
    
    const resultPromise = withRetry(operation, {
      ...DEFAULT_RETRY_CONFIG,
      maxRetries: 1,
      baseDelay: 100,
    });
    
    // Should wait 1000ms (retry-after) instead of 100ms (base delay)
    await vi.advanceTimersByTimeAsync(2000);
    
    await expect(resultPromise).rejects.toThrow(RateLimitError);
    expect(operation).toHaveBeenCalledTimes(2);
  }, 10000);
});

describe('enhancedFetch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return successful response', async () => {
    const mockResponse = new Response('success', { status: 200 });
    mockFetch.mockResolvedValue(mockResponse);
    
    const response = await enhancedFetch('https://api.example.com');
    expect(response).toBe(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith('https://api.example.com', {});
  });

  it('should classify and throw HTTP errors', async () => {
    const mockResponse = new Response('Unauthorized', { status: 401 });
    mockFetch.mockResolvedValue(mockResponse);
    
    await expect(enhancedFetch('https://api.example.com')).rejects.toThrow(AuthenticationError);
  });

  it('should retry on network errors', async () => {
    mockFetch
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(new Response('success', { status: 200 }));
    
    const responsePromise = enhancedFetch('https://api.example.com', {}, {
      ...DEFAULT_RETRY_CONFIG,
      maxRetries: 1,
      baseDelay: 100,
    });
    
    await vi.advanceTimersByTimeAsync(2000);
    
    const response = await responsePromise;
    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  }, 10000);

  it('should pass through fetch options', async () => {
    const mockResponse = new Response('success', { status: 200 });
    mockFetch.mockResolvedValue(mockResponse);
    
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: 'test' }),
    };
    
    await enhancedFetch('https://api.example.com', options);
    expect(mockFetch).toHaveBeenCalledWith('https://api.example.com', options);
  });
});

describe('getUserFriendlyMessage', () => {
  it('should return user message for AppError', () => {
    const error = new NetworkError('Network failed');
    const message = getUserFriendlyMessage(error);
    expect(message).toBe(error.userMessage);
  });

  it('should return default message for unknown errors', () => {
    const error = new Error('Unknown error');
    const message = getUserFriendlyMessage(error);
    expect(message).toBe('An unexpected error occurred. Please try again.');
  });

  it('should handle non-Error objects', () => {
    const message = getUserFriendlyMessage('string error');
    expect(message).toBe('An unexpected error occurred. Please try again.');
  });
});

describe('createErrorReport', () => {
  it('should create error report for AppError', () => {
    const error = new NetworkError('Network failed', 0);
    const report = createErrorReport(error, { url: 'https://api.example.com' });
    
    expect(report.code).toBe('NETWORK_ERROR');
    expect(report.message).toBe('Network failed');
    expect(report.userMessage).toBe(error.userMessage);
    expect(report.retryable).toBe(true);
    expect(report.url).toBe('https://api.example.com');
    expect(report.timestamp).toBeTypeOf('number');
  });

  it('should create error report for unknown error', () => {
    const error = new Error('Unknown error');
    const report = createErrorReport(error);
    
    expect(report.code).toBe('SERVER_ERROR');
    expect(report.message).toContain('Unknown error');
    expect(report.retryable).toBe(true);
    expect(report.timestamp).toBeTypeOf('number');
  });

  it('should include user agent when available', () => {
    // Mock navigator
    Object.defineProperty(global, 'navigator', {
      value: { userAgent: 'test-agent' },
      writable: true,
    });
    
    const error = new Error('Test error');
    const report = createErrorReport(error);
    
    expect(report.userAgent).toBe('test-agent');
  });
});