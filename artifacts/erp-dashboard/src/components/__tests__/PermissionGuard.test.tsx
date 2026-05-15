/**
 * @module PermissionGuard.test
 * @description Component tests for PermissionGuard — allowed/denied rendering,
 * fallback content, single + multiple permissions, requireAll behavior.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestProviders } from '@/test/TestProviders';

interface PermState {
  can: (p: string) => boolean;
  canAny: (p: string[]) => boolean;
  canAll: (p: string[]) => boolean;
}

const permState: { current: PermState } = {
  current: {
    can: () => true,
    canAny: () => true,
    canAll: () => true,
  },
};

vi.mock('@/hooks/usePermission', () => ({
  usePermission: () => permState.current,
}));

import { PermissionGuard } from '../PermissionGuard';

describe('PermissionGuard', () => {
  beforeEach(() => {
    permState.current = {
      can: () => true,
      canAny: () => true,
      canAll: () => true,
    };
  });

  it('renders children when single permission is granted', () => {
    render(
      <PermissionGuard permission={'employee.read' as never}>
        <span>Allowed</span>
      </PermissionGuard>,
      { wrapper: TestProviders },
    );
    expect(screen.getByText('Allowed')).toBeTruthy();
  });

  it('renders null when permission is denied', () => {
    permState.current.can = () => false;
    const { container } = render(
      <PermissionGuard permission={'employee.delete' as never}>
        <span>Denied content</span>
      </PermissionGuard>,
      { wrapper: TestProviders },
    );
    expect(container.textContent).toBe('');
  });

  it('renders fallback when provided and not allowed', () => {
    permState.current.can = () => false;
    render(
      <PermissionGuard
        permission={'x' as never}
        fallback={<span>No access</span>}
      >
        <span>Hidden</span>
      </PermissionGuard>,
      { wrapper: TestProviders },
    );
    expect(screen.getByText('No access')).toBeTruthy();
  });

  it('renders children when no permission specified', () => {
    render(
      <PermissionGuard>
        <span>Default</span>
      </PermissionGuard>,
      { wrapper: TestProviders },
    );
    expect(screen.getByText('Default')).toBeTruthy();
  });

  it('uses canAll for multiple permissions when requireAll is true', () => {
    const canAllSpy = vi.fn(() => true);
    permState.current = {
      can: () => true,
      canAny: () => true,
      canAll: canAllSpy,
    };
    render(
      <PermissionGuard
        permissions={['a', 'b'] as never}
        requireAll={true}
      >
        <span>Multi all</span>
      </PermissionGuard>,
      { wrapper: TestProviders },
    );
    expect(canAllSpy).toHaveBeenCalledWith(['a', 'b']);
  });

  it('uses canAny for multiple permissions when requireAll is false', () => {
    const canAnySpy = vi.fn(() => true);
    permState.current = {
      can: () => true,
      canAny: canAnySpy,
      canAll: () => true,
    };
    render(
      <PermissionGuard
        permissions={['a', 'b'] as never}
      >
        <span>Any</span>
      </PermissionGuard>,
      { wrapper: TestProviders },
    );
    expect(canAnySpy).toHaveBeenCalledWith(['a', 'b']);
  });
});
