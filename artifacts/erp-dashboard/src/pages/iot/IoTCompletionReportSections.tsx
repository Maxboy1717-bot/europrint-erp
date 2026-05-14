/**
 * @module IoTCompletionReportSections
 * @description Step-progress bar, StarRating, and ResultsStep for IoTCompletionReport.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { User, AlertTriangle, ChevronRight, Star } from "lucide-react";
import { IotLang, CompletionReportData } from "./iot-types";
import { CompletionStep, StarRatingProps } from "./IoTCompletionReportTypes";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

// ─── Star Rating ──────────────────────────────────────────────────────────────
export function StarRating({ value, onChange, label, lang }: StarRatingProps) {
  const { t } = useTranslation("common");
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
            <Star className={`h-10 w-10 ${star <= value ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`} />
          </button>
        ))}
        {value > 0 && (
          <EPStatusPill tone="neutral" className="ml-2 text-sm">
            {t(labels[value][0], labels[value][1])}
          </EPStatusPill>
        )}
      </div>
    </div>
  );
}

// ─── Step Progress Bar ────────────────────────────────────────────────────────
export function StepProgressBar({
  step,
  stepLabels,
}: {
  step: CompletionStep;
  stepLabels: { id: CompletionStep; uz: string; ru: string }[];
}) {
  return (
    <div className="flex items-center gap-1">
      {(Array.isArray(stepLabels) ? stepLabels : []).map((s, i) => (
        <div key={s.id} className="flex items-center gap-1 flex-1">
          <div className={`flex-1 text-center py-1.5 px-2 rounded-md text-xs font-semibold border transition-all ${
            step === s.id ? "bg-primary text-primary-foreground border-primary" :
            (step === "done" || (Array.isArray(stepLabels) ? stepLabels : []).findIndex(x => x.id === step) > i) ? "bg-green-100 text-[var(--ep-green)] border-green-300 dark:bg-green-900/30 dark:text-green-400" :
            "bg-muted text-muted-foreground border-transparent"
          }`}>
            {s.uz}
          </div>
          {i < stepLabels.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
        </div>
      ))}
    </div>
  );
}

// ─── Results Step ─────────────────────────────────────────────────────────────
export function ResultsStep({
  lang,
  completionReport,
  onNext,
}: {
  lang: IotLang;
  completionReport: CompletionReportData;
  onNext: () => void;
}) {
  const { t } = useTranslation("common");
  const t = (uz: string, ru: string) => lang === "uz" ? uz : ru;
  return (
    <>
      <Card className="bg-blue-50 dark:bg-blue-950/30">
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <User className="h-8 w-8 text-[var(--ep-blue)]" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">{t("Kutilgan", "Ожидалось")}</p>
              <p className="text-2xl font-bold text-[var(--ep-blue)]">{completionReport.production?.targetQuantity}</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">{t("Haqiqiy", "Фактически")}</p>
              <p className="text-2xl font-bold text-[var(--ep-green)]">{completionReport.production?.actualQuantity}</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">{t("Yaxshi", "Годных")}</p>
              <p className="text-2xl font-bold">{completionReport.production?.goodQuantity}</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">{t("Brak", "Брак")}</p>
              <p className={`text-2xl font-bold ${(completionReport.production?.defectQuantity || 0) > 0 ? "text-[var(--ep-red)]" : ""}`}>
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-center">
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
        <AlertTriangle className="h-4 w-4 text-[var(--ep-yellow)] flex-shrink-0 mt-0.5" />
        <p className="text-sm text-[var(--ep-yellow)] dark:text-amber-300">
          {t("Keyingi qadamda majburiy baholash va material qaytarish kerak", "Следующий шаг — обязательная оценка и возврат материала")}
        </p>
      </div>

      <Button className="w-full h-14 text-lg font-bold" onClick={onNext} data-testid="button-goto-evaluation">
        {t("Baholashga o'tish", "Перейти к оценке")}
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </>
  );
}
