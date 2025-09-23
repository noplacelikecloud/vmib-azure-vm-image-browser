import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SKUsDetails } from '../SKUsDetails';
import { useVMImagesStore } from '../../../stores/vmImagesStore';
import { useSubscriptions } from '../../../stores/authStore';
import { useMsal } from '@azure/msal-react';

// Mock the stores and dependencies
vi.mock('../../../stores/vmImagesStore');
vi.mock('../../../stores/authStore');
vi.mock('@azure/msal-react');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({
      publisherName: 'microsoft',
      offerName: 'windows-server-2022',
    }),
  };
});

// Mock UI components to simplify testing
vi.mock('../../ui/SearchFilter', () => ({
  SearchFilter: ({ placeholder, value, onSearch }: any) => (
    <input
      data-testid="search-filter"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onSearch(e.target.value)}
    />
  ),
}));

vi.mock('../../ui/BackButton', () => ({
  BackButton: ({ to, label }: any) => (
    <button data-testid="back-button">{label}</button>
  ),
}));

vi.mock('../../../services/vmImagesService', () => ({
  createVMImagesService: () => ({}),
}));

vi.mock('../../../services/subscriptionService', () => ({
  MSALTokenProvider: class MockMSALTokenProvider {},
}));

describe('SKUsDetails Search Field Behavior', () => {
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
  });

  it('shows search field when data is loaded but no SKUs are available', () => {
    vi.mocked(useVMImagesStore).mockImplementation((selector) => {
      const mockState = {
        skus: [], // No SKUs available
        filteredSkus: [],
        loading: false,
        error: null,
        loadedSkus: { publisher: 'microsoft', offer: 'windows-server-2022' }, // Data has been loaded
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

    // Search field should be visible even when no SKUs are available
    expect(screen.getByTestId('search-filter')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search SKUs...')).toBeInTheDocument();
    
    // Should also show the "No SKUs Found" message
    expect(screen.getByText('No SKUs Found')).toBeInTheDocument();
  });

  it('shows search field when search returns no results', () => {
    vi.mocked(useVMImagesStore).mockImplementation((selector) => {
      const mockState = {
        skus: [{ // Has SKUs in the store
          name: '2022-datacenter',
          displayName: 'Windows Server 2022 Datacenter',
          publisher: 'microsoft',
          offer: 'windows-server-2022',
          location: 'eastus',
          versions: ['latest'],
        }],
        filteredSkus: [], // But filtered results are empty
        loading: false,
        error: null,
        loadedSkus: { publisher: 'microsoft', offer: 'windows-server-2022' },
        searchQuery: 'nonexistent', // User has searched for something
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

    // Search field should still be visible
    expect(screen.getByTestId('search-filter')).toBeInTheDocument();
    expect(screen.getByDisplayValue('nonexistent')).toBeInTheDocument();
    
    // Should show "No SKUs Found" message for search results
    expect(screen.getByText('No SKUs Found')).toBeInTheDocument();
    expect(screen.getByText(/No SKUs match your search for "nonexistent"/)).toBeInTheDocument();
  });

  it('shows search field when SKUs are available', () => {
    const mockSKU = {
      name: '2022-datacenter',
      displayName: 'Windows Server 2022 Datacenter',
      publisher: 'microsoft',
      offer: 'windows-server-2022',
      location: 'eastus',
      versions: ['latest'],
    };

    vi.mocked(useVMImagesStore).mockImplementation((selector) => {
      const mockState = {
        skus: [mockSKU],
        filteredSkus: [mockSKU],
        loading: false,
        error: null,
        loadedSkus: { publisher: 'microsoft', offer: 'windows-server-2022' },
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

    // Search field should be visible
    expect(screen.getByTestId('search-filter')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search SKUs...')).toBeInTheDocument();
  });
});