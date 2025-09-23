import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { Card } from '../Card';

describe('Card', () => {
  it('renders children correctly', () => {
    render(
      <Card>
        <div>Card content</div>
      </Card>
    );
    
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies default variant and padding classes', () => {
    const { container } = render(
      <Card>
        <div>Content</div>
      </Card>
    );
    
    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement).toHaveClass('bg-white', 'border', 'border-gray-200', 'p-4', 'sm:p-6');
  });

  it('applies different variant classes', () => {
    const variants = ['default', 'elevated', 'outlined', 'ghost'] as const;
    
    variants.forEach((variant) => {
      const { container } = render(
        <Card variant={variant}>
          <div>Content</div>
        </Card>
      );
      
      const cardElement = container.firstChild as HTMLElement;
      
      switch (variant) {
        case 'elevated':
          expect(cardElement).toHaveClass('shadow-md');
          break;
        case 'outlined':
          expect(cardElement).toHaveClass('border-2', 'border-gray-300');
          break;
        case 'ghost':
          expect(cardElement).toHaveClass('bg-transparent');
          break;
        default:
          expect(cardElement).toHaveClass('bg-white', 'border-gray-200');
      }
    });
  });

  it('applies hover classes when hover is enabled', () => {
    const { container } = render(
      <Card hover>
        <div>Content</div>
      </Card>
    );
    
    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement).toHaveClass('hover:border-blue-500', 'hover:shadow-md');
  });

  it('applies clickable classes and handles click', () => {
    const handleClick = vi.fn();
    const { container } = render(
      <Card clickable onClick={handleClick}>
        <div>Content</div>
      </Card>
    );
    
    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement).toHaveClass('cursor-pointer');
    expect(cardElement).toHaveAttribute('role', 'button');
    expect(cardElement).toHaveAttribute('tabIndex', '0');
    
    fireEvent.click(cardElement);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('handles keyboard navigation for clickable cards', () => {
    const handleClick = vi.fn();
    const { container } = render(
      <Card clickable onClick={handleClick}>
        <div>Content</div>
      </Card>
    );
    
    const cardElement = container.firstChild as HTMLElement;
    
    fireEvent.keyDown(cardElement, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(1);
    
    fireEvent.keyDown(cardElement, { key: ' ' });
    expect(handleClick).toHaveBeenCalledTimes(2);
    
    fireEvent.keyDown(cardElement, { key: 'Escape' });
    expect(handleClick).toHaveBeenCalledTimes(2); // Should not trigger
  });

  it('applies different padding sizes', () => {
    const paddings = ['none', 'sm', 'md', 'lg'] as const;
    const expectedClasses = ['', 'p-3 sm:p-4', 'p-4 sm:p-6', 'p-6 sm:p-8'];
    
    paddings.forEach((padding, index) => {
      const { container } = render(
        <Card padding={padding}>
          <div>Content</div>
        </Card>
      );
      
      const cardElement = container.firstChild as HTMLElement;
      if (expectedClasses[index]) {
        expectedClasses[index].split(' ').forEach(cls => {
          expect(cardElement).toHaveClass(cls);
        });
      }
    });
  });

  it('applies custom className', () => {
    const { container } = render(
      <Card className="custom-card">
        <div>Content</div>
      </Card>
    );
    
    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement).toHaveClass('custom-card');
  });
});