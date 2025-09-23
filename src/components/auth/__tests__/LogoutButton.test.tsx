import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LogoutButton } from '../LogoutButton';

// Mock MSAL React
const mockLogoutPopup = vi.fn();
const mockClearCache = vi.fn();
vi.mock('@azure/msal-react', () => ({
  useMsal: () => ({
    instance: {
      logoutPopup: mockLogoutPopup,
      clearCache: mockClearCache,
    },
  }),
}));

// Mock Zustand stores
const mockAuthLogout = vi.fn();
const mockNavigationReset = vi.fn();
const mockVMImagesReset = vi.fn();

vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(() => mockAuthLogout),
}));

vi.mock('../../stores/navigationStore', () => ({
  useNavigationStore: vi.fn(() => mockNavigationReset),
}));

vi.mock('../../stores/vmImagesStore', () => ({
  useVMImagesStore: vi.fn(() => mockVMImagesReset),
}));

// Mock window.location.reload
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
    reload: vi.fn(),
  },
  writable: true,
});

describe('LogoutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with default icon', () => {
    render(<LogoutButton />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Sign out');
    expect(button).toHaveAttribute('title', 'Sign out');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('should render with custom children', () => {
    render(<LogoutButton>Custom Logout Text</LogoutButton>);
    expect(screen.getByText('Custom Logout Text')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<LogoutButton className="custom-class" />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should have default styling classes', () => {
    render(<LogoutButton />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('p-2', 'bg-red-600', 'text-white', 'rounded');
  });

  it('should call logoutPopup when clicked', async () => {
    mockLogoutPopup.mockResolvedValue({});
    
    render(<LogoutButton />);
    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockLogoutPopup).toHaveBeenCalledWith({
        postLogoutRedirectUri: 'http://localhost:3000',
        mainWindowRedirectUri: 'http://localhost:3000',
      });
    });
    
    // Note: Store clearing functionality is tested in integration tests
    // as mocking Zustand selectors in unit tests is complex
  });

  it('should handle logout errors with fallback cleanup', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Logout failed');
    mockLogoutPopup.mockRejectedValue(error);
    
    render(<LogoutButton />);
    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockLogoutPopup).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Logout failed:', error);
      expect(mockClearCache).toHaveBeenCalled();
      expect(window.location.reload).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
    // Note: Store clearing in error handler is tested in integration tests
  });

  it('should be accessible', () => {
    render(<LogoutButton />);
    const button = screen.getByRole('button');
    
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAttribute('aria-label', 'Sign out');
    expect(button).toHaveAttribute('title', 'Sign out');
    expect(button).toHaveClass('focus:outline-none', 'focus:ring-2');
  });
});