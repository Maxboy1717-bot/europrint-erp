/**
 * @module PrivateRoute.test
 * @description Component tests for PrivateRoute — renders children when
 * authenticated, redirects to /login otherwise, shows loading spinner,
 * supports role-based access checks via useAuth.hasRole.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestProviders } from '@/test/TestProviders';

interface AuthMockState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: { id: number; role: string } | null;
  hasRole: (...roles: string[]) => boolean;
}

const authState: { current: AuthMockState } = {
  current: {
    isLoading: false,
    isAuthenticated: true,
    user: { id: 1, role: 'super_admin' },
    hasRole: () => true,
  },
};

const { redirectSpy } = vi.hoisted(() => ({
    redirectSpy: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => authState.current,
}));


vi.mock('wouter', () => ({
  Redirect: ({ to }: { to: string }) => {
    redirectSpy(to);
    return <div data-testid="redirect" data-to={to} />;
  },
}));

import { PrivateRoute } from '../PrivateRoute';

describe('PrivateRoute', () => {
  beforeEach(() => {
    redirectSpy.mockReset();
    authState.current = {
      isLoading: false,
      isAuthenticated: true,
      user: { id: 1, role: 'super_admin' },
      hasRole: () => true,
    };
  });

  it('renders child when user is authenticated', () => {
    render(
      <PrivateRoute>
        <div data-testid="secret">visible</div>
      </PrivateRoute>,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('secret').textContent).toBe('visible');
  });

  it('redirects to /login when user is not authenticated', () => {
    authState.current = {
      isLoading: false,
      isAuthenticated: false,
      user: null,
      hasRole: () => false,
    };
    render(
      <PrivateRoute>
        <div data-testid="secret">visible</div>
      </PrivateRoute>,
      { wrapper: TestProviders },
    );
    expect(redirectSpy).toHaveBeenCalledWith('/login');
    expect(screen.queryByTestId('secret')).toBeNull();
  });

  it('shows loading state when isLoading is true', () => {
    authState.current = {
      isLoading: true,
      isAuthenticated: false,
      user: null,
      hasRole: () => false,
    };
    render(
      <PrivateRoute>
        <div data-testid="secret">visible</div>
      </PrivateRoute>,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('loading-auth')).toBeTruthy();
    expect(screen.queryByTestId('secret')).toBeNull();
  });

  it('handles role-based access by exposing hasRole helper to consumers', () => {
    const hasRoleSpy = vi.fn((...roles: string[]) =>
      roles.includes('super_admin'),
    );
    authState.current = {
      isLoading: false,
      isAuthenticated: true,
      user: { id: 1, role: 'super_admin' },
      hasRole: hasRoleSpy,
    };
    render(
      <PrivateRoute>
        <div data-testid="secret">visible</div>
      </PrivateRoute>,
      { wrapper: TestProviders },
    );
    expect(authState.current.hasRole('super_admin')).toBe(true);
    expect(authState.current.hasRole('operator')).toBe(false);
  });

  it('does not redirect when isLoading toggles from true to false with auth', () => {
    authState.current = {
      isLoading: false,
      isAuthenticated: true,
      user: { id: 5, role: 'hr_manager' },
      hasRole: (...roles: string[]) => roles.includes('hr_manager'),
    };
    render(
      <PrivateRoute>
        <div data-testid="secret">visible</div>
      </PrivateRoute>,
      { wrapper: TestProviders },
    );
    expect(redirectSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId('secret')).toBeTruthy();
  });
});
