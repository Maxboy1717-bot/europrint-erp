import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Languages, XCircle, AlertTriangle, Phone, ArrowRightLeft, Moon, Square, Play, Timer, Target, Clock, Barcode, User } from "lucide-react";
import { UseMutationResult } from "@tanstack/react-query";
import { ProductionSession, DowntimeReasonCode, IotLang } from "./iot-types";
import { REASON_ICONS } from "./useIoTTablet";

interface IoTProductionDashboardProps {
  lang: IotLang;
  setLang: (l: IotLang) => void;
  workerName: string;
  currentTime: string;
  activeSession: ProductionSession | null;
  shiftInfo: { name: string; nameRu: string; startTime: string; endTime: string; coWorkers?: { id: string; name: string }[] } | null;
  shiftRemaining: number;
  workerId: string;
  elapsedTime: number;
  setupTime: number;
  qcReminderVisible: boolean;
  energySaving: boolean;
  setEnergySaving: (v: boolean) => void;
  showSOSDialog: boolean;
  setShowSOSDialog: (v: boolean) => void;
  showHandoverDialog: boolean;
  setShowHandoverDialog: (v: boolean) => void;
  showQcFormDialog: boolean;
  setShowQcFormDialog: (v: boolean) => void;
  showDefectDialog: boolean;
  setShowDefectDialog: (v: boolean) => void;
  showDowntimeDialog: boolean;
  setShowDowntimeDialog: (v: boolean) => void;
  sosMessage: string;
  setSosMessage: (v: string) => void;
  sosType: "equipment" | "health" | "material" | "other";
  setSosType: (v: "equipment" | "health" | "material" | "other") => void;
  handleSOSSend: () => void;
  handoverNotes: { machineStatus: string; pendingTasks: string; qualityIssues: string; safetyNotes: string; materialStatus: string };
  setHandoverNotes: (v: { machineStatus: string; pendingTasks: string; qualityIssues: string; safetyNotes: string; materialStatus: string }) => void;
  handoverSignature: string;
  setHandoverSignature: (v: string) => void;
  qcSampleSize: string;
  setQcSampleSize: (v: string) => void;
  qcDefectCount: string;
  setQcDefectCount: (v: string) => void;
  qcNotes: string;
  setQcNotes: (v: string) => void;
  defectQty: string;
  setDefectQty: (v: string) => void;
  defectReason: string;
  setDefectReason: (v: string) => void;
  defectStage: string;
  setDefectStage: (v: string) => void;
  selectedReasonCode: string;
  setSelectedReasonCode: (v: string) => void;
  downtimeMinutes: string;
  setDowntimeMinutes: (v: string) => void;
  downtimeNotes: string;
  setDowntimeNotes: (v: string) => void;
  defectReasons: Array<{ code: string; labelUz: string; labelRu: string; stage: string }>;
  defectReasonsLoading: boolean;
  reasonCodes: DowntimeReasonCode[];
  selectedOrder: { orderNumber?: string; productName?: string } | null;
  selectedEquipment: { name?: string } | null;
  formatTime: (s: number) => string;
  formatEstimatedTime: (s: number) => string;
  startSession: UseMutationResult<ProductionSession, Error, void, unknown>;
  stopSession: UseMutationResult<unknown, Error, void, unknown>;
  reportDefect: UseMutationResult<void, Error, void, unknown>;
  submitHandover: UseMutationResult<void, Error, void, unknown>;
  submitInlineQC: UseMutationResult<void, Error, void, unknown>;
  reportDowntime: UseMutationResult<void, Error, void, unknown>;
}

