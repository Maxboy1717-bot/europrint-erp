import React from "react";
import { DndContext, DragOverlay, closestCenter } from "@dnd-kit/core";
import type { useKanbanDragDrop } from "@/hooks/use-kanban-dnd";
import { STAGES } from "@/components/recruiting/helpers";
import type {
  FunnelStage,
  PipelineEntry,
  Vacancy,
  AIInterviewSession,
} from "@/components/recruiting/types";
import { KanbanColumn } from "@/components/recruiting/KanbanColumn";
import { DraggableCandidateCard } from "@/components/recruiting/DraggableCandidateCard";

export interface KanbanBoardGridProps {
  dnd: ReturnType<typeof useKanbanDragDrop>;
  byStage: (stage: FunnelStage) => PipelineEntry[];
  counts: Record<FunnelStage, number>;
  isLoading: boolean;
  aiSessions: AIInterviewSession[];
  vacancyMap: Record<number, Vacancy>;
  expandedCard: number | null;
  setExpandedCard: (id: number | null) => void;
  cpPanelOpen: Set<number>;
  setCpPanelOpen: React.Dispatch<React.SetStateAction<Set<number>>>;
  updateMutation: { mutate: (args: { id: number; funnel_stage: FunnelStage }) => void; isPending: boolean };
  rejectMutation: { mutate: (id: number) => void; isPending: boolean };
  setInterviewEntry: (e: PipelineEntry | null) => void;
  setJobOfferEntry: (e: PipelineEntry | null) => void;
  setReportEntry: (e: PipelineEntry | null) => void;
  setRoadmapEntry: (e: PipelineEntry | null) => void;
  setPortretVacancy: (v: Vacancy | null) => void;
}

/**
 * The actual @dnd-kit board.
 *
 * Lives in its own component so `RecruitingKanban.tsx` (the page) stays
 * close to the 300-line budget while the drag-drop wiring lives next
 * to the columns/cards it composes.
 */
export function KanbanBoardGrid({
  dnd,
  byStage,
  counts,
  isLoading,
  aiSessions,
  vacancyMap,
  expandedCard,
  setExpandedCard,
  cpPanelOpen,
  setCpPanelOpen,
  updateMutation,
  rejectMutation,
  setInterviewEntry,
  setJobOfferEntry,
  setReportEntry,
  setRoadmapEntry,
  setPortretVacancy,
}: KanbanBoardGridProps) {
  const stages = Array.isArray(STAGES) ? STAGES : [];

  return (
    <div className="flex-1 overflow-x-auto" data-testid="kanban-board">
      <DndContext
        sensors={dnd.sensors}
        collisionDetection={closestCenter}
        onDragStart={dnd.handleDragStart}
        onDragEnd={dnd.handleDragEnd}
        onDragCancel={dnd.handleDragCancel}
      >
        <div className="flex gap-3 pb-4 h-full min-w-max">
          {stages.map((stage) => {
            const stageEntries = byStage(stage.key);
            const safeEntries = Array.isArray(stageEntries) ? stageEntries : [];
            const itemIds = safeEntries.map((e) => e.id);
            return (
              <KanbanColumn
                key={stage.key}
                stage={stage}
                count={counts[stage.key] ?? 0}
                itemIds={itemIds}
                isLoading={isLoading}
                isEmpty={safeEntries.length === 0}
              >
                {safeEntries.map((entry) => (
                  <DraggableCandidateCard
                    key={entry.id}
                    stageKey={stage.key}
                    draggingDisabled={dnd.isPending}
                    entry={entry}
                    stage={stage}
                    aiSessions={aiSessions}
                    vacancyMap={vacancyMap}
                    expandedCard={expandedCard}
                    setExpandedCard={setExpandedCard}
                    cpPanelOpen={cpPanelOpen}
                    setCpPanelOpen={setCpPanelOpen}
                    updateMutation={updateMutation}
                    rejectMutation={rejectMutation}
                    setInterviewEntry={setInterviewEntry}
                    setJobOfferEntry={setJobOfferEntry}
                    setReportEntry={setReportEntry}
                    setRoadmapEntry={setRoadmapEntry}
                    setPortretVacancy={setPortretVacancy}
                  />
                ))}
              </KanbanColumn>
            );
          })}
        </div>
        <DragOverlay dropAnimation={null}>
          {dnd.activeEntry ? (
            <div
              data-testid="drag-overlay-card"
              className="bg-surface-container-lowest rounded-lg p-3 shadow-2xl border border-primary/40 w-64 opacity-90"
            >
              <div className="text-sm font-medium truncate">{dnd.activeEntry.candidate_name}</div>
              <div className="text-xs text-muted-foreground truncate">{dnd.activeEntry.candidate_phone}</div>
              {dnd.activeEntry.vacancy_title && (
                <div className="text-xs text-primary truncate mt-1">{dnd.activeEntry.vacancy_title}</div>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
