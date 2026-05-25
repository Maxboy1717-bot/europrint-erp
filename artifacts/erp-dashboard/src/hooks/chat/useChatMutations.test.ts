/**
 * @module useChatMutations.test
 * @description Vitest tests for chat mutation hooks.
 */

import React, { type ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/lib/queryClient', async () => {
  const actual = await vi.importActual<typeof import('@/lib/queryClient')>(
    '@/lib/queryClient',
  );
  return { ...actual, apiRequest: vi.fn() };
});

import { apiRequest } from '@/lib/queryClient';
import {
  useSendMessage,
  useAddReaction,
  useRemoveReaction,
  useEditMessage,
  useDeleteMessage,
  useCreatePoll,
  useVotePoll,
} from './useChatMutations';

const mockedApi = vi.mocked(apiRequest);

function makeWrapper(): React.FC<{ children: ReactNode }> {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return Wrapper;
}

describe('chat mutation hooks', () => {
  beforeEach(() => mockedApi.mockReset());

  it('posts message content to the room', async () => {
    mockedApi.mockResolvedValueOnce({ id: 'msg-1' });
    const { result } = renderHook(() => useSendMessage('r-1'), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({ content: 'hello' });
    });
    expect(mockedApi).toHaveBeenCalledWith(
      'POST',
      '/api/chat/rooms/r-1/messages',
      { content: 'hello' },
    );
  });

  it('adds a reaction via POST', async () => {
    mockedApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useAddReaction('r-1'), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({ msgId: 'm-1', emoji: '👍' });
    });
    expect(mockedApi).toHaveBeenCalledWith(
      'POST',
      '/api/chat/rooms/r-1/messages/m-1/reactions',
      { emoji: '👍' },
    );
  });

  it('removes reaction with URL-encoded emoji', async () => {
    mockedApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useRemoveReaction('r-1'), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({ msgId: 'm-9', emoji: '🔥' });
    });
    expect(mockedApi).toHaveBeenCalledWith(
      'DELETE',
      `/api/chat/rooms/r-1/messages/m-9/reactions/${encodeURIComponent('🔥')}`,
    );
  });

  it('edits an existing message via PATCH', async () => {
    mockedApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useEditMessage('r-1'), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({ msgId: 'm-2', content: 'edited' });
    });
    expect(mockedApi).toHaveBeenCalledWith(
      'PATCH',
      '/api/chat/rooms/r-1/messages/m-2',
      { content: 'edited' },
    );
  });

  it('deletes a message via DELETE', async () => {
    mockedApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useDeleteMessage('r-1'), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync('m-3');
    });
    expect(mockedApi).toHaveBeenCalledWith(
      'DELETE',
      '/api/chat/rooms/r-1/messages/m-3',
    );
  });

  it('creates a poll payload via POST', async () => {
    mockedApi.mockResolvedValueOnce({ id: 'poll-1' });
    const { result } = renderHook(() => useCreatePoll('r-1'), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({
        question: 'Lunch?',
        options: ['Pizza', 'Plov'],
      });
    });
    expect(mockedApi).toHaveBeenCalledWith(
      'POST',
      '/api/chat/rooms/r-1/polls',
      { question: 'Lunch?', options: ['Pizza', 'Plov'] },
    );
  });

  it('submits vote with optionIndices', async () => {
    mockedApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useVotePoll(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({ pollId: 'p-1', optionIndices: [0, 2] });
    });
    expect(mockedApi).toHaveBeenCalledWith(
      'POST',
      '/api/chat/polls/p-1/vote',
      { optionIndices: [0, 2] },
    );
  });
});
