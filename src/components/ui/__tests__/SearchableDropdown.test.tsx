import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SearchableDropdown } from '../SearchableDropdown';

const mockOptions = [
  { value: 'eastus', label: 'East US', description: 'Virginia, USA' },
  { value: 'westus', label: 'West US', description: 'California, USA' },
  { value: 'centralus', label: 'Central US', description: 'Iowa, USA' },
  { value: 'northeurope', label: 'North Europe', description: 'Ireland' },
  { value: 'westeurope', label: 'West Europe', description: 'Netherlands' },
];

describe('SearchableDropdown', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with placeholder when no value is selected', () => {
    render(
      <SearchableDropdown
        options={mockOptions}
        placeholder="Select a region..."
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Select a region...')).toBeInTheDocument();
  });

  it('renders with selected value', () => {
    render(
      <SearchableDropdown
        options={mockOptions}
        value="eastus"
        placeholder="Select a region..."
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('East US')).toBeInTheDocument();
  });

  it('opens dropdown when clicked', () => {
    render(
      <SearchableDropdown
        options={mockOptions}
        placeholder="Select a region..."
        onSelect={mockOnSelect}
      />
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    expect(screen.getByText('East US')).toBeInTheDocument();
    expect(screen.getByText('West US')).toBeInTheDocument();
  });

  it('filters options based on search query', async () => {
    render(
      <SearchableDropdown
        options={mockOptions}
        placeholder="Select a region..."
        onSelect={mockOnSelect}
      />
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'europe' } });

    await waitFor(() => {
      expect(screen.getByText('North Europe')).toBeInTheDocument();
      expect(screen.getByText('West Europe')).toBeInTheDocument();
      expect(screen.queryByText('East US')).not.toBeInTheDocument();
    });
  });

  it('filters options based on description', async () => {
    render(
      <SearchableDropdown
        options={mockOptions}
        placeholder="Select a region..."
        onSelect={mockOnSelect}
      />
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'virginia' } });

    await waitFor(() => {
      expect(screen.getByText('East US')).toBeInTheDocument();
      expect(screen.queryByText('West US')).not.toBeInTheDocument();
    });
  });

  it('calls onSelect when option is clicked', () => {
    render(
      <SearchableDropdown
        options={mockOptions}
        placeholder="Select a region..."
        onSelect={mockOnSelect}
      />
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    const option = screen.getByText('East US');
    fireEvent.click(option);

    expect(mockOnSelect).toHaveBeenCalledWith('eastus');
  });

  it('closes dropdown after selection', () => {
    render(
      <SearchableDropdown
        options={mockOptions}
        placeholder="Select a region..."
        onSelect={mockOnSelect}
      />
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();

    const option = screen.getByText('East US');
    fireEvent.click(option);

    expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument();
  });

  it('handles keyboard navigation', () => {
    render(
      <SearchableDropdown
        options={mockOptions}
        placeholder="Select a region..."
        onSelect={mockOnSelect}
      />
    );

    const trigger = screen.getByRole('button');
    
    // Open with Enter key
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();

    // Navigate with arrow keys
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    
    // Select with Enter
    fireEvent.keyDown(trigger, { key: 'Enter' });
    
    expect(mockOnSelect).toHaveBeenCalledWith('westus');
  });

  it('closes dropdown with Escape key', () => {
    render(
      <SearchableDropdown
        options={mockOptions}
        placeholder="Select a region..."
        onSelect={mockOnSelect}
      />
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();

    fireEvent.keyDown(trigger, { key: 'Escape' });

    expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <SearchableDropdown
        options={mockOptions}
        placeholder="Select a region..."
        onSelect={mockOnSelect}
        loading={true}
      />
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows disabled state', () => {
    render(
      <SearchableDropdown
        options={mockOptions}
        placeholder="Select a region..."
        onSelect={mockOnSelect}
        disabled={true}
      />
    );

    const trigger = screen.getByRole('button');
    expect(trigger).toBeDisabled();
  });

  it('shows empty message when no options match search', async () => {
    render(
      <SearchableDropdown
        options={mockOptions}
        placeholder="Select a region..."
        onSelect={mockOnSelect}
      />
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByText('No results for "nonexistent"')).toBeInTheDocument();
    });
  });

  it('shows custom empty message when no options provided', () => {
    render(
      <SearchableDropdown
        options={[]}
        placeholder="Select a region..."
        onSelect={mockOnSelect}
        emptyMessage="No regions available"
      />
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    expect(screen.getByText('No regions available')).toBeInTheDocument();
  });

  it('highlights selected option', () => {
    render(
      <SearchableDropdown
        options={mockOptions}
        value="eastus"
        placeholder="Select a region..."
        onSelect={mockOnSelect}
      />
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    const selectedOption = screen.getByRole('option', { name: /East US/ });
    expect(selectedOption).toHaveAttribute('aria-selected', 'true');
  });

  it('uses custom search placeholder', () => {
    render(
      <SearchableDropdown
        options={mockOptions}
        placeholder="Select a region..."
        onSelect={mockOnSelect}
        searchPlaceholder="Type to search regions..."
      />
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    expect(screen.getByPlaceholderText('Type to search regions...')).toBeInTheDocument();
  });
});