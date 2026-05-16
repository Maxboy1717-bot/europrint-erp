/**
 * @module HROffboardingSteps
 * @description Checklist panel component for the HR Offboarding page.
 * Renders the full checklist for a single offboarding case, handles the
 * exit-interview form (via ExitInterviewForm), and exposes a "finalize" action.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2 } from "lucide-react";
import { apiRequest, getAuthHeaders } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  type OffboardingCase,
  type ChecklistItem,
  STATUS_BADGE,
  CHECKLIST_ICONS,
  DISMISSAL_MAP,
} from "./HROffboardingTypes";
import { ExitInterviewForm } from "./HROffboardingInterview";
import { useTranslation } from '@/lib/i18n';

// ── Local types ───────────────────────────────────────────────────────────────

interface CaseDetail extends OffboardingCase {
  checklist: ChecklistItem[];
}

interface ExitInterviewResult {
  answersComplete: boolean;
  blocksSettlement: boolean;
  missingAnswers: string[];
}

// ── ChecklistPanel ────────────────────────────────────────────────────────────

export function ChecklistPanel({
  caseId,
  onClose,
}: {
  caseId: number;
  onClose: () => void;
}) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showInterviewForm, setShowInterviewForm] = useState(false);

  const { data: caseDetail, isLoading } = useQuery<CaseDetail>({
    queryKey: ["/api/hr/offboarding/cases", caseId],
    queryFn: () =>
      apiRequest<CaseDetail>('GET', `/api/hr/offboarding/cases/${caseId}`),
  });

  const markItem = useMutation({
    mutationFn: ({ itemId, done, notes }: { itemId: number; done: boolean; notes?: string }) =>
      apiRequest("PATCH", `/api/hr/offboarding/cases/${caseId}/checklist/${itemId}`, { done, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/offboarding/cases", caseId] });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/offboarding/cases"] });
      toast({ title: "Yangilandi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const saveInterview = useMutation<ExitInterviewResult, Error, void>({
    mutationFn: () =>
      apiRequest<ExitInterviewResult>("POST", `/api/hr/offboarding/cases/${caseId}/exit-interview`, { answers }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/offboarding/cases", caseId] });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/offboarding/cases"] });
      setShowInterviewForm(false);
      if (data?.blocksSettlement) {
        const missing = Array.isArray(data.missingAnswers) ? data.missingAnswers : [];
        toast({
          title: "Suhbat saqlandi — hisob-kitob blokda",
          description: `Javob berilmagan savollar: ${missing.join(", ")}`,
          variant: "destructive",
        });
      } else {
        toast({ title: "Chiqish suhbati saqlandi — barcha savollar javoblangan" });
      }
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  /** Uses the gated /finalize endpoint to enforce exit-interview completeness. */
  const completeCase = useMutation({
    mutationFn: () => apiRequest("POST", `/api/hr/offboarding/cases/${caseId}/finalize`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/offboarding/cases"] });
      onClose();
      toast({ title: "Offboarding yakunlandi — xodim tizimdan chiqarildi" });
    },
    onError: (err: Error) => {
      const msg = err?.message?.includes("EXIT_INTERVIEW_INCOMPLETE")
        ? "Suhbatning barcha savollari to'ldirilmagan — hisob-kitob blokda"
        : err?.message?.includes("EXIT_INTERVIEW_REQUIRED")
        ? "Avval chiqish suhbatini o'tkazing"
        : "Finalashtirish muvaffaqiyatsiz";
      toast({ title: msg, variant: "destructive" });
    },
  });

  if (isLoading || !caseDetail) {
    return (
      <div className="space-y-3 py-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <Skeleton key={`k-${i}`} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const checklist = Array.isArray(caseDetail.checklist) ? caseDetail.checklist : [];
  const pct =
    caseDetail.total_items > 0
      ? Math.round((caseDetail.completed_items / caseDetail.total_items) * 100)
      : 0;

  return (
    <div className="space-y-4">
      {/* Header summary */}
      <div className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">{caseDetail.full_name}</p>
            <p className="text-xs text-muted-foreground">
              {caseDetail.position}
              {caseDetail.department && ` · ${caseDetail.department}`}
            </p>
          </div>
          <Badge variant={STATUS_BADGE[caseDetail.status]?.variant ?? "secondary"}>
            {STATUS_BADGE[caseDetail.status]?.label ?? caseDetail.status}
          </Badge>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Jarayon: {caseDetail.completed_items}/{caseDetail.total_items} bosqich</span>
            <span className="font-medium">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2" />
        </div>
        {caseDetail.last_working_day && (
          <p className="text-xs text-muted-foreground">
            Oxirgi ish kuni:{" "}
            <span className="text-foreground font-medium">
              {new Date(caseDetail.last_working_day).toLocaleDateString("uz-UZ")}
            </span>
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Sabab:{" "}
          <span className="text-foreground">
            {DISMISSAL_MAP[caseDetail.dismissal_type] ?? caseDetail.dismissal_type}
          </span>
        </p>
      </div>

      {/* Checklist items */}
      <div className="space-y-2">
        {checklist.map(item => (
          <div
            key={item.id}
            className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${
              item.done
                ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30"
                : "bg-background border-border/50 hover:bg-muted/30"
            }`}
          >
            <div className={`shrink-0 ${item.done ? "text-[var(--ep-green)]" : "text-muted-foreground"}`}>
              {item.done ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                CHECKLIST_ICONS[item.item_key] ?? (
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/40" />
                )
              )}
            </div>
            <span className={`flex-1 text-sm ${item.done ? "line-through text-muted-foreground" : ""}`}>
              {item.label}
            </span>
            {item.done && item.done_at && (
              <span className="text-xs text-muted-foreground shrink-0">
                {new Date(item.done_at).toLocaleDateString("uz-UZ")}
              </span>
            )}
            {!item.done && caseDetail.status === "active" && (
              <div className="flex items-center gap-1 shrink-0">
                {item.item_key === "exit_interview" && !caseDetail.exit_interview_done ? (
                  <Button
                    size="sm" variant="outline" className="h-6 text-xs px-2"
                    onClick={() => setShowInterviewForm(true)}
                  >
                    {t("yozuvQoshish")}
                  </Button>
                ) : (
                  <Button
                    size="sm" variant="outline" className="h-6 text-xs px-2"
                    onClick={() => markItem.mutate({ itemId: item.id, done: true })}
                    disabled={markItem.isPending}
                  >
                    {t("Bajarildi")}
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Exit interview form */}
      {showInterviewForm && (
        <ExitInterviewForm
          answers={answers}
          onAnswerChange={(key, value) => setAnswers(a => ({ ...a, [key]: value }))}
          onSave={() => saveInterview.mutate()}
          onCancel={() => setShowInterviewForm(false)}
          isSaving={saveInterview.isPending}
        />
      )}

      {/* Finalize button — only when 100% complete */}
      {caseDetail.status === "active" && pct >= 100 && (
        <Button
          className="w-full bg-[var(--ep-green)] hover:bg-[var(--ep-green)]/90 text-white"
          onClick={() => completeCase.mutate()}
          disabled={completeCase.isPending}
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          {t("offboardingniYakunlash")}
        </Button>
      )}
    </div>
  );
}
