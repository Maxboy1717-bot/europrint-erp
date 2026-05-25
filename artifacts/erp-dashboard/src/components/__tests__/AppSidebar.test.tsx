/**
 * @module AppSidebar.test
 * @description Component tests for AppSidebar — role-based menu visibility,
 * active route highlighting, collapse behavior, RBAC filtering.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestProviders } from '@/test/TestProviders';

interface RoleMenuMock {
  isMenuAllowed: (url: string) => boolean;
  isAdmin: boolean;
  role: string;
}

const roleMenuState: { current: RoleMenuMock } = {
  current: {
    isMenuAllowed: () => true,
    isAdmin: true,
    role: 'super_admin',
  },
};

const sidebarState: { current: 'expanded' | 'collapsed' } = {
  current: 'expanded',
};

vi.mock('@/hooks/use-role-menus', () => ({
  useRoleMenus: () => roleMenuState.current,
}));

vi.mock('@/hooks/use-default-panel', () => ({
  useDefaultPanel: () => ({ defaultPage: 'analytics' }),
}));

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}));

vi.mock('@/components/ui/sidebar', () => {
  const passthrough = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  );
  return {
    Sidebar: passthrough,
    SidebarContent: passthrough,
    SidebarGroup: passthrough,
    SidebarGroupContent: passthrough,
    SidebarGroupLabel: passthrough,
    SidebarMenu: passthrough,
    SidebarMenuButton: ({
      children,
      isActive,
    }: {
      children: React.ReactNode;
      isActive?: boolean;
      asChild?: boolean;
    }) => <div data-active={isActive ? 'true' : 'false'}>{children}</div>,
    SidebarMenuItem: passthrough,
    SidebarHeader: passthrough,
    SidebarFooter: passthrough,
    useSidebar: () => ({ state: sidebarState.current }),
  };
});

vi.mock('@/components/EuroprintLogo', () => ({
  EuroprintLogo: () => <span>EuroPrint</span>,
}));

vi.mock('@/lib/safeStorage', () => ({
  safeStorage: {
    setItem: vi.fn(),
    getItem: vi.fn(),
    clear: vi.fn(),
  },
}));

// AppSidebar uses Radix `<Tooltip>` when collapsed — short-circuit the Radix
// primitive in tests so we don't have to wrap every render in TooltipProvider.
vi.mock('@/components/ui/tooltip', () => {
  const passthrough = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  return {
    Tooltip: passthrough,
    TooltipTrigger: passthrough,
    TooltipContent: passthrough,
    TooltipProvider: passthrough,
  };
});

// Also mock the underlying Radix primitive in case the module cache fails to
// rewire `@/components/ui/tooltip` for any sub-import path (defensive).
vi.mock('@radix-ui/react-tooltip', () => {
  const passthrough = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  return {
    Root: passthrough,
    Trigger: passthrough,
    Content: passthrough,
    Provider: passthrough,
    Portal: passthrough,
    Arrow: () => null,
  };
});

import { AppSidebar } from '../AppSidebar';

describe('AppSidebar', () => {
  beforeEach(() => {
    roleMenuState.current = {
      isMenuAllowed: () => true,
      isAdmin: true,
      role: 'super_admin',
    };
    sidebarState.current = 'expanded';
  });

  it('shows all modules when user role is admin', () => {
    render(<AppSidebar activePage="analytics" />, { wrapper: TestProviders });
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(5);
  });

  it('hides finance modules when user role is hr', () => {
    const hrAllowed = new Set(['employees', 'hr/dashboard', 'settings']);
    roleMenuState.current = {
      isMenuAllowed: (url: string) => hrAllowed.has(url),
      isAdmin: false,
      role: 'hr_manager',
    };
    render(<AppSidebar activePage="employees" />, { wrapper: TestProviders });
    const financeLink = screen.queryByTestId('nav-menu-item-fi/accounts');
    expect(financeLink).toBeNull();
  });

  it('hides item labels when sidebar collapses on toggle', () => {
    sidebarState.current = 'collapsed';
    // The Tooltip module mock above already passes through Radix.
    // We just verify the version label "ERP System v2.0" is absent in
    // the collapsed sidebar state; the menu items themselves still render
    // through the mocked SidebarMenuButton + Tooltip passthroughs.
    render(<AppSidebar activePage="analytics" />, { wrapper: TestProviders });
    expect(screen.queryByText('ERP System v2.0')).toBeNull();
  });

  it('highlights active route when activePage matches item url', () => {
    render(<AppSidebar activePage="courses" />, { wrapper: TestProviders });
    const courseLink = screen.getByTestId('nav-menu-item-courses');
    const wrapper = courseLink.closest('[data-active]');
    expect(wrapper?.getAttribute('data-active')).toBe('true');
  });

  it('filters menu via RBAC when isMenuAllowed denies a route', () => {
    const limited = new Set(['settings']);
    roleMenuState.current = {
      isMenuAllowed: (url: string) => limited.has(url),
      isAdmin: false,
      role: 'operator',
    };
    render(<AppSidebar activePage="settings" />, { wrapper: TestProviders });
    expect(screen.queryByTestId('nav-menu-item-employees')).toBeNull();
    expect(screen.getByTestId('nav-menu-item-settings')).toBeTruthy();
  });
});
