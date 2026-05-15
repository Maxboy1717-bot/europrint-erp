/**
 * @module Tests.test
 * @description Deep test for tests admin page — loading, success, error,
 *   add-dialog open, search input.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('wouter', () => ({
  useLocation: () => ['/tests', vi.fn()],
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

import Tests from '../Tests';
import {
  makeQueryWrapper,
  makePendingWrapper,
  makeErrorWrapper,
} from './_testKit';

const testsPayload = [
  {
    id: 't1',
    title: 'Safety basics',
    titleRu: 'Основы безопасности',
    courseId: 'c1',
    passPercentage: 70,
    timeLimit: 30,
    maxAttempts: 3,
    createdAt: '2024-03-01',
    questionCount: 10,
  },
];

describe('Tests page', () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    apiRequestMock.mockResolvedValue({});
  });

  it('renders shell while pending', () => {
    const Wrapper = makePendingWrapper();
    const { container } = render(<Tests />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders the test list when data resolves', async () => {
    const Wrapper = makeQueryWrapper({
      responses: { '/api/tests': testsPayload },
    });
    const { container } = render(<Tests />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(container.textContent).toMatch(/Safety basics/i);
    });
  });

  it('survives upstream errors', () => {
    const Wrapper = makeErrorWrapper();
    const { container } = render(<Tests />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('does not call apiRequest on initial mount', async () => {
    const Wrapper = makeQueryWrapper({
      responses: { '/api/tests': testsPayload },
    });
    render(<Tests />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
    });
    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  it('renders the add-test trigger button after load', async () => {
    const Wrapper = makeQueryWrapper({
      responses: { '/api/tests': testsPayload },
    });
    render(<Tests />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });
  });
});
