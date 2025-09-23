import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Pagination, usePagination } from '../Pagination';

describe('Pagination', () => {
  const mockOnPageChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders pagination controls correctly', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={mockOnPageChange}
        itemsPerPage={10}
        totalItems={50}
      />
    );

    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Showing 11 to 20 of 50 results';
    })).toBeInTheDocument();
    expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
    expect(screen.getByLabelText('Next page')).toBeInTheDocument();
    expect(screen.getByText('2')).toHaveAttribute('aria-current', 'page');
  });

  it('does not render when totalPages is 1 or less', () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalPages={1}
        onPageChange={mockOnPageChange}
        itemsPerPage={10}
        totalItems={5}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('does not render when totalItems is 0', () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalPages={0}
        onPageChange={mockOnPageChange}
        itemsPerPage={10}
        totalItems={0}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('disables previous button on first page', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
        itemsPerPage={10}
        totalItems={50}
      />
    );

    const prevButton = screen.getByLabelText('Previous page');
    expect(prevButton).toBeDisabled();
    expect(prevButton).toHaveClass('cursor-not-allowed');
  });

  it('disables next button on last page', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={5}
        onPageChange={mockOnPageChange}
        itemsPerPage={10}
        totalItems={50}
      />
    );

    const nextButton = screen.getByLabelText('Next page');
    expect(nextButton).toBeDisabled();
    expect(nextButton).toHaveClass('cursor-not-allowed');
  });

  it('calls onPageChange when page number is clicked', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={mockOnPageChange}
        itemsPerPage={10}
        totalItems={50}
      />
    );

    fireEvent.click(screen.getByText('3'));
    expect(mockOnPageChange).toHaveBeenCalledWith(3);
  });

  it('calls onPageChange when previous button is clicked', () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        onPageChange={mockOnPageChange}
        itemsPerPage={10}
        totalItems={50}
      />
    );

    fireEvent.click(screen.getByLabelText('Previous page'));
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange when next button is clicked', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={mockOnPageChange}
        itemsPerPage={10}
        totalItems={50}
      />
    );

    fireEvent.click(screen.getByLabelText('Next page'));
    expect(mockOnPageChange).toHaveBeenCalledWith(3);
  });

  it('shows ellipsis and first/last page when needed', () => {
    render(
      <Pagination
        currentPage={10}
        totalPages={20}
        onPageChange={mockOnPageChange}
        itemsPerPage={10}
        totalItems={200}
        maxVisiblePages={5}
      />
    );

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getAllByText('...')).toHaveLength(2);
  });

  it('does not show info when showInfo is false', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={mockOnPageChange}
        itemsPerPage={10}
        totalItems={50}
        showInfo={false}
      />
    );

    expect(screen.queryByText(/Showing \d+ to \d+ of \d+ results/)).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={mockOnPageChange}
        itemsPerPage={10}
        totalItems={50}
        className="custom-pagination"
      />
    );

    expect(screen.getByRole('navigation').parentElement).toHaveClass('custom-pagination');
  });

  it('calculates correct item range for last page', () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={3}
        onPageChange={mockOnPageChange}
        itemsPerPage={10}
        totalItems={25}
      />
    );

    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Showing 21 to 25 of 25 results';
    })).toBeInTheDocument();
  });

  it('handles single page correctly', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={1}
        onPageChange={mockOnPageChange}
        itemsPerPage={10}
        totalItems={5}
      />
    );

    // Should not render anything for single page
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('does not call onPageChange for current page', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={mockOnPageChange}
        itemsPerPage={10}
        totalItems={50}
      />
    );

    fireEvent.click(screen.getByText('2'));
    expect(mockOnPageChange).not.toHaveBeenCalled();
  });
});

