import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SKUsDetails } from '../SKUsDetails';
import { useVMImagesStore } from '../../../stores/vmImagesStore';
import { useSubscriptions } from '../../../stores/authStore';
import { useMsal } from '@azure/msal-react';
import type { SKU } from '../../../types';
import { useCurrentNavigation } from '../../../stores';
import { useCurrentNavigation } from '../../../stores';

// Mock the stores
vi.mock('../../../stores/vmImagesStore');
vi.mock('../../../stores/navigationStore');
vi.mock('../../../stores/authStore');
vi.mock('@azure/msal-react');

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

vi.mock('../../ui/CopyButton', () => ({
  CopyButton: ({ imageReference, className }: { imageReference: any; className?: string }) => (
    <button 
      data-testid="copy-button" 
      className={className}
      onClick={() => console.log('Copy clicked for:', imageReference)}
    >
      Copy
    </button>
  ),
}));

const mockSKUs: SKU[] = [
  {
    name: '2022-datacenter',
    displayName: 'Windows Server 2022 Datacenter',
    publisher: 'microsoft',
    offer: 'windows-server-2022',
    location: 'eastus',
    versions: ['latest', '20348.1006.220908', '20348.887.220806'],
  },
  {
    name: '2022-datacenter-core',
    displayName: 'Windows Server 2022 Datacenter Core',
    publisher: 'microsoft',
    offer: 'windows-server-2022',
    location: 'westus2',
    versions: ['latest', '20348.1006.220908'],
  },
  {
    name: '2022-datacenter-azure-edition',
    displayName: 'Windows Server 2022 Datacenter Azure Edition',
    publisher: 'microsoft',
    offer: 'windows-server-2022',
    location: 'centralus',
    versions: [],
  },
];

describe('SKUsDetails', () => {
  const mockSetSkusSearch = vi.fn();
  const mockSetSkusPage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock MSAL
    vi.mocked(useMsal).mockReturnValue({
      instance: {} as any,
      accounts: [{ homeAccountId: 'test-account' }] as any,
      inProgress: 'none' as any,
    });

    // Mock auth store
    vi.mocked(useSubscriptions).mockReturnValue({
      selectedSubscription: 'test-subscription',
      selectedLocation: 'eastus',
    });

    // Default store mock
    vi.mocked(useVMImagesStore).mockImplementation((selector) => {
      const mockState = {
        skus: [],
        filteredSkus: [],
        loading: false,
        error: null,
        loadedSkus: null,
        searchQuery: '',
        pagination: {
          skus: { currentPage: 1, itemsPerPage: 8 }
        },
        setSkusSearch: mockSetSkusSearch,
        setSkusPage: mockSetSkusPage,
      };
      return selector(mockState);
    });
  });

  it('renders loading state correctly', () => {
    vi.mocked(useVMImagesStore).mockImplementation((selector) => {
      const mockState = {
        skus: [],
        filteredSkus: [],
        loading: true,
        error: null,
        loadedSkus: null,
        searchQuery: '',
        pagination: {
          skus: { currentPage: 1, itemsPerPage: 8 }
        },
        setSkusSearch: mockSetSkusSearch,
        setSkusPage: mockSetSkusPage,
      };
      return selector(mockState);
    });

    render(
      <MemoryRouter initialEntries={['/publishers/microsoft/offers/windows-server-2022/skus']}>
        <SKUsDetails />
      </MemoryRouter>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toHaveAttribute('data-size', 'lg');
  });

  it('renders error state correctly', () => {
    const errorMessage = 'Failed to fetch SKUs';
    vi.mocked(useSkus).mockReturnValue({
      skus: [],
      loading: false,
      error: errorMessage,
      loadedFor: null,
    });

    render(<SKUsDetails />);

    expect(screen.getByTestId('error-message')).toBeInTheDocument();
    expect(screen.getByTestId('error-title')).toHaveTextContent('Failed to load SKUs');
    expect(screen.getByTestId('error-text')).toHaveTextContent(errorMessage);
    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
  });

  it('renders empty state when no SKUs are available', () => {
    vi.mocked(useSkus).mockReturnValue({
      skus: [],
      loading: false,
      error: null,
      loadedFor: { publisher: 'microsoft', offer: 'windows-server-2022' },
    });

    render(<SKUsDetails />);

    expect(screen.getByText('No SKUs Found')).toBeInTheDocument();
    expect(screen.getByText('No SKUs are available for the selected offer.')).toBeInTheDocument();
  });

  it('renders select offer state when no offer is selected', () => {
    vi.mocked(useCurrentNavigation).mockReturnValue({
      currentLevel: 'skus',
      selectedPublisher: 'microsoft',
      selectedOffer: null,
    });

    vi.mocked(useSkus).mockReturnValue({
      skus: [],
      loading: false,
      error: null,
      loadedFor: null,
    });

    render(<SKUsDetails />);

    expect(screen.getByText('Select an Offer')).toBeInTheDocument();
    expect(screen.getByText('Please select an offer to view its available SKUs.')).toBeInTheDocument();
  });

  it('renders select offer state when no publisher is selected', () => {
    vi.mocked(useCurrentNavigation).mockReturnValue({
      currentLevel: 'skus',
      selectedPublisher: null,
      selectedOffer: 'windows-server-2022',
    });

    vi.mocked(useSkus).mockReturnValue({
      skus: [],
      loading: false,
      error: null,
      loadedFor: null,
    });

    render(<SKUsDetails />);

    expect(screen.getByText('Select an Offer')).toBeInTheDocument();
    expect(screen.getByText('Please select an offer to view its available SKUs.')).toBeInTheDocument();
  });

  it('renders SKUs details correctly', () => {
    vi.mocked(useSkus).mockReturnValue({
      skus: mockSKUs,
      loading: false,
      error: null,
      loadedFor: { publisher: 'microsoft', offer: 'windows-server-2022' },
    });

    render(<SKUsDetails />);

    expect(screen.getByText('SKUs for windows-server-2022')).toBeInTheDocument();
    expect(screen.getByText('Available SKUs and their versions for Infrastructure as Code deployment')).toBeInTheDocument();

    // Check that all SKUs are rendered
    mockSKUs.forEach((sku) => {
      expect(screen.getByText(sku.displayName)).toBeInTheDocument();
      expect(screen.getByText(sku.name)).toBeInTheDocument();
      expect(screen.getByText(sku.location)).toBeInTheDocument();
    });
    
    // Check that publisher appears multiple times (once in header + once for each SKU)
    expect(screen.getAllByText('microsoft')).toHaveLength(4); // 1 in header + 3 in SKUs
    
    // Check that offer appears multiple times (once for each SKU)
    expect(screen.getAllByText('windows-server-2022')).toHaveLength(3); // 3 in SKUs

    expect(screen.getByText('Showing 3 SKUs')).toBeInTheDocument();
  });

  it('renders versions correctly for SKUs with versions', () => {
    vi.mocked(useSkus).mockReturnValue({
      skus: [mockSKUs[0]], // Only the first SKU with versions
      loading: false,
      error: null,
      loadedFor: { publisher: 'microsoft', offer: 'windows-server-2022' },
    });

    render(<SKUsDetails />);

    expect(screen.getByText('Available Versions')).toBeInTheDocument();
    
    // Check that all versions are displayed
    mockSKUs[0].versions.forEach((version) => {
      expect(screen.getByText(version)).toBeInTheDocument();
    });

    expect(screen.getByText('3 versions available')).toBeInTheDocument();
  });

  it('renders no versions state for SKUs without versions', () => {
    vi.mocked(useSkus).mockReturnValue({
      skus: [mockSKUs[2]], // SKU with empty versions array
      loading: false,
      error: null,
      loadedFor: { publisher: 'microsoft', offer: 'windows-server-2022' },
    });

    render(<SKUsDetails />);

    expect(screen.getByText('Available Versions')).toBeInTheDocument();
    expect(screen.getByText('No versions available')).toBeInTheDocument();
  });

  it('renders copy button for each SKU and version', () => {
    vi.mocked(useSkus).mockReturnValue({
      skus: mockSKUs,
      loading: false,
      error: null,
      loadedFor: { publisher: 'microsoft', offer: 'windows-server-2022' },
    });

    render(<SKUsDetails />);

    const copyButtons = screen.getAllByTestId('copy-button');
    // Should have one copy button per version + one per SKU with versions
    const expectedButtons = mockSKUs.reduce((total, sku) => {
      return total + sku.versions.length + (sku.versions.length > 0 ? 1 : 0);
    }, 0);
    expect(copyButtons).toHaveLength(expectedButtons);
  });

  it('handles copy button click correctly', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    vi.mocked(useSkus).mockReturnValue({
      skus: [mockSKUs[0]],
      loading: false,
      error: null,
      loadedFor: { publisher: 'microsoft', offer: 'windows-server-2022' },
    });

    render(<SKUsDetails />);

    const copyButtons = screen.getAllByTestId('copy-button');
    fireEvent.click(copyButtons[0]);

    expect(consoleSpy).toHaveBeenCalledWith('Copy clicked for:', expect.objectContaining({
      publisher: 'microsoft',
      offer: 'windows-server-2022',
      sku: '2022-datacenter',
      version: 'latest'
    }));
    
    consoleSpy.mockRestore();
  });

  it('applies custom className correctly', () => {
    vi.mocked(useSkus).mockReturnValue({
      skus: mockSKUs,
      loading: false,
      error: null,
      loadedFor: { publisher: 'microsoft', offer: 'windows-server-2022' },
    });

    const { container } = render(<SKUsDetails className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('shows singular form when only one SKU', () => {
    vi.mocked(useSkus).mockReturnValue({
      skus: [mockSKUs[0]],
      loading: false,
      error: null,
      loadedFor: { publisher: 'microsoft', offer: 'windows-server-2022' },
    });

    render(<SKUsDetails />);

    expect(screen.getByText('Showing 1 SKU')).toBeInTheDocument();
  });

  it('shows singular form for versions when only one version', () => {
    const skuWithOneVersion = {
      ...mockSKUs[0],
      versions: ['latest'],
    };

    vi.mocked(useSkus).mockReturnValue({
      skus: [skuWithOneVersion],
      loading: false,
      error: null,
      loadedFor: { publisher: 'microsoft', offer: 'windows-server-2022' },
    });

    render(<SKUsDetails />);

    expect(screen.getByText('1 version available')).toBeInTheDocument();
  });

  it('renders retry button when there is an error', () => {
    vi.mocked(useSkus).mockReturnValue({
      skus: [],
      loading: false,
      error: 'Network error',
      loadedFor: null,
    });

    render(<SKUsDetails />);

    const retryButton = screen.getByTestId('retry-button');
    expect(retryButton).toBeInTheDocument();
    
    // Test that clicking the button doesn't throw an error
    fireEvent.click(retryButton);
  });

  it('displays latest version indicator correctly', () => {
    vi.mocked(useSkus).mockReturnValue({
      skus: [mockSKUs[0]],
      loading: false,
      error: null,
      loadedFor: { publisher: 'microsoft', offer: 'windows-server-2022' },
    });

    render(<SKUsDetails />);

    // Check that "Latest" indicator is shown for the latest version
    expect(screen.getByText('Latest')).toBeInTheDocument();
    
    // Check that "Version" indicator is shown for other versions
    expect(screen.getAllByText('Version')).toHaveLength(2); // For the two non-latest versions
  });
});