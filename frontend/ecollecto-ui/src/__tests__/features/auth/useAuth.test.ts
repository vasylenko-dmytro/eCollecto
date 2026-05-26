import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuth } from '../../../features/auth/hooks/useAuth';

// Mock react-oidc-context
const mockSigninRedirect = vi.fn();
const mockSignoutRedirect = vi.fn();

vi.mock('react-oidc-context', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    signinRedirect: mockSigninRedirect,
    signoutRedirect: mockSignoutRedirect,
  }),
}));

// Mock react-redux
vi.mock('react-redux', () => ({
  useSelector: vi.fn(() => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  })),
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns isAuthenticated=false when not logged in', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('returns user=null when not logged in', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
  });

  it('returns isLoading=false when auth state is resolved', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoading).toBe(false);
  });

  it('signIn() calls oidcAuth.signinRedirect', () => {
    const { result } = renderHook(() => useAuth());
    result.current.signIn();
    expect(mockSigninRedirect).toHaveBeenCalledOnce();
  });

  it('signOut() calls oidcAuth.signoutRedirect', () => {
    const { result } = renderHook(() => useAuth());
    result.current.signOut();
    expect(mockSignoutRedirect).toHaveBeenCalledOnce();
  });

  it('getAccessToken() returns null when not authenticated', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.getAccessToken()).toBeNull();
  });
});


