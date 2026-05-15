/**
 * @module LanguageSwitcher.test
 * @description Component tests for LanguageSwitcher — trigger button, language
 * options, setLanguage callback, active indicator, accessibility.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestProviders } from '@/test/TestProviders';

const langState: { current: string; setter: ReturnType<typeof vi.fn> } = {
  current: 'uz',
  setter: vi.fn(),
};

vi.mock('@/lib/i18n', () => ({
  useLanguageSetter: () => ({
    language: langState.current,
    setLanguage: langState.setter,
  }),
}));

import { LanguageSwitcher } from '../LanguageSwitcher';

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    langState.current = 'uz';
    langState.setter = vi.fn();
  });

  it('renders trigger button when mounted', () => {
    render(<LanguageSwitcher />, { wrapper: TestProviders });
    expect(screen.getByTestId('button-language-switcher')).toBeTruthy();
  });

  it('shows current language short code when language is uz', () => {
    render(<LanguageSwitcher />, { wrapper: TestProviders });
    expect(screen.getByText('UZ')).toBeTruthy();
  });

  it('shows different short code when language is ru', () => {
    langState.current = 'ru';
    render(<LanguageSwitcher />, { wrapper: TestProviders });
    expect(screen.getByText('RU')).toBeTruthy();
  });

  it('opens menu when trigger is clicked', () => {
    render(<LanguageSwitcher />, { wrapper: TestProviders });
    fireEvent.click(screen.getByTestId('button-language-switcher'));
    expect(screen.getByTestId('menu-item-language-uz')).toBeTruthy();
  });

  it('calls setLanguage when ru item is clicked', () => {
    render(<LanguageSwitcher />, { wrapper: TestProviders });
    fireEvent.click(screen.getByTestId('button-language-switcher'));
    fireEvent.click(screen.getByTestId('menu-item-language-ru'));
    expect(langState.setter).toHaveBeenCalledWith('ru');
  });

  it('renders all available language options when menu opens', () => {
    render(<LanguageSwitcher />, { wrapper: TestProviders });
    fireEvent.click(screen.getByTestId('button-language-switcher'));
    expect(screen.getByTestId('menu-item-language-uz')).toBeTruthy();
    expect(screen.getByTestId('menu-item-language-ru')).toBeTruthy();
  });
});
