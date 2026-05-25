/**
 * @module AishaPanel.test
 * @description Render, RBAC, mute toggle, history list.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AishaPanel } from '../AishaPanel';
import { useAishaStore } from '@/aisha/store';

vi.mock('@/aisha/hooks/use-wake-word', () => ({
  useWakeWord: () => ({ error: null }),
}));

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

beforeEach(() => {
  useAishaStore.setState({ status: 'idle', muted: false, history: [], lastResponse: null });
  cleanup();
});

describe('AishaPanel', () => {
  it('renders when isDirector=true', () => {
    render(<AishaPanel isDirector />);
    expect(screen.getByTestId('aisha-panel')).toBeInTheDocument();
  });

  it('renders nothing when isDirector=false', () => {
    const { container } = render(<AishaPanel isDirector={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows the orb with current status', () => {
    useAishaStore.setState({ status: 'listening' });
    render(<AishaPanel isDirector />);
    const orb = screen.getByRole('img', { name: /listening/i });
    expect(orb).toBeInTheDocument();
  });

  it('mute button toggles status', () => {
    render(<AishaPanel isDirector />);
    fireEvent.click(screen.getByTestId('aisha-mute'));
    expect(useAishaStore.getState().muted).toBe(true);
  });

  it('F4 keyboard shortcut toggles mute', () => {
    render(<AishaPanel isDirector />);
    fireEvent.keyDown(window, { key: 'F4' });
    expect(useAishaStore.getState().muted).toBe(true);
  });

  it('renders empty-state when no commands yet', () => {
    render(<AishaPanel isDirector />);
    expect(screen.getByText('panel.noHistory')).toBeInTheDocument();
  });

  it('lists pushed commands', () => {
    useAishaStore.setState({
      history: [{ id: '1', transcript: 'sex-3 holati qanday?', at: Date.now() }],
    });
    render(<AishaPanel isDirector />);
    expect(screen.getByText(/sex-3/)).toBeInTheDocument();
  });

  it('collapses and expands', () => {
    render(<AishaPanel isDirector />);
    const btn = screen.getByLabelText(/panel\.(collapse|expand)/);
    fireEvent.click(btn);
    expect(screen.queryByText('panel.history')).toBeNull();
  });
});
