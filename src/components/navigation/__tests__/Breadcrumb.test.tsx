import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Breadcrumb, CompactBreadcrumb } from '../Breadcrumb';
import { useBreadcrumb } from '../../../stores/navigationStore';
import type { BreadcrumbItem } from '../../../types';

// Mock the navigation store
vi.mock('../../../stores/navigationStore');

const mockBreadcrumbItems: BreadcrumbItem[] = [
  {
    label: 'Publishers',
    level: 'publishers',
    onClick: vi.fn(),
  },
  {
    label: 'Microsoft',
    level: 'offers',
    onClick: vi.fn(),
  },
  {
    label: 'Windows Server',
    level: 'skus',
    onClick: vi.fn(),
  },
];

describe('Breadcrumb', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation
    (useBreadcrumb as any).mockReturnValue({
      breadcrumb: mockBreadcrumbItems,
    });
  });

  it('renders breadcrumb items correctly', () => {
    render(<Breadcrumb />);
    
    expect(screen.getByText('Publishers')).toBeInTheDocument();
    expect(screen.getByText('Microsoft')).toBeInTheDocument();
    expect(screen.getByText('Windows Server')).toBeInTheDocument();
  });

  it('shows home icon when showHome is true', () => {
    render(<Breadcrumb showHome />);
    
    const homeButton = screen.getByLabelText('Go to home');
    expect(homeButton).toBeInTheDocument();
  });

  it('hides home icon when showHome is false', () => {
    render(<Breadcrumb showHome={false} />);
    
    const homeButton = screen.queryByLabelText('Go to home');
    expect(homeButton).not.toBeInTheDocument();
  });

  it('renders separators between items', () => {
    render(<Breadcrumb />);
    
    const separators = screen.getAllByText('/');
    // Should have separators: home -> first item, between items
    expect(separators.length).toBeGreaterThan(0);
  });

  it('uses custom separator when provided', () => {
    render(<Breadcrumb separator=">" />);
    
    const customSeparators = screen.getAllByText('>');
    expect(customSeparators.length).toBeGreaterThan(0);
  });

  it('makes non-current items clickable', () => {
    render(<Breadcrumb />);
    
    const publishersButton = screen.getByRole('button', { name: 'Go to Publishers' });
    const microsoftButton = screen.getByRole('button', { name: 'Go to Microsoft' });
    
    expect(publishersButton).toBeInTheDocument();
    expect(microsoftButton).toBeInTheDocument();
  });

  it('makes current item non-clickable', () => {
    render(<Breadcrumb />);
    
    const currentItem = screen.getByText('Windows Server');
    expect(currentItem).toHaveAttribute('aria-current', 'page');
    expect(currentItem.tagName).toBe('SPAN');
  });

  it('calls onClick when breadcrumb item is clicked', () => {
    render(<Breadcrumb />);
    
    const publishersButton = screen.getByRole('button', { name: 'Go to Publishers' });
    fireEvent.click(publishersButton);
    
    expect(mockBreadcrumbItems[0].onClick).toHaveBeenCalled();
  });

  it('does not call onClick for current item', () => {
    render(<Breadcrumb />);
    
    const currentItem = screen.getByText('Windows Server');
    fireEvent.click(currentItem);
    
    expect(mockBreadcrumbItems[2].onClick).not.toHaveBeenCalled();
  });

  it('calls home onClick when home button is clicked', () => {
    render(<Breadcrumb showHome />);
    
    const homeButton = screen.getByLabelText('Go to home');
    fireEvent.click(homeButton);
    
    expect(mockBreadcrumbItems[0].onClick).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const { container } = render(<Breadcrumb className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('returns null when breadcrumb is empty', () => {
    (useBreadcrumb as any).mockReturnValue({
      breadcrumb: [],
    });

    const { container } = render(<Breadcrumb />);
    
    expect(container.firstChild).toBeNull();
  });

  it('has proper accessibility attributes', () => {
    render(<Breadcrumb />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Breadcrumb');
    
    const currentItem = screen.getByText('Windows Server');
    expect(currentItem).toHaveAttribute('aria-current', 'page');
  });
});

describe('CompactBreadcrumb', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation
    (useBreadcrumb as any).mockReturnValue({
      breadcrumb: mockBreadcrumbItems,
    });
  });

  it('renders current item', () => {
    render(<CompactBreadcrumb />);
    
    expect(screen.getByText('Windows Server')).toBeInTheDocument();
  });

  it('renders parent item with back button', () => {
    render(<CompactBreadcrumb />);
    
    const backButton = screen.getByLabelText('Go back to Microsoft');
    expect(backButton).toBeInTheDocument();
    expect(screen.getByText('Microsoft')).toBeInTheDocument();
  });

  it('calls parent onClick when back button is clicked', () => {
    render(<CompactBreadcrumb />);
    
    const backButton = screen.getByLabelText('Go back to Microsoft');
    fireEvent.click(backButton);
    
    expect(mockBreadcrumbItems[1].onClick).toHaveBeenCalled();
  });

  it('does not show back button when only one item', () => {
    (useBreadcrumb as any).mockReturnValue({
      breadcrumb: [mockBreadcrumbItems[0]],
    });

    render(<CompactBreadcrumb />);
    
    expect(screen.queryByLabelText(/Go back to/)).not.toBeInTheDocument();
    expect(screen.getByText('Publishers')).toBeInTheDocument();
  });

  it('returns null when breadcrumb is empty', () => {
    (useBreadcrumb as any).mockReturnValue({
      breadcrumb: [],
    });

    const { container } = render(<CompactBreadcrumb />);
    
    expect(container.firstChild).toBeNull();
  });

  it('applies custom className', () => {
    const { container } = render(<CompactBreadcrumb className="compact-class" />);
    
    expect(container.firstChild).toHaveClass('compact-class');
  });

  it('has proper accessibility attributes', () => {
    render(<CompactBreadcrumb />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Breadcrumb');
    
    const currentItem = screen.getByText('Windows Server');
    expect(currentItem).toHaveAttribute('aria-current', 'page');
  });
});