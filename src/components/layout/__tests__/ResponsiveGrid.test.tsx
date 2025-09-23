import React from 'react';
import { render, screen } from '@testing-library/react';
import { ResponsiveGrid } from '../ResponsiveGrid';

describe('ResponsiveGrid', () => {
  it('renders children correctly', () => {
    render(
      <ResponsiveGrid>
        <div>Item 1</div>
        <div>Item 2</div>
      </ResponsiveGrid>
    );
    
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('applies default grid classes', () => {
    const { container } = render(
      <ResponsiveGrid>
        <div>Item 1</div>
      </ResponsiveGrid>
    );
    
    const gridElement = container.firstChild as HTMLElement;
    expect(gridElement).toHaveClass('grid', 'gap-4');
  });

  it('applies custom gap classes', () => {
    const { container } = render(
      <ResponsiveGrid gap="lg">
        <div>Item 1</div>
      </ResponsiveGrid>
    );
    
    const gridElement = container.firstChild as HTMLElement;
    expect(gridElement).toHaveClass('gap-6');
  });

  it('applies auto-fit grid when enabled', () => {
    const { container } = render(
      <ResponsiveGrid autoFit minItemWidth="200px">
        <div>Item 1</div>
      </ResponsiveGrid>
    );
    
    const gridElement = container.firstChild as HTMLElement;
    expect(gridElement.className).toContain('grid-cols-[repeat(auto-fit,minmax(200px,1fr))]');
  });

  it('applies custom column configuration', () => {
    const { container } = render(
      <ResponsiveGrid cols={{ xs: 1, sm: 2, md: 3 }}>
        <div>Item 1</div>
      </ResponsiveGrid>
    );
    
    const gridElement = container.firstChild as HTMLElement;
    expect(gridElement).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'md:grid-cols-3');
  });

  it('applies custom className', () => {
    const { container } = render(
      <ResponsiveGrid className="custom-grid">
        <div>Item 1</div>
      </ResponsiveGrid>
    );
    
    const gridElement = container.firstChild as HTMLElement;
    expect(gridElement).toHaveClass('custom-grid');
  });

  it('handles different gap sizes', () => {
    const gapSizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
    const expectedClasses = ['gap-2', 'gap-3', 'gap-4', 'gap-6', 'gap-8'];
    
    gapSizes.forEach((gap, index) => {
      const { container } = render(
        <ResponsiveGrid gap={gap}>
          <div>Item</div>
        </ResponsiveGrid>
      );
      
      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass(expectedClasses[index]);
    });
  });
});