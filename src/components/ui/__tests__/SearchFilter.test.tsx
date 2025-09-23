import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SearchFilter } from '../SearchFilter';

describe('SearchFilter', () => {
  const mockOnSearch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders with default props', () => {
    render(<SearchFilter onSearch={mockOnSearch} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Search...');
    expect(input).toHaveValue('');
  });

  it('renders with custom placeholder', () => {
    render(<SearchFilter onSearch={mockOnSearch} placeholder="Search publishers..." />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', 'Search publishers...');
  });

  it('renders with initial value', () => {
    render(<SearchFilter onSearch={mockOnSearch} value="test query" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('test query');
  });

  it('calls onSearch with debounced input', async () => {
    render(<SearchFilter onSearch={mockOnSearch} debounceMs={100} />);
    
    const input = screen.getByRole('textbox');
    
    // Type in the input
    fireEvent.change(input, { target: { value: 'test' } });
    
    // Should not call immediately
    expect(mockOnSearch).not.toHaveBeenCalled();
    
    // Fast-forward time to trigger debounce
    vi.advanceTimersByTime(100);
    
    expect(mockOnSearch).toHaveBeenCalledWith('test');
    expect(mockOnSearch).toHaveBeenCalledTimes(1);
  });

  it('debounces multiple rapid inputs', async () => {
    render(<SearchFilter onSearch={mockOnSearch} debounceMs={100} />);
    
    const input = screen.getByRole('textbox');
    
    // Type multiple values rapidly
    fireEvent.change(input, { target: { value: 'test' } });
    vi.advanceTimersByTime(50);
    fireEvent.change(input, { target: { value: 'testing' } });
    vi.advanceTimersByTime(50);
    fireEvent.change(input, { target: { value: 'testing123' } });
    
    // Should not call yet
    expect(mockOnSearch).not.toHaveBeenCalled();
    
    // Fast-forward to trigger debounce
    vi.advanceTimersByTime(100);
    
    // Should only call once with final value
    expect(mockOnSearch).toHaveBeenCalledWith('testing123');
    expect(mockOnSearch).toHaveBeenCalledTimes(1);
  });

  it('shows clear button when there is text', async () => {
    render(<SearchFilter onSearch={mockOnSearch} />);
    
    const input = screen.getByRole('textbox');
    
    // Initially no clear button
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
    
    // Type some text
    fireEvent.change(input, { target: { value: 'test' } });
    
    // Clear button should appear
    expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
  });

  it('clears input when clear button is clicked', async () => {
    render(<SearchFilter onSearch={mockOnSearch} />);
    
    const input = screen.getByRole('textbox');
    
    // Type some text
    fireEvent.change(input, { target: { value: 'test' } });
    
    const clearButton = screen.getByLabelText('Clear search');
    fireEvent.click(clearButton);
    
    expect(input).toHaveValue('');
    expect(mockOnSearch).toHaveBeenCalledWith('');
  });

  it('clears input when Escape key is pressed', async () => {
    render(<SearchFilter onSearch={mockOnSearch} />);
    
    const input = screen.getByRole('textbox');
    
    // Type some text
    fireEvent.change(input, { target: { value: 'test' } });
    
    // Press Escape
    fireEvent.keyDown(input, { key: 'Escape' });
    
    expect(input).toHaveValue('');
    expect(mockOnSearch).toHaveBeenCalledWith('');
  });

  it('hides clear button when showClearButton is false', async () => {
    render(<SearchFilter onSearch={mockOnSearch} showClearButton={false} />);
    
    const input = screen.getByRole('textbox');
    
    // Type some text
    fireEvent.change(input, { target: { value: 'test' } });
    
    // Clear button should not appear
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<SearchFilter onSearch={mockOnSearch} disabled />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('does not show clear button when disabled', async () => {
    render(<SearchFilter onSearch={mockOnSearch} disabled value="test" />);
    
    // Clear button should not appear even with text
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<SearchFilter onSearch={mockOnSearch} className="custom-class" />);
    
    const container = screen.getByRole('textbox').closest('.custom-class');
    expect(container).toBeInTheDocument();
  });

  it('updates value when value prop changes', () => {
    const { rerender } = render(<SearchFilter onSearch={mockOnSearch} value="initial" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('initial');
    
    rerender(<SearchFilter onSearch={mockOnSearch} value="updated" />);
    expect(input).toHaveValue('updated');
  });

  it('has proper accessibility attributes', () => {
    render(<SearchFilter onSearch={mockOnSearch} placeholder="Search items" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-label', 'Search items');
    
    const searchIcon = screen.getByRole('textbox').parentElement?.querySelector('svg');
    expect(searchIcon).toHaveAttribute('aria-hidden', 'true');
  });

  it('handles rapid clear and type operations', async () => {
    render(<SearchFilter onSearch={mockOnSearch} debounceMs={100} />);
    
    const input = screen.getByRole('textbox');
    
    // Type, clear, type again
    fireEvent.change(input, { target: { value: 'test' } });
    const clearButton = screen.getByLabelText('Clear search');
    fireEvent.click(clearButton);
    fireEvent.change(input, { target: { value: 'new' } });
    
    // Fast-forward time
    vi.advanceTimersByTime(100);
    
    // Should call with final value
    expect(mockOnSearch).toHaveBeenLastCalledWith('new');
  });

  it('handles empty string search correctly', async () => {
    render(<SearchFilter onSearch={mockOnSearch} debounceMs={100} />);
    
    const input = screen.getByRole('textbox');
    
    // Type and then delete all
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.change(input, { target: { value: '' } });
    
    vi.advanceTimersByTime(100);
    
    expect(mockOnSearch).toHaveBeenLastCalledWith('');
  });
});