import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CopyButton } from '../CopyButton';
import { VMImageReference } from '../../../types';
import * as utils from '../../../utils';

// Mock the clipboard API
const mockWriteText = vi.fn();
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

// Mock the utils module
vi.mock('../../../utils', async () => {
  const actual = await vi.importActual('../../../utils');
  return {
    ...actual,
    copyToClipboard: vi.fn(),
  };
});

describe('CopyButton', () => {
  const mockImageRef: VMImageReference = {
    publisher: 'Canonical',
    offer: '0001-com-ubuntu-server-focal',
    sku: '20_04-lts-gen2',
    version: 'latest'
  };

  const mockCopyToClipboard = vi.mocked(utils.copyToClipboard);

  beforeEach(() => {
    vi.clearAllMocks();
    mockCopyToClipboard.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Rendering', () => {
    it('should render copy button with default state', () => {
      render(<CopyButton imageReference={mockImageRef} />);
      
      expect(screen.getByRole('button', { name: /copy as arm template/i })).toBeInTheDocument();
      expect(screen.getByText('Copy')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const { container } = render(
        <CopyButton imageReference={mockImageRef} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should be disabled when imageReference is invalid', () => {
      const invalidImageRef = { ...mockImageRef, publisher: '' };
      render(<CopyButton imageReference={invalidImageRef} />);
      
      const copyButton = screen.getByRole('button', { name: /copy as arm template/i });
      expect(copyButton).toBeDisabled();
      expect(copyButton).toHaveClass('cursor-not-allowed');
    });

    it('should be disabled when disabled prop is true', () => {
      render(<CopyButton imageReference={mockImageRef} disabled={true} />);
      
      const copyButton = screen.getByRole('button', { name: /copy as arm template/i });
      expect(copyButton).toBeDisabled();
    });
  });

  describe('Dropdown functionality', () => {
    it('should open dropdown when dropdown toggle is clicked', () => {
      render(<CopyButton imageReference={mockImageRef} />);
      
      const dropdownToggle = screen.getByRole('button', { name: /select copy format/i });
      fireEvent.click(dropdownToggle);
      
      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /arm template/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /terraform/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /bicep/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /ansible/i })).toBeInTheDocument();
    });

    it('should close dropdown when clicking outside', () => {
      render(
        <div>
          <CopyButton imageReference={mockImageRef} />
          <div data-testid="outside">Outside element</div>
        </div>
      );
      
      const dropdownToggle = screen.getByRole('button', { name: /select copy format/i });
      fireEvent.click(dropdownToggle);
      
      expect(screen.getByRole('menu')).toBeInTheDocument();
      
      fireEvent.mouseDown(screen.getByTestId('outside'));
      
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('should show selected format with checkmark', () => {
      render(<CopyButton imageReference={mockImageRef} />);
      
      const dropdownToggle = screen.getByRole('button', { name: /select copy format/i });
      fireEvent.click(dropdownToggle);
      
      const armOption = screen.getByRole('menuitem', { name: /arm template/i });
      expect(armOption).toHaveClass('bg-blue-50', 'text-blue-700');
      
      // Check for checkmark icon (svg with specific path)
      const checkmark = armOption.querySelector('svg');
      expect(checkmark).toBeInTheDocument();
    });
  });

  describe('Copy functionality', () => {
    it('should copy ARM template when main button is clicked', async () => {
      render(<CopyButton imageReference={mockImageRef} />);
      
      const copyButton = screen.getByRole('button', { name: /copy as arm template/i });
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(mockCopyToClipboard).toHaveBeenCalledWith(
          expect.stringContaining('"publisher": "Canonical"')
        );
      });
    });

    it('should copy selected format when dropdown option is clicked', async () => {
      render(<CopyButton imageReference={mockImageRef} />);
      
      const dropdownToggle = screen.getByRole('button', { name: /select copy format/i });
      fireEvent.click(dropdownToggle);
      
      const terraformOption = screen.getByRole('menuitem', { name: /terraform/i });
      fireEvent.click(terraformOption);
      
      await waitFor(() => {
        expect(mockCopyToClipboard).toHaveBeenCalledWith(
          expect.stringContaining('publisher = "Canonical"')
        );
      });
    });

    it('should show success state after successful copy', async () => {
      render(<CopyButton imageReference={mockImageRef} />);
      
      const copyButton = screen.getByRole('button', { name: /copy as arm template/i });
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });
      
      expect(copyButton).toHaveClass('bg-green-600');
    });

    it('should show error state when copy fails', async () => {
      mockCopyToClipboard.mockResolvedValue(false);
      
      render(<CopyButton imageReference={mockImageRef} />);
      
      const copyButton = screen.getByRole('button', { name: /copy as arm template/i });
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(screen.getByText('Copy Failed')).toBeInTheDocument();
      });
      
      expect(copyButton).toHaveClass('bg-red-600');
    });

    it('should show loading state during copy operation', async () => {
      // Mock a delayed response
      mockCopyToClipboard.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(true), 100))
      );
      
      render(<CopyButton imageReference={mockImageRef} />);
      
      const copyButton = screen.getByRole('button', { name: /copy as arm template/i });
      fireEvent.click(copyButton);
      
      // Should show loading state immediately
      expect(screen.getByText('Copying...')).toBeInTheDocument();
      expect(copyButton.querySelector('.animate-spin')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });
    });

    it('should handle copy exception gracefully', async () => {
      mockCopyToClipboard.mockRejectedValue(new Error('Copy failed'));
      
      render(<CopyButton imageReference={mockImageRef} />);
      
      const copyButton = screen.getByRole('button', { name: /copy as arm template/i });
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(screen.getByText('Copy Failed')).toBeInTheDocument();
      });
    });
  });

  describe('Format selection', () => {
    it('should update selected format when dropdown option is clicked', async () => {
      render(<CopyButton imageReference={mockImageRef} />);
      
      // Open dropdown
      const dropdownToggle = screen.getByRole('button', { name: /select copy format/i });
      fireEvent.click(dropdownToggle);
      
      // Click Terraform option
      const terraformOption = screen.getByRole('menuitem', { name: /terraform/i });
      fireEvent.click(terraformOption);
      
      // Wait for copy to complete
      await waitFor(() => {
        expect(mockCopyToClipboard).toHaveBeenCalledWith(
          expect.stringContaining('publisher = "Canonical"')
        );
      });
      
      // Open dropdown again to check selection
      fireEvent.click(dropdownToggle);
      
      const terraformOptionAgain = screen.getByRole('menuitem', { name: /terraform/i });
      expect(terraformOptionAgain).toHaveClass('bg-blue-50', 'text-blue-700');
    });

    it('should use selected format for quick copy', async () => {
      render(<CopyButton imageReference={mockImageRef} />);
      
      // Select Bicep format
      const dropdownToggle = screen.getByRole('button', { name: /select copy format/i });
      fireEvent.click(dropdownToggle);
      
      const bicepOption = screen.getByRole('menuitem', { name: /bicep/i });
      fireEvent.click(bicepOption);
      
      await waitFor(() => {
        expect(mockCopyToClipboard).toHaveBeenCalledWith(
          expect.stringContaining("publisher: 'Canonical'")
        );
      });
      
      // Clear previous calls
      mockCopyToClipboard.mockClear();
      
      // Now use quick copy (main button) - wait for state to update first
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copy as bicep/i })).toBeInTheDocument();
      });
      
      const copyButton = screen.getByRole('button', { name: /copy as bicep/i });
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(mockCopyToClipboard).toHaveBeenCalledWith(
          expect.stringContaining("publisher: 'Canonical'")
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<CopyButton imageReference={mockImageRef} />);
      
      const dropdownToggle = screen.getByRole('button', { name: /select copy format/i });
      expect(dropdownToggle).toHaveAttribute('aria-expanded', 'false');
      expect(dropdownToggle).toHaveAttribute('aria-haspopup', 'true');
      
      fireEvent.click(dropdownToggle);
      
      expect(dropdownToggle).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('menu')).toHaveAttribute('aria-orientation', 'vertical');
    });

    it('should have proper button labels', () => {
      render(<CopyButton imageReference={mockImageRef} />);
      
      expect(screen.getByRole('button', { name: /copy as arm template/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /select copy format/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<CopyButton imageReference={mockImageRef} />);
      
      const copyButton = screen.getByRole('button', { name: /copy as arm template/i });
      const dropdownToggle = screen.getByRole('button', { name: /select copy format/i });
      
      // Both buttons should be focusable
      copyButton.focus();
      expect(copyButton).toHaveFocus();
      
      dropdownToggle.focus();
      expect(dropdownToggle).toHaveFocus();
    });
  });

  describe('Edge cases', () => {
    it('should handle invalid image reference', async () => {
      const invalidImageRef = { ...mockImageRef, publisher: '' };
      render(<CopyButton imageReference={invalidImageRef} />);
      
      const copyButton = screen.getByRole('button', { name: /copy as arm template/i });
      
      // Button should be disabled
      expect(copyButton).toBeDisabled();
      
      // Clicking should not trigger copy
      fireEvent.click(copyButton);
      expect(mockCopyToClipboard).not.toHaveBeenCalled();
    });

    it('should close dropdown when format is selected', async () => {
      render(<CopyButton imageReference={mockImageRef} />);
      
      const dropdownToggle = screen.getByRole('button', { name: /select copy format/i });
      fireEvent.click(dropdownToggle);
      
      expect(screen.getByRole('menu')).toBeInTheDocument();
      
      const terraformOption = screen.getByRole('menuitem', { name: /terraform/i });
      fireEvent.click(terraformOption);
      
      // Wait for copy operation to complete
      await waitFor(() => {
        expect(mockCopyToClipboard).toHaveBeenCalled();
      });
      
      // Dropdown should be closed
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });
});