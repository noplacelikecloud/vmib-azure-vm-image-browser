// Utility functions for the Azure VM Marketplace Browser

/**
 * Concatenate class names conditionally
 */
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Formats a string for display purposes
 */
export const formatDisplayName = (name: string): string => {
  return name
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Debounce function for search inputs
 */
// eslint-disable-next-line no-unused-vars
export const debounce = <T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
  // eslint-disable-next-line no-unused-vars
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Format error messages for display
 */
export const formatErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
};

// Export validation functions
export * from './validation';

// Export IaC formatting functions
export * from './iacFormats';

// Export error handling utilities
export * from './errorHandling';

// Export network status utilities
export * from './networkStatus';
