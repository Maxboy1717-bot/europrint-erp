/**
 * @module IoTCompletionReport
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';
import { IoTCompletionReportProps, CompletionStep } from "./IoTCompletionReportTypes";
import { StepProgressBar, ResultsStep } from "./IoTCompletionReportSections";
import { EvaluationStep, MaterialReturnStep, DoneStep } from "./IoTCompletionReportSteps";
import { useTranslation } from '@/lib/i18n';

export function IoTCompletionReport({ lang, open, onClose, completionReport, formatTime, tabletToken }: IoTCompletionReportProps) {
  const { t } = useTranslation("common");
  const t = (uz: string, ru: string) => lang === "uz" ? uz : ru;
  const { toast } = useToast();

  const [step, setStep] = useState<CompletionStep>("results");
  const [safetyScore, setSafetyScore] = useState(0);
  const [qualityScore, setQualityScore] = useState(0);
  const [productivityScore, setProductivityScore] = useState(0);
  const [teamworkScore, setTeamworkScore] = useState(0);
  const [issuesReported, setIssuesReported] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [evalSubmitting, setEvalSubmitting] = useState(false);
  const [evalDone, setEvalDone] = useState(false);

  const [returnedQty, setReturnedQty] = useState<string>("");
  const [returnReason, setReturnReason] = useState("");
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnDone, setReturnDone] = useState(false);

  const materialRemainder = completionReport?.materialRemainder;
  const sessionId = completionReport?.sessionId;

  const evalComplete = safetyScore > 0 && qualityScore > 0 && productivityScore > 0 && teamworkScore > 0;
  const returnRequired = (materialRemainder?.requiresReturn ?? false);

  function handleDialogClose(open: boolean) {
    if (!open && step !== "done") return;
    if (!open && step === "done") { resetState(); onClose(); }
  }

  function resetState() {
    setStep("results");
    setSafetyScore(0); setQualityScore(0); setProductivityScore(0); setTeamworkScore(0);
    setIssuesReported(""); setSuggestions("");
    setEvalDone(false); setReturnDone(false);
    setReturnedQty(""); setReturnReason("");
  }

  async function submitEvaluation() {
    if (!evalComplete) {
      toast({ title: t("Barcha 4 mezon baholanishi kerak", "Все 4 критерия должны быть оценены"), variant: "destructive" });
      return;
    }
    if (!sessionId || !tabletToken) {
      toast({ title: t("Sessiya ma'lumoti yo'q", "Нет данных о сессии"), variant: "destructive" });
      return;
    }
    setEvalSubmitting(true);
    try {
      const res = await apiRequest('POST', `/api/iot/production-sessions/${sessionId}/evaluation`, {
        safetyScore, qualityScore, productivityScore, teamworkScore,
        issuesReported: issuesReported || undefined, suggestions: suggestions || undefined,
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Xatolik"); }
      setEvalDone(true);
      toast({ title: t("Baholash saqlandi!", "Оценка сохранена!") });
      if (returnRequired) { setStep("material"); } else { setStep("done"); }
    } catch (err: unknown) {
      toast({ title: t("Baholashda xatolik", "Ошибка оценки"), description: String(err instanceof Error ? err.message : err), variant: "destructive" });
    } finally { setEvalSubmitting(false); }
  }

  async function submitMaterialReturn() {
    const qty = parseInt(returnedQty) || 0;
    if (!sessionId || !tabletToken) {
      toast({ title: t("Sessiya ma'lumoti yo'q", "Нет данных о сессии"), variant: "destructive" });
      return;
    }
    setReturnSubmitting(true);
    try {
      const res = await apiRequest('POST', `/api/iot/production-sessions/${sessionId}/material-return`, {
        returnedQty: qty, unit: materialRemainder?.unit || "dona", notes: returnReason || undefined,
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Xatolik"); }
      setReturnDone(true);
      toast({ title: t("Material qaytarildi!", "Материал возвращён!") });
      setStep("done");
    } catch (err: unknown) {
      toast({ title: t("Qaytarishda xatolik", "Ошибка возврата"), description: String(err instanceof Error ? err.message : err), variant: "destructive" });
    } finally { setReturnSubmitting(false); }
  }

  function handleClose() {
    if (step !== "done") {
      toast({ title: t("Avval baholashni tugatib, materialni qaytaring", "Сначала завершите оценку и верните материал"), variant: "destructive" });
      return;
    }
    resetState();
    onClose();
  }

  const stepLabels: { id: CompletionStep; uz: string; ru: string }[] = [
    { id: "results", uz: "Natijalar", ru: "Результаты" },
    { id: "evaluation", uz: "Baholash", ru: "Оценка" },
    ...(returnRequired ? [{ id: "material" as CompletionStep, uz: "Material", ru: "Материал" }] : []),
  ];

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-[var(--ep-green)]" />
            {t("Sessiya yakunlandi", "Сессия завершена")}
          </DialogTitle>
        </DialogHeader>

        {completionReport && (
          <div className="space-y-4">
            <StepProgressBar step={step} stepLabels={stepLabels} />

            {step === "results" && (
              <ResultsStep
                lang={lang}
                completionReport={completionReport}
                onNext={() => setStep("evaluation")}
              />
            )}

            {step === "evaluation" && (
              <EvaluationStep
                lang={lang}
                safetyScore={safetyScore} setSafetyScore={setSafetyScore}
                qualityScore={qualityScore} setQualityScore={setQualityScore}
                productivityScore={productivityScore} setProductivityScore={setProductivityScore}
                teamworkScore={teamworkScore} setTeamworkScore={setTeamworkScore}
                issuesReported={issuesReported} setIssuesReported={setIssuesReported}
                suggestions={suggestions} setSuggestions={setSuggestions}
                evalComplete={evalComplete} evalSubmitting={evalSubmitting}
                onSubmit={submitEvaluation}
              />
            )}

            {step === "material" && materialRemainder && (
              <MaterialReturnStep
                lang={lang}
                materialRemainder={materialRemainder}
                returnedQty={returnedQty} setReturnedQty={setReturnedQty}
                returnReason={returnReason} setReturnReason={setReturnReason}
                returnSubmitting={returnSubmitting}
                onSubmit={submitMaterialReturn}
              />
            )}

            {step === "done" && (
              <DoneStep lang={lang} evalDone={evalDone} returnDone={returnDone} onClose={handleClose} />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
