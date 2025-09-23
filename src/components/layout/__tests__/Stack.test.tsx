import React from 'react';
import { render, screen } from '@testing-library/react';
import { Stack } from '../Stack';

describe('Stack', () => {
  it('renders children correctly', () => {
    render(
      <Stack>
        <div>Item 1</div>
        <div>Item 2</div>
      </Stack>
    );
    
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('applies default vertical direction and spacing', () => {
    const { container } = render(
      <Stack>
        <div>Item 1</div>
      </Stack>
    );
    
    const stackElement = container.firstChild as HTMLElement;
    expect(stackElement).toHaveClass('flex', 'flex-col', 'space-y-4', 'items-stretch', 'justify-start');
  });

  it('applies horizontal direction', () => {
    const { container } = render(
      <Stack direction="horizontal">
        <div>Item 1</div>
      </Stack>
    );
    
    const stackElement = container.firstChild as HTMLElement;
    expect(stackElement).toHaveClass('flex-row', 'space-x-4');
  });

  it('applies different spacing sizes', () => {
    const spacings = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
    const verticalClasses = ['space-y-1', 'space-y-2', 'space-y-4', 'space-y-6', 'space-y-8'];
    
    spacings.forEach((spacing, index) => {
      const { container } = render(
        <Stack spacing={spacing}>
          <div>Item</div>
        </Stack>
      );
      
      const stackElement = container.firstChild as HTMLElement;
      expect(stackElement).toHaveClass(verticalClasses[index]);
    });
  });

  it('applies different alignment options', () => {
    const alignments = ['start', 'center', 'end', 'stretch'] as const;
    const expectedClasses = ['items-start', 'items-center', 'items-end', 'items-stretch'];
    
    alignments.forEach((align, index) => {
      const { container } = render(
        <Stack align={align}>
          <div>Item</div>
        </Stack>
      );
      
      const stackElement = container.firstChild as HTMLElement;
      expect(stackElement).toHaveClass(expectedClasses[index]);
    });
  });

  it('applies different justify options', () => {
    const justifyOptions = ['start', 'center', 'end', 'between', 'around', 'evenly'] as const;
    const expectedClasses = ['justify-start', 'justify-center', 'justify-end', 'justify-between', 'justify-around', 'justify-evenly'];
    
    justifyOptions.forEach((justify, index) => {
      const { container } = render(
        <Stack justify={justify}>
          <div>Item</div>
        </Stack>
      );
      
      const stackElement = container.firstChild as HTMLElement;
      expect(stackElement).toHaveClass(expectedClasses[index]);
    });
  });

  it('applies wrap class when wrap is enabled', () => {
    const { container } = render(
      <Stack wrap>
        <div>Item</div>
      </Stack>
    );
    
    const stackElement = container.firstChild as HTMLElement;
    expect(stackElement).toHaveClass('flex-wrap');
  });

  it('applies custom className', () => {
    const { container } = render(
      <Stack className="custom-stack">
        <div>Item</div>
      </Stack>
    );
    
    const stackElement = container.firstChild as HTMLElement;
    expect(stackElement).toHaveClass('custom-stack');
  });

  it('handles responsive configuration', () => {
    const { container } = render(
      <Stack
        responsive={{
          sm: { direction: 'horizontal', spacing: 'lg' },
          md: { align: 'center', justify: 'between' }
        }}
      >
        <div>Item</div>
      </Stack>
    );
    
    const stackElement = container.firstChild as HTMLElement;
    expect(stackElement).toHaveClass('sm:flex-row', 'sm:space-x-6', 'md:items-center', 'md:justify-between');
  });

  it('applies horizontal spacing for horizontal direction', () => {
    const { container } = render(
      <Stack direction="horizontal" spacing="lg">
        <div>Item</div>
      </Stack>
    );
    
    const stackElement = container.firstChild as HTMLElement;
    expect(stackElement).toHaveClass('space-x-6');
    expect(stackElement).not.toHaveClass('space-y-6');
  });
});