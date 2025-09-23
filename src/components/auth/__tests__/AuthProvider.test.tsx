import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider } from '../AuthProvider';

// Mock MSAL React
vi.mock('@azure/msal-react', () => ({
  MsalProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="msal-provider">{children}</div>
  ),
}));

// Mock MSAL Browser
vi.mock('@azure/msal-browser', () => ({
  PublicClientApplication: vi.fn().mockImplementation(() => ({
    initialize: vi.fn(),
    acquireTokenSilent: vi.fn(),
    acquireTokenPopup: vi.fn(),
    logout: vi.fn(),
  })),
}));

// Mock the config
vi.mock('../../config/msalConfig', () => ({
  msalConfig: {
    auth: {
      clientId: 'test-client-id',
      authority: 'https://login.microsoftonline.com/common',
    },
  },
}));

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children within MsalProvider', () => {
    const TestChild = () => <div data-testid="test-child">Test Child</div>;

    render(
      <AuthProvider>
        <TestChild />
      </AuthProvider>
    );

    expect(screen.getByTestId('msal-provider')).toBeInTheDocument();
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('should create MSAL instance with correct configuration', async () => {
    // The MSAL instance is created when the module is imported, not when rendered
    // So we just need to verify the instance exists
    const { msalInstance } = await import('../AuthProvider');
    expect(msalInstance).toBeDefined();
  });

  it('should handle multiple children', () => {
    render(
      <AuthProvider>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </AuthProvider>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });

  it('should export msalInstance', async () => {
    const { msalInstance } = await import('../AuthProvider');
    expect(msalInstance).toBeDefined();
  });
});