describe('usePagination', () => {
  const TestComponent: React.FC<{ totalItems: number; itemsPerPage?: number; initialPage?: number }> = ({
    totalItems,
    itemsPerPage,
    initialPage,
  }) => {
    const pagination = usePagination(totalItems, itemsPerPage, initialPage);

    return (
      <div>
        <div data-testid="current-page">{pagination.currentPage}</div>
        <div data-testid="total-pages">{pagination.totalPages}</div>
        <div data-testid="start-index">{pagination.startIndex}</div>
        <div data-testid="end-index">{pagination.endIndex}</div>
        <div data-testid="has-next">{pagination.hasNextPage.toString()}</div>
        <div data-testid="has-previous">{pagination.hasPreviousPage.toString()}</div>
        <button onClick={() => pagination.goToPage(2)}>Go to page 2</button>
        <button onClick={pagination.goToNextPage}>Next</button>
        <button onClick={pagination.goToPreviousPage}>Previous</button>
        <button onClick={pagination.goToFirstPage}>First</button>
        <button onClick={pagination.goToLastPage}>Last</button>
      </div>
    );
  };

  it('initializes with correct default values', () => {
    render(<TestComponent totalItems={50} />);

    expect(screen.getByTestId('current-page')).toHaveTextContent('1');
    expect(screen.getByTestId('total-pages')).toHaveTextContent('5');
    expect(screen.getByTestId('start-index')).toHaveTextContent('0');
    expect(screen.getByTestId('end-index')).toHaveTextContent('10');
    expect(screen.getByTestId('has-next')).toHaveTextContent('true');
    expect(screen.getByTestId('has-previous')).toHaveTextContent('false');
  });

  it('initializes with custom itemsPerPage and initialPage', () => {
    render(<TestComponent totalItems={50} itemsPerPage={5} initialPage={3} />);

    expect(screen.getByTestId('current-page')).toHaveTextContent('3');
    expect(screen.getByTestId('total-pages')).toHaveTextContent('10');
    expect(screen.getByTestId('start-index')).toHaveTextContent('10');
    expect(screen.getByTestId('end-index')).toHaveTextContent('15');
  });

  it('navigates to specific page', () => {
    render(<TestComponent totalItems={50} />);

    fireEvent.click(screen.getByText('Go to page 2'));

    expect(screen.getByTestId('current-page')).toHaveTextContent('2');
    expect(screen.getByTestId('start-index')).toHaveTextContent('10');
    expect(screen.getByTestId('end-index')).toHaveTextContent('20');
  });

  it('navigates to next page', () => {
    render(<TestComponent totalItems={50} />);

    fireEvent.click(screen.getByText('Next'));

    expect(screen.getByTestId('current-page')).toHaveTextContent('2');
  });

  it('navigates to previous page', () => {
    render(<TestComponent totalItems={50} initialPage={3} />);

    fireEvent.click(screen.getByText('Previous'));

    expect(screen.getByTestId('current-page')).toHaveTextContent('2');
  });

  it('navigates to first page', () => {
    render(<TestComponent totalItems={50} initialPage={3} />);

    fireEvent.click(screen.getByText('First'));

    expect(screen.getByTestId('current-page')).toHaveTextContent('1');
  });

  it('navigates to last page', () => {
    render(<TestComponent totalItems={50} initialPage={1} />);

    fireEvent.click(screen.getByText('Last'));

    expect(screen.getByTestId('current-page')).toHaveTextContent('5');
  });

  it('does not navigate beyond bounds', () => {
    render(<TestComponent totalItems={50} initialPage={1} />);

    // Try to go to previous page from first page
    fireEvent.click(screen.getByText('Previous'));
    expect(screen.getByTestId('current-page')).toHaveTextContent('1');

    // Go to last page
    fireEvent.click(screen.getByText('Last'));
    expect(screen.getByTestId('current-page')).toHaveTextContent('5');

    // Try to go to next page from last page
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByTestId('current-page')).toHaveTextContent('5');
  });

  it('resets to first page when total pages decreases', () => {
    const { rerender } = render(<TestComponent totalItems={50} initialPage={5} />);

    expect(screen.getByTestId('current-page')).toHaveTextContent('5');

    // Reduce total items so current page is out of bounds
    rerender(<TestComponent totalItems={20} initialPage={5} />);

    expect(screen.getByTestId('current-page')).toHaveTextContent('1');
  });

  it('handles edge case with zero items', () => {
    render(<TestComponent totalItems={0} />);

    expect(screen.getByTestId('current-page')).toHaveTextContent('1');
    expect(screen.getByTestId('total-pages')).toHaveTextContent('0');
    expect(screen.getByTestId('start-index')).toHaveTextContent('0');
    expect(screen.getByTestId('end-index')).toHaveTextContent('0');
  });
});