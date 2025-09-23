import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from '../ProtectedRoute';

// Mock MSAL React
let mockIsAuthenticated = false;
vi.mock('@azure/msal-react', () => ({
  useIsAuthenticated: () => mockIsAuthenticated,
}));

// Mock LoginButton
vi.mock('../LoginButton', () => ({
  LoginButton: ({ className }: { className?: string }) => (
    <button className={className} data-testid="login-button">
      Mocked Login Button
    </button>
  ),
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = false;
  });

  describe('when user is not authenticated', () => {
    it('should render login interface instead of children', () => {
      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByText('Azure VM Marketplace Browser')).toBeInTheDocument();
      expect(screen.getByText('Please sign in to access your Azure subscriptions')).toBeInTheDocument();
      expect(screen.getByTestId('login-button')).toBeInTheDocument();
    });

    it('should render custom fallback when provided', () => {
      const customFallback = <div data-testid="custom-fallback">Custom Login</div>;
      
      render(
        <ProtectedRoute fallback={customFallback}>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.queryByTestId('login-button')).not.toBeInTheDocument();
    });

    it('should have proper styling for login interface', () => {
      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      // Find the outer container with the styling classes
      const outerContainer = screen.getByText('Azure VM Marketplace Browser').closest('.min-h-screen');
      expect(outerContainer).toHaveClass('min-h-screen', 'flex', 'items-center', 'justify-center');
    });
  });

  describe('when user is authenticated', () => {
    beforeEach(() => {
      mockIsAuthenticated = true;
    });

    it('should render children when authenticated', () => {
      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.queryByText('Azure VM Marketplace Browser')).not.toBeInTheDocument();
      expect(screen.queryByTestId('login-button')).not.toBeInTheDocument();
    });

    it('should render multiple children when authenticated', () => {
      render(
        <ProtectedRoute>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });

    it('should not render fallback when authenticated', () => {
      const customFallback = <div data-testid="custom-fallback">Custom Login</div>;
      
      render(
        <ProtectedRoute fallback={customFallback}>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.queryByTestId('custom-fallback')).not.toBeInTheDocument();
    });
  });
});