/**
 * @module ThemeToggle.test
 * @description Component tests for ThemeToggle — button rendering, theme
 * toggle on click, persisted via safeStorage, document class update.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestProviders } from '@/test/TestProviders';

// `vi.mock` is hoisted above top-level statements. Use `vi.hoisted` so that
// the storage state and setItem spy are also hoisted and available inside
// the mock factory.
const { storage, setItemSpy } = vi.hoisted(() => {
  const storage: { theme: string | null } = { theme: null };
  const setItemSpy = vi.fn((k: string, v: string) => {
    if (k === 'theme') storage.theme = v;
  });
  return { storage, setItemSpy };
});

vi.mock('@/lib/safeStorage', () => ({
  safeStorage: {
    setItem: setItemSpy,
    getItem: (k: string) => (k === 'theme' ? storage.theme : null),
    clear: vi.fn(),
  },
}));

import { ThemeToggle } from '../ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    storage.theme = null;
    setItemSpy.mockClear();
    document.documentElement.className = '';
    // jsdom mock for matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('renders theme toggle button when mounted', () => {
    render(<ThemeToggle />, { wrapper: TestProviders });
    expect(screen.getByTestId('button-theme-toggle')).toBeTruthy();
  });

  it('persists theme via safeStorage when button clicked', () => {
    render(<ThemeToggle />, { wrapper: TestProviders });
    fireEvent.click(screen.getByTestId('button-theme-toggle'));
    expect(setItemSpy).toHaveBeenCalledWith('theme', 'dark');
  });

  it('adds dark class to documentElement when toggled on', () => {
    render(<ThemeToggle />, { wrapper: TestProviders });
    fireEvent.click(screen.getByTestId('button-theme-toggle'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes dark class when toggled off', () => {
    render(<ThemeToggle />, { wrapper: TestProviders });
    const btn = screen.getByTestId('button-theme-toggle');
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('reads initial theme from safeStorage when light is saved', () => {
    storage.theme = 'light';
    render(<ThemeToggle />, { wrapper: TestProviders });
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('initializes dark when saved theme is dark', () => {
    storage.theme = 'dark';
    render(<ThemeToggle />, { wrapper: TestProviders });
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
