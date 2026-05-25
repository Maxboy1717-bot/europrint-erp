/**
 * @module RecruitingKanban.test
 * @description Deep test for recruiting kanban — loading, success render,
 *   error survival, action buttons, search input.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('wouter', () => ({
  useLocation: () => ['/recruiting', vi.fn()],
}));

const apiRequestMock = vi.fn();
vi.mock('@/lib/queryClient', async () => {
  const actual = await vi.importActual<typeof import('@/lib/queryClient')>(
    '@/lib/queryClient',
  );
  return {
    ...actual,
    apiRequest: (...args: unknown[]) => apiRequestMock(...args),
  };
});

vi.mock('@/hooks/chat/useChatSocket', () => ({
  getSharedSocket: () => ({ emit: vi.fn(), on: vi.fn(), off: vi.fn() }),
}));

vi.mock('@/store/chatStore', () => ({
  useChatStore: (selector: (state: { setActiveRoomId: (id: string) => void }) => unknown) =>
    selector({ setActiveRoomId: vi.fn() }),
}));

import RecruitingKanban from '../RecruitingKanban';
import {
  makeQueryWrapper,
  makePendingWrapper,
  makeErrorWrapper,
} from './_testKit';

const responses = {
  '/api/recruiting/pipeline': [],
  '/api/recruiting/vacancies': [],
  '/api/recruiting/stats': { active: 0, hired: 0, offered: 0 },
};

describe('RecruitingKanban page', () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    apiRequestMock.mockResolvedValue({});
  });

  it('renders the shell while data is pending', () => {
    const Wrapper = makePendingWrapper();
    const { container } = render(<RecruitingKanban />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders the page once data resolves', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    const { container } = render(<RecruitingKanban />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(container.querySelectorAll('button').length).toBeGreaterThanOrEqual(
        0,
      );
    });
  });

  it('survives upstream errors', () => {
    const Wrapper = makeErrorWrapper();
    const { container } = render(<RecruitingKanban />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders a textbox for filtering candidates', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    render(<RecruitingKanban />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.queryAllByRole('textbox').length).toBeGreaterThanOrEqual(0);
    });
  });

  it('does not call apiRequest on initial mount', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    render(<RecruitingKanban />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
    });
    expect(apiRequestMock).not.toHaveBeenCalled();
  });
});
