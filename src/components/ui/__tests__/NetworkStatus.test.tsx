import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  NetworkStatus,
  OfflineFallback,
  RetryButton,
  useNetworkStatus,
  useNetworkAwareOperation,
} from '../NetworkStatus';
import { globalNetworkMonitor } from '../../../utils/networkStatus';

// Mock the global network monitor
vi.mock('../../../utils/networkStatus', () => {
  const mockNetworkMonitor = {
    getNetworkStatus: vi.fn(() => ({ isOnline: true, connectionType: 'wifi' })),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    isOnline: vi.fn(() => true),
  };

  return {
    globalNetworkMonitor: mockNetworkMonitor,
  };
});

describe('NetworkStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when online and showWhenOnline is false', () => {
    render(<NetworkStatus />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('should render when online and showWhenOnline is true', () => {
    render(<NetworkStatus showWhenOnline />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('should render when offline', () => {
    (globalNetworkMonitor.getNetworkStatus as any).mockReturnValue({
      isOnline: false,
      connectionType: 'wifi',
    });

    render(<NetworkStatus />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('should show connection type when available', () => {
    (globalNetworkMonitor.getNetworkStatus as any).mockReturnValue({
      isOnline: true,
      connectionType: '4g',
    });

    render(<NetworkStatus showWhenOnline />);
    expect(screen.getByText('(4g)')).toBeInTheDocument();
  });

  it('should call onStatusChange when status changes', () => {
    const onStatusChange = vi.fn();
    let statusChangeCallback: any;

    (globalNetworkMonitor.addEventListener as any).mockImplementation((event: string, callback: any) => {
      if (event === 'change') {
        statusChangeCallback = callback;
      }
    });

    render(<NetworkStatus onStatusChange={onStatusChange} />);

    // Simulate status change
    const newStatus = { isOnline: false, connectionType: 'wifi' };
    statusChangeCallback(newStatus);

    expect(onStatusChange).toHaveBeenCalledWith(newStatus);
  });

  it('should clean up event listeners on unmount', () => {
    const { unmount } = render(<NetworkStatus />);
    unmount();

    expect(globalNetworkMonitor.removeEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    );
  });
});

describe('OfflineFallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children when online', () => {
    (globalNetworkMonitor.isOnline as any).mockReturnValue(true);

    render(
      <OfflineFallback>
        <div>Online content</div>
      </OfflineFallback>
    );

    expect(screen.getByText('Online content')).toBeInTheDocument();
  });

  it('should render default fallback when offline', () => {
    (globalNetworkMonitor.isOnline as any).mockReturnValue(false);

    render(
      <OfflineFallback>
        <div>Online content</div>
      </OfflineFallback>
    );

    expect(screen.queryByText('Online content')).not.toBeInTheDocument();
    expect(screen.getByText('No Internet Connection')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('should render custom fallback when offline', () => {
    (globalNetworkMonitor.isOnline as any).mockReturnValue(false);

    render(
      <OfflineFallback fallback={<div>Custom offline message</div>}>
        <div>Online content</div>
      </OfflineFallback>
    );

    expect(screen.queryByText('Online content')).not.toBeInTheDocument();
    expect(screen.getByText('Custom offline message')).toBeInTheDocument();
  });

  it('should reload page when try again button is clicked', () => {
    (globalNetworkMonitor.isOnline as any).mockReturnValue(false);

    // Mock window.location.reload
    const mockReload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
    });

    render(
      <OfflineFallback>
        <div>Online content</div>
      </OfflineFallback>
    );

    fireEvent.click(screen.getByText('Try Again'));
    expect(mockReload).toHaveBeenCalled();
  });
});

describe('RetryButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call onRetry when clicked and online', () => {
    (globalNetworkMonitor.isOnline as any).mockReturnValue(true);
    const onRetry = vi.fn();

    render(<RetryButton onRetry={onRetry} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('should not call onRetry when offline', () => {
    (globalNetworkMonitor.isOnline as any).mockReturnValue(false);
    const onRetry = vi.fn();

    render(<RetryButton onRetry={onRetry} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('should show offline state when offline', () => {
    (globalNetworkMonitor.isOnline as any).mockReturnValue(false);
    const onRetry = vi.fn();

    render(<RetryButton onRetry={onRetry} />);

    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should show retrying state when isRetrying is true', () => {
    (globalNetworkMonitor.isOnline as any).mockReturnValue(true);
    const onRetry = vi.fn();

    render(<RetryButton onRetry={onRetry} isRetrying />);

    expect(screen.getByText('Retrying...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should be disabled when disabled prop is true', () => {
    (globalNetworkMonitor.isOnline as any).mockReturnValue(true);
    const onRetry = vi.fn();

    render(<RetryButton onRetry={onRetry} disabled />);

    expect(screen.getByRole('button')).toBeDisabled();
    fireEvent.click(screen.getByRole('button'));
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('should render custom children', () => {
    (globalNetworkMonitor.isOnline as any).mockReturnValue(true);
    const onRetry = vi.fn();

    render(<RetryButton onRetry={onRetry}>Custom Retry Text</RetryButton>);

    expect(screen.getByText('Custom Retry Text')).toBeInTheDocument();
  });
});

describe('useNetworkStatus', () => {
  it('should return current network status', () => {
    const TestComponent = () => {
      const networkStatus = useNetworkStatus();
      return <div>{networkStatus.isOnline ? 'Online' : 'Offline'}</div>;
    };

    render(<TestComponent />);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('should update when network status changes', () => {
    let statusChangeCallback: any;

    (globalNetworkMonitor.addEventListener as any).mockImplementation((event: string, callback: any) => {
      if (event === 'change') {
        statusChangeCallback = callback;
      }
    });

    const TestComponent = () => {
      const networkStatus = useNetworkStatus();
      return <div>{networkStatus.isOnline ? 'Online' : 'Offline'}</div>;
    };

    render(<TestComponent />);
    expect(screen.getByText('Online')).toBeInTheDocument();

    // Simulate going offline
    statusChangeCallback({ isOnline: false });
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });
});

describe('useNetworkAwareOperation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should execute operation when online', async () => {
    (globalNetworkMonitor.getNetworkStatus as any).mockReturnValue({ isOnline: true });
    
    const mockOperation = vi.fn().mockResolvedValue('success');

    const TestComponent = () => {
      const { execute, data, isLoading, error } = useNetworkAwareOperation(mockOperation);

      React.useEffect(() => {
        execute();
      }, [execute]);

      if (isLoading) return <div>Loading...</div>;
      if (error) return <div>Error: {error.message}</div>;
      if (data) return <div>Data: {data}</div>;
      return <div>No data</div>;
    };

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByText('Data: success')).toBeInTheDocument();
    });

    expect(mockOperation).toHaveBeenCalled();
  });

  it('should not execute operation when offline', async () => {
    (globalNetworkMonitor.getNetworkStatus as any).mockReturnValue({ isOnline: false });
    
    const mockOperation = vi.fn().mockResolvedValue('success');

    const TestComponent = () => {
      const { execute, data, isLoading, error } = useNetworkAwareOperation(mockOperation);

      React.useEffect(() => {
        execute();
      }, [execute]);

      if (isLoading) return <div>Loading...</div>;
      if (error) return <div>Error: {error.message}</div>;
      if (data) return <div>Data: {data}</div>;
      return <div>No data</div>;
    };

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByText('Error: Cannot perform operation while offline')).toBeInTheDocument();
    });

    expect(mockOperation).not.toHaveBeenCalled();
  });

  it('should handle operation errors', async () => {
    (globalNetworkMonitor.getNetworkStatus as any).mockReturnValue({ isOnline: true });
    
    const mockOperation = vi.fn().mockRejectedValue(new Error('Operation failed'));

    const TestComponent = () => {
      const { execute, data, isLoading, error } = useNetworkAwareOperation(mockOperation);

      React.useEffect(() => {
        execute();
      }, [execute]);

      if (isLoading) return <div>Loading...</div>;
      if (error) return <div>Error: {error.message}</div>;
      if (data) return <div>Data: {data}</div>;
      return <div>No data</div>;
    };

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByText('Error: Operation failed')).toBeInTheDocument();
    });

    expect(mockOperation).toHaveBeenCalled();
  });
});