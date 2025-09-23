import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SubscriptionSelector } from '../SubscriptionSelector';
import { useAuthStore, useSubscriptions } from '../../../stores/authStore';
import { subscriptionService } from '../../../services/subscriptionService';
import type { Subscription } from '../../../types';

// Mock the stores
vi.mock('../../../stores/authStore');

// Mock the subscription service
vi.mock('../../../services/subscriptionService', () => ({
  subscriptionService: {
    getSubscriptions: vi.fn(),
  },
}));

const mockSubscriptions: Subscription[] = [
  {
    subscriptionId: 'sub-1',
    displayName: 'Development Subscription',
    state: 'Enabled',
  },
  {
    subscriptionId: 'sub-2',
    displayName: 'Production Subscription',
    state: 'Enabled',
  },
];

describe('SubscriptionSelector', () => {
  const mockSetLoading = vi.fn();
  const mockSetError = vi.fn();
  const mockSetSubscriptions = vi.fn();
  const mockSelectSubscription = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    (useAuthStore as any).mockReturnValue({
      loading: false,
      error: null,
      setLoading: mockSetLoading,
      setError: mockSetError,
      setSubscriptions: mockSetSubscriptions,
    });

    (useSubscriptions as any).mockReturnValue({
      subscriptions: mockSubscriptions,
      selectedSubscription: null,
      selectSubscription: mockSelectSubscription,
    });

    // Mock the subscription service
    (subscriptionService.getSubscriptions as any).mockResolvedValue(mockSubscriptions);
  });

  it('renders subscription selector with subscriptions', () => {
    render(<SubscriptionSelector />);
    
    expect(screen.getByLabelText('Azure Subscription')).toBeInTheDocument();
    expect(screen.getByText('Select a subscription...')).toBeInTheDocument();
    expect(screen.getByText('Development Subscription (Enabled)')).toBeInTheDocument();
    expect(screen.getByText('Production Subscription (Enabled)')).toBeInTheDocument();
  });

  it('shows loading state when loading subscriptions', () => {
    (useAuthStore as any).mockReturnValue({
      loading: true,
      error: null,
      setLoading: mockSetLoading,
      setError: mockSetError,
      setSubscriptions: mockSetSubscriptions,
    });

    render(<SubscriptionSelector />);
    
    expect(screen.getByText('Loading subscriptions...')).toBeInTheDocument();
    const spinner = screen.getByText('Loading subscriptions...').previousElementSibling;
    expect(spinner).toHaveClass('animate-spin');
  });

  it('shows error state with retry button', () => {
    const errorMessage = 'Failed to load subscriptions';
    (useAuthStore as any).mockReturnValue({
      loading: false,
      error: errorMessage,
      setLoading: mockSetLoading,
      setError: mockSetError,
      setSubscriptions: mockSetSubscriptions,
    });

    render(<SubscriptionSelector />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('handles retry functionality', () => {
    const errorMessage = 'Failed to load subscriptions';
    (useAuthStore as any).mockReturnValue({
      loading: false,
      error: errorMessage,
      setLoading: mockSetLoading,
      setError: mockSetError,
      setSubscriptions: mockSetSubscriptions,
    });

    render(<SubscriptionSelector />);
    
    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);
    
    expect(mockSetError).toHaveBeenCalledWith(null);
    expect(mockSetSubscriptions).toHaveBeenCalledWith([]);
  });

  it('shows message when no subscriptions are available', () => {
    (useSubscriptions as any).mockReturnValue({
      subscriptions: [],
      selectedSubscription: null,
      selectSubscription: mockSelectSubscription,
    });

    render(<SubscriptionSelector />);
    
    expect(screen.getByText(/No subscriptions available/)).toBeInTheDocument();
  });

  it('handles subscription selection', () => {
    render(<SubscriptionSelector />);
    
    const select = screen.getByLabelText('Azure Subscription');
    fireEvent.change(select, { target: { value: 'sub-1' } });
    
    expect(mockSelectSubscription).toHaveBeenCalledWith('sub-1');
  });

  it('shows selected subscription info', () => {
    (useSubscriptions as any).mockReturnValue({
      subscriptions: mockSubscriptions,
      selectedSubscription: 'sub-1',
      selectSubscription: mockSelectSubscription,
    });

    render(<SubscriptionSelector />);
    
    expect(screen.getByText('Selected: Development Subscription')).toBeInTheDocument();
  });

  it('can be disabled', () => {
    render(<SubscriptionSelector disabled />);
    
    const select = screen.getByLabelText('Azure Subscription');
    expect(select).toBeDisabled();
  });

  it('applies custom className', () => {
    const { container } = render(<SubscriptionSelector className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('loads subscriptions on mount when none exist', async () => {
    (useSubscriptions as any).mockReturnValue({
      subscriptions: [],
      selectedSubscription: null,
      selectSubscription: mockSelectSubscription,
    });

    render(<SubscriptionSelector />);
    
    await waitFor(() => {
      expect(subscriptionService.getSubscriptions).toHaveBeenCalled();
      expect(mockSetLoading).toHaveBeenCalledWith(true);
    });
  });

  it('handles subscription service error', async () => {
    const errorMessage = 'Network error';
    (subscriptionService.getSubscriptions as any).mockRejectedValue(new Error(errorMessage));
    
    (useSubscriptions as any).mockReturnValue({
      subscriptions: [],
      selectedSubscription: null,
      selectSubscription: mockSelectSubscription,
    });

    render(<SubscriptionSelector />);
    
    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith(errorMessage);
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });
  });

  it('does not reload subscriptions if already loaded', () => {
    render(<SubscriptionSelector />);
    
    expect(subscriptionService.getSubscriptions).not.toHaveBeenCalled();
  });
});