import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User, CheckCircle, Star, Package, AlertTriangle, ChevronRight, Loader2, RotateCcw } from "lucide-react";
import { CompletionReportData, IotLang } from "./iot-types";
import { useToast } from "@/hooks/use-toast";

interface IoTCompletionReportProps {
  lang: IotLang;
  open: boolean;
  onClose: () => void;
  completionReport: CompletionReportData | null;
  formatTime: (s: number) => string;
  tabletToken: string;
}

type Step = "results" | "evaluation" | "material" | "done";

function StarRating({ value, onChange, label, lang }: { value: number; onChange: (v: number) => void; label: string; lang: IotLang }) {
  const t = (uz: string, ru: string) => lang === "uz" ? uz : ru;
  const labels: Record<number, [string, string]> = {
    1: ["Yomon", "Плохо"], 2: ["Qoniqarsiz", "Неудовл."], 3: ["O'rta", "Средне"],
    4: ["Yaxshi", "Хорошо"], 5: ["A'lo", "Отлично"],
  };
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <div className="flex items-center gap-1">
        {([1, 2, 3, 4, 5]).map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none transition-transform active:scale-90"
            data-testid={`star-${label.toLowerCase().replace(/\s/g, "-")}-${star}`}
          >
            <Star
              className={`h-10 w-10 ${star <= value ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`}
            />
          </button>
        ))}
        {value > 0 && (
          <Badge variant="secondary" className="ml-2 text-sm">
            {t(labels[value][0], labels[value][1])}
          </Badge>
        )}
      </div>
    </div>
  );
}

