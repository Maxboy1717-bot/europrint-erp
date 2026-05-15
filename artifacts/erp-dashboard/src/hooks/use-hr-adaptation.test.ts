/**
 * @module use-hr-adaptation.test
 * @description Vitest tests for HR Adaptation hooks.
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
  useAdaptationPrograms,
  useCreateAdaptationProgram,
  useAdaptationRecords,
  useCreateAdaptationRecord,
} from './use-hr-adaptation';

const mockedFetchApi = vi.mocked(fetchApi);

function makeWrapper(): React.FC<{ children: ReactNode }> {
  const qc = new QueryClient({
    defaultOptions: { queries: { gcTime: 0, retry: false }, mutations: { retry: false } },
  });
  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return Wrapper;
}

describe('use-hr-adaptation hooks', () => {
  beforeEach(() => mockedFetchApi.mockReset());

  it('returns programs list when API succeeds', async () => {
    mockedFetchApi.mockResolvedValueOnce({
      data: [{ id: 1 }],
      ok: true,
      status: 200,
    });
    const { result } = renderHook(() => useAdaptationPrograms(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 1 }]);
  });

  it('exposes loading state while records fetch is pending', async () => {
    mockedFetchApi.mockImplementation(() => new Promise(r => { setTimeout(() => r({}), 100); }));
    const { result, unmount } = renderHook(() => useAdaptationRecords(), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
    unmount();
  });

  it('returns error state when programs API rejects', async () => {
    mockedFetchApi.mockRejectedValueOnce(new Error('500'));
    const { result } = renderHook(() => useAdaptationPrograms(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('500');
  });

  it('refetches records when refetch is invoked', async () => {
    mockedFetchApi
      .mockResolvedValueOnce({ data: [{ id: 1 }], ok: true, status: 200 })
      .mockResolvedValueOnce({ data: [{ id: 2 }], ok: true, status: 200 });
    const { result } = renderHook(() => useAdaptationRecords(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    let refetchedData: unknown;
    await act(async () => {
      const r = await result.current.refetch();
      refetchedData = r.data;
    });
    // refetch resolves with the new data directly — assert on the return value
    // since `result.current` may lag behind in React 19 with renderHook's
    // useEffect-based ref update.
    expect(refetchedData).toEqual([{ id: 2 }]);
  });

  it('creates program via mutation', async () => {
    mockedFetchApi.mockResolvedValueOnce({
      data: { id: 1 },
      ok: true,
      status: 201,
    });
    const { result } = renderHook(() => useCreateAdaptationProgram(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({ name: 'Onboarding 30d' });
    });
    expect(mockedFetchApi).toHaveBeenCalledWith('/hr/adaptation/programs', {
      method: 'POST',
      body: JSON.stringify({ name: 'Onboarding 30d' }),
    });
  });

  it('surfaces error when create record mutation fails', async () => {
    mockedFetchApi.mockRejectedValueOnce(new Error('invalid'));
    const { result } = renderHook(() => useCreateAdaptationRecord(), {
      wrapper: makeWrapper(),
    });
    await expect(
      act(async () => {
        await result.current.mutateAsync({ employeeId: 1, programId: 2 });
      }),
    ).rejects.toThrow('invalid');
  });
});
