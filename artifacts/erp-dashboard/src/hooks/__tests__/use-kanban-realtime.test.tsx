import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ─── Hoisted shared spies (needed by hoisted vi.mock factories) ──────────────

const { onSpy, offSpy, disconnectSpy, invalidateSpy, listeners, tokenRef } = vi.hoisted(() => ({
  onSpy: vi.fn() as ReturnType<typeof vi.fn>,
  offSpy: vi.fn() as ReturnType<typeof vi.fn>,
  disconnectSpy: vi.fn() as ReturnType<typeof vi.fn>,
  invalidateSpy: vi.fn() as ReturnType<typeof vi.fn>,
  listeners: new Map<string, (payload: unknown) => void>(),
  tokenRef: { current: "test.jwt.token" as string | null },
}));

vi.mock("socket.io-client", () => ({
  io: vi.fn(() => ({
    on: (event: string, fn: (payload: unknown) => void) => {
      listeners.set(event, fn);
      onSpy(event);
    },
    off: (event: string) => {
      listeners.delete(event);
      offSpy(event);
    },
    disconnect: () => disconnectSpy(),
  })),
}));

vi.mock("@/lib/safeStorage", () => ({
  safeStorage: {
    getItem: (key: string) => (key === "access_token" ? tokenRef.current : null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

vi.mock("@/lib/queryClient", () => ({
  queryClient: {
    invalidateQueries: (...args: unknown[]) => invalidateSpy(...args),
  },
}));

import { useKanbanRealtime } from "../use-kanban-realtime";
import { KANBAN_QUERY_KEY } from "../use-kanban-dnd";

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("useKanbanRealtime", () => {
  beforeEach(() => {
    onSpy.mockReset();
    offSpy.mockReset();
    disconnectSpy.mockReset();
    invalidateSpy.mockReset();
    listeners.clear();
    tokenRef.current = "test.jwt.token";
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("subscribes to candidate:moved on the recruitment namespace", () => {
    renderHook(() => useKanbanRealtime());
    expect(onSpy).toHaveBeenCalledWith("candidate:moved");
  });

  it("invalidates the pipeline query when an event arrives", () => {
    renderHook(() => useKanbanRealtime());
    const fn = listeners.get("candidate:moved");
    expect(fn).toBeDefined();
    act(() => {
      fn?.({ funnelId: 9, toStage: "INTERVIEWED" });
    });
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: KANBAN_QUERY_KEY });
  });

  it("forwards the event payload to the onEvent callback", () => {
    const cb = vi.fn();
    renderHook(() => useKanbanRealtime(cb));
    const fn = listeners.get("candidate:moved");
    act(() => {
      fn?.({ funnelId: 7, toStage: "HIRED" });
    });
    expect(cb).toHaveBeenCalledWith({ funnelId: 7, toStage: "HIRED" });
  });

  it("treats a missing payload as an empty object", () => {
    const cb = vi.fn();
    renderHook(() => useKanbanRealtime(cb));
    const fn = listeners.get("candidate:moved");
    act(() => {
      fn?.(null);
    });
    expect(cb).toHaveBeenCalledWith({});
  });

  it("disconnects and unsubscribes on unmount", () => {
    const { unmount } = renderHook(() => useKanbanRealtime());
    unmount();
    expect(offSpy).toHaveBeenCalledWith("candidate:moved");
    expect(disconnectSpy).toHaveBeenCalledTimes(1);
  });

  it("is a no-op when no auth token is in storage", () => {
    tokenRef.current = null;
    renderHook(() => useKanbanRealtime());
    expect(onSpy).not.toHaveBeenCalled();
  });
});
