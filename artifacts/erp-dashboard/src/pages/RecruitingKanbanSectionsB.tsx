/**
 * @module RecruitingKanbanSectionsB
 * @description Kanban board section component and HCMethodologyBanner re-export.
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  STAGES, getPhaseForStage,
  HCMethodologyBanner,
} from "@/components/recruiting/helpers";
import { CandidateCard } from "@/components/recruiting/CandidateCard";
import type { KanbanBoardProps } from "./RecruitingKanbanTypes";
import { EPStatusPill } from "@/components/ep";

// ─── Kanban Board ─────────────────────────────────────────────────────────────

export function RecruitingKanbanBoard({
  isLoading,
  byStage,
  counts,
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
}: KanbanBoardProps) {
  return (
    <div className="flex-1 overflow-x-auto">
      <div className="flex gap-3 pb-4 h-full min-w-max">
        {(Array.isArray(STAGES) ? STAGES : []).map(stage => {
          const phase = getPhaseForStage(stage.key);
          return (
            <div
              key={stage.key}
              data-testid={`column-stage-${stage.key}`}
              className="flex flex-col bg-muted/40 rounded-xl p-4 w-64 shrink-0 min-h-[400px]"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${stage.accent}`} />
                  <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {stage.label}
                  </span>
                </div>
                <EPStatusPill tone="neutral" data-testid={`badge-count-${stage.key}`}>
                  {counts[stage.key]}
                </EPStatusPill>
              </div>
              {phase && (
                <div className={`text-[9px] mb-2 px-1.5 py-0.5 rounded ${phase.color}/15 text-muted-foreground font-medium`}>
                  {phase.num}-bosqich: {phase.label}
                </div>
              )}
              <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
                {isLoading && (
                  <div className="text-xs text-muted-foreground text-center py-4">Yuklanmoqda...</div>
                )}
                {byStage(stage.key).map(entry => (
                  <CandidateCard
                    key={entry.id}
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
                {!isLoading && byStage(stage.key).length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-4 opacity-50">Bo'sh</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Re-export HCMethodologyBanner so the main page only needs to import from sections
export { HCMethodologyBanner };
