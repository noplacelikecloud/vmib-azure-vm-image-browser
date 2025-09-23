import React from 'react';
import { render, screen } from '@testing-library/react';
import { Container } from '../Container';

describe('Container', () => {
  it('renders children correctly', () => {
    render(
      <Container>
        <div>Test content</div>
      </Container>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies default size and padding classes', () => {
    const { container } = render(
      <Container>
        <div>Test content</div>
      </Container>
    );
    
    const containerElement = container.firstChild as HTMLElement;
    expect(containerElement).toHaveClass('max-w-7xl', 'px-4', 'sm:px-6', 'lg:px-8');
  });

  it('applies custom size classes', () => {
    const { container } = render(
      <Container size="sm">
        <div>Test content</div>
      </Container>
    );
    
    const containerElement = container.firstChild as HTMLElement;
    expect(containerElement).toHaveClass('max-w-2xl');
  });

  it('applies custom padding classes', () => {
    const { container } = render(
      <Container padding="lg">
        <div>Test content</div>
      </Container>
    );
    
    const containerElement = container.firstChild as HTMLElement;
    expect(containerElement).toHaveClass('px-6', 'sm:px-8', 'lg:px-12');
  });

  it('applies no padding when padding is none', () => {
    const { container } = render(
      <Container padding="none">
        <div>Test content</div>
      </Container>
    );
    
    const containerElement = container.firstChild as HTMLElement;
    expect(containerElement).not.toHaveClass('px-4', 'px-6', 'px-8');
  });

  it('applies custom className', () => {
    const { container } = render(
      <Container className="custom-class">
        <div>Test content</div>
      </Container>
    );
    
    const containerElement = container.firstChild as HTMLElement;
    expect(containerElement).toHaveClass('custom-class');
  });

  it('applies full size correctly', () => {
    const { container } = render(
      <Container size="full">
        <div>Test content</div>
      </Container>
    );
    
    const containerElement = container.firstChild as HTMLElement;
    expect(containerElement).toHaveClass('max-w-full');
  });
});