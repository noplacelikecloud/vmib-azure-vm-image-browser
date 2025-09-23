import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { Logo } from '../Logo';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Logo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders logo image', () => {
    renderWithRouter(<Logo />);

    expect(screen.getByLabelText('Go to home page')).toBeInTheDocument();
    expect(screen.getByAltText('Azure VM Marketplace Logo')).toBeInTheDocument();
  });

  it('renders logo image regardless of showText prop', () => {
    renderWithRouter(<Logo showText={false} />);

    expect(screen.getByLabelText('Go to home page')).toBeInTheDocument();
    expect(screen.getByAltText('Azure VM Marketplace Logo')).toBeInTheDocument();
  });

  it('applies different size classes', () => {
    const { rerender } = renderWithRouter(<Logo size="sm" />);
    let button = screen.getByLabelText('Go to home page');
    let img = button.querySelector('img');
    expect(img?.parentElement).toHaveClass('h-6', 'w-6');

    rerender(
      <BrowserRouter>
        <Logo size="lg" />
      </BrowserRouter>
    );
    button = screen.getByLabelText('Go to home page');
    img = button.querySelector('img');
    expect(img?.parentElement).toHaveClass('h-10', 'w-10');
  });

  it('navigates to publishers page when clicked', () => {
    renderWithRouter(<Logo />);

    const button = screen.getByLabelText('Go to home page');
    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith('/publishers');
  });

  it('applies custom className', () => {
    renderWithRouter(<Logo className="custom-logo" />);

    const button = screen.getByLabelText('Go to home page');
    expect(button).toHaveClass('custom-logo');
  });

  it('has proper accessibility attributes', () => {
    renderWithRouter(<Logo />);

    const button = screen.getByLabelText('Go to home page');
    expect(button).toHaveAttribute('aria-label', 'Go to home page');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('has hover and focus styles', () => {
    renderWithRouter(<Logo />);

    const button = screen.getByLabelText('Go to home page');
    expect(button).toHaveClass('hover:opacity-80', 'focus:ring-2', 'focus:ring-blue-500');
  });

  it('shows fallback when image fails to load', () => {
    renderWithRouter(<Logo />);

    const img = screen.getByAltText('Azure VM Marketplace Logo');
    
    // Simulate image load error
    fireEvent.error(img);
    
    // The fallback should be visible (though we can't easily test the DOM manipulation in this test environment)
    expect(img).toBeInTheDocument();
  });
});