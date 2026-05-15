/**
 * @module PermissionButton.test
 * @description Component tests for PermissionButton — permission gating,
 * disabled state, tooltip handling, requireAll logic, children passthrough.
 */

import { render, screen, fireEvent } from '@testing-library/react';
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

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip-content">{children}</div>
  ),
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { PermissionButton } from '../PermissionButton';

describe('PermissionButton', () => {
  beforeEach(() => {
    permState.current = {
      can: () => true,
      canAny: () => true,
      canAll: () => true,
    };
  });

  it('renders enabled button when user has permission', () => {
    render(
      <PermissionButton permission={'employee.read' as never}>Click</PermissionButton>,
      { wrapper: TestProviders },
    );
    const btn = screen.getByRole('button') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it('renders disabled button when user lacks permission', () => {
    permState.current.can = () => false;
    render(
      <PermissionButton permission={'employee.delete' as never}>Delete</PermissionButton>,
      { wrapper: TestProviders },
    );
    const btn = screen.getByRole('button') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('renders children content when allowed', () => {
    render(
      <PermissionButton permission={'x' as never}>Save changes</PermissionButton>,
      { wrapper: TestProviders },
    );
    expect(screen.getByText('Save changes')).toBeTruthy();
  });

  it('calls onClick when allowed and clicked', () => {
    const onClick = vi.fn();
    render(
      <PermissionButton permission={'x' as never} onClick={onClick}>Go</PermissionButton>,
      { wrapper: TestProviders },
    );
    fireEvent.click(screen.getByText('Go'));
    expect(onClick).toHaveBeenCalled();
  });

  it('renders button when no permission prop is provided', () => {
    render(
      <PermissionButton>Plain</PermissionButton>,
      { wrapper: TestProviders },
    );
    const btn = screen.getByRole('button') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it('uses canAll when permissions array given with requireAll', () => {
    const canAllSpy = vi.fn(() => false);
    permState.current = {
      can: () => true,
      canAny: () => true,
      canAll: canAllSpy,
    };
    render(
      <PermissionButton
        permission={['a', 'b'] as never}
        requireAll={true}
      >
        Multi
      </PermissionButton>,
      { wrapper: TestProviders },
    );
    expect(canAllSpy).toHaveBeenCalled();
  });
});
