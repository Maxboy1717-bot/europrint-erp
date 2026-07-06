/**
 * @module IoTCompletionReportSteps
 * @description Evaluation, MaterialReturn, and Done step components for IoTCompletionReport.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, Package, RotateCcw } from "lucide-react";
import { CompletionReportData } from "./iot-types";
import { StarRating } from "./IoTCompletionReportSections";
import { EPStatusPill, EPLoader } from "@/components/ep";
import { useTranslation } from "@/lib/i18n";

// ─── Evaluation Step ──────────────────────────────────────────────────────────
export function EvaluationStep({
  safetyScore, setSafetyScore,
  qualityScore, setQualityScore,
  productivityScore, setProductivityScore,
  teamworkScore, setTeamworkScore,
  issuesReported, setIssuesReported,
  suggestions, setSuggestions,
  evalComplete, evalSubmitting,
  onSubmit,
}: {
  safetyScore: number; setSafetyScore: (v: number) => void;
  qualityScore: number; setQualityScore: (v: number) => void;
  productivityScore: number; setProductivityScore: (v: number) => void;
  teamworkScore: number; setTeamworkScore: (v: number) => void;
  issuesReported: string; setIssuesReported: (v: string) => void;
  suggestions: string; setSuggestions: (v: string) => void;
  evalComplete: boolean;
  evalSubmitting: boolean;
  onSubmit: () => void;
}) {
  const { t } = useTranslation("iot");
  return (
    <>
      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md p-3">
        <p className="text-sm font-semibold text-[var(--ep-red)] dark:text-red-300">
          {t("crEvalMandatory")}
        </p>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
            {t("crShiftRating")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <StarRating value={safetyScore} onChange={setSafetyScore} label={t("crSafety")} />
          <StarRating value={qualityScore} onChange={setQualityScore} label={t("crQuality")} />
          <StarRating value={productivityScore} onChange={setProductivityScore} label={t("crRatingProductivity")} />
          <StarRating value={teamworkScore} onChange={setTeamworkScore} label={t("crTeamwork")} />
        </CardContent>
      </Card>
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium mb-1">{t("crIssuesOptional")}</p>
          <Textarea value={issuesReported} onChange={e => setIssuesReported(e.target.value)} placeholder={t("crIssuesPlaceholder")} className="resize-none" rows={2} data-testid="textarea-issues" />
        </div>
        <div>
          <p className="text-sm font-medium mb-1">{t("crSuggestionsOptional")}</p>
          <Textarea value={suggestions} onChange={e => setSuggestions(e.target.value)} placeholder={t("crSuggestionsPlaceholder")} className="resize-none" rows={2} data-testid="textarea-suggestions" />
        </div>
      </div>
      {!evalComplete && (
        <p className="text-sm text-[var(--ep-red)] text-center">
          {t("crRateAll4")}
        </p>
      )}
      <Button className="w-full h-14 text-lg font-bold" onClick={onSubmit} disabled={!evalComplete || evalSubmitting} data-testid="button-submit-evaluation">
        {evalSubmitting ? <EPLoader size={20} className="mr-2" /> : <CheckCircle className="mr-2 h-4 w-4" />}
        {t("crSaveEvaluation")}
      </Button>
    </>
  );
}

// ─── Material Return Step ─────────────────────────────────────────────────────
export function MaterialReturnStep({
  materialRemainder,
  returnedQty, setReturnedQty,
  returnReason, setReturnReason,
  returnSubmitting,
  onSubmit,
}: {
  materialRemainder: NonNullable<CompletionReportData["materialRemainder"]>;
  returnedQty: string; setReturnedQty: (v: string) => void;
  returnReason: string; setReturnReason: (v: string) => void;
  returnSubmitting: boolean;
  onSubmit: () => void;
}) {
  const { t } = useTranslation("iot");
  return (
    <>
      <Card className="border-orange-200 dark:border-orange-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-5 w-5 text-[var(--ep-primary)]" />
            {t("crMaterialReturnTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">{t("crGiven")}</p>
              <p className="text-xl font-bold">{materialRemainder.takenQty}</p>
              <p className="text-xs text-muted-foreground">{materialRemainder.unit}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">{t("crUsed")}</p>
              <p className="text-xl font-bold text-[var(--ep-green)]">{materialRemainder.usedQty}</p>
              <p className="text-xs text-muted-foreground">{materialRemainder.unit}</p>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200">
              <p className="text-xs text-muted-foreground">{t("crRemainder")}</p>
              <p className="text-xl font-bold text-[var(--ep-primary)]">{materialRemainder.remainderQty}</p>
              <p className="text-xs text-muted-foreground">{materialRemainder.unit}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-1">{t("crReturnedQtyLabel")}</p>
            <input
              type="number" min="0" max={materialRemainder.remainderQty}
              value={returnedQty} onChange={e => setReturnedQty(e.target.value)}
              placeholder={String(materialRemainder.remainderQty)}
              className="w-full h-12 px-4 rounded-md border border-input bg-background text-lg font-bold focus:outline-none focus:ring-2 focus:ring-ring"
              data-testid="input-returned-qty"
            />
          </div>
          <div>
            <p className="text-sm font-medium mb-1">{t("crReasonOptional")}</p>
            <Textarea value={returnReason} onChange={e => setReturnReason(e.target.value)} placeholder={t("crNotUsedPlaceholder")} className="resize-none" rows={2} data-testid="textarea-return-reason" />
          </div>
        </CardContent>
      </Card>
      <Button className="w-full h-14 text-lg font-bold" onClick={onSubmit} disabled={returnSubmitting} data-testid="button-submit-material-return">
        {returnSubmitting ? <EPLoader size={20} className="mr-2" /> : <RotateCcw className="mr-2 h-4 w-4" />}
        {t("crReturnMaterialButton")}
      </Button>
    </>
  );
}

// ─── Done Step ────────────────────────────────────────────────────────────────
export function DoneStep({
  evalDone, returnDone, onClose,
}: {
  evalDone: boolean;
  returnDone: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation("iot");
  return (
    <>
      <div className="text-center py-6 space-y-4">
        <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
          <CheckCircle className="h-12 w-12 text-[var(--ep-green)]" />
        </div>
        <div>
          <p className="text-2xl font-bold text-[var(--ep-green)]">{t("crAllDone")}</p>
          <p className="text-muted-foreground mt-1">
            {t("crDoneSummary")}
          </p>
        </div>
        {evalDone && (
          <EPStatusPill tone="neutral" className="text-sm px-3 py-1">
            {t("crEvalSavedShort")} ✓
          </EPStatusPill>
        )}
        {returnDone && (
          <EPStatusPill tone="neutral" className="text-sm px-3 py-1 ml-2">
            {t("crMaterialReturnedShort")} ✓
          </EPStatusPill>
        )}
      </div>
      <Button className="w-full h-14 text-lg font-bold" onClick={onClose} data-testid="button-close-report">
        {t("crCloseAndNext")}
      </Button>
    </>
  );
}