export function IoTProductionDashboard(props: IoTProductionDashboardProps) {
  const {
    lang, setLang, workerName, currentTime, activeSession, shiftInfo, shiftRemaining, workerId,
    elapsedTime, setupTime, qcReminderVisible, energySaving, setEnergySaving,
    showSOSDialog, setShowSOSDialog, showHandoverDialog, setShowHandoverDialog,
    showQcFormDialog, setShowQcFormDialog, showDefectDialog, setShowDefectDialog,
    showDowntimeDialog, setShowDowntimeDialog,
    sosMessage, setSosMessage, sosType, setSosType, handleSOSSend,
    handoverNotes, setHandoverNotes, handoverSignature, setHandoverSignature,
    qcSampleSize, setQcSampleSize, qcDefectCount, setQcDefectCount, qcNotes, setQcNotes,
    defectQty, setDefectQty, defectReason, setDefectReason, defectStage, setDefectStage,
    selectedReasonCode, setSelectedReasonCode, downtimeMinutes, setDowntimeMinutes, downtimeNotes, setDowntimeNotes,
    defectReasons, defectReasonsLoading, reasonCodes, selectedOrder, selectedEquipment,
    formatTime, formatEstimatedTime, startSession, stopSession, reportDefect, submitHandover, submitInlineQC, reportDowntime,
  } = props;

  const t = (uz: string, ru: string) => lang === "uz" ? uz : ru;

  const DOWNTIME_THRESHOLD_SECONDS = 30;
  const lastSignalTime = activeSession?.lastSignalAt ? new Date(activeSession.lastSignalAt).getTime() : null;
  const secondsSinceLastSignal = lastSignalTime ? Math.floor((Date.now() - lastSignalTime) / 1000) : null;
  const isAutoStopped = secondsSinceLastSignal !== null && secondsSinceLastSignal > DOWNTIME_THRESHOLD_SECONDS;
  const effectiveStatus = isAutoStopped ? "stopped" : activeSession?.status;
  const isSettingUp = Boolean(activeSession?.setupStartedAt && !activeSession?.setupEndedAt);
  const cycleTimeSeconds = 5;
  const remainingQuantity = Math.max(0, (activeSession?.targetQuantity || 0) - (activeSession?.actualQuantity || 0));
  const estimatedTimeSeconds = remainingQuantity * cycleTimeSeconds;
  const progressPercent = activeSession ? Math.min((activeSession.actualQuantity / activeSession.targetQuantity) * 100, 100) : 0;
  const orderBarcode = activeSession?.barcode || selectedOrder?.orderNumber || "0000000000000";
  const sessionProductName = lang === "ru" && activeSession?.productNameRu ? activeSession.productNameRu : activeSession?.productName || selectedOrder?.productName;
  const sessionEquipmentName = lang === "ru" && activeSession?.equipmentNameRu ? activeSession.equipmentNameRu : activeSession?.equipmentName || selectedEquipment?.name;

  return (
    <div className="min-h-screen bg-surface font-inter" data-testid="iot-tablet-production">
      {energySaving && (
        <div className="fixed inset-0 bg-black/95 z-[9999] flex flex-col items-center justify-center cursor-pointer select-none" onClick={() => setEnergySaving(false)} data-testid="energy-saving-overlay">
          <Moon className="h-16 w-16 text-primary mb-4 opacity-70" />
          <p className="text-white/60 text-xl font-light mb-2">{t("Energiya tejash rejimi", "Режим энергосбережения")}</p>
          <p className="text-white/40 text-sm">{currentTime}</p>
          <p className="text-white/30 text-xs mt-6">{t("Ekranga bosing — faollashtirish", "Нажмите на экран для активации")}</p>
        </div>
      )}

      {/* SOS Dialog */}
      <Dialog open={showSOSDialog} onOpenChange={setShowSOSDialog}>
        <DialogContent className="max-w-sm bg-surface-container-lowest border-outline-variant shadow-xl">
          <DialogHeader><DialogTitle className="text-error flex items-center gap-2"><Phone className="h-5 w-5" />{t("SOS — Shoshilinch xabar", "SOS — Срочное сообщение")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: "equipment" as const, labelUz: "Uskunа nosozligi", labelRu: "Поломка оборудования" },
                { value: "health" as const, labelUz: "Salomatlik xavfi", labelRu: "Проблема со здоровьем" },
                { value: "material" as const, labelUz: "Material muammosi", labelRu: "Проблема с материалом" },
                { value: "other" as const, labelUz: "Boshqa holat", labelRu: "Другая ситуация" },
              ]).map(opt => (
                <Button 
                  key={opt.value} 
                  variant={sosType === opt.value ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setSosType(opt.value)} 
                  data-testid={`button-sos-type-${opt.value}`}
                  className={sosType === opt.value ? "bg-error text-white border-none" : "border-outline-variant text-on-surface-variant"}
                >
                  {t(opt.labelUz, opt.labelRu)}
                </Button>
              ))}
            </div>
            <Textarea 
              placeholder={t("Muammoni tasvirlab bering...", "Опишите проблему...")} 
              value={sosMessage} 
              onChange={e => setSosMessage(e.target.value)} 
              rows={3} 
              data-testid="input-sos-message" 
              className="bg-surface border-outline-variant text-on-surface"
            />
            <Button variant="destructive" className="w-full h-14 text-lg font-bold bg-error text-white rounded-xl " onClick={handleSOSSend} data-testid="button-sos-send">
              <Phone className="h-6 w-6 mr-2" />{t("Sex boshlig'iga yuborish", "Отправить начальнику цеха")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Handover Dialog */}
      <Dialog open={showHandoverDialog} onOpenChange={setShowHandoverDialog}>
        <DialogContent className="max-w-md bg-surface-container-lowest border-outline-variant shadow-xl">
          <DialogHeader><DialogTitle className="text-2xl font-bold text-on-surface">{t("Smena topshirish akti", "Акт сдачи смены")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {([
              { key: "machineStatus", uzLabel: "Uskuna holati", ruLabel: "Состояние оборудования" },
              { key: "pendingTasks", uzLabel: "Bajarilmagan vazifalar", ruLabel: "Невыполненные задачи" },
              { key: "qualityIssues", uzLabel: "Sifat muammolari", ruLabel: "Проблемы with качеством" },
              { key: "safetyNotes", uzLabel: "Xavfsizlik eslatmalari", ruLabel: "Примечания по безопасности" },
              { key: "materialStatus", uzLabel: "Material holati", ruLabel: "Статус материалов" },
            ]).map(({ key, uzLabel, ruLabel }) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{lang === "uz" ? uzLabel : ruLabel}</Label>
                <Textarea value={handoverNotes[key as keyof typeof handoverNotes]} onChange={e => setHandoverNotes({ ...handoverNotes, [key]: e.target.value })} placeholder={lang === "uz" ? `${uzLabel}...` : `${ruLabel}...`} className="bg-surface border-outline-variant text-on-surface text-base h-20" data-testid={`handover-${key}`} />
              </div>
            ))}
            <div className="space-y-1.5 pt-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-error">{t("Raqamli imzo (majburiy)", "Цифровая подпись (обязательно)")}</Label>
              <Input value={handoverSignature} onChange={e => setHandoverSignature(e.target.value)} placeholder={t("Tabel raqami yoki FIO ni kiriting", "Введите табельный номер или ФИО")} className="bg-surface border-outline-variant text-on-surface h-12 text-lg font-medium" data-testid="input-handover-signature" />
              <p className="text-xs text-on-surface-variant font-medium italic">{t("Imzo akt yaratilishini tasdiqlaydi", "Подпись подтверждает создание акта")}</p>
            </div>
            <Button className="w-full h-16 text-xl font-bold bg-primary text-white rounded-xl  mt-2" onClick={() => submitHandover.mutate()} disabled={submitHandover.isPending || !handoverSignature.trim()} data-testid="button-submit-handover">
              {submitHandover.isPending ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <ArrowRightLeft className="h-6 w-6 mr-2" />}
              {t("Smena topshirish", "Сдать смену")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QC Form Dialog */}
      <Dialog open={showQcFormDialog} onOpenChange={setShowQcFormDialog}>
        <DialogContent className="max-w-sm bg-surface-container-lowest border-outline-variant shadow-xl">
          <DialogHeader><DialogTitle className="text-2xl font-bold text-on-surface">{t("Inline sifat nazorati", "Встроенный контроль качества")}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm font-semibold text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant/30">{t(`Hozirgi miqdor: ${activeSession?.actualQuantity} ta`, `Текущее кол-во: ${activeSession?.actualQuantity} шт`)}</p>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t("Namuna hajmi", "Размер выборки")}</Label>
              <Input type="number" min={1} value={qcSampleSize} onChange={e => setQcSampleSize(e.target.value)} placeholder="10" className="bg-surface border-outline-variant text-on-surface h-12 text-xl font-bold text-center" data-testid="input-qc-sample-size" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t("Brak soni", "Кол-во дефектов")}</Label>
              <Input type="number" min={0} value={qcDefectCount} onChange={e => setQcDefectCount(e.target.value)} placeholder="0" className="bg-surface border-outline-variant text-on-surface h-12 text-xl font-bold text-center text-error" data-testid="input-qc-defect-count" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t("Izoh", "Примечание")}</Label>
              <Textarea value={qcNotes} onChange={e => setQcNotes(e.target.value)} placeholder={t("Izohlang...", "Комментарий...")} rows={3} className="bg-surface border-outline-variant text-on-surface text-base" data-testid="input-qc-notes" />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-14 text-lg font-bold border-outline-variant text-on-surface-variant hover:bg-surface-container-high" onClick={() => setShowQcFormDialog(false)} data-testid="button-qc-cancel">{t("Bekor", "Отмена")}</Button>
            <Button className="flex-1 h-14 text-lg font-bold bg-primary text-white " onClick={() => submitInlineQC.mutate()} disabled={submitInlineQC.isPending} data-testid="button-qc-submit">
              {submitInlineQC.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}{t("Saqlash", "Сохранить")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-dim text-white p-4  sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-white hover:bg-surface-container-lowest/10 rounded-full h-12 w-12" onClick={() => setLang(lang === "uz" ? "ru" : "uz")} data-testid="button-lang-prod"><Languages className="h-6 w-6" /></Button>
            <div>
              <p className="text-xs font-bold opacity-70 tracking-widest uppercase">{activeSession?.sessionNumber}</p>
              <p className="text-xl font-black tracking-tight">{workerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`px-5 py-2 rounded-xl text-lg font-black shadow-inner border border-white/20 flex items-center gap-2 ${effectiveStatus === "running" ? "bg-green-500/20 text-green-300" : "bg-error/20 text-error animate-pulse"}`}>
              <div className={`h-2.5 w-2.5 rounded-full ${effectiveStatus === "running" ? "bg-green-400" : "bg-error animate-pulse"}`} />
              {isSettingUp ? t("SOZLANMOQDA", "НАСТРОЙКА") : effectiveStatus === "running" ? t("ISHLAMOQDA", "РАБОТАЕТ") : t("TO'XTAGAN", "ОСТАНОВЛЕН")}
            </div>
            {shiftInfo && (
              <div className="flex items-center gap-4">
                <div className="text-center bg-surface-container-lowest/10 rounded-xl px-4 py-2 border border-white/10">
                  <p className="text-xs font-bold opacity-70 uppercase tracking-wider">{lang === "ru" ? shiftInfo.nameRu : shiftInfo.name}</p>
                  <p className="text-base font-black">{shiftInfo.startTime} - {shiftInfo.endTime}</p>
                  {shiftRemaining > 0
                    ? <p className="text-xs font-bold text-yellow-300 mt-0.5">{t("Qoldi", "Осталось")}: {formatTime(shiftRemaining)}</p>
                    : <p className="text-xs font-bold text-error animate-pulse mt-0.5">{t("Smena tugadi", "Смена завершена")}</p>
                  }
                </div>
              </div>
            )}
            <div className="text-right bg-black/20 px-5 py-2 rounded-xl border border-white/10"><p className="text-3xl font-mono font-black tracking-tighter">{currentTime}</p></div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Order Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
          <div className="flex items-start justify-between gap-6 relative z-10">
            <div className="flex-1 space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t("Buyurtma va Mahsulot", "Заказ и Продукт")}</p>
              <h1 className="text-5xl font-black text-primary tracking-tighter">{activeSession?.orderNumber || selectedOrder?.orderNumber}</h1>
              <p className="text-2xl font-bold text-on-surface leading-tight">{sessionProductName || t("Mahsulot", "Продукт")}</p>
            </div>
            <div className="text-right space-y-1 bg-surface-container px-6 py-4 rounded-2xl border border-outline-variant/30">
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t("Maqsad", "Цель")}</p>
              <p className="text-5xl font-black text-on-surface tracking-tighter">{(activeSession?.targetQuantity || 0).toLocaleString()}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t("dona", "шт")}</p>
            </div>
          </div>
          <div className="mt-6 p-5 bg-surface rounded-2xl border border-outline-variant/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3"><Barcode className="h-6 w-6 text-on-surface-variant" /><span className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">{t("Shtrix kod", "Штрих-код")}:</span></div>
              <span className="font-mono text-2xl font-black tracking-[0.2em] text-on-surface">{orderBarcode}</span>
            </div>
            <div className="h-14 bg-surface-container-lowest flex items-center justify-center rounded-xl border border-outline-variant/20 shadow-inner">
              <div className="flex gap-[1.5px] items-center">
                {orderBarcode.split("").map((digit, i) => (
                  <div key={`k-${i}`} className={`h-10 ${parseInt(digit) % 2 === 0 ? "w-1.5 bg-on-surface" : "w-0.5 bg-on-surface"}`} />
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-outline-variant/30 grid grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary-container flex items-center justify-center shadow-sm"><User className="h-6 w-6 text-primary" /></div>
              <div><p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{t("Operator", "Оператор")}</p><p className="text-lg font-black text-on-surface">{workerName}</p></div>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{t("Uskuna", "Оборудование")}</p>
              <p className="text-lg font-black text-on-surface">{sessionEquipmentName || t("—", "—")}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{t("Sozlash vaqti", "Время настройки")}</p>
              <p className="text-xl font-black font-mono text-primary">{formatTime(setupTime)}</p>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant shadow-sm text-center space-y-2">
            <Timer className="h-8 w-8 mx-auto text-primary" />
            <p className="text-3xl font-mono font-black tracking-tighter text-on-surface">{formatTime(elapsedTime)}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t("Ish vaqti", "Рабочее время")}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant shadow-sm text-center space-y-2">
            <Target className="h-8 w-8 mx-auto text-green-500" />
            <p className="text-3xl font-black tracking-tighter text-on-surface">{activeSession?.actualQuantity?.toLocaleString() || 0}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">/ {activeSession?.targetQuantity?.toLocaleString()}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant shadow-sm text-center space-y-2">
            <XCircle className="h-8 w-8 mx-auto text-error" />
            <p className="text-3xl font-black tracking-tighter text-error">{activeSession?.defectQuantity?.toLocaleString() || 0}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-error">{t("Brak", "Брак")}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant shadow-sm text-center space-y-2">
            <Clock className="h-8 w-8 mx-auto text-amber-500" />
            <p className="text-3xl font-black tracking-tighter text-on-surface">{formatEstimatedTime(estimatedTimeSeconds)}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t("Qoldi", "Осталось")}</p>
          </div>
        </div>

        {/* QC Reminder Banner */}
        {qcReminderVisible && (
          <div className="rounded-2xl border-l-8 border-amber-500 bg-amber-50 p-6 flex items-center justify-between gap-6  animate-in slide-in-from-left duration-300" data-testid="banner-qc-reminder">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center text-amber-600"><AlertTriangle className="h-8 w-8" /></div>
              <div className="space-y-1">
                <p className="text-xl font-black text-amber-900 tracking-tight">{t("Inline sifat nazorati!", "Встроенный контроль качества!")}</p>
                <p className="text-base font-bold text-amber-700">{t(`${activeSession?.actualQuantity} ta ishlab chiqarildi - NAMUNA OLING`, `Произведено ${activeSession?.actualQuantity} шт - ВОЗЬМИТЕ ОБРАЗЕЦ`)}</p>
              </div>
            </div>
            <Button size="lg" className="h-14 px-8 text-lg font-black bg-amber-500 text-white rounded-xl  hover:bg-amber-600 active:scale-95 transition-all" onClick={() => setShowQcFormDialog(true)} data-testid="button-qc-reminder-open">{t("QC SHAKLI", "QC ФОРМА")}</Button>
          </div>
        )}

        {/* Progress */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant shadow-sm">
          <div className="flex justify-between items-end mb-4">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t("Ish jarayoni", "Прогресс выполнения")}</p>
              <h3 className="text-xl font-black text-on-surface tracking-tight">{t("Bajarilish", "Выполнение")}</h3>
            </div>
            <p className="text-4xl font-black text-primary tracking-tighter">{progressPercent.toFixed(1)}%</p>
          </div>
          <div className="h-6 bg-surface-container rounded-full overflow-hidden border border-outline-variant/30 shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary-dim transition-all duration-500 relative" 
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute inset-0 bg-surface-container-lowest/20 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 pb-10">
          {activeSession?.status === "pending" || isSettingUp ? (
            <Button className="h-24 text-2xl font-black tracking-tight col-span-2 bg-gradient-to-br from-primary to-primary-dim text-white rounded-2xl shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all" onClick={() => startSession.mutate()} disabled={startSession.isPending} data-testid="button-finish-setup">
              {startSession.isPending ? <Loader2 className="h-8 w-8 animate-spin mr-3" /> : <Play className="h-8 w-8 fill-current mr-3" />}
              {t("SOZLASH TUGADI - BOSHLASH", "НАСТРОЙКА ЗАВЕРШЕНА - СТАРТ")}
            </Button>
          ) : (
            <>
              <Dialog open={showDefectDialog} onOpenChange={setShowDefectDialog}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="h-20 text-xl font-black tracking-tight bg-error text-white rounded-2xl shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all" data-testid="button-report-defect"><XCircle className="h-8 w-8 mr-3" />{t("BRAK", "БРАК")}</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md bg-surface-container-lowest border-outline-variant shadow-2xl">
                  <DialogHeader><DialogTitle className="text-2xl font-bold text-on-surface">{t("Brak hisoboti", "Отчет о браке")}</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t("Miqdor (dona)", "Количество (шт.)")}</Label>
                      <Input type="number" inputMode="numeric" value={defectQty} onChange={e => setDefectQty(e.target.value)} placeholder="0" className="text-4xl h-20 text-center font-black text-error bg-surface border-outline-variant rounded-xl" data-testid="input-defect-qty" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t("Brak sababi", "Причина брака")}</Label>
                      <Select value={defectReason} onValueChange={val => { setDefectReason(val); const found = (Array.isArray(defectReasons) ? defectReasons : []).find(r => r.code === val); if (found) setDefectStage(found.stage); }}>
                        <SelectTrigger className="h-14 text-lg bg-surface border-outline-variant rounded-xl" data-testid="select-defect-reason"><SelectValue placeholder={t("Sabab tanlang...", "Выберите причину...")} /></SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {defectReasonsLoading ? <SelectItem value="_loading" disabled>{t("Yuklanmoqda...", "Загрузка...")}</SelectItem>
                            : defectReasons.length === 0 ? <SelectItem value="_empty" disabled>{t("Sabablar yuklanmadi", "Причины не загружены")}</SelectItem>
                              : (defectReasons ?? []).map(r => <SelectItem key={r.code} value={r.code} className="py-3 text-base" data-testid={`defect-reason-${r.code}`}>{r.code}: {lang === "uz" ? r.labelUz : r.labelRu}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t("Bosqich (ishlab chiqarish operatsiyasi)", "Этап производства")}</Label>
                      <Select value={defectStage} onValueChange={setDefectStage}>
                        <SelectTrigger className="h-14 text-lg bg-surface border-outline-variant rounded-xl" data-testid="select-defect-stage"><SelectValue placeholder={t("Bosqich tanlang...", "Выберите этап...")} /></SelectTrigger>
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
                    <Button className="w-full h-16 text-xl font-bold bg-error text-white rounded-xl  mt-2" onClick={() => reportDefect.mutate()} disabled={reportDefect.isPending || !defectQty || parseInt(defectQty) <= 0 || !defectReason} data-testid="button-submit-defect">
                      {reportDefect.isPending ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <XCircle className="h-6 w-6 mr-2" />}
                      {t("Hisobotni yuborish", "Отправить отчет")}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showDowntimeDialog} onOpenChange={setShowDowntimeDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-20 text-xl font-black tracking-tight border-4 border-amber-500 text-amber-600 bg-surface-container-lowest rounded-2xl shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all" data-testid="button-report-downtime"><Clock className="h-8 w-8 mr-3" />{t("TO'XTALISH", "ПРОСТОЙ")}</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md bg-surface-container-lowest border-outline-variant shadow-2xl">
                  <DialogHeader><DialogTitle className="text-2xl font-bold text-on-surface">{t("To'xtalish hisoboti", "Отчет о простое")}</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t("To'xtalish sababi", "Причина простоя")}</Label>
                      <Select value={selectedReasonCode} onValueChange={setSelectedReasonCode}>
                        <SelectTrigger className="h-14 text-lg bg-surface border-outline-variant rounded-xl" data-testid="select-downtime-reason"><SelectValue placeholder={t("Sabab tanlang...", "Выберите причину...")} /></SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {(Array.isArray(reasonCodes) ? reasonCodes : []).map(r => {
                            const Icon = REASON_ICONS[r.code as keyof typeof REASON_ICONS] || AlertTriangle;
                            return (
                              <SelectItem key={r.code} value={r.code} className="py-3 text-base" data-testid={`downtime-reason-${r.code}`}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4 text-amber-500" />
                                  <span>{r.code}: {lang === "uz" ? r.labelUz : r.labelRu}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t("Davomiyligi (daqiqa)", "Длительность (мин.)")}</Label>
                      <Input type="number" inputMode="numeric" value={downtimeMinutes} onChange={e => setDowntimeMinutes(e.target.value)} placeholder="5" className="text-4xl h-20 text-center font-black text-amber-600 bg-surface border-outline-variant rounded-xl" data-testid="input-downtime-minutes" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t("Izoh", "Примечание")}</Label>
                      <Textarea value={downtimeNotes} onChange={e => setDowntimeNotes(e.target.value)} placeholder={t("Batafsil ma'lumot...", "Подробности...")} rows={3} className="bg-surface border-outline-variant text-on-surface text-base" data-testid="input-downtime-notes" />
                    </div>
                    <Button className="w-full h-16 text-xl font-bold bg-amber-500 text-white rounded-xl  mt-2" onClick={() => reportDowntime.mutate()} disabled={reportDowntime.isPending || !selectedReasonCode || !downtimeMinutes} data-testid="button-submit-downtime">
                      {reportDowntime.isPending ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <Clock className="h-6 w-6 mr-2" />}
                      {t("Hisobotni yuborish", "Отправить отчет")}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {/* Bottom Actions Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-outline-variant p-3 flex items-center justify-between z-30 shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
        <div className="flex gap-3">
          <Button variant="outline" className="h-14 px-6 text-lg font-bold border-outline-variant text-on-surface-variant hover:bg-surface-container-high rounded-xl" onClick={() => setEnergySaving(true)} data-testid="button-energy-saving"><Moon className="h-6 w-6 mr-2 text-primary" />{t("Tejash", "Экономия")}</Button>
          <Button variant="outline" className="h-14 px-6 text-lg font-bold border-outline-variant text-error hover:bg-red-50 rounded-xl" onClick={() => setShowSOSDialog(true)} data-testid="button-sos-open"><Phone className="h-6 w-6 mr-2 animate-bounce" />{t("SOS", "SOS")}</Button>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="h-14 px-6 text-lg font-bold border-outline-variant text-on-surface-variant hover:bg-surface-container-high rounded-xl" onClick={() => setShowHandoverDialog(true)} data-testid="button-handover-open"><ArrowRightLeft className="h-6 w-6 mr-2 text-green-600" />{t("Smena topshirish", "Сдать смену")}</Button>
          <Button 
            className="h-14 px-8 text-lg font-black bg-error text-white rounded-xl  hover:bg-red-700 active:scale-95 transition-all" 
            onClick={() => stopSession.mutate()} 
            disabled={stopSession.isPending || !activeSession}
            data-testid="button-stop-session"
          >
            {stopSession.isPending ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <Square className="h-6 w-6 fill-current mr-2" />}
            {t("STOP", "СТОП")}
          </Button>
        </div>
      </div>
    </div>
  );
}
