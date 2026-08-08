/**
 * @module IoTCompletionReport
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { IoTCompletionReportProps, CompletionStep } from "./IoTCompletionReportTypes";
import { StepProgressBar, ResultsStep } from "./IoTCompletionReportSections";
import { EvaluationStep, MaterialReturnStep, DoneStep } from "./IoTCompletionReportSteps";
import { useTranslation } from "@/lib/i18n";
import { tabletFetch as sharedTabletFetch } from "./tabletFetch";

// B14/Decision 1 (2026-07-06): these two calls previously used apiRequest (ERP
// JWT/cookie auth) even though tabletToken was already validated in scope above --
// the token was checked but never actually sent, so a bare kiosk tablet (no ERP
// session) always got a silent failure here. C2 (CRITICAL-CORRECTNESS-AUDIT-
// 2026-07-06): now routed through the shared tabletFetch client, which also
// transparently refreshes an expired token and retries once instead of failing.
function tabletFetch(tabletToken: string, path: string, body: unknown): Promise<Response> {
  return sharedTabletFetch("POST", path, body, tabletToken);
}

export function IoTCompletionReport({ open, onClose, completionReport, formatTime, tabletToken }: IoTCompletionReportProps) {
  const { t } = useTranslation("iot");
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
      toast({ title: t("crEvalRequired"), variant: "destructive" });
      return;
    }
    if (!sessionId || !tabletToken) {
      toast({ title: t("crNoSessionData"), variant: "destructive" });
      return;
    }
    setEvalSubmitting(true);
    try {
      const res = await tabletFetch(tabletToken, `/api/iot/production-sessions/${sessionId}/evaluation`, {
        safetyScore, qualityScore, productivityScore, teamworkScore,
        issuesReported: issuesReported || undefined, suggestions: suggestions || undefined,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setEvalDone(true);
      toast({ title: t("crEvalSaved") });
      if (returnRequired) { setStep("material"); } else { setStep("done"); }
    } catch (err: unknown) {
      toast({ title: t("crEvalError"), description: String(err instanceof Error ? err.message : err), variant: "destructive" });
    } finally { setEvalSubmitting(false); }
  }

  async function submitMaterialReturn() {
    const qty = parseInt(returnedQty) || 0;
    if (!sessionId || !tabletToken) {
      toast({ title: t("crNoSessionData"), variant: "destructive" });
      return;
    }
    setReturnSubmitting(true);
    try {
      const res = await tabletFetch(tabletToken, `/api/iot/production-sessions/${sessionId}/material-return`, {
        returnedQty: qty, unit: materialRemainder?.unit || "dona", notes: returnReason || undefined,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setReturnDone(true);
      toast({ title: t("crMaterialReturned") });
      setStep("done");
    } catch (err: unknown) {
      toast({ title: t("crReturnError"), description: String(err instanceof Error ? err.message : err), variant: "destructive" });
    } finally { setReturnSubmitting(false); }
  }

  function handleClose() {
    if (step !== "done") {
      toast({ title: t("crFinishFirst"), variant: "destructive" });
      return;
    }
    resetState();
    onClose();
  }

  // i18n F2: was { uz, ru } with StepProgressBar always rendering .uz regardless
  // of language -- now a single resolved `label` in the current language.
  const stepLabels: { id: CompletionStep; label: string }[] = [
    { id: "results", label: t("crStepResults") },
    { id: "evaluation", label: t("crStepEvaluation") },
    ...(returnRequired ? [{ id: "material" as CompletionStep, label: t("crStepMaterial") }] : []),
  ];

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-[var(--ep-green)]" />
            {t("crTitle")}
          </DialogTitle>
        </DialogHeader>

        {completionReport && (
          <div className="space-y-4">
            <StepProgressBar step={step} stepLabels={stepLabels} />

            {step === "results" && (
              <ResultsStep
                completionReport={completionReport}
                onNext={() => setStep("evaluation")}
              />
            )}

            {step === "evaluation" && (
              <EvaluationStep
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
                materialRemainder={materialRemainder}
                returnedQty={returnedQty} setReturnedQty={setReturnedQty}
                returnReason={returnReason} setReturnReason={setReturnReason}
                returnSubmitting={returnSubmitting}
                onSubmit={submitMaterialReturn}
              />
            )}

            {step === "done" && (
              <DoneStep evalDone={evalDone} returnDone={returnDone} onClose={handleClose} />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
