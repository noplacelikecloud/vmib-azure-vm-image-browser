import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import App from '../App';

// Mock all external dependencies to focus on App component structure
vi.mock('@azure/msal-react', () => ({
  MsalProvider: ({ children }: any) => <div data-testid="msal-provider">{children}</div>,
}));

vi.mock('../components/auth/AuthProvider', () => ({
  AuthProvider: ({ children }: any) => <div data-testid="auth-provider">{children}</div>,
}));

vi.mock('../components/ui/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: any) => <div data-testid="error-boundary">{children}</div>,
}));

vi.mock('../components/ui/NetworkStatus', () => ({
  NetworkStatus: () => <div data-testid="network-status">Network Status</div>,
}));

vi.mock('../config/msalConfig', () => ({
  msalInstance: {
    initialize: vi.fn(),
  },
}));

vi.mock('../routes', () => ({
  router: {
    routes: [],
  },
}));

vi.mock('react-router-dom', () => ({
  RouterProvider: ({ router }: any) => <div data-testid="router-provider">Router Content</div>,
}));

describe('App Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the main App component with all providers in correct hierarchy', () => {
    render(<App />);

    // Check that all main components are rendered
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    expect(screen.getByTestId('msal-provider')).toBeInTheDocument();
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
    expect(screen.getByTestId('network-status')).toBeInTheDocument();
    expect(screen.getByTestId('router-provider')).toBeInTheDocument();
  });

  it('maintains proper component hierarchy structure', () => {
    render(<App />);

    // Verify the component tree structure
    const errorBoundary = screen.getByTestId('error-boundary');
    const msalProvider = screen.getByTestId('msal-provider');
    const authProvider = screen.getByTestId('auth-provider');
    const networkStatus = screen.getByTestId('network-status');
    const routerProvider = screen.getByTestId('router-provider');

    // Check that components are nested correctly
    expect(errorBoundary).toContainElement(msalProvider);
    expect(msalProvider).toContainElement(authProvider);
    expect(authProvider).toContainElement(networkStatus);
    expect(authProvider).toContainElement(routerProvider);
  });

  it('applies correct CSS classes to main container', () => {
    render(<App />);

    // Find the main container div
    const mainContainer = screen.getByTestId('network-status').parentElement;
    expect(mainContainer).toHaveClass('min-h-screen', 'bg-gray-50');
  });

  it('renders network status component', () => {
    render(<App />);

    expect(screen.getByTestId('network-status')).toBeInTheDocument();
    expect(screen.getByText('Network Status')).toBeInTheDocument();
  });

  it('renders router provider with correct props', () => {
    render(<App />);

    expect(screen.getByTestId('router-provider')).toBeInTheDocument();
    expect(screen.getByText('Router Content')).toBeInTheDocument();
  });

  it('provides error boundary for the entire application', () => {
    render(<App />);

    // Error boundary should wrap the entire application
    const errorBoundary = screen.getByTestId('error-boundary');
    expect(errorBoundary).toBeInTheDocument();
    
    // All other components should be inside the error boundary
    expect(errorBoundary).toContainElement(screen.getByTestId('msal-provider'));
    expect(errorBoundary).toContainElement(screen.getByTestId('auth-provider'));
    expect(errorBoundary).toContainElement(screen.getByTestId('network-status'));
    expect(errorBoundary).toContainElement(screen.getByTestId('router-provider'));
  });

  it('provides MSAL context to the application', () => {
    render(<App />);

    // MSAL provider should be present and contain the auth provider
    const msalProvider = screen.getByTestId('msal-provider');
    expect(msalProvider).toBeInTheDocument();
    expect(msalProvider).toContainElement(screen.getByTestId('auth-provider'));
  });

  it('provides authentication context to the application', () => {
    render(<App />);

    // Auth provider should be present and contain the main app content
    const authProvider = screen.getByTestId('auth-provider');
    expect(authProvider).toBeInTheDocument();
    expect(authProvider).toContainElement(screen.getByTestId('network-status'));
    expect(authProvider).toContainElement(screen.getByTestId('router-provider'));
  });
});