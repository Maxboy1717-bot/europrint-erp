/**
 * @module IoTCompletionReportSteps
 * @description Evaluation, MaterialReturn, and Done step components for IoTCompletionReport.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, Package, RotateCcw } from "lucide-react";
import { IotLang, CompletionReportData } from "./iot-types";
import { StarRating } from "./IoTCompletionReportSections";
import { EPStatusPill, EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

// ─── Evaluation Step ──────────────────────────────────────────────────────────
export function EvaluationStep({
  lang,
  safetyScore, setSafetyScore,
  qualityScore, setQualityScore,
  productivityScore, setProductivityScore,
  teamworkScore, setTeamworkScore,
  issuesReported, setIssuesReported,
  suggestions, setSuggestions,
  evalComplete, evalSubmitting,
  onSubmit,
}: {
  lang: IotLang;
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
  const { t } = useTranslation("common");
  const t = (uz: string, ru: string) => lang === "uz" ? uz : ru;
  return (
    <>
      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md p-3">
        <p className="text-sm font-semibold text-[var(--ep-red)] dark:text-red-300">
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
          <Textarea value={issuesReported} onChange={e => setIssuesReported(e.target.value)} placeholder={t("Bu smena muammolari...", "Проблемы этой смены...")} className="resize-none" rows={2} data-testid="textarea-issues" />
        </div>
        <div>
          <p className="text-sm font-medium mb-1">{t("Takliflar (ixtiyoriy)", "Предложения (необяз.)")}</p>
          <Textarea value={suggestions} onChange={e => setSuggestions(e.target.value)} placeholder={t("Yaxshilash takliflari...", "Предложения по улучшению...")} className="resize-none" rows={2} data-testid="textarea-suggestions" />
        </div>
      </div>
      {!evalComplete && (
        <p className="text-sm text-[var(--ep-red)] text-center">
          {t("Barcha 4 mezonni baholang (1-5 yulduz)", "Оцените все 4 критерия (1-5 звезд)")}
        </p>
      )}
      <Button className="w-full h-14 text-lg font-bold" onClick={onSubmit} disabled={!evalComplete || evalSubmitting} data-testid="button-submit-evaluation">
        {evalSubmitting ? <EPLoader size={20} className="mr-2" /> : <CheckCircle className="mr-2 h-4 w-4" />}
        {t("Baholashni saqlash", "Сохранить оценку")}
      </Button>
    </>
  );
}

// ─── Material Return Step ─────────────────────────────────────────────────────
export function MaterialReturnStep({
  lang,
  materialRemainder,
  returnedQty, setReturnedQty,
  returnReason, setReturnReason,
  returnSubmitting,
  onSubmit,
}: {
  lang: IotLang;
  materialRemainder: NonNullable<CompletionReportData["materialRemainder"]>;
  returnedQty: string; setReturnedQty: (v: string) => void;
  returnReason: string; setReturnReason: (v: string) => void;
  returnSubmitting: boolean;
  onSubmit: () => void;
}) {
  const { t } = useTranslation("common");
  const t = (uz: string, ru: string) => lang === "uz" ? uz : ru;
  return (
    <>
      <Card className="border-orange-200 dark:border-orange-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-5 w-5 text-[var(--ep-primary)]" />
            {t("Material qoldig'i qaytarish", "Возврат остатка материала")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">{t("Berilgan", "Выдано")}</p>
              <p className="text-xl font-bold">{materialRemainder.takenQty}</p>
              <p className="text-xs text-muted-foreground">{materialRemainder.unit}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">{t("Ishlatilgan", "Использовано")}</p>
              <p className="text-xl font-bold text-[var(--ep-green)]">{materialRemainder.usedQty}</p>
              <p className="text-xs text-muted-foreground">{materialRemainder.unit}</p>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200">
              <p className="text-xs text-muted-foreground">{t("Qoliq", "Остаток")}</p>
              <p className="text-xl font-bold text-[var(--ep-primary)]">{materialRemainder.remainderQty}</p>
              <p className="text-xs text-muted-foreground">{materialRemainder.unit}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-1">{t("Qaytarilgan miqdor", "Возвращённое количество")}</p>
            <input
              type="number" min="0" max={materialRemainder.remainderQty}
              value={returnedQty} onChange={e => setReturnedQty(e.target.value)}
              placeholder={String(materialRemainder.remainderQty)}
              className="w-full h-12 px-4 rounded-md border border-input bg-background text-lg font-bold focus:outline-none focus:ring-2 focus:ring-ring"
              data-testid="input-returned-qty"
            />
          </div>
          <div>
            <p className="text-sm font-medium mb-1">{t("Sabab / izoh (ixtiyoriy)", "Причина / комментарий (необяз.)")}</p>
            <Textarea value={returnReason} onChange={e => setReturnReason(e.target.value)} placeholder={t("Nima uchun ishlatilmagan...", "Почему не использовано...")} className="resize-none" rows={2} data-testid="textarea-return-reason" />
          </div>
        </CardContent>
      </Card>
      <Button className="w-full h-14 text-lg font-bold" onClick={onSubmit} disabled={returnSubmitting} data-testid="button-submit-material-return">
        {returnSubmitting ? <EPLoader size={20} className="mr-2" /> : <RotateCcw className="mr-2 h-4 w-4" />}
        {t("Material qaytarish", "Вернуть материал")}
      </Button>
    </>
  );
}

// ─── Done Step ────────────────────────────────────────────────────────────────
export function DoneStep({
  lang, evalDone, returnDone, onClose,
}: {
  lang: IotLang;
  evalDone: boolean;
  returnDone: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation("common");
  const t = (uz: string, ru: string) => lang === "uz" ? uz : ru;
  return (
    <>
      <div className="text-center py-6 space-y-4">
        <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
          <CheckCircle className="h-12 w-12 text-[var(--ep-green)]" />
        </div>
        <div>
          <p className="text-2xl font-bold text-[var(--ep-green)]">{t("Hammasi bajarildi!", "Всё выполнено!")}</p>
          <p className="text-muted-foreground mt-1">
            {t("Baholash va material qaytarish muvaffaqiyatli yakunlandi", "Оценка и возврат материала успешно завершены")}
          </p>
        </div>
        {evalDone && (
          <EPStatusPill tone="neutral" className="text-sm px-3 py-1">
            {t("Baholash saqlandi", "Оценка сохранена")} ✓
          </EPStatusPill>
        )}
        {returnDone && (
          <EPStatusPill tone="neutral" className="text-sm px-3 py-1 ml-2">
            {t("Material qaytarildi", "Материал возвращён")} ✓
          </EPStatusPill>
        )}
      </div>
      <Button className="w-full h-14 text-lg font-bold" onClick={onClose} data-testid="button-close-report">
        {t("Yopish va yangi buyurtmaga o'tish", "Закрыть и перейти к следующему")}
      </Button>
    </>
  );
}