export function IoTCompletionReport({ lang, open, onClose, completionReport, formatTime, tabletToken }: IoTCompletionReportProps) {
  const t = (uz: string, ru: string) => lang === "uz" ? uz : ru;
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("results");
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
    if (!open && step === "done") {
      resetState();
      onClose();
    }
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
      const res = await fetch(`/api/iot/production-sessions/${sessionId}/evaluation`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tablet-token": tabletToken },
        body: JSON.stringify({ safetyScore, qualityScore, productivityScore, teamworkScore, issuesReported: issuesReported || undefined, suggestions: suggestions || undefined }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Xatolik");
      }
      setEvalDone(true);
      toast({ title: t("Baholash saqlandi!", "Оценка сохранена!") });
      if (returnRequired) {
        setStep("material");
      } else {
        setStep("done");
      }
    } catch (err: unknown) {
      toast({ title: t("Baholashda xatolik", "Ошибка оценки"), description: String(err instanceof Error ? err.message : err), variant: "destructive" });
    } finally {
      setEvalSubmitting(false);
    }
  }

  async function submitMaterialReturn() {
    const qty = parseInt(returnedQty) || 0;
    if (!sessionId || !tabletToken) {
      toast({ title: t("Sessiya ma'lumoti yo'q", "Нет данных о сессии"), variant: "destructive" });
      return;
    }
    setReturnSubmitting(true);
    try {
      const res = await fetch(`/api/iot/production-sessions/${sessionId}/material-return`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tablet-token": tabletToken },
        body: JSON.stringify({ returnedQty: qty, unit: materialRemainder?.unit || "dona", notes: returnReason || undefined }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Xatolik");
      }
      setReturnDone(true);
      toast({ title: t("Material qaytarildi!", "Материал возвращён!") });
      setStep("done");
    } catch (err: unknown) {
      toast({ title: t("Qaytarishda xatolik", "Ошибка возврата"), description: String(err instanceof Error ? err.message : err), variant: "destructive" });
    } finally {
      setReturnSubmitting(false);
    }
  }

  function handleClose() {
    if (step !== "done") {
      toast({ title: t("Avval baholashni tugatib, materialni qaytaring", "Сначала завершите оценку и верните материал"), variant: "destructive" });
      return;
    }
    resetState();
    onClose();
  }

  const stepLabels: { id: Step; uz: string; ru: string }[] = [
    { id: "results", uz: "Natijalar", ru: "Результаты" },
    { id: "evaluation", uz: "Baholash", ru: "Оценка" },
    ...(returnRequired ? [{ id: "material" as Step, uz: "Material", ru: "Материал" }] : []),
  ];

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            {t("Sessiya yakunlandi", "Сессия завершена")}
          </DialogTitle>
        </DialogHeader>

        {completionReport && (
          <div className="space-y-4">
            {/* Progress steps */}
            <div className="flex items-center gap-1">
              {(Array.isArray(stepLabels) ? stepLabels : []).map((s, i) => (
                <div key={s.id} className="flex items-center gap-1 flex-1">
                  <div className={`flex-1 text-center py-1.5 px-2 rounded-md text-xs font-semibold border transition-all ${
                    step === s.id ? "bg-primary text-primary-foreground border-primary" :
                    (step === "done" || (stepLabels ?? []).findIndex(x => x.id === step) > i) ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400" :
                    "bg-muted text-muted-foreground border-transparent"
                  }`}>
                    {t(s.uz, s.ru)}
                  </div>
                  {i < stepLabels.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                </div>
              ))}
            </div>

            {/* ===== STEP 1: RESULTS ===== */}
            {step === "results" && (
              <>
                <Card className="bg-blue-50 dark:bg-blue-950/30">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <User className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="font-bold text-lg">{completionReport.worker?.name}</p>
                        <p className="text-sm text-muted-foreground">{t("Tabel", "Табель")}: {completionReport.worker?.tabelNumber}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{t("Ishlab chiqarish natijasi", "Результат производства")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">{t("Kutilgan", "Ожидалось")}</p>
                        <p className="text-2xl font-bold text-blue-600">{completionReport.production?.targetQuantity}</p>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">{t("Haqiqiy", "Фактически")}</p>
                        <p className="text-2xl font-bold text-green-600">{completionReport.production?.actualQuantity}</p>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">{t("Yaxshi", "Годных")}</p>
                        <p className="text-2xl font-bold">{completionReport.production?.goodQuantity}</p>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">{t("Brak", "Брак")}</p>
                        <p className={`text-2xl font-bold ${(completionReport.production?.defectQuantity || 0) > 0 ? "text-red-500" : ""}`}>
                          {completionReport.production?.defectQuantity}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{t("Bajarildi", "Выполнено")}</span>
                        <span className="font-bold">{Math.round(completionReport.production?.completionPercent || 0)}%</span>
                      </div>
                      <Progress value={completionReport.production?.completionPercent || 0} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">OEE {t("ko'rsatkichlari", "показатели")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">{t("Mavjudlik", "Доступн.")}</p>
                        <p className="font-bold">{completionReport.metrics?.availability || 0}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t("Unumdorlik", "Произв.")}</p>
                        <p className="font-bold">{completionReport.metrics?.performance || 0}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t("Sifat", "Качество")}</p>
                        <p className="font-bold">{completionReport.metrics?.quality || 0}%</p>
                      </div>
                      <div className="bg-primary/10 rounded p-1">
                        <p className="text-xs text-muted-foreground">OEE</p>
                        <p className="font-bold text-primary">{completionReport.metrics?.oee || 0}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-3 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    {t("Keyingi qadamda majburiy baholash va material qaytarish kerak", "Следующий шаг — обязательная оценка и возврат материала")}
                  </p>
                </div>

                <Button
                  className="w-full h-14 text-lg font-bold"
                  onClick={() => setStep("evaluation")}
                  data-testid="button-goto-evaluation"
                >
                  {t("Baholashga o'tish", "Перейти к оценке")}
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </>
            )}

            {/* ===== STEP 2: MANDATORY EVALUATION ===== */}
            {step === "evaluation" && (
              <>
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md p-3">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                    {t("Bu baholash MAJBURIY. Tugatmasdan chiqib bo'lmaydi.", "Эта оценка ОБЯЗАТЕЛЬНА. Нельзя выйти без завершения.")}
                  </p>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                      {t("Smena baholash (1-5 yulduz)", "Оценка смены (1-5 звезд)")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <StarRating value={safetyScore} onChange={setSafetyScore} label={t("Xavfsizlik", "Безопасность")} lang={lang} />
                    <StarRating value={qualityScore} onChange={setQualityScore} label={t("Sifat", "Качество")} lang={lang} />
                    <StarRating value={productivityScore} onChange={setProductivityScore} label={t("Unumdorlik", "Производительность")} lang={lang} />
                    <StarRating value={teamworkScore} onChange={setTeamworkScore} label={t("Jamoaviylik", "Командная работа")} lang={lang} />
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">{t("Muammolar (ixtiyoriy)", "Проблемы (необяз.)")}</p>
                    <Textarea
                      value={issuesReported}
                      onChange={e => setIssuesReported(e.target.value)}
                      placeholder={t("Bu smena muammolari...", "Проблемы этой смены...")}
                      className="resize-none"
                      rows={2}
                      data-testid="textarea-issues"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">{t("Takliflar (ixtiyoriy)", "Предложения (необяз.)")}</p>
                    <Textarea
                      value={suggestions}
                      onChange={e => setSuggestions(e.target.value)}
                      placeholder={t("Yaxshilash takliflari...", "Предложения по улучшению...")}
                      className="resize-none"
                      rows={2}
                      data-testid="textarea-suggestions"
                    />
                  </div>
                </div>

                {!evalComplete && (
                  <p className="text-sm text-red-500 text-center">
                    {t("Barcha 4 mezonni baholang (1-5 yulduz)", "Оцените все 4 критерия (1-5 звезд)")}
                  </p>
                )}

                <Button
                  className="w-full h-14 text-lg font-bold"
                  onClick={submitEvaluation}
                  disabled={!evalComplete || evalSubmitting}
                  data-testid="button-submit-evaluation"
                >
                  {evalSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle className="mr-2 h-5 w-5" />}
                  {t("Baholashni saqlash", "Сохранить оценку")}
                </Button>
              </>
            )}

            {/* ===== STEP 3: MATERIAL RETURN (only if requiresReturn) ===== */}
            {step === "material" && materialRemainder && (
              <>
                <Card className="border-orange-200 dark:border-orange-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="h-5 w-5 text-orange-500" />
                      {t("Material qoldig'i qaytarish", "Возврат остатка материала")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">{t("Berilgan", "Выдано")}</p>
                        <p className="text-xl font-bold">{materialRemainder.takenQty}</p>
                        <p className="text-xs text-muted-foreground">{materialRemainder.unit}</p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">{t("Ishlatilgan", "Использовано")}</p>
                        <p className="text-xl font-bold text-green-600">{materialRemainder.usedQty}</p>
                        <p className="text-xs text-muted-foreground">{materialRemainder.unit}</p>
                      </div>
                      <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200">
                        <p className="text-xs text-muted-foreground">{t("Qoliq", "Остаток")}</p>
                        <p className="text-xl font-bold text-orange-600">{materialRemainder.remainderQty}</p>
                        <p className="text-xs text-muted-foreground">{materialRemainder.unit}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-1">{t("Qaytarilgan miqdor", "Возвращённое количество")}</p>
                      <input
                        type="number"
                        min="0"
                        max={materialRemainder.remainderQty}
                        value={returnedQty}
                        onChange={e => setReturnedQty(e.target.value)}
                        placeholder={String(materialRemainder.remainderQty)}
                        className="w-full h-12 px-4 rounded-md border border-input bg-background text-lg font-bold focus:outline-none focus:ring-2 focus:ring-ring"
                        data-testid="input-returned-qty"
                      />
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-1">{t("Sabab / izoh (ixtiyoriy)", "Причина / комментарий (необяз.)")}</p>
                      <Textarea
                        value={returnReason}
                        onChange={e => setReturnReason(e.target.value)}
                        placeholder={t("Nima uchun ishlatilmagan...", "Почему не использовано...")}
                        className="resize-none"
                        rows={2}
                        data-testid="textarea-return-reason"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Button
                  className="w-full h-14 text-lg font-bold"
                  onClick={submitMaterialReturn}
                  disabled={returnSubmitting}
                  data-testid="button-submit-material-return"
                >
                  {returnSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <RotateCcw className="mr-2 h-5 w-5" />}
                  {t("Material qaytarish", "Вернуть материал")}
                </Button>
              </>
            )}

            {/* ===== STEP: DONE ===== */}
            {step === "done" && (
              <>
                <div className="text-center py-6 space-y-4">
                  <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{t("Hammasi bajarildi!", "Всё выполнено!")}</p>
                    <p className="text-muted-foreground mt-1">
                      {t("Baholash va material qaytarish muvaffaqiyatli yakunlandi", "Оценка и возврат материала успешно завершены")}
                    </p>
                  </div>
                  {evalDone && (
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      {t("Baholash saqlandi", "Оценка сохранена")} ✓
                    </Badge>
                  )}
                  {returnDone && (
                    <Badge variant="secondary" className="text-sm px-3 py-1 ml-2">
                      {t("Material qaytarildi", "Материал возвращён")} ✓
                    </Badge>
                  )}
                </div>

                <Button
                  className="w-full h-14 text-lg font-bold"
                  onClick={handleClose}
                  data-testid="button-close-report"
                >
                  {t("Yopish va yangi buyurtmaga o'tish", "Закрыть и перейти к следующему")}
                </Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
