/**
 * @module CandidateChecklistSections
 * @description Section components (badges, progress bar) for CandidateChecklist.
 */

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ChecklistData,
  ProbationReviewsResponse,
  getProgressInfo,
} from "./CandidateChecklistTypes";

// ─── Minimal progress badge (karta ichida) ────────────────────────────────────
export function ChecklistProgressBadge({
  pipelineEntryId,
  checklistData,
}: {
  pipelineEntryId: number;
  checklistData?: ChecklistData;
}) {
  const fallback = checklistData ?? {};
  const { done, total, pct } = getProgressInfo(fallback);
  const isComplete = done === total;

  return (
    <span
      title={`Cheklist: ${done}/${total} bajarildi`}
      className={cn(
        "inline-flex items-center gap-1 text-xs rounded-full px-1.5 py-0.5 font-medium border",
        isComplete
          ? "bg-green-50 text-[var(--ep-green)] border-green-200"
          : pct >= 50
          ? "bg-amber-50 text-[var(--ep-yellow)] border-amber-200"
          : "bg-muted text-muted-foreground border-border"
      )}
    >
      {isComplete ? (
        <CheckCircle2 className="w-3 h-3" />
      ) : (
        <ClipboardList className="w-3 h-3" />
      )}
      {done}/{total}
    </span>
  );
}

// ─── Probation Review Badge (karta ichida, kanban uchun) ──────────────────────
export function ProbationReviewBadges({ pipelineEntryId }: { pipelineEntryId: number }) {
  const { data } = useQuery<ProbationReviewsResponse>({
    queryKey: [`/api/hr/recruitment/pipeline/${pipelineEntryId}/probation-review`],
    staleTime: 60_000,
  });

  const reviews = data?.data ?? [];
  if (reviews.length === 0) return null;

  const decisionIcons: Record<string, string> = {
    continue: "✅",
    extended_trial: "⚠️",
    terminate: "❌",
  };

  return (
    <div className="flex flex-wrap gap-1">
      {(Array.isArray(reviews) ? reviews : []).map(r => (
        <span
          key={r.review_type}
          className="inline-flex items-center gap-0.5 text-[10px] rounded-full px-1.5 py-0.5 font-medium bg-green-50 text-[var(--ep-green)] border border-green-200"
          title={`${r.review_type}-kun baholash: ${r.decision}`}
        >
          {decisionIcons[r.decision] ?? "✅"} {r.review_type}-kun ✓
        </span>
      ))}
    </div>
  );
}
