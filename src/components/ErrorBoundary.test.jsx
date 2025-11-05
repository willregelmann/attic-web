import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from './ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Component that throws during render
const AlwaysThrows = () => {
  throw new Error('Component crashed!');
};

describe('ErrorBoundary', () => {
  // Suppress console errors during tests to keep output clean
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should catch errors and display error UI', () => {
    render(
      <ErrorBoundary>
        <AlwaysThrows />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/we're sorry/i)).toBeInTheDocument();
  });

  it('should display error message', () => {
    render(
      <ErrorBoundary>
        <AlwaysThrows />
      </ErrorBoundary>
    );

    expect(screen.getByText(/The error has been logged/i)).toBeInTheDocument();
  });

  it('should show action buttons', () => {
    render(
      <ErrorBoundary>
        <AlwaysThrows />
      </ErrorBoundary>
    );

    expect(screen.getByRole('button', { name: /return to home/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
  });

  it('should redirect to home when clicking "Return to Home"', async () => {
    const user = userEvent.setup();

    // Mock window.location
    delete window.location;
    window.location = { href: '' };

    render(
      <ErrorBoundary>
        <AlwaysThrows />
      </ErrorBoundary>
    );

    const homeButton = screen.getByRole('button', { name: /return to home/i });
    await user.click(homeButton);

    expect(window.location.href).toBe('/');
  });

  it('should reload page when clicking "Reload Page"', async () => {
    const user = userEvent.setup();

    // Mock window.location.reload
    const mockReload = vi.fn();
    delete window.location;
    window.location = { reload: mockReload };

    render(
      <ErrorBoundary>
        <AlwaysThrows />
      </ErrorBoundary>
    );

    const reloadButton = screen.getByRole('button', { name: /reload page/i });
    await user.click(reloadButton);

    expect(mockReload).toHaveBeenCalled();
  });

  it('should show error details in development mode', () => {
    // Set to development mode
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <AlwaysThrows />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error Details (Development Only)')).toBeInTheDocument();

    // Restore original env
    process.env.NODE_ENV = originalEnv;
  });

  it('should not show error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(
      <ErrorBoundary>
        <AlwaysThrows />
      </ErrorBoundary>
    );

    expect(screen.queryByText('Error Details (Development Only)')).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('should handle errors in child components that throw conditionally', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();

    // Now make it throw
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should log error to console', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <AlwaysThrows />
      </ErrorBoundary>
    );

    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
