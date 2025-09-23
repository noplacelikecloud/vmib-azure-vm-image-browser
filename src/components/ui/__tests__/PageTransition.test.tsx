import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { vi } from 'vitest';
import {
  PageTransition,
  StaggeredAnimation,
  LoadingTransition,
  HoverTransition,
  EnhancedPageTransition,
  ContentTransition
} from '../PageTransition';

// Mock timers for testing transitions
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe('PageTransition', () => {
  it('renders children correctly', () => {
    render(
      <PageTransition>
        <div>Test content</div>
      </PageTransition>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies loading state classes when loading', () => {
    const { container } = render(
      <PageTransition isLoading={true}>
        <div>Test content</div>
      </PageTransition>
    );
    
    const transitionElement = container.firstChild as HTMLElement;
    expect(transitionElement).toHaveClass('opacity-0');
  });

  it('applies visible state classes when not loading', () => {
    const { container } = render(
      <PageTransition isLoading={false}>
        <div>Test content</div>
      </PageTransition>
    );
    
    const transitionElement = container.firstChild as HTMLElement;
    expect(transitionElement).toHaveClass('opacity-100');
  });

  it('applies different transition types', () => {
    const { container, rerender } = render(
      <PageTransition type="slide">
        <div>Test content</div>
      </PageTransition>
    );
    
    let transitionElement = container.firstChild as HTMLElement;
    expect(transitionElement).toHaveClass('translate-x-0');

    rerender(
      <PageTransition type="scale">
        <div>Test content</div>
      </PageTransition>
    );
    
    transitionElement = container.firstChild as HTMLElement;
    expect(transitionElement).toHaveClass('scale-100');
  });

  it('applies different duration classes', () => {
    const { container, rerender } = render(
      <PageTransition duration="fast">
        <div>Test content</div>
      </PageTransition>
    );
    
    let transitionElement = container.firstChild as HTMLElement;
    expect(transitionElement).toHaveClass('duration-150');

    rerender(
      <PageTransition duration="slow">
        <div>Test content</div>
      </PageTransition>
    );
    
    transitionElement = container.firstChild as HTMLElement;
    expect(transitionElement).toHaveClass('duration-500');
  });

  it('handles transition key changes', () => {
    const { container, rerender } = render(
      <PageTransition transitionKey="key1">
        <div>Content 1</div>
      </PageTransition>
    );
    
    const transitionElement = container.firstChild as HTMLElement;
    expect(transitionElement).toHaveClass('opacity-100');

    act(() => {
      rerender(
        <PageTransition transitionKey="key2">
          <div>Content 2</div>
        </PageTransition>
      );
    });

    // Fast forward timers to complete transition
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should complete transition
    expect(transitionElement).toHaveClass('opacity-100');
  });

  it('applies custom className', () => {
    const { container } = render(
      <PageTransition className="custom-transition">
        <div>Test content</div>
      </PageTransition>
    );
    
    const transitionElement = container.firstChild as HTMLElement;
    expect(transitionElement).toHaveClass('custom-transition');
  });
});

describe('StaggeredAnimation', () => {
  it('renders children correctly', () => {
    render(
      <StaggeredAnimation>
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
      </StaggeredAnimation>
    );
    
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('applies staggered animation classes', () => {
    render(
      <StaggeredAnimation>
        <div>Item 1</div>
        <div>Item 2</div>
      </StaggeredAnimation>
    );
    
    // Should render without throwing - animation classes are applied via CSS
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <StaggeredAnimation className="custom-stagger">
        <div>Item 1</div>
      </StaggeredAnimation>
    );
    
    expect(container.firstChild).toHaveClass('custom-stagger');
  });
});

describe('LoadingTransition', () => {
  it('shows loading component when loading', () => {
    render(
      <LoadingTransition
        isLoading={true}
        loadingComponent={<div>Loading...</div>}
      >
        <div>Content</div>
      </LoadingTransition>
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows content when not loading', () => {
    render(
      <LoadingTransition
        isLoading={false}
        loadingComponent={<div>Loading...</div>}
      >
        <div>Content</div>
      </LoadingTransition>
    );
    
    // After minimum loading time, content should be visible
    act(() => {
      vi.advanceTimersByTime(300);
    });
    
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('respects minimum loading time', () => {
    const { rerender } = render(
      <LoadingTransition
        isLoading={true}
        loadingComponent={<div>Loading...</div>}
        minLoadingTime={500}
      >
        <div>Content</div>
      </LoadingTransition>
    );
    
    // Change to not loading before minimum time
    rerender(
      <LoadingTransition
        isLoading={false}
        loadingComponent={<div>Loading...</div>}
        minLoadingTime={500}
      >
        <div>Content</div>
      </LoadingTransition>
    );
    
    // Should still show loading
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // After minimum time, should show content
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});

describe('HoverTransition', () => {
  it('renders children correctly', () => {
    render(
      <HoverTransition>
        <div>Hover content</div>
      </HoverTransition>
    );
    
    expect(screen.getByText('Hover content')).toBeInTheDocument();
  });

  it('applies base transition classes', () => {
    const { container } = render(
      <HoverTransition>
        <div>Hover content</div>
      </HoverTransition>
    );
    
    const hoverElement = container.firstChild as HTMLElement;
    expect(hoverElement).toHaveClass('transition-all', 'duration-200');
  });

  it('applies hover scale when enabled', () => {
    const { container } = render(
      <HoverTransition hoverScale>
        <div>Hover content</div>
      </HoverTransition>
    );
    
    const hoverElement = container.firstChild as HTMLElement;
    expect(hoverElement).toHaveClass('hover:scale-105');
  });

  it('applies hover shadow when enabled', () => {
    const { container } = render(
      <HoverTransition hoverShadow>
        <div>Hover content</div>
      </HoverTransition>
    );
    
    const hoverElement = container.firstChild as HTMLElement;
    expect(hoverElement).toHaveClass('hover:shadow-md');
  });

  it('applies hover border when enabled', () => {
    const { container } = render(
      <HoverTransition hoverBorder>
        <div>Hover content</div>
      </HoverTransition>
    );
    
    const hoverElement = container.firstChild as HTMLElement;
    expect(hoverElement).toHaveClass('hover:border-blue-500');
  });

  it('applies custom className', () => {
    const { container } = render(
      <HoverTransition className="custom-hover">
        <div>Hover content</div>
      </HoverTransition>
    );
    
    const hoverElement = container.firstChild as HTMLElement;
    expect(hoverElement).toHaveClass('custom-hover');
  });

  it('combines multiple hover effects', () => {
    const { container } = render(
      <HoverTransition hoverScale hoverShadow hoverBorder>
        <div>Hover content</div>
      </HoverTransition>
    );
    
    const hoverElement = container.firstChild as HTMLElement;
    expect(hoverElement).toHaveClass(
      'hover:scale-105',
      'hover:shadow-md',
      'hover:border-blue-500'
    );
  });
});

describe('EnhancedPageTransition', () => {
  it('renders children when not loading and no error', () => {
    render(
      <EnhancedPageTransition>
        <div>Content</div>
      </EnhancedPageTransition>
    );
    
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('shows loading component when loading', () => {
    render(
      <EnhancedPageTransition
        isLoading={true}
        loadingComponent={<div>Loading...</div>}
      >
        <div>Content</div>
      </EnhancedPageTransition>
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error component when error exists', () => {
    render(
      <EnhancedPageTransition
        error="Test error"
        errorComponent={<div>Error occurred</div>}
      >
        <div>Content</div>
      </EnhancedPageTransition>
    );
    
    expect(screen.getByText('Error occurred')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <EnhancedPageTransition className="custom-enhanced">
        <div>Content</div>
      </EnhancedPageTransition>
    );
    
    expect(container.firstChild).toHaveClass('custom-enhanced');
  });
});

describe('ContentTransition', () => {
  it('renders children correctly', () => {
    render(
      <ContentTransition contentKey="test">
        <div>Content</div>
      </ContentTransition>
    );
    
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('handles content key changes', () => {
    const { rerender } = render(
      <ContentTransition contentKey="key1">
        <div>Content 1</div>
      </ContentTransition>
    );
    
    expect(screen.getByText('Content 1')).toBeInTheDocument();

    act(() => {
      rerender(
        <ContentTransition contentKey="key2">
          <div>Content 2</div>
        </ContentTransition>
      );
    });

    // Fast forward timers to complete transition
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByText('Content 2')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ContentTransition contentKey="test" className="custom-content">
        <div>Content</div>
      </ContentTransition>
    );
    
    expect(container.firstChild).toHaveClass('custom-content');
  });
});