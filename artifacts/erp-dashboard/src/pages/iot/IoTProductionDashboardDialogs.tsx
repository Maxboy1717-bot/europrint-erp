/**
 * @module IoTProductionDashboardDialogs
 * @description Action buttons (defect/downtime dialogs) and bottom bar for IoTProductionDashboard.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Phone, ArrowRightLeft, Moon, Square, Play, Clock, XCircle, AlertTriangle } from "lucide-react";
import { IotLang, ProductionSession, DowntimeReasonCode } from "./iot-types";
import { REASON_ICONS } from "./useIoTTablet";
import { UseMutationResult } from "@tanstack/react-query";

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
// ─── Bottom Actions Bar ───────────────────────────────────────────────────────
export function BottomActionsBar({
  lang, activeSession, stopSession, setEnergySaving, setShowSOSDialog, setShowHandoverDialog,
}: {
  lang: IotLang;
  activeSession: ProductionSession | null;
  stopSession: UseMutationResult<unknown, Error, void, unknown>;
  setEnergySaving: (v: boolean) => void;
  setShowSOSDialog: (v: boolean) => void;
  setShowHandoverDialog: (v: boolean) => void;
}) {
  const { t } = useTranslation("common");
  const t = (uz: string, ru: string) => lang === "uz" ? uz : ru;
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-3 flex items-center justify-between z-30 shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
      <div className="flex gap-3">
        <Button variant="outline" className="h-14 px-6 text-lg font-bold border-border text-muted-foreground hover:bg-muted rounded-xl" onClick={() => setEnergySaving(true)} data-testid="button-energy-saving">
          <Moon className="h-6 w-6 mr-2 text-primary" />{t("Tejash", "Экономия")}
        </Button>
        <Button variant="outline" className="h-14 px-6 text-lg font-bold border-border text-[var(--ep-red)] hover:bg-red-50 rounded-xl" onClick={() => setShowSOSDialog(true)} data-testid="button-sos-open">
          <Phone className="h-6 w-6 mr-2 animate-bounce" />{t("SOS", "SOS")}
        </Button>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" className="h-14 px-6 text-lg font-bold border-border text-muted-foreground hover:bg-muted rounded-xl" onClick={() => setShowHandoverDialog(true)} data-testid="button-handover-open">
          <ArrowRightLeft className="h-6 w-6 mr-2 text-[var(--ep-green)]" />{t("Smena topshirish", "Сдать смену")}
        </Button>
        <Button className="h-14 px-8 text-lg font-black bg-[var(--ep-red)] text-white rounded-xl hover:bg-[var(--ep-red)]/90 active:scale-95 transition-all" onClick={() => stopSession.mutate()} disabled={stopSession.isPending || !activeSession} data-testid="button-stop-session">
          {stopSession.isPending ? <EPLoader size={24} className="mr-2" /> : <Square className="h-6 w-6 fill-current mr-2" />}
          {t("STOP", "СТОП")}
        </Button>
      </div>
    </div>
  );
}

// ─── Action Buttons (Defect / Downtime / Start) ───────────────────────────────
export function ActionButtons({
  lang, activeSession, isSettingUp, startSession,
  showDefectDialog, setShowDefectDialog,
  showDowntimeDialog, setShowDowntimeDialog,
  defectQty, setDefectQty, defectReason, setDefectReason, defectStage, setDefectStage,
  defectReasons, defectReasonsLoading, reportDefect,
  selectedReasonCode, setSelectedReasonCode, downtimeMinutes, setDowntimeMinutes,
  downtimeNotes, setDowntimeNotes, reasonCodes, reportDowntime,
}: {
  lang: IotLang;
  activeSession: ProductionSession | null;
  isSettingUp: boolean;
  startSession: UseMutationResult<ProductionSession, Error, void, unknown>;
  showDefectDialog: boolean; setShowDefectDialog: (v: boolean) => void;
  showDowntimeDialog: boolean; setShowDowntimeDialog: (v: boolean) => void;
  defectQty: string; setDefectQty: (v: string) => void;
  defectReason: string; setDefectReason: (v: string) => void;
  defectStage: string; setDefectStage: (v: string) => void;
  defectReasons: Array<{ code: string; labelUz: string; labelRu: string; stage: string }>;
  defectReasonsLoading: boolean;
  reportDefect: UseMutationResult<void, Error, void, unknown>;
  selectedReasonCode: string; setSelectedReasonCode: (v: string) => void;
  downtimeMinutes: string; setDowntimeMinutes: (v: string) => void;
  downtimeNotes: string; setDowntimeNotes: (v: string) => void;
  reasonCodes: DowntimeReasonCode[];
  reportDowntime: UseMutationResult<void, Error, void, unknown>;
}) {
  const { t } = useTranslation("common");
  const t = (uz: string, ru: string) => lang === "uz" ? uz : ru;

  if (activeSession?.status === "pending" || isSettingUp) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-10">
        <Button className="h-24 text-2xl font-black tracking-tight col-span-2 bg-primary text-white rounded-xl shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all" onClick={() => startSession.mutate()} disabled={startSession.isPending} data-testid="button-finish-setup">
          {startSession.isPending ? <EPLoader size={32} className="mr-3" /> : <Play className="h-8 w-8 fill-current mr-3" />}
          {t("SOZLASH TUGADI - BOSHLASH", "НАСТРОЙКА ЗАВЕРШЕНА - СТАРТ")}
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-10">
      {/* Defect Dialog */}
      <Dialog open={showDefectDialog} onOpenChange={setShowDefectDialog}>
        <DialogTrigger asChild>
          <Button variant="destructive" className="h-20 text-xl font-black tracking-tight bg-[var(--ep-red)] text-white rounded-xl shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all" data-testid="button-report-defect">
            <XCircle className="h-8 w-8 mr-3" />{t("BRAK", "БРАК")}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md bg-card border-border shadow-lg p-6">
          <DialogHeader><DialogTitle className="text-2xl font-bold text-foreground">{t("Brak hisoboti", "Отчет о браке")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("Miqdor (dona)", "Количество (шт.)")}</Label>
              <Input type="number" inputMode="numeric" value={defectQty} onChange={e => setDefectQty(e.target.value)} placeholder="0" className="text-4xl h-20 text-center font-black text-[var(--ep-red)] bg-background border-border rounded-xl" data-testid="input-defect-qty" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("Brak sababi", "Причина брака")}</Label>
              <Select value={defectReason} onValueChange={val => { setDefectReason(val); const found = (Array.isArray(defectReasons) ? defectReasons : []).find(r => r.code === val); if (found) setDefectStage(found.stage); }}>
                <SelectTrigger className="h-14 text-lg bg-background border-border rounded-xl" data-testid="select-defect-reason"><SelectValue placeholder={t("Sabab tanlang...", "Выберите причину...")} /></SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {defectReasonsLoading ? <SelectItem value="_loading" disabled>{t("Yuklanmoqda...", "Загрузка...")}</SelectItem>
                    : defectReasons.length === 0 ? <SelectItem value="_empty" disabled>{t("Sabablar yuklanmadi", "Причины не загружены")}</SelectItem>
                      : (Array.isArray(defectReasons) ? defectReasons : []).map(r => <SelectItem key={r.code} value={r.code} className="py-3 text-base" data-testid={`defect-reason-${r.code}`}>{r.code}: {lang === "uz" ? r.labelUz : r.labelRu}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("Bosqich (ishlab chiqarish operatsiyasi)", "Этап производства")}</Label>
              <Select value={defectStage} onValueChange={setDefectStage}>
                <SelectTrigger className="h-14 text-lg bg-background border-border rounded-xl" data-testid="select-defect-stage"><SelectValue placeholder={t("Bosqich tanlang...", "Выберите этап...")} /></SelectTrigger>
                <SelectContent>
                  {([
                    { value: "setup", labelUz: "Sozlash", labelRu: "Настройка" },
                    { value: "production", labelUz: "Ishlab chiqarish", labelRu: "Производство" },
                    { value: "cleaning", labelUz: "Tozalash", labelRu: "Чистка" },
                  ]).map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="py-3 text-base">{t(opt.labelUz, opt.labelRu)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full h-16 text-xl font-bold bg-[var(--ep-red)] text-white rounded-xl mt-2" onClick={() => reportDefect.mutate()} disabled={reportDefect.isPending || !defectQty || parseInt(defectQty) <= 0 || !defectReason} data-testid="button-submit-defect">
              {reportDefect.isPending ? <EPLoader size={24} className="mr-2" /> : <XCircle className="h-6 w-6 mr-2" />}
              {t("Hisobotni yuborish", "Отправить отчет")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Downtime Dialog */}
      <Dialog open={showDowntimeDialog} onOpenChange={setShowDowntimeDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" className="h-20 text-xl font-black tracking-tight border-4 border-amber-500 text-[var(--ep-yellow)] bg-card rounded-xl shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all" data-testid="button-report-downtime">
            <Clock className="h-8 w-8 mr-3" />{t("TO'XTALISH", "ПРОСТОЙ")}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md bg-card border-border shadow-lg p-6">
          <DialogHeader><DialogTitle className="text-2xl font-bold text-foreground">{t("To'xtalish hisoboti", "Отчет о простое")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("To'xtalish sababi", "Причина простоя")}</Label>
              <Select value={selectedReasonCode} onValueChange={setSelectedReasonCode}>
                <SelectTrigger className="h-14 text-lg bg-background border-border rounded-xl" data-testid="select-downtime-reason"><SelectValue placeholder={t("Sabab tanlang...", "Выберите причину...")} /></SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {(Array.isArray(reasonCodes) ? reasonCodes : []).map(r => {
                    const Icon = REASON_ICONS[r.code as keyof typeof REASON_ICONS] || AlertTriangle;
                    return (
                      <SelectItem key={r.code} value={r.code} className="py-3 text-base" data-testid={`downtime-reason-${r.code}`}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-[var(--ep-yellow)]" />
                          <span>{r.code}: {lang === "uz" ? r.labelUz : r.labelRu}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("Davomiyligi (daqiqa)", "Длительность (мин.)")}</Label>
              <Input type="number" inputMode="numeric" value={downtimeMinutes} onChange={e => setDowntimeMinutes(e.target.value)} placeholder="5" className="text-4xl h-20 text-center font-black text-[var(--ep-yellow)] bg-background border-border rounded-xl" data-testid="input-downtime-minutes" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("Izoh", "Примечание")}</Label>
              <Textarea value={downtimeNotes} onChange={e => setDowntimeNotes(e.target.value)} placeholder={t("Batafsil ma'lumot...", "Подробности...")} rows={3} className="bg-background border-border text-foreground text-base" data-testid="input-downtime-notes" />
            </div>
            <Button className="w-full h-16 text-xl font-bold bg-[var(--ep-yellow)] text-white rounded-xl mt-2" onClick={() => reportDowntime.mutate()} disabled={reportDowntime.isPending || !selectedReasonCode || !downtimeMinutes} data-testid="button-submit-downtime">
              {reportDowntime.isPending ? <EPLoader size={24} className="mr-2" /> : <Clock className="h-6 w-6 mr-2" />}
              {t("Hisobotni yuborish", "Отправить отчет")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
