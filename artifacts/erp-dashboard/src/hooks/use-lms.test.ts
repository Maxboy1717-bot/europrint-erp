/**
 * @module use-lms.test
 * @description Vitest tests for LMS React Query hooks.
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
  useCourses,
  useCreateCourse,
  usePublishCourse,
  useEnrollments,
  useStartTestAttempt,
  useCertificates,
  useRevokeCertificate,
} from './use-lms';

const mockedFetchApi = vi.mocked(fetchApi);

function makeWrapper(): React.FC<{ children: ReactNode }> {
  const qc = new QueryClient({
    defaultOptions: { queries: { gcTime: 0,  retry: false }, mutations: { retry: false } },
  });
  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return Wrapper;
}

describe('use-lms hooks', () => {
  beforeEach(() => mockedFetchApi.mockReset());

  it('returns courses list when API succeeds', async () => {
    mockedFetchApi.mockResolvedValueOnce({
      data: [{ id: 1, title: 'Safety' }],
      ok: true,
      status: 200,
    });
    const { result } = renderHook(() => useCourses(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 1, title: 'Safety' }]);
  });

  it('exposes loading state while enrollments fetch is pending', async () => {
    mockedFetchApi.mockImplementation(() => new Promise(r => { setTimeout(() => r({}), 100); }));
    const { result, unmount } = renderHook(() => useEnrollments(), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
    unmount();
  });

  it('returns error state when courses API rejects', async () => {
    mockedFetchApi.mockRejectedValueOnce(new Error('boom'));
    const { result } = renderHook(() => useCourses(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('boom');
  });

  it('refetches certificates when refetch is invoked', async () => {
    let __refetched: unknown;
    mockedFetchApi
      .mockResolvedValueOnce({ data: [{ id: 1 }], ok: true, status: 200 })
      .mockResolvedValueOnce({ data: [{ id: 2 }], ok: true, status: 200 });
    const { result } = renderHook(() => useCertificates(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await act(async () => {
      const __r = await result.current.refetch(); __refetched = __r.data;
    });
    expect(__refetched).toEqual([{ id: 2 }]);
  });

  it('creates course via mutation', async () => {
    mockedFetchApi.mockResolvedValueOnce({
      data: { id: 1 },
      ok: true,
      status: 201,
    });
    const { result } = renderHook(() => useCreateCourse(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({ title: 'New' });
    });
    expect(mockedFetchApi).toHaveBeenCalledWith('/lms/courses', {
      method: 'POST',
      body: JSON.stringify({ title: 'New' }),
    });
  });

  it('publishes course via mutation with id in url', async () => {
    mockedFetchApi.mockResolvedValueOnce({ data: {}, ok: true, status: 200 });
    const { result } = renderHook(() => usePublishCourse(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync(5);
    });
    expect(mockedFetchApi).toHaveBeenCalledWith('/lms/courses/5/publish', {
      method: 'POST',
    });
  });

  it('starts test attempt via mutation', async () => {
    mockedFetchApi.mockResolvedValueOnce({
      data: { attemptId: 1 },
      ok: true,
      status: 201,
    });
    const { result } = renderHook(() => useStartTestAttempt(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync(7);
    });
    expect(mockedFetchApi).toHaveBeenCalledWith('/lms/tests/7/attempt', {
      method: 'POST',
    });
  });

  it('surfaces error when revoke certificate mutation fails', async () => {
    mockedFetchApi.mockRejectedValueOnce(new Error('not allowed'));
    const { result } = renderHook(() => useRevokeCertificate(), {
      wrapper: makeWrapper(),
    });
    await expect(
      act(async () => {
        await result.current.mutateAsync(9);
      }),
    ).rejects.toThrow('not allowed');
  });
});
