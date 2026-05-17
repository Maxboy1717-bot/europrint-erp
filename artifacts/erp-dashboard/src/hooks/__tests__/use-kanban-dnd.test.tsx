import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";

// ─── Mocks ───────────────────────────────────────────────────────────────────
// vi.mock factory is hoisted; we use `vi.hoisted` to share mock state safely.

const { toastSpy, apiRequestMock, sharedClient } = vi.hoisted(() => {
  return {
    toastSpy: vi.fn() as ReturnType<typeof vi.fn>,
    apiRequestMock: vi.fn() as ReturnType<typeof vi.fn>,
    sharedClient: { current: null as unknown },
  };
});

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastSpy }),
}));

vi.mock("@/lib/queryClient", async () => {
  const { QueryClient } = await import("@tanstack/react-query");
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  sharedClient.current = client;
  return {
    queryClient: client,
    apiRequest: (...args: unknown[]) => apiRequestMock(...args),
  };
});

import { useKanbanDragDrop, KANBAN_QUERY_KEY } from "../use-kanban-dnd";
import type { PipelineEntry } from "@/components/recruiting/types";

function getClient(): QueryClient {
  const c = sharedClient.current as QueryClient | null;
  if (!c) throw new Error("queryClient mock not initialized");
  return c;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeEntry(id: number, stage: PipelineEntry["funnel_stage"]): PipelineEntry {
  return {
    id,
    funnel_stage: stage,
    vacancy_id: 1,
    candidate_id: 100 + id,
    candidate_name: `Nomzod ${id}`,
    candidate_phone: `+998 90 000 ${id.toString().padStart(4, "0")}`,
    created_at: "2026-05-17T00:00:00.000Z",
  };
}

function wrapperFor(client: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

function buildDragEnd(activeId: number, overStage: string | null): DragEndEvent {
  return {
    active: { id: activeId, data: { current: undefined }, rect: { current: { initial: null, translated: null } } } as DragEndEvent["active"],
    over: overStage
      ? ({ id: `column-${overStage}`, data: { current: { type: "column", stage: overStage } } } as DragEndEvent["over"])
      : null,
    collisions: null,
    delta: { x: 0, y: 0 },
    activatorEvent: new Event("pointerdown"),
  } as DragEndEvent;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("useKanbanDragDrop", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    toastSpy.mockReset();
    getClient().clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns sensors and dnd handlers without firing mutation on mount", () => {
    const { result } = renderHook(() => useKanbanDragDrop([makeEntry(1, "NEW")]), {
      wrapper: wrapperFor(getClient()),
    });
    expect(typeof result.current.handleDragEnd).toBe("function");
    expect(typeof result.current.handleDragStart).toBe("function");
    expect(result.current.activeEntry).toBeNull();
    expect(result.current.isPending).toBe(false);
    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  it("tracks activeEntry between drag-start and drag-end", () => {
    const entries = [makeEntry(7, "NEW"), makeEntry(8, "PHONE_SCREENING")];
    const { result } = renderHook(() => useKanbanDragDrop(entries), {
      wrapper: wrapperFor(getClient()),
    });

    act(() => {
      result.current.handleDragStart({
        active: { id: 7 } as unknown as DragStartEvent["active"],
      } as DragStartEvent);
    });
    expect(result.current.activeEntry?.id).toBe(7);
    expect(result.current.activeEntry?.candidate_name).toBe("Nomzod 7");

    act(() => {
      result.current.handleDragEnd(buildDragEnd(7, null));
    });
    expect(result.current.activeEntry).toBeNull();
  });

  it("does not call the API when dropped on its own column (no stage change)", () => {
    const entries = [makeEntry(1, "NEW")];
    const { result } = renderHook(() => useKanbanDragDrop(entries), {
      wrapper: wrapperFor(getClient()),
    });

    act(() => {
      result.current.handleDragEnd(buildDragEnd(1, "NEW"));
    });
    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  it("optimistically updates cache and POSTs to the funnel-stage endpoint", async () => {
    const entries = [makeEntry(42, "NEW")];
    getClient().setQueryData(KANBAN_QUERY_KEY, { data: entries });
    apiRequestMock.mockResolvedValue({ data: {} });

    const { result } = renderHook(() => useKanbanDragDrop(entries), {
      wrapper: wrapperFor(getClient()),
    });

    act(() => {
      result.current.handleDragEnd(buildDragEnd(42, "PHONE_SCREENING"));
    });

    // Optimistic update should be visible synchronously
    const optimistic = getClient().getQueryData<{ data: PipelineEntry[] }>(KANBAN_QUERY_KEY);
    expect(optimistic?.data?.[0]?.funnel_stage).toBe("PHONE_SCREENING");

    await waitFor(() => expect(apiRequestMock).toHaveBeenCalledTimes(1));
    expect(apiRequestMock).toHaveBeenCalledWith(
      "POST",
      "/api/hr/recruitment/pipeline/42/stage",
      { stage: "PHONE_SCREENING" },
    );
  });

  it("rolls back the optimistic cache when the API call rejects", async () => {
    const entries = [makeEntry(13, "NEW")];
    getClient().setQueryData(KANBAN_QUERY_KEY, { data: entries });
    apiRequestMock.mockRejectedValue(new Error("server boom"));

    const { result } = renderHook(() => useKanbanDragDrop(entries), {
      wrapper: wrapperFor(getClient()),
    });

    act(() => {
      result.current.handleDragEnd(buildDragEnd(13, "PHONE_SCREENING"));
    });

    await waitFor(() => expect(toastSpy).toHaveBeenCalled());
    const rolledBack = getClient().getQueryData<{ data: PipelineEntry[] }>(KANBAN_QUERY_KEY);
    expect(rolledBack?.data?.[0]?.funnel_stage).toBe("NEW");
    expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "destructive" }),
    );
  });

  it("ignores drops onto a target with no stage data", () => {
    const entries = [makeEntry(1, "NEW")];
    const { result } = renderHook(() => useKanbanDragDrop(entries), {
      wrapper: wrapperFor(getClient()),
    });
    const noOver = buildDragEnd(1, null);
    act(() => {
      result.current.handleDragEnd(noOver);
    });
    expect(apiRequestMock).not.toHaveBeenCalled();
  });
});
