import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PublishersGrid } from '../PublishersGrid';
import { usePublishers } from '../../../stores/vmImagesStore';
import { useNavigationActions } from '../../../stores/navigationStore';
import type { Publisher } from '../../../types';

// Mock the stores
vi.mock('../../../stores/vmImagesStore');
vi.mock('../../../stores/navigationStore');

// Mock the UI components
vi.mock('../../ui/LoadingSpinner', () => ({
  LoadingSpinner: ({ size }: { size?: string }) => (
    <div data-testid="loading-spinner" data-size={size}>Loading...</div>
  ),
}));

vi.mock('../../ui/ErrorMessage', () => ({
  ErrorMessage: ({ 
    message, 
    title, 
    showRetry, 
    onRetry 
  }: { 
    message: string; 
    title?: string; 
    showRetry?: boolean; 
    onRetry?: () => void;
  }) => (
    <div data-testid="error-message">
      {title && <div data-testid="error-title">{title}</div>}
      <div data-testid="error-text">{message}</div>
      {showRetry && (
        <button data-testid="retry-button" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  ),
}));

const mockPublishers: Publisher[] = [
  {
    name: 'microsoft',
    displayName: 'Microsoft',
    location: 'eastus',
  },
  {
    name: 'canonical',
    displayName: 'Canonical',
    location: 'westus2',
  },
  {
    name: 'redhat',
    displayName: 'Red Hat',
    location: 'centralus',
  },
];

const mockNavigateToOffers = vi.fn();

describe('PublishersGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    vi.mocked(useNavigationActions).mockReturnValue({
      navigateToOffers: mockNavigateToOffers,
      navigateToPublishers: vi.fn(),
      navigateToSkus: vi.fn(),
      goBack: vi.fn(),
    });
  });

  it('renders loading state correctly', () => {
    vi.mocked(usePublishers).mockReturnValue({
      publishers: [],
      loading: true,
      error: null,
      loaded: false,
    });

    render(<PublishersGrid />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toHaveAttribute('data-size', 'lg');
  });

  it('renders error state correctly', () => {
    const errorMessage = 'Failed to fetch publishers';
    vi.mocked(usePublishers).mockReturnValue({
      publishers: [],
      loading: false,
      error: errorMessage,
      loaded: false,
    });

    render(<PublishersGrid />);

    expect(screen.getByTestId('error-message')).toBeInTheDocument();
    expect(screen.getByTestId('error-title')).toHaveTextContent('Failed to load publishers');
    expect(screen.getByTestId('error-text')).toHaveTextContent(errorMessage);
    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
  });

  it('renders empty state when no publishers are available', () => {
    vi.mocked(usePublishers).mockReturnValue({
      publishers: [],
      loading: false,
      error: null,
      loaded: true,
    });

    render(<PublishersGrid />);

    expect(screen.getByText('No Publishers Found')).toBeInTheDocument();
    expect(screen.getByText('No VM image publishers are available for the selected subscription.')).toBeInTheDocument();
  });

  it('renders publishers grid correctly', () => {
    vi.mocked(usePublishers).mockReturnValue({
      publishers: mockPublishers,
      loading: false,
      error: null,
      loaded: true,
    });

    render(<PublishersGrid />);

    expect(screen.getByText('VM Image Publishers')).toBeInTheDocument();
    expect(screen.getByText('Select a publisher to view their available offers')).toBeInTheDocument();

    // Check that all publishers are rendered
    mockPublishers.forEach((publisher) => {
      expect(screen.getByText(publisher.displayName)).toBeInTheDocument();
      expect(screen.getByText(publisher.name)).toBeInTheDocument();
      expect(screen.getByText(publisher.location)).toBeInTheDocument();
    });

    expect(screen.getByText('Showing 3 publishers')).toBeInTheDocument();
  });

  it('handles publisher click correctly', async () => {
    vi.mocked(usePublishers).mockReturnValue({
      publishers: mockPublishers,
      loading: false,
      error: null,
      loaded: true,
    });

    render(<PublishersGrid />);

    const microsoftCard = screen.getByLabelText('View offers for Microsoft');
    fireEvent.click(microsoftCard);

    await waitFor(() => {
      expect(mockNavigateToOffers).toHaveBeenCalledWith('microsoft', 'Microsoft');
    });
  });

  it('handles keyboard navigation correctly', async () => {
    vi.mocked(usePublishers).mockReturnValue({
      publishers: mockPublishers,
      loading: false,
      error: null,
      loaded: true,
    });

    render(<PublishersGrid />);

    const microsoftCard = screen.getByLabelText('View offers for Microsoft');
    
    // Test Enter key
    fireEvent.keyDown(microsoftCard, { key: 'Enter' });
    await waitFor(() => {
      expect(mockNavigateToOffers).toHaveBeenCalledWith('microsoft', 'Microsoft');
    });

    vi.clearAllMocks();

    // Test Space key
    fireEvent.keyDown(microsoftCard, { key: ' ' });
    await waitFor(() => {
      expect(mockNavigateToOffers).toHaveBeenCalledWith('microsoft', 'Microsoft');
    });
  });

  it('does not navigate on other key presses', async () => {
    vi.mocked(usePublishers).mockReturnValue({
      publishers: mockPublishers,
      loading: false,
      error: null,
      loaded: true,
    });

    render(<PublishersGrid />);

    const microsoftCard = screen.getByLabelText('View offers for Microsoft');
    
    fireEvent.keyDown(microsoftCard, { key: 'Tab' });
    
    await waitFor(() => {
      expect(mockNavigateToOffers).not.toHaveBeenCalled();
    });
  });

  it('applies custom className correctly', () => {
    vi.mocked(usePublishers).mockReturnValue({
      publishers: mockPublishers,
      loading: false,
      error: null,
      loaded: true,
    });

    const { container } = render(<PublishersGrid className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('shows singular form when only one publisher', () => {
    vi.mocked(usePublishers).mockReturnValue({
      publishers: [mockPublishers[0]],
      loading: false,
      error: null,
      loaded: true,
    });

    render(<PublishersGrid />);

    expect(screen.getByText('Showing 1 publisher')).toBeInTheDocument();
  });

  it('renders retry button when there is an error', () => {
    vi.mocked(usePublishers).mockReturnValue({
      publishers: [],
      loading: false,
      error: 'Network error',
      loaded: false,
    });

    render(<PublishersGrid />);

    const retryButton = screen.getByTestId('retry-button');
    expect(retryButton).toBeInTheDocument();
    
    // Test that clicking the button doesn't throw an error
    fireEvent.click(retryButton);
  });
});