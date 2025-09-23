import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { ErrorMessage, InlineError, EmptyState } from '../ErrorMessage';

describe('ErrorMessage', () => {
  it('renders error message with default props', () => {
    const { container } = render(<ErrorMessage message="Something went wrong" />);
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('bg-red-50', 'border-red-200');
  });

  it('renders with title', () => {
    render(<ErrorMessage title="Error Title" message="Error message" />);
    
    expect(screen.getByText('Error Title')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('renders different error types', () => {
    const { rerender, container } = render(<ErrorMessage message="Warning message" type="warning" />);
    expect(container.firstChild).toHaveClass('bg-yellow-50', 'border-yellow-200');

    rerender(<ErrorMessage message="Info message" type="info" />);
    expect(container.firstChild).toHaveClass('bg-blue-50', 'border-blue-200');
  });

  it('renders retry button when onRetry is provided', () => {
    const onRetry = vi.fn();
    render(<ErrorMessage message="Error" onRetry={onRetry} />);
    
    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalled();
  });

  it('renders dismiss button when onDismiss is provided', () => {
    const onDismiss = vi.fn();
    render(<ErrorMessage message="Error" onDismiss={onDismiss} />);
    
    const dismissButton = screen.getByText('Dismiss');
    expect(dismissButton).toBeInTheDocument();
    
    fireEvent.click(dismissButton);
    expect(onDismiss).toHaveBeenCalled();
  });

  it('renders close button when onDismiss is provided', () => {
    const onDismiss = vi.fn();
    render(<ErrorMessage message="Error" onDismiss={onDismiss} />);
    
    const closeButton = screen.getByLabelText('Dismiss');
    expect(closeButton).toBeInTheDocument();
    
    fireEvent.click(closeButton);
    expect(onDismiss).toHaveBeenCalled();
  });

  it('uses custom button text', () => {
    const onRetry = vi.fn();
    const onDismiss = vi.fn();
    
    render(
      <ErrorMessage
        message="Error"
        onRetry={onRetry}
        onDismiss={onDismiss}
        retryText="Retry Now"
        dismissText="Close"
      />
    );
    
    expect(screen.getByText('Retry Now')).toBeInTheDocument();
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('hides icon when showIcon is false', () => {
    render(<ErrorMessage message="Error" showIcon={false} />);
    
    // Should not have the error icon
    const icons = screen.queryAllByRole('generic');
    const hasErrorIcon = icons.some(icon => icon.querySelector('svg'));
    expect(hasErrorIcon).toBe(false);
  });

  it('applies custom className', () => {
    const { container } = render(<ErrorMessage message="Error" className="custom-error" />);
    
    expect(container.firstChild).toHaveClass('custom-error');
  });
});

describe('InlineError', () => {
  it('renders inline error message', () => {
    render(<InlineError message="Field is required" />);
    
    const error = screen.getByText('Field is required');
    expect(error).toBeInTheDocument();
    expect(error).toHaveClass('text-sm', 'text-red-600', 'mt-1');
  });

  it('applies custom className', () => {
    render(<InlineError message="Error" className="custom-inline" />);
    
    const error = screen.getByText('Error');
    expect(error).toHaveClass('custom-inline');
  });
});

describe('EmptyState', () => {
  it('renders empty state with title', () => {
    const { container } = render(<EmptyState title="No data found" />);
    
    expect(screen.getByText('No data found')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('text-center', 'py-12');
  });

  it('renders with description', () => {
    render(
      <EmptyState
        title="No items"
        description="There are no items to display at this time."
      />
    );
    
    expect(screen.getByText('No items')).toBeInTheDocument();
    expect(screen.getByText('There are no items to display at this time.')).toBeInTheDocument();
  });

  it('renders with custom icon', () => {
    const customIcon = <div data-testid="custom-icon">Custom Icon</div>;
    
    render(<EmptyState title="Empty" icon={customIcon} />);
    
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('renders with action button', () => {
    const action = {
      label: 'Add Item',
      onClick: vi.fn(),
    };
    
    render(<EmptyState title="Empty" action={action} />);
    
    const actionButton = screen.getByText('Add Item');
    expect(actionButton).toBeInTheDocument();
    
    fireEvent.click(actionButton);
    expect(action.onClick).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const { container } = render(<EmptyState title="Empty" className="custom-empty" />);
    
    expect(container.firstChild).toHaveClass('custom-empty');
  });

  it('renders default icon when no custom icon provided', () => {
    const { container } = render(<EmptyState title="Empty" />);
    
    // Should have an SVG icon
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});