import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ErrorBoundary, ErrorFallback } from '../ErrorBoundary';

// Component that throws an error for testing
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('An unexpected error occurred while rendering this component.')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();
    
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('applies custom className', () => {
    const { container } = render(
      <ErrorBoundary className="custom-error">
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(container.firstChild).toHaveClass('custom-error');
  });

  it('resets error state when Try Again is clicked', () => {
    let shouldThrow = true;
    const TestComponent = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>No error</div>;
    };

    const { rerender } = render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    
    const tryAgainButton = screen.getByText('Try Again');
    
    // Change the condition and click try again
    shouldThrow = false;
    fireEvent.click(tryAgainButton);
    
    // Re-render to trigger the reset
    rerender(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('No error')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('shows error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Error Details (Development)')).toBeInTheDocument();
    
    process.env.NODE_ENV = originalEnv;
  });
});

describe('ErrorFallback', () => {
  it('renders error message and retry button', () => {
    const error = new Error('Test error message');
    const resetError = vi.fn();
    
    render(<ErrorFallback error={error} resetError={resetError} />);
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('calls resetError when Try Again is clicked', () => {
    const error = new Error('Test error');
    const resetError = vi.fn();
    
    render(<ErrorFallback error={error} resetError={resetError} />);
    
    const tryAgainButton = screen.getByText('Try Again');
    fireEvent.click(tryAgainButton);
    
    expect(resetError).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const error = new Error('Test error');
    const resetError = vi.fn();
    const { container } = render(
      <ErrorFallback error={error} resetError={resetError} className="custom-fallback" />
    );
    
    expect(container.firstChild).toHaveClass('custom-fallback');
  });

  it('shows generic message when error has no message', () => {
    const error = new Error();
    const resetError = vi.fn();
    
    render(<ErrorFallback error={error} resetError={resetError} />);
    
    expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument();
  });
});