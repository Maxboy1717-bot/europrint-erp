import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ClipboardList, CheckCircle2, Clock, AlertTriangle, ChevronDown, ChevronUp, FileSearch, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { CVScreeningGuide } from "./CVScreeningGuide";
import { ProbationReviewDialog, type ProbationReview } from "@/components/hr/ProbationReviewDialog";

// ─── Cheklist bandlari (backend bilan mos kelishi kerak) ─────────────────────
export const CHECKLIST_ITEMS = [
  { key: "cv_received",               step: 4, stepLabel: "TEZ ISHLASH",     label: "CV qabul qilindi va ro'yxatga kiritildi",          mandatory: true,  sla_hours: 4   },
  { key: "cv_screened",               step: 4, stepLabel: "TEZ ISHLASH",     label: "CV skrining o'tkazildi (Material №52)",            mandatory: true,  sla_hours: 24  },
  { key: "phone_interview",           step: 4, stepLabel: "TEZ ISHLASH",     label: "Telefon suhbati o'tkazildi (Material №53)",        mandatory: true,  sla_hours: 48  },
  { key: "productivity_questionnaire",step: 4, stepLabel: "TEZ ISHLASH",     label: "Mahsuldorlik anketa to'ldirildi",                  mandatory: false, sla_hours: 72  },
  { key: "background_check",          step: 5, stepLabel: "BAHOLASH",        label: "Fon tekshiruvi (ijtimoiy tarmoqlar, Mat. №54)",    mandatory: false, sla_hours: 48  },
  { key: "main_interview",            step: 5, stepLabel: "BAHOLASH",        label: "Asosiy suhbat o'tkazildi (Material №11)",          mandatory: true,  sla_hours: 120 },
  { key: "tool_test",                 step: 5, stepLabel: "BAHOLASH",        label: "HR Capital TOOL TEST o'tkazildi (A-J)",            mandatory: true,  sla_hours: 120 },
  { key: "ai_interview",              step: 5, stepLabel: "BAHOLASH",        label: "AI Suhbat (ERP tizimida) o'tkazildi",              mandatory: false, sla_hours: 120 },
  { key: "productivity_form",         step: 5, stepLabel: "BAHOLASH",        label: "Material №46 — Mahsuldorlik shakli to'ldirildi",   mandatory: true,  sla_hours: 168 },
  { key: "reference_check",           step: 5, stepLabel: "BAHOLASH",        label: "Tavsiyalar tekshirildi (Reference check)",         mandatory: false, sla_hours: 168 },
  { key: "final_decision",            step: 6, stepLabel: "KIRISH",          label: "Yakuniy qaror qabul qilindi",                      mandatory: true,  sla_hours: 24  },
  { key: "offer_sent",                step: 6, stepLabel: "KIRISH",          label: "Taklif yuborildi / og'zaki taklif berildi",        mandatory: true,  sla_hours: 48  },
  { key: "offer_accepted",            step: 6, stepLabel: "KIRISH",          label: "Taklif qabul qilindi",                             mandatory: true,  sla_hours: 72  },
  { key: "contract_signed",           step: 6, stepLabel: "KIRISH",          label: "Mehnat shartnomasi imzolandi",                     mandatory: true,  sla_hours: 120 },
  { key: "onboarding_scheduled",      step: 6, stepLabel: "KIRISH",          label: "Ishga kirish sanasi va rejasi belgilandi",         mandatory: true,  sla_hours: 48  },
  { key: "onboarding_started",        step: 7, stepLabel: "KUCHAYTIRISH",    label: "Ishga kirish (onboarding) boshlandi",              mandatory: true,  sla_hours: null },
  { key: "mentor_assigned",           step: 7, stepLabel: "KUCHAYTIRISH",    label: "Mentor / nastavnik tayinlandi",                    mandatory: false, sla_hours: 48  },
  { key: "day_30_review",             step: 7, stepLabel: "KUCHAYTIRISH",    label: "30-kun baholash suhbati o'tkazildi",               mandatory: true,  sla_hours: null },
  { key: "day_90_review",             step: 7, stepLabel: "KUCHAYTIRISH",    label: "90-kun baholash (sinov muddati yakunlandi)",        mandatory: true,  sla_hours: null },
] as const;

