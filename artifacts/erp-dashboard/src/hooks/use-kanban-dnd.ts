import { useState, useMemo, useCallback } from "react";
import {
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
  type DragStartEvent,
  type DragEndEvent,
  type DragCancelEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PipelineEntry, FunnelStage } from "@/components/recruiting/types";

/**
 * Kanban drag-drop hook with optimistic mutation.
 *
 * Project rules:
 *  - onMutate: snapshot cache, apply optimistic update.
 *  - onError: rollback from snapshot (F2 — every mutation MUST have onError).
 *  - onSettled: invalidate query to reconcile.
 *  - apiRequest(METHOD, URL, body) signature (F3).
 *  - Array.isArray guard on every .map/.filter (Rule 2).
 *
 * The backend endpoint is `POST /api/hr/recruitment/pipeline/:id/stage`
 * with body `{ stage: string, notes?: string, date?: string }` —
 * NOT the PATCH variant used previously in RecruitingKanban.tsx,
 * which never matched a route. See `apps/api/src/modules/hr/recruitment/
 * hr-vacancies.controller.ts:124` and `dto/hr-vacancies.dto.ts:15`.
 */
export interface KanbanQueryShape {
  data?: PipelineEntry[];
}

export const KANBAN_QUERY_KEY = ["/api/hr/recruitment/pipeline"] as const;

export interface MoveStageArgs {
  id: number;
  toStage: FunnelStage;
  notes?: string;
}

interface MutationContext {
  previous: KanbanQueryShape | undefined;
}

export function useKanbanDragDrop(entries: PipelineEntry[]) {
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const safeEntries = useMemo(
    () => (Array.isArray(entries) ? entries : []),
    [entries],
  );

  const activeEntry = useMemo(
    () => safeEntries.find((e) => e.id === activeId) ?? null,
    [safeEntries, activeId],
  );

  const moveMutation = useMutation<
    unknown,
    Error,
    MoveStageArgs,
    MutationContext
  >({
    mutationFn: ({ id, toStage, notes }) =>
      apiRequest("POST", `/api/hr/recruitment/pipeline/${id}/stage`, {
        stage: toStage,
        ...(notes !== undefined ? { notes } : {}),
      }),
    onMutate: async ({ id, toStage }) => {
      await queryClient.cancelQueries({ queryKey: KANBAN_QUERY_KEY });
      const previous = queryClient.getQueryData<KanbanQueryShape>(
        KANBAN_QUERY_KEY,
      );
      queryClient.setQueryData<KanbanQueryShape>(KANBAN_QUERY_KEY, (old) => {
        const rows = Array.isArray(old?.data) ? old.data : [];
        const next = rows.map((row) =>
          row.id === id ? { ...row, funnel_stage: toStage } : row,
        );
        return { ...(old ?? {}), data: next };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(KANBAN_QUERY_KEY, context.previous);
      }
      toast({
        title: "Bosqichni o'zgartirib bo'lmadi",
        description: "Tarmoq xatosi yoki ruxsat etilmagan o'tish",
        variant: "destructive",
      });
    },
    onSuccess: (_data, vars) => {
      toast({ title: `Nomzod ${vars.toStage} bosqichiga ko'chirildi` });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: KANBAN_QUERY_KEY });
    },
  });

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = Number(event.active.id);
    if (Number.isFinite(id)) setActiveId(id);
  }, []);

  const handleDragCancel = useCallback((_event: DragCancelEvent) => {
    setActiveId(null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over) return;

      const candidateId = Number(active.id);
      const overData = over.data?.current as
        | { type?: string; stage?: FunnelStage }
        | undefined;
      const toStage =
        overData?.type === "column"
          ? overData.stage
          : (overData?.stage as FunnelStage | undefined);

      if (!toStage || !Number.isFinite(candidateId)) return;

      const entry = safeEntries.find((e) => e.id === candidateId);
      if (!entry || entry.funnel_stage === toStage) return;

      moveMutation.mutate({ id: candidateId, toStage });
    },
    [moveMutation, safeEntries],
  );

  return {
    sensors,
    activeId,
    activeEntry,
    isPending: moveMutation.isPending,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    moveMutation,
  };
}
