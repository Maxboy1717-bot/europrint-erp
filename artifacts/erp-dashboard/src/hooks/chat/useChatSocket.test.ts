/**
 * @module useChatSocket.test
 * @description Vitest tests for the useChatSocket hook & shared-socket helpers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const { markRoomReadMock } = vi.hoisted(() => ({
  markRoomReadMock: vi.fn(),
}));

vi.mock('@/store/chatStore', () => ({
  useChatStore: {
    getState: () => ({ markRoomRead: markRoomReadMock }),
  },
}));

import {
  useChatSocket,
  setSharedSocket,
  getSharedSocket,
} from './useChatSocket';

interface FakeSocket {
  connected: boolean;
  emit: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
}

function makeSocket(connected = true): FakeSocket {
  return {
    connected,
    emit: vi.fn(),
    on: vi.fn(),
  };
}

describe('useChatSocket helpers', () => {
  beforeEach(() => {
    markRoomReadMock.mockReset();
    setSharedSocket(null);
  });

  it('getSharedSocket returns null when no socket is set', () => {
    expect(getSharedSocket()).toBeNull();
  });

  it('setSharedSocket stores the supplied socket', () => {
    const s = makeSocket();
    setSharedSocket(s as unknown as Parameters<typeof setSharedSocket>[0]);
    expect(getSharedSocket()).toBe(s);
  });

  it('joinRoom is a no-op when no socket is connected', () => {
    setSharedSocket(null);
    const { result } = renderHook(() => useChatSocket());
    result.current.joinRoom('r-1');
    expect(markRoomReadMock).not.toHaveBeenCalled();
  });

  it('joinRoom emits join_room / get_messages / mark_read when socket exists', () => {
    const s = makeSocket();
    setSharedSocket(s as unknown as Parameters<typeof setSharedSocket>[0]);
    const { result } = renderHook(() => useChatSocket());
    result.current.joinRoom('42');
    expect(s.emit).toHaveBeenCalledWith('join_room', { roomId: 42 });
    expect(s.emit).toHaveBeenCalledWith('get_messages', { roomId: 42 });
    expect(s.emit).toHaveBeenCalledWith('mark_read', { roomId: 42 });
    expect(markRoomReadMock).toHaveBeenCalledWith('42');
  });

  it('sendMessage queues message when socket is unavailable', () => {
    setSharedSocket(null);
    const { result } = renderHook(() => useChatSocket());
    result.current.sendMessage('r-1', 'hello');
    const s = makeSocket(true);
    setSharedSocket(s as unknown as Parameters<typeof setSharedSocket>[0]);
    expect(s.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(s.emit).toHaveBeenCalledWith('message:send', {
      roomId: 'r-1',
      content: 'hello',
      replyToId: undefined,
      mentionedUserIds: undefined,
    });
  });

  it('sendMessage trims whitespace and rejects empty content', () => {
    const s = makeSocket();
    setSharedSocket(s as unknown as Parameters<typeof setSharedSocket>[0]);
    const { result } = renderHook(() => useChatSocket());
    result.current.sendMessage('r-1', '   ');
    expect(s.emit).not.toHaveBeenCalled();
    result.current.sendMessage('r-1', '  hi  ');
    expect(s.emit).toHaveBeenCalledWith('message:send', {
      roomId: 'r-1',
      content: 'hi',
      replyToId: undefined,
      mentionedUserIds: undefined,
    });
  });

  it('sendTypingStart / sendTypingStop emit typing events', () => {
    const s = makeSocket();
    setSharedSocket(s as unknown as Parameters<typeof setSharedSocket>[0]);
    const { result } = renderHook(() => useChatSocket());
    result.current.sendTypingStart('5');
    result.current.sendTypingStop('5');
    expect(s.emit).toHaveBeenCalledWith('typing', { roomId: 5, isTyping: true });
    expect(s.emit).toHaveBeenCalledWith('typing', { roomId: 5, isTyping: false });
  });
});