type ChecklistKey = typeof CHECKLIST_ITEMS[number]["key"];

const REVIEW_KEYS: Record<string, "30" | "90"> = {
  day_30_review: "30",
  day_90_review: "90",
};

interface ChecklistItem {
  done: boolean;
  done_at?: string | null;
  note?: string;
  done_by?: string;
}

type ChecklistData = Partial<Record<ChecklistKey, ChecklistItem>>;

interface ChecklistResponse {
  data: {
    pipeline_entry_id: number;
    checklist_data: ChecklistData;
    id: number | null;
  };
}

interface ProbationReviewsResponse {
  data: ProbationReview[];
}

const STEP_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  4: { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200" },
  5: { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200" },
  6: { bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200" },
  7: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
};

function getProgressInfo(data: ChecklistData) {
  const mandatory = CHECKLIST_ITEMS.filter(i => i.mandatory);
  const total = mandatory.length;
  const done = (Array.isArray(mandatory) ? mandatory : []).filter(i => data[i.key]?.done).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

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
          ? "bg-green-50 text-green-700 border-green-200"
          : pct >= 50
          ? "bg-amber-50 text-amber-700 border-amber-200"
          : "bg-slate-50 text-slate-600 border-slate-200"
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
          className="inline-flex items-center gap-0.5 text-[10px] rounded-full px-1.5 py-0.5 font-medium bg-green-50 text-green-700 border border-green-200"
          title={`${r.review_type}-kun baholash: ${r.decision}`}
        >
          {decisionIcons[r.decision] ?? "✅"} {r.review_type}-kun ✓
        </span>
      ))}
    </div>
  );
}

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
      apiRequest("PATCH", `/api/hr/recruitment/pipeline/${pipelineEntryId}/checklist`, { key, done, note }),
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

  const { done, total, pct } = getProgressInfo(checklistData);

  const steps = [4, 5, 6, 7];
  const groupedItems = (steps ?? []).map(step => ({
    step,
    label: CHECKLIST_ITEMS.find(i => i.step === step)?.stepLabel ?? `Bosqich ${step}`,
    items: CHECKLIST_ITEMS.filter(i => i.step === step),
  }));

  return (
    <>
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
          <SheetHeader className="px-5 pt-5 pb-3 border-b bg-[#1a1a2e] text-white rounded-none sticky top-0 z-10">
            <SheetTitle className="text-white flex items-center gap-2 text-base">
              <ClipboardList className="w-4 h-4 text-orange-400" />
              Kandidat Cheklisti
            </SheetTitle>
            <p className="text-sm text-slate-300 mt-0.5">{candidateName}</p>

            {/* Progress bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Majburiy bandlar</span>
                <span className={pct === 100 ? "text-green-300 font-semibold" : ""}>{done}/{total} — {pct}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
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
              Yuklanmoqda…
            </div>
          ) : (
            <div className="px-4 py-4 space-y-3">
              {(Array.isArray(groupedItems) ? groupedItems : []).map(({ step, label, items }) => {
                const colors = STEP_COLORS[step];
                const stepDone = (Array.isArray(items) ? items : []).filter(i => checklistData[i.key]?.done).length;
                const expanded = expandedSteps.has(step);

                return (
                  <div key={step} className={cn("rounded-lg border", colors.border)}>
                    {/* Step header */}
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

                    {/* Items */}
                    {expanded && (
                      <div className="divide-y divide-slate-100 bg-white rounded-b-lg">
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
                                  disabled={patchMutation.isPending}
                                  className="mt-0.5 shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-1 flex-wrap">
                                    <label
                                      htmlFor={`chk-${item.key}`}
                                      className={cn(
                                        "text-xs cursor-pointer leading-relaxed flex-1",
                                        isDone ? "line-through text-slate-400" : "text-slate-700"
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
                                            className="shrink-0 inline-flex items-center gap-0.5 text-[10px] text-teal-600 hover:text-teal-700 border border-teal-200 rounded px-1.5 py-0.5 bg-teal-50 hover:bg-teal-100 transition-colors"
                                            data-testid="button-cv-guide-checklist"
                                          >
                                            <FileSearch className="w-2.5 h-2.5" />
                                            №52
                                          </button>
                                        }
                                      />
                                    )}

                                    {/* "Forma to'ldirish" tugmasi — faqat day_30 va day_90 uchun */}
                                    {showFormaButton && (
                                      <Button
                                        size="sm"
                                        variant={existingReview ? "secondary" : "outline"}
                                        className={cn(
                                          "h-6 text-[10px] px-2 gap-1 shrink-0",
                                          existingReview
                                            ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-300"
                                            : "border-purple-300 text-purple-600 hover:bg-purple-50"
                                        )}
                                        onClick={() => setProbationDialog({ type: reviewType! })}
                                        data-testid={`button-probation-review-${item.key}`}
                                      >
                                        <FileText className="w-2.5 h-2.5" />
                                        {existingReview ? "Forma ✓" : "Forma to'ldirish"}
                                      </Button>
                                    )}
                                  </div>

                                  {/* SLA & timestamps */}
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    {item.sla_hours && !isDone && (
                                      <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400">
                                        <Clock className="w-2.5 h-2.5" />
                                        SLA: {item.sla_hours}h
                                      </span>
                                    )}
                                    {isDone && entry?.done_at && (
                                      <span className="text-[10px] text-green-600">
                                        ✓ {new Date(entry.done_at).toLocaleDateString("uz-UZ")}
                                        {entry.done_by ? ` — ${entry.done_by}` : ""}
                                      </span>
                                    )}
                                    {entry?.note && !isEditingNote && (
                                      <span className="text-[10px] text-slate-500 italic truncate max-w-[160px]">
                                        💬 {entry.note}
                                      </span>
                                    )}
                                    {/* Probation review summary badge */}
                                    {existingReview && (
                                      <span className="text-[10px] text-green-600">
                                        Baholash: {existingReview.decision === "continue" ? "Davom ettirish" : existingReview.decision === "extended_trial" ? "Qo'shimcha sinov" : "Tugatish"}
                                      </span>
                                    )}
                                  </div>

                                  {/* Note editing */}
                                  {isEditingNote ? (
                                    <div className="mt-1.5 flex gap-1.5">
                                      <Textarea
                                        value={noteText}
                                        onChange={e => setNoteText(e.target.value)}
                                        rows={2}
                                        className="text-xs py-1 px-2 h-auto resize-none flex-1"
                                        placeholder="Izoh yozing…"
                                        autoFocus
                                      />
                                      <div className="flex flex-col gap-1">
                                        <Button
                                          size="sm"
                                          className="h-7 text-xs px-2 bg-[#1a1a2e] hover:bg-[#2a2a4e]"
                                          onClick={() => handleSaveNote(item.key as ChecklistKey)}
                                        >
                                          Saqlash
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 text-xs px-2"
                                          onClick={() => { setNoteEditing(null); setNoteText(""); }}
                                        >
                                          Bekor
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setNoteEditing(item.key);
                                        setNoteText(entry?.note ?? "");
                                      }}
                                      className="mt-0.5 text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                      + Izoh qo'shish
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
        </SheetContent>
      </Sheet>

      {/* Probation Review Dialogs */}
      {probationDialog && (
        <ProbationReviewDialog
          open={!!probationDialog}
          onOpenChange={isOpen => {
            if (!isOpen) setProbationDialog(null);
          }}
          pipelineEntryId={pipelineEntryId}
          reviewType={probationDialog.type}
          candidateName={candidateName}
          existingReview={reviewMap[probationDialog.type] ?? null}
        />
      )}
    </>
  );
}

export default CandidateChecklistSheet;
