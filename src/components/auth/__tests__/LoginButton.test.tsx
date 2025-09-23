import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginButton } from '../LoginButton';

// Mock MSAL React
const mockLoginPopup = vi.fn();
vi.mock('@azure/msal-react', () => ({
  useMsal: () => ({
    instance: {
      loginPopup: mockLoginPopup,
    },
  }),
}));

// Mock the config
vi.mock('../../config/msalConfig', () => ({
  loginRequest: {
    scopes: [
      'https://management.azure.com/user_impersonation',
      'openid',
      'profile',
      'email',
    ],
    prompt: 'select_account',
  },
}));

describe('LoginButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with default text', () => {
    render(<LoginButton />);
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('should render with custom children', () => {
    render(<LoginButton>Custom Login Text</LoginButton>);
    expect(screen.getByText('Custom Login Text')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<LoginButton className="custom-class" />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should have default styling classes', () => {
    render(<LoginButton />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-4', 'py-2', 'bg-blue-600', 'text-white', 'rounded');
  });

  it('should call loginPopup when clicked', async () => {
    mockLoginPopup.mockResolvedValue({});
    
    render(<LoginButton />);
    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockLoginPopup).toHaveBeenCalledWith({
        scopes: [
          'https://management.azure.com/user_impersonation',
          'openid',
          'profile',
          'email',
        ],
        prompt: 'select_account',
      });
    });
  });

  it('should handle login errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Login failed');
    mockLoginPopup.mockRejectedValue(error);
    
    render(<LoginButton />);
    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockLoginPopup).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Login failed:', error);
    });

    consoleSpy.mockRestore();
  });

  it('should be accessible', () => {
    render(<LoginButton />);
    const button = screen.getByRole('button');
    
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('focus:outline-none', 'focus:ring-2');
  });
});