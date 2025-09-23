import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { OffersList } from '../OffersList';
import { useOffers } from '../../../stores/vmImagesStore';
import { useNavigationActions, useCurrentNavigation } from '../../../stores/navigationStore';
import type { Offer } from '../../../types';

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

const mockOffers: Offer[] = [
  {
    name: 'windows-server-2022',
    displayName: 'Windows Server 2022',
    publisher: 'microsoft',
    location: 'eastus',
  },
  {
    name: 'sql-server-2022',
    displayName: 'SQL Server 2022',
    publisher: 'microsoft',
    location: 'westus2',
  },
  {
    name: 'visual-studio-2022',
    displayName: 'Visual Studio 2022',
    publisher: 'microsoft',
    location: 'centralus',
  },
];

const mockNavigateToSkus = vi.fn();

describe('OffersList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    vi.mocked(useNavigationActions).mockReturnValue({
      navigateToOffers: vi.fn(),
      navigateToPublishers: vi.fn(),
      navigateToSkus: mockNavigateToSkus,
      goBack: vi.fn(),
    });

    vi.mocked(useCurrentNavigation).mockReturnValue({
      currentLevel: 'offers',
      selectedPublisher: 'microsoft',
      selectedOffer: null,
    });
  });

  it('renders loading state correctly', () => {
    vi.mocked(useOffers).mockReturnValue({
      offers: [],
      loading: true,
      error: null,
      loadedFor: null,
    });

    render(<OffersList />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toHaveAttribute('data-size', 'lg');
  });

  it('renders error state correctly', () => {
    const errorMessage = 'Failed to fetch offers';
    vi.mocked(useOffers).mockReturnValue({
      offers: [],
      loading: false,
      error: errorMessage,
      loadedFor: null,
    });

    render(<OffersList />);

    expect(screen.getByTestId('error-message')).toBeInTheDocument();
    expect(screen.getByTestId('error-title')).toHaveTextContent('Failed to load offers');
    expect(screen.getByTestId('error-text')).toHaveTextContent(errorMessage);
    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
  });

  it('renders empty state when no offers are available', () => {
    vi.mocked(useOffers).mockReturnValue({
      offers: [],
      loading: false,
      error: null,
      loadedFor: { publisher: 'microsoft' },
    });

    render(<OffersList />);

    expect(screen.getByText('No Offers Found')).toBeInTheDocument();
    expect(screen.getByText('No offers are available for the selected publisher.')).toBeInTheDocument();
  });

  it('renders select publisher state when no publisher is loaded', () => {
    vi.mocked(useOffers).mockReturnValue({
      offers: [],
      loading: false,
      error: null,
      loadedFor: null,
    });

    render(<OffersList />);

    expect(screen.getByText('Select a Publisher')).toBeInTheDocument();
    expect(screen.getByText('Please select a publisher to view their available offers.')).toBeInTheDocument();
  });

  it('renders offers list correctly', () => {
    vi.mocked(useOffers).mockReturnValue({
      offers: mockOffers,
      loading: false,
      error: null,
      loadedFor: { publisher: 'microsoft' },
    });

    render(<OffersList />);

    expect(screen.getByText('Offers for microsoft')).toBeInTheDocument();
    expect(screen.getByText('Select an offer to view its available SKUs')).toBeInTheDocument();

    // Check that all offers are rendered
    mockOffers.forEach((offer) => {
      expect(screen.getByText(offer.displayName)).toBeInTheDocument();
      expect(screen.getByText(offer.name)).toBeInTheDocument();
      expect(screen.getByText(offer.location)).toBeInTheDocument();
    });
    
    // Check that publisher appears multiple times (once for each offer)
    expect(screen.getAllByText('microsoft')).toHaveLength(3); // 3 in offers

    expect(screen.getByText('Showing 3 offers')).toBeInTheDocument();
  });

  it('handles offer click correctly', async () => {
    vi.mocked(useOffers).mockReturnValue({
      offers: mockOffers,
      loading: false,
      error: null,
      loadedFor: { publisher: 'microsoft' },
    });

    render(<OffersList />);

    const windowsServerOffer = screen.getByLabelText('View SKUs for Windows Server 2022');
    fireEvent.click(windowsServerOffer);

    await waitFor(() => {
      expect(mockNavigateToSkus).toHaveBeenCalledWith(
        'microsoft',
        'windows-server-2022',
        'microsoft',
        'Windows Server 2022'
      );
    });
  });

  it('handles keyboard navigation correctly', async () => {
    vi.mocked(useOffers).mockReturnValue({
      offers: mockOffers,
      loading: false,
      error: null,
      loadedFor: { publisher: 'microsoft' },
    });

    render(<OffersList />);

    const windowsServerOffer = screen.getByLabelText('View SKUs for Windows Server 2022');
    
    // Test Enter key
    fireEvent.keyDown(windowsServerOffer, { key: 'Enter' });
    await waitFor(() => {
      expect(mockNavigateToSkus).toHaveBeenCalledWith(
        'microsoft',
        'windows-server-2022',
        'microsoft',
        'Windows Server 2022'
      );
    });

    vi.clearAllMocks();

    // Test Space key
    fireEvent.keyDown(windowsServerOffer, { key: ' ' });
    await waitFor(() => {
      expect(mockNavigateToSkus).toHaveBeenCalledWith(
        'microsoft',
        'windows-server-2022',
        'microsoft',
        'Windows Server 2022'
      );
    });
  });

  it('does not navigate on other key presses', async () => {
    vi.mocked(useOffers).mockReturnValue({
      offers: mockOffers,
      loading: false,
      error: null,
      loadedFor: { publisher: 'microsoft' },
    });

    render(<OffersList />);

    const windowsServerOffer = screen.getByLabelText('View SKUs for Windows Server 2022');
    
    fireEvent.keyDown(windowsServerOffer, { key: 'Tab' });
    
    await waitFor(() => {
      expect(mockNavigateToSkus).not.toHaveBeenCalled();
    });
  });

  it('does not navigate when no publisher is selected', async () => {
    vi.mocked(useCurrentNavigation).mockReturnValue({
      currentLevel: 'offers',
      selectedPublisher: null,
      selectedOffer: null,
    });

    vi.mocked(useOffers).mockReturnValue({
      offers: mockOffers,
      loading: false,
      error: null,
      loadedFor: { publisher: 'microsoft' },
    });

    render(<OffersList />);

    const windowsServerOffer = screen.getByLabelText('View SKUs for Windows Server 2022');
    fireEvent.click(windowsServerOffer);

    await waitFor(() => {
      expect(mockNavigateToSkus).not.toHaveBeenCalled();
    });
  });

  it('applies custom className correctly', () => {
    vi.mocked(useOffers).mockReturnValue({
      offers: mockOffers,
      loading: false,
      error: null,
      loadedFor: { publisher: 'microsoft' },
    });

    const { container } = render(<OffersList className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('shows singular form when only one offer', () => {
    vi.mocked(useOffers).mockReturnValue({
      offers: [mockOffers[0]],
      loading: false,
      error: null,
      loadedFor: { publisher: 'microsoft' },
    });

    render(<OffersList />);

    expect(screen.getByText('Showing 1 offer')).toBeInTheDocument();
  });

  it('renders retry button when there is an error', () => {
    vi.mocked(useOffers).mockReturnValue({
      offers: [],
      loading: false,
      error: 'Network error',
      loadedFor: null,
    });

    render(<OffersList />);

    const retryButton = screen.getByTestId('retry-button');
    expect(retryButton).toBeInTheDocument();
    
    // Test that clicking the button doesn't throw an error
    fireEvent.click(retryButton);
  });
});