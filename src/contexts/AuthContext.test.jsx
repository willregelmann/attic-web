import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { AuthProvider, useAuth } from './AuthContext';
import { GOOGLE_LOGIN } from '../queries';

// Mock jwt-decode
vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn(() => ({
    sub: 'google-123',
    email: 'test@example.com',
    name: 'Test User',
    picture: 'https://example.com/avatar.jpg',
    given_name: 'Test',
    family_name: 'User',
  })),
}));

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with no user when localStorage is empty', async () => {
    const wrapper = ({ children }) => (
      <MockedProvider mocks={[]} addTypename={false}>
        <AuthProvider>{children}</AuthProvider>
      </MockedProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should restore user from localStorage on mount', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
    };

    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('user_data', JSON.stringify(mockUser));

    const wrapper = ({ children }) => (
      <MockedProvider mocks={[]} addTypename={false}>
        <AuthProvider>{children}</AuthProvider>
      </MockedProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should handle login successfully', async () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
    };

    const mocks = [
      {
        request: {
          query: GOOGLE_LOGIN,
          variables: {
            googleToken: 'mock-google-token',
          },
        },
        result: {
          data: {
            googleLogin: {
              access_token: 'mock-access-token',
              user: mockUser,
            },
          },
        },
      },
    ];

    const wrapper = ({ children }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        <AuthProvider>{children}</AuthProvider>
      </MockedProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.login('mock-google-token');

    await waitFor(() => {
      expect(result.current.user).toBeTruthy();
      expect(result.current.user.email).toBe('test@example.com');
      expect(result.current.isAuthenticated).toBe(true);
    });

    // Verify localStorage was updated
    expect(localStorage.getItem('token')).toBe('mock-access-token');
    expect(localStorage.getItem('user_data')).toBeTruthy();
  });

  it('should handle logout successfully', async () => {
    // Setup initial authenticated state
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('user_data', JSON.stringify({
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
    }));

    const wrapper = ({ children }) => (
      <MockedProvider mocks={[]} addTypename={false}>
        <AuthProvider>{children}</AuthProvider>
      </MockedProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
    });

    await result.current.logout();

    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    // Verify localStorage was cleared
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user_data')).toBeNull();
  });

  it('should handle login error gracefully', async () => {
    const mocks = [
      {
        request: {
          query: GOOGLE_LOGIN,
          variables: {
            googleToken: 'invalid-token',
          },
        },
        error: new Error('Invalid credentials'),
      },
    ];

    const wrapper = ({ children }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        <AuthProvider>{children}</AuthProvider>
      </MockedProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(result.current.login('invalid-token')).rejects.toThrow();

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should handle corrupted localStorage data', async () => {
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('user_data', 'invalid-json{{{');

    const wrapper = ({ children }) => (
      <MockedProvider mocks={[]} addTypename={false}>
        <AuthProvider>{children}</AuthProvider>
      </MockedProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should not crash, should handle gracefully
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
