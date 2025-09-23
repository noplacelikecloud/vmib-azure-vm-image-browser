import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LocationSelector } from '../LocationSelector';

// Mock the auth store
const mockSelectLocation = vi.fn();
const mockSetLocations = vi.fn();

vi.mock('../../stores/authStore', () => ({
  useSubscriptions: () => ({
    locations: [
      { name: 'eastus', displayName: 'East US', regionalDisplayName: 'Virginia, USA' },
      { name: 'westus', displayName: 'West US', regionalDisplayName: 'California, USA' },
      { name: 'centralus', displayName: 'Central US', regionalDisplayName: 'Iowa, USA' },
    ],
    selectedLocation: 'eastus',
    setLocations: mockSetLocations,
    selectLocation: mockSelectLocation,
  }),
}));

// Mock the SearchableDropdown component
vi.mock('../SearchableDropdown', () => ({
  SearchableDropdown: ({ options, value, onSelect, placeholder, disabled }: any) => (
    <div data-testid="searchable-dropdown">
      <select
        value={value}
        onChange={(e) => onSelect(e.target.value)}
        disabled={disabled}
        data-placeholder={placeholder}
      >
        <option value="">Select...</option>
        {options.map((option: any) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  ),
}));

describe('LocationSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders location selector with label', () => {
    render(<LocationSelector />);

    expect(screen.getByText('Azure Region')).toBeInTheDocument();
    expect(screen.getByTestId('searchable-dropdown')).toBeInTheDocument();
  });

  it('shows selected location info', () => {
    render(<LocationSelector />);

    expect(screen.getByText('Selected: East US (Virginia, USA)')).toBeInTheDocument();
  });

  it('calls selectLocation when location is changed', () => {
    render(<LocationSelector />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'westus' } });

    expect(mockSelectLocation).toHaveBeenCalledWith('westus');
  });

  it('can be disabled', () => {
    render(<LocationSelector disabled={true} />);

    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
  });

  it('applies custom className', () => {
    render(<LocationSelector className="custom-class" />);

    const container = screen.getByText('Azure Region').parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('initializes locations when empty', () => {
    // Mock empty locations
    vi.mocked(require('../../stores/authStore').useSubscriptions).mockReturnValueOnce({
      locations: [],
      selectedLocation: 'eastus',
      setLocations: mockSetLocations,
      selectLocation: mockSelectLocation,
    });

    render(<LocationSelector />);

    expect(mockSetLocations).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'eastus', displayName: 'East US' }),
        expect.objectContaining({ name: 'westus', displayName: 'West US' }),
      ])
    );
  });
});