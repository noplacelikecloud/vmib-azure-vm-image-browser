import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LoadingSpinner, Skeleton, LoadingOverlay, CardSkeleton } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    const { container } = render(<LoadingSpinner />);
    
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toHaveClass('animate-spin', 'rounded-full', 'h-6', 'w-6');
  });

  it('renders with different sizes', () => {
    const { rerender, container } = render(<LoadingSpinner size="xs" />);
    expect(container.querySelector('.animate-spin')).toHaveClass('h-3', 'w-3');

    rerender(<LoadingSpinner size="xl" />);
    expect(container.querySelector('.animate-spin')).toHaveClass('h-12', 'w-12');
  });

  it('renders with text', () => {
    render(<LoadingSpinner text="Loading data..." />);
    
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<LoadingSpinner className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders centered when centered prop is true', () => {
    const { container } = render(<LoadingSpinner centered />);
    
    expect(container.firstChild).toHaveClass('flex', 'items-center', 'justify-center', 'min-h-32');
  });

  it('applies custom color', () => {
    const { container } = render(<LoadingSpinner color="border-red-600" />);
    
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toHaveClass('border-red-600');
  });

  it('matches text size with spinner size', () => {
    render(<LoadingSpinner size="lg" text="Loading..." />);
    
    const text = screen.getByText('Loading...');
    expect(text).toHaveClass('text-lg');
  });
});

describe('Skeleton', () => {
  it('renders with default props', () => {
    const { container } = render(<Skeleton />);
    
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('animate-pulse', 'bg-gray-200', 'rounded');
    expect(skeleton.style.width).toBe('100%');
    expect(skeleton.style.height).toBe('1rem');
  });

  it('applies custom dimensions', () => {
    const { container } = render(<Skeleton width={200} height="2rem" />);
    
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton.style.width).toBe('200px');
    expect(skeleton.style.height).toBe('2rem');
  });

  it('renders rounded when rounded prop is true', () => {
    const { container } = render(<Skeleton rounded />);
    
    expect(container.firstChild).toHaveClass('rounded-full');
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="custom-skeleton" />);
    
    expect(container.firstChild).toHaveClass('custom-skeleton');
  });
});

describe('LoadingOverlay', () => {
  it('renders when isVisible is true', () => {
    render(<LoadingOverlay isVisible={true} />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    const overlay = screen.getByText('Loading...').closest('.fixed');
    expect(overlay).toHaveClass('fixed', 'inset-0', 'bg-black', 'bg-opacity-50');
  });

  it('does not render when isVisible is false', () => {
    const { container } = render(<LoadingOverlay isVisible={false} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('renders with custom text', () => {
    render(<LoadingOverlay isVisible={true} text="Processing..." />);
    
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<LoadingOverlay isVisible={true} className="custom-overlay" />);
    
    expect(container.firstChild).toHaveClass('custom-overlay');
  });
});

describe('CardSkeleton', () => {
  it('renders skeleton card structure', () => {
    const { container } = render(<CardSkeleton />);
    
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('border', 'rounded-lg', 'p-4', 'space-y-3');
    
    // Should have multiple skeleton elements
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(1);
  });

  it('applies custom className', () => {
    const { container } = render(<CardSkeleton className="custom-card" />);
    
    expect(container.firstChild).toHaveClass('custom-card');
  });
});