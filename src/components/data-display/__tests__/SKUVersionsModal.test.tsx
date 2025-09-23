import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SKUVersionsModal } from '../SKUVersionsModal';
import type { SKU } from '../../../types';

// Mock the Modal component
vi.mock('../../ui/Modal', () => ({
  Modal: ({ isOpen, onClose, title, children }: any) => 
    isOpen ? (
      <div data-testid="modal">
        <div data-testid="modal-title">{title}</div>
        <button data-testid="close-button" onClick={onClose}>Close</button>
        {children}
      </div>
    ) : null
}));

// Mock the CopyButton component
vi.mock('../../ui/CopyButton', () => ({
  CopyButton: ({ imageReference }: any) => (
    <button data-testid="copy-button">
      Copy {imageReference.version}
    </button>
  ),
}));

// Mock the LoadingSpinner component
vi.mock('../../ui/LoadingSpinner', () => ({
  LoadingSpinner: ({ size }: any) => (
    <div data-testid="loading-spinner" data-size={size}>Loading...</div>
  ),
}));

const mockSKU: SKU = {
  name: '2022-datacenter',
  displayName: 'Windows Server 2022 Datacenter',
  publisher: 'microsoft',
  offer: 'windows-server-2022',
  location: 'eastus',
  versions: ['latest', '20348.1006.220908', '20348.887.220806'],
};

const mockSKUWithoutVersions: SKU = {
  name: '2022-datacenter-core',
  displayName: 'Windows Server 2022 Datacenter Core',
  publisher: 'microsoft',
  offer: 'windows-server-2022',
  location: 'eastus',
  versions: [],
};

describe('SKUVersionsModal', () => {
  const mockOnClose = vi.fn();
  const mockOnLoadVersions = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(
      <SKUVersionsModal
        isOpen={false}
        onClose={mockOnClose}
        sku={mockSKU}
        onLoadVersions={mockOnLoadVersions}
      />
    );

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('does not render when sku is null', () => {
    render(
      <SKUVersionsModal
        isOpen={true}
        onClose={mockOnClose}
        sku={null}
        onLoadVersions={mockOnLoadVersions}
      />
    );

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('renders modal with SKU information when isOpen is true', () => {
    render(
      <SKUVersionsModal
        isOpen={true}
        onClose={mockOnClose}
        sku={mockSKU}
        onLoadVersions={mockOnLoadVersions}
      />
    );

    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-title')).toHaveTextContent(
      'Available Versions - Windows Server 2022 Datacenter'
    );
    expect(screen.getByText('Windows Server 2022 Datacenter')).toBeInTheDocument();
    expect(screen.getByText('2022-datacenter')).toBeInTheDocument();
    expect(screen.getByText('microsoft')).toBeInTheDocument();
    expect(screen.getByText('windows-server-2022')).toBeInTheDocument();
    expect(screen.getByText('eastus')).toBeInTheDocument();
  });

  it('displays existing versions when SKU has versions', () => {
    render(
      <SKUVersionsModal
        isOpen={true}
        onClose={mockOnClose}
        sku={mockSKU}
        onLoadVersions={mockOnLoadVersions}
      />
    );

    expect(screen.getByText('latest')).toBeInTheDocument();
    expect(screen.getByText('20348.1006.220908')).toBeInTheDocument();
    expect(screen.getByText('20348.887.220806')).toBeInTheDocument();
    expect(screen.getByText('3 versions available')).toBeInTheDocument();
    expect(screen.getAllByTestId('copy-button')).toHaveLength(3);
  });

  it('shows latest badge for latest version', () => {
    render(
      <SKUVersionsModal
        isOpen={true}
        onClose={mockOnClose}
        sku={mockSKU}
        onLoadVersions={mockOnLoadVersions}
      />
    );

    expect(screen.getByText('Latest')).toBeInTheDocument();
  });

  it('loads versions when SKU has no versions', async () => {
    const mockVersions = ['latest', '1.0.0'];
    mockOnLoadVersions.mockResolvedValue(mockVersions);

    render(
      <SKUVersionsModal
        isOpen={true}
        onClose={mockOnClose}
        sku={mockSKUWithoutVersions}
        onLoadVersions={mockOnLoadVersions}
      />
    );

    // Should show loading initially
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Loading versions...')).toBeInTheDocument();

    // Wait for versions to load
    await waitFor(() => {
      expect(mockOnLoadVersions).toHaveBeenCalledWith(mockSKUWithoutVersions);
    });

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('latest')).toBeInTheDocument();
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
    });
  });

  it('shows error message when loading versions fails', async () => {
    const errorMessage = 'Failed to load versions';
    mockOnLoadVersions.mockRejectedValue(new Error(errorMessage));

    render(
      <SKUVersionsModal
        isOpen={true}
        onClose={mockOnClose}
        sku={mockSKUWithoutVersions}
        onLoadVersions={mockOnLoadVersions}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to Load Versions')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  it('retries loading versions when retry button is clicked', async () => {
    const errorMessage = 'Failed to load versions';
    mockOnLoadVersions.mockRejectedValueOnce(new Error(errorMessage));
    mockOnLoadVersions.mockResolvedValueOnce(['latest']);

    render(
      <SKUVersionsModal
        isOpen={true}
        onClose={mockOnClose}
        sku={mockSKUWithoutVersions}
        onLoadVersions={mockOnLoadVersions}
      />
    );

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    // Click retry
    fireEvent.click(screen.getByText('Retry'));

    // Should call onLoadVersions again
    await waitFor(() => {
      expect(mockOnLoadVersions).toHaveBeenCalledTimes(2);
    });
  });

  it('shows no versions message when no versions are available', async () => {
    mockOnLoadVersions.mockResolvedValue([]);

    render(
      <SKUVersionsModal
        isOpen={true}
        onClose={mockOnClose}
        sku={mockSKUWithoutVersions}
        onLoadVersions={mockOnLoadVersions}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No Versions Available')).toBeInTheDocument();
      expect(screen.getByText(/This SKU may not have published versions yet/)).toBeInTheDocument();
    });
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <SKUVersionsModal
        isOpen={true}
        onClose={mockOnClose}
        sku={mockSKU}
        onLoadVersions={mockOnLoadVersions}
      />
    );

    fireEvent.click(screen.getByTestId('close-button'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('resets state when modal is reopened', async () => {
    const { rerender } = render(
      <SKUVersionsModal
        isOpen={false}
        onClose={mockOnClose}
        sku={mockSKU}
        onLoadVersions={mockOnLoadVersions}
      />
    );

    // Open modal
    rerender(
      <SKUVersionsModal
        isOpen={true}
        onClose={mockOnClose}
        sku={mockSKU}
        onLoadVersions={mockOnLoadVersions}
      />
    );

    expect(screen.getByText('latest')).toBeInTheDocument();

    // Close modal
    rerender(
      <SKUVersionsModal
        isOpen={false}
        onClose={mockOnClose}
        sku={mockSKU}
        onLoadVersions={mockOnLoadVersions}
      />
    );

    // Open with different SKU that has no versions
    mockOnLoadVersions.mockResolvedValue(['different-version']);
    rerender(
      <SKUVersionsModal
        isOpen={true}
        onClose={mockOnClose}
        sku={mockSKUWithoutVersions}
        onLoadVersions={mockOnLoadVersions}
      />
    );

    // Should show loading state initially
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});