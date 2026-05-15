/**
 * @module use-hr-recruitment.test
 * @description Vitest tests for HR Recruitment hooks.
 */

import React, { type ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/lib/utils', () => ({
  fetchApi: vi.fn(),
  cn: (...args: unknown[]) => args.join(' '),
}));

import { fetchApi } from '@/lib/utils';
import {
  useVacancies,
  useCreateVacancy,
  useCandidates,
  useCreateCandidate,
  useInterviews,
  useCreateInterview,
} from './use-hr-recruitment';

const mockedFetchApi = vi.mocked(fetchApi);

function makeWrapper(): React.FC<{ children: ReactNode }> {
  const qc = new QueryClient({
    defaultOptions: { queries: { gcTime: 0,  retry: false }, mutations: { retry: false } },
  });
  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return Wrapper;
}

describe('use-hr-recruitment hooks', () => {
  beforeEach(() => mockedFetchApi.mockReset());

  it('returns vacancies when API succeeds', async () => {
    mockedFetchApi.mockResolvedValueOnce({
      data: [{ id: 1, title: 'Engineer' }],
      ok: true,
      status: 200,
    });
    const { result } = renderHook(() => useVacancies(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 1, title: 'Engineer' }]);
  });

  it('exposes loading state while candidates fetch is pending', async () => {
    mockedFetchApi.mockImplementation(() => new Promise(r => { setTimeout(() => r({}), 100); }));
    const { result, unmount } = renderHook(() => useCandidates(), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
    unmount();
  });

  it('returns error state when vacancies API rejects', async () => {
    mockedFetchApi.mockRejectedValueOnce(new Error('boom'));
    const { result } = renderHook(() => useVacancies(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('boom');
  });

  it('refetches interviews when refetch is invoked', async () => {
    let __refetched: unknown;
    mockedFetchApi
      .mockResolvedValueOnce({ data: [{ id: 1 }], ok: true, status: 200 })
      .mockResolvedValueOnce({ data: [{ id: 2 }], ok: true, status: 200 });
    const { result } = renderHook(() => useInterviews(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await act(async () => {
      const __r = await result.current.refetch(); __refetched = __r.data;
    });
    expect(__refetched).toEqual([{ id: 2 }]);
  });

  it('creates vacancy via mutation', async () => {
    mockedFetchApi.mockResolvedValueOnce({
      data: { id: 1 },
      ok: true,
      status: 201,
    });
    const { result } = renderHook(() => useCreateVacancy(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({ title: 'QA' });
    });
    expect(mockedFetchApi).toHaveBeenCalledWith(
      '/hr/recruitment/vacancies',
      {
        method: 'POST',
        body: JSON.stringify({ title: 'QA' }),
      },
    );
  });

  it('creates candidate via mutation', async () => {
    mockedFetchApi.mockResolvedValueOnce({
      data: { id: 1 },
      ok: true,
      status: 201,
    });
    const { result } = renderHook(() => useCreateCandidate(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({ name: 'Ali' });
    });
    expect(mockedFetchApi).toHaveBeenCalledWith(
      '/hr/recruitment/candidates',
      {
        method: 'POST',
        body: JSON.stringify({ name: 'Ali' }),
      },
    );
  });

  it('surfaces error when create interview mutation fails', async () => {
    mockedFetchApi.mockRejectedValueOnce(new Error('conflict'));
    const { result } = renderHook(() => useCreateInterview(), {
      wrapper: makeWrapper(),
    });
    await expect(
      act(async () => {
        await result.current.mutateAsync({ candidateId: 1 });
      }),
    ).rejects.toThrow('conflict');
  });
});
