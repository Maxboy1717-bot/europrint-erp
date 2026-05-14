/**
 * @module CandidateChecklist
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ClipboardList } from "lucide-react";
import { ProbationReviewDialog, type ProbationReview } from "@/components/hr/ProbationReviewDialog";
import {
  ChecklistKey,
  ChecklistData,
  ChecklistResponse,
  ProbationReviewsResponse,
} from "./CandidateChecklistTypes";
import { ChecklistSheetBody } from "./CandidateChecklistDialogs";

export { ChecklistProgressBadge, ProbationReviewBadges } from "./CandidateChecklistSections";
export { CHECKLIST_ITEMS } from "./CandidateChecklistTypes";

// ─── Asosiy Cheklist Panel (Sheet sifatida) ───────────────────────────────────
export function CandidateChecklistSheet({
  pipelineEntryId,
  candidateName,
  trigger,
}: {
  pipelineEntryId: number;
  candidateName: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([4, 5, 6, 7]));
  const [noteEditing, setNoteEditing] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [probationDialog, setProbationDialog] = useState<{ type: "30" | "90" } | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<ChecklistResponse>({
    queryKey: [`/api/hr/recruitment/pipeline/${pipelineEntryId}/checklist`],
    enabled: open && !!pipelineEntryId,
    staleTime: 30_000,
  });

  const { data: reviewsData } = useQuery<ProbationReviewsResponse>({
    queryKey: [`/api/hr/recruitment/pipeline/${pipelineEntryId}/probation-review`],
    enabled: open && !!pipelineEntryId,
    staleTime: 30_000,
  });

  const checklistData: ChecklistData = data?.data?.checklist_data ?? {};
  const reviews: ProbationReview[] = reviewsData?.data ?? [];
  const reviewMap: Record<string, ProbationReview> = Object.fromEntries(
    (Array.isArray(reviews) ? reviews : []).map(r => [r.review_type, r])
  );

  const patchMutation = useMutation({
    mutationFn: ({ key, done, note }: { key: string; done: boolean; note?: string }) =>
      apiRequest("POST", `/api/hr/recruitment/pipeline/${pipelineEntryId}/checklist`, { key, done, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/hr/recruitment/pipeline/${pipelineEntryId}/checklist`],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/recruitment/checklist-alerts"] });
    },
  });

  const toggleStep = (step: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(step)) next.delete(step);
      else next.add(step);
      return next;
    });
  };

  const handleToggle = (key: ChecklistKey, currentDone: boolean) => {
    patchMutation.mutate({ key, done: !currentDone });
  };

  const handleSaveNote = (key: ChecklistKey) => {
    patchMutation.mutate({
      key,
      done: checklistData[key]?.done ?? false,
      note: noteText,
    });
    setNoteEditing(null);
    setNoteText("");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
            <ClipboardList className="w-3.5 h-3.5" />
            Cheklist
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-[480px] max-w-full overflow-y-auto p-0">
        <ChecklistSheetBody
          candidateName={candidateName}
          checklistData={checklistData}
          isLoading={isLoading}
          expandedSteps={expandedSteps}
          noteEditing={noteEditing}
          noteText={noteText}
          setNoteText={setNoteText}
          setNoteEditing={setNoteEditing}
          patchIsPending={patchMutation.isPending}
          reviewMap={reviewMap}
          probationDialog={probationDialog}
          setProbationDialog={setProbationDialog}
          pipelineEntryId={pipelineEntryId}
          toggleStep={toggleStep}
          handleToggle={handleToggle}
          handleSaveNote={handleSaveNote}
        />
      </SheetContent>
    </Sheet>
  );
}

export default CandidateChecklistSheet;
