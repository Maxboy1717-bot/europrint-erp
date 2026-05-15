/**
 * @module use-hr-skills.test
 * @description Vitest tests for HR Skills hooks.
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
  useSkills,
  useCreateSkill,
  useUpdateSkill,
  useSkillRequirements,
  useSkillCategories,
} from './use-hr-skills';

const mockedFetchApi = vi.mocked(fetchApi);

function makeWrapper(): React.FC<{ children: ReactNode }> {
  const qc = new QueryClient({
    defaultOptions: { queries: { gcTime: 0,  retry: false }, mutations: { retry: false } },
  });
  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return Wrapper;
}

describe('use-hr-skills hooks', () => {
  beforeEach(() => mockedFetchApi.mockReset());

  it('returns skills list when API succeeds', async () => {
    mockedFetchApi.mockResolvedValueOnce({
      data: [{ id: 1, name: 'TS' }],
      ok: true,
      status: 200,
    });
    const { result } = renderHook(() => useSkills(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 1, name: 'TS' }]);
  });

  it('exposes loading state while categories fetch is pending', async () => {
    mockedFetchApi.mockImplementation(() => new Promise(r => { setTimeout(() => r({}), 100); }));
    const { result, unmount } = renderHook(() => useSkillCategories(), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
    unmount();
  });

  it('returns error state when skills API rejects', async () => {
    mockedFetchApi.mockRejectedValueOnce(new Error('500'));
    const { result } = renderHook(() => useSkills(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('500');
  });

  it('refetches requirements when refetch is invoked', async () => {
    let __refetched: unknown;
    mockedFetchApi
      .mockResolvedValueOnce({ data: [{ id: 1 }], ok: true, status: 200 })
      .mockResolvedValueOnce({ data: [{ id: 2 }], ok: true, status: 200 });
    const { result } = renderHook(() => useSkillRequirements(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await act(async () => {
      const __r = await result.current.refetch(); __refetched = __r.data;
    });
    expect(__refetched).toEqual([{ id: 2 }]);
  });

  it('creates skill via mutation', async () => {
    mockedFetchApi.mockResolvedValueOnce({
      data: { id: 1 },
      ok: true,
      status: 201,
    });
    const { result } = renderHook(() => useCreateSkill(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({ name: 'Welding' });
    });
    expect(mockedFetchApi).toHaveBeenCalledWith('/hr/skills', {
      method: 'POST',
      body: JSON.stringify({ name: 'Welding' }),
    });
  });

  it('surfaces error when update skill mutation fails', async () => {
    mockedFetchApi.mockRejectedValueOnce(new Error('conflict'));
    const { result } = renderHook(() => useUpdateSkill(), {
      wrapper: makeWrapper(),
    });
    await expect(
      act(async () => {
        await result.current.mutateAsync({ id: 1, name: 'New' });
      }),
    ).rejects.toThrow('conflict');
  });
});
