/**
 * @module CandidateChecklistDialogs
 * @description Dialog and sheet content for CandidateChecklist.
 */

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { ClipboardList, Clock, ChevronDown, ChevronUp, FileSearch, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { CVScreeningGuide } from "./CVScreeningGuide";
import { ProbationReviewDialog, type ProbationReview } from "@/components/hr/ProbationReviewDialog";
import { useTranslation } from '@/lib/i18n';
import {
  CHECKLIST_ITEMS, REVIEW_KEYS, ChecklistKey, ChecklistData, STEP_COLORS, getProgressInfo,
} from "./CandidateChecklistTypes";

interface ChecklistSheetBodyProps {
  candidateName: string;
  checklistData: ChecklistData;
  isLoading: boolean;
  expandedSteps: Set<number>;
  noteEditing: string | null;
  noteText: string;
  setNoteText: (v: string) => void;
  setNoteEditing: (v: string | null) => void;
  patchIsPending: boolean;
  reviewMap: Record<string, ProbationReview>;
  probationDialog: { type: "30" | "90" } | null;
  setProbationDialog: (v: { type: "30" | "90" } | null) => void;
  pipelineEntryId: number;
  toggleStep: (step: number) => void;
  handleToggle: (key: ChecklistKey, currentDone: boolean) => void;
  handleSaveNote: (key: ChecklistKey) => void;
}

export function ChecklistSheetBody({
  candidateName, checklistData, isLoading, expandedSteps, noteEditing, noteText,
  setNoteText, setNoteEditing, patchIsPending, reviewMap, probationDialog,
  setProbationDialog, pipelineEntryId, toggleStep, handleToggle, handleSaveNote,
}: ChecklistSheetBodyProps) {
  const { t } = useTranslation("common");
  const { done, total, pct } = getProgressInfo(checklistData);

  const steps = [4, 5, 6, 7];
  const groupedItems = (Array.isArray(steps) ? steps : []).map(step => ({
    step,
    label: CHECKLIST_ITEMS.find(i => i.step === step)?.stepLabel ?? `Bosqich ${step}`,
    items: CHECKLIST_ITEMS.filter(i => i.step === step),
  }));

  return (
    <>
      <SheetHeader className="px-5 pt-5 pb-3 border-b bg-card text-foreground rounded-none sticky top-0 z-10">
        <SheetTitle className="text-foreground flex items-center gap-2 text-base">
          <ClipboardList className="w-4 h-4 text-orange-400" />
          {t("kandidatCheklisti")}
        </SheetTitle>
        <p className="text-sm text-muted-foreground mt-0.5">{candidateName}</p>
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{t("majburiyBandlar")}</span>
            <span className={pct === 100 ? "text-[var(--ep-green)] font-semibold" : ""}>{done}/{total} — {pct}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                pct === 100 ? "bg-green-400" : pct >= 50 ? "bg-amber-400" : "bg-orange-400"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </SheetHeader>

      {isLoading ? (
        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
          {t("yuklanmoqda1")}
        </div>
      ) : (
        <div className="px-4 py-4 space-y-3">
          {(Array.isArray(groupedItems) ? groupedItems : []).map(({ step, label, items }) => {
            const colors = STEP_COLORS[step];
            const stepDone = (Array.isArray(items) ? items : []).filter(i => checklistData[i.key]?.done).length;
            const expanded = expandedSteps.has(step);

            return (
              <div key={step} className={cn("rounded-lg border", colors.border)}>
                <button
                  onClick={() => toggleStep(step)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-t-lg text-sm font-semibold",
                    colors.bg, colors.text
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-white/60 flex items-center justify-center text-xs font-bold">
                      {step}
                    </span>
                    {label}
                  </span>
                  <span className="flex items-center gap-2 text-xs font-normal">
                    {stepDone}/{items.length}
                    {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </span>
                </button>

                {expanded && (
                  <div className="divide-y divide-border bg-card rounded-b-lg">
                    {(Array.isArray(items) ? items : []).map(item => {
                      const entry = checklistData[item.key as ChecklistKey];
                      const isDone = entry?.done ?? false;
                      const isEditingNote = noteEditing === item.key;
                      const reviewType = REVIEW_KEYS[item.key as string];
                      const existingReview = reviewType ? reviewMap[reviewType] : undefined;
                      const showFormaButton = !!reviewType && isDone;

                      return (
                        <div key={item.key} className="px-3 py-2.5">
                          <div className="flex items-start gap-2.5">
                            <Checkbox
                              id={`chk-${item.key}`}
                              checked={isDone}
                              onCheckedChange={() => handleToggle(item.key as ChecklistKey, isDone)}
                              disabled={patchIsPending}
                              className="mt-0.5 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-1 flex-wrap">
                                <label
                                  htmlFor={`chk-${item.key}`}
                                  className={cn(
                                    "text-xs cursor-pointer leading-relaxed flex-1",
                                    isDone ? "line-through text-muted-foreground" : "text-foreground"
                                  )}
                                >
                                  {item.label}
                                  {item.mandatory && (
                                    <span className="ml-1 text-red-400 font-bold text-[10px]">*</span>
                                  )}
                                </label>
                                {item.key === "cv_screened" && (
                                  <CVScreeningGuide
                                    trigger={
                                      <button
                                        className="shrink-0 inline-flex items-center gap-0.5 text-[10px] text-[var(--ep-cyan)] hover:text-teal-700 border border-teal-200 rounded px-1.5 py-0.5 bg-teal-50 hover:bg-teal-100 transition-colors"
                                        data-testid="button-cv-guide-checklist"
                                      >
                                        <FileSearch className="w-2.5 h-2.5" />
                                        №52
                                      </button>
                                    }
                                  />
                                )}
                                {showFormaButton && (
                                  <Button
                                    size="sm"
                                    variant={existingReview ? "secondary" : "outline"}
                                    className={cn(
                                      "h-6 text-[10px] px-2 gap-1 shrink-0",
                                      existingReview
                                        ? "bg-green-100 text-[var(--ep-green)] hover:bg-green-200 border-green-300"
                                        : "border-purple-300 text-[var(--ep-purple)] hover:bg-purple-50"
                                    )}
                                    onClick={() => setProbationDialog({ type: reviewType! })}
                                    data-testid={`button-probation-review-${item.key}`}
                                  >
                                    <FileText className="w-2.5 h-2.5" />
                                    {existingReview ? "Forma ✓" : "Forma to'ldirish"}
                                  </Button>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                {item.sla_hours && !isDone && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                    <Clock className="w-2.5 h-2.5" />
                                    SLA: {item.sla_hours}h
                                  </span>
                                )}
                                {isDone && entry?.done_at && (
                                  <span className="text-[10px] text-[var(--ep-green)]">
                                    ✓ {new Date(entry.done_at).toLocaleDateString("uz-UZ")}
                                    {entry.done_by ? ` — ${entry.done_by}` : ""}
                                  </span>
                                )}
                                {entry?.note && !isEditingNote && (
                                  <span className="text-[10px] text-muted-foreground italic truncate max-w-[160px]">
                                    💬 {entry.note}
                                  </span>
                                )}
                                {existingReview && (
                                  <span className="text-[10px] text-[var(--ep-green)]">
                                    Baholash: {existingReview.decision === "continue" ? "Davom ettirish" : existingReview.decision === "extended_trial" ? "Qo'shimcha sinov" : "Tugatish"}
                                  </span>
                                )}
                              </div>

                              {isEditingNote ? (
                                <div className="mt-1.5 flex gap-1.5">
                                  <Textarea
                                    value={noteText}
                                    onChange={e => setNoteText(e.target.value)}
                                    rows={2}
                                    className="text-xs py-1 px-2 h-auto resize-none flex-1"
                                    placeholder={t("izohYozing1")}
                                    autoFocus
                                  />
                                  <div className="flex flex-col gap-1">
                                    <Button
                                      size="sm"
                                      className="h-7 text-xs px-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                                      onClick={() => handleSaveNote(item.key as ChecklistKey)}
                                    >
                                      {t("Saqlash")}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-xs px-2"
                                      onClick={() => { setNoteEditing(null); setNoteText(""); }}
                                    >
                                      {t("Bekor")}
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setNoteEditing(item.key);
                                    setNoteText(entry?.note ?? "");
                                  }}
                                  className="mt-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  {t("izohQoshish")}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {probationDialog && (
        <ProbationReviewDialog
          open={!!probationDialog}
          onOpenChange={isOpen => { if (!isOpen) setProbationDialog(null); }}
          pipelineEntryId={pipelineEntryId}
          reviewType={probationDialog.type}
          candidateName={candidateName}
          existingReview={reviewMap[probationDialog.type] ?? null}
        />
      )}
    </>
  );
}
