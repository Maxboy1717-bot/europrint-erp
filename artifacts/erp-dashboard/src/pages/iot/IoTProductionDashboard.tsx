/**
 * @module IoTProductionDashboard
 * @description React page component. Route-level UI.
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Phone, ArrowRightLeft } from "lucide-react";
import { IoTProductionDashboardProps } from "./IoTProductionDashboardTypes";
import {
  EnergySavingOverlay,
  DashboardHeader,
  OrderCard,
  MetricsCards,
  MachineStatusPanel,
  ProgressSection,
  QcReminderBanner,
} from "./IoTProductionDashboardSections";
import { ActionButtons, BottomActionsBar } from "./IoTProductionDashboardDialogs";

import { EPLoader } from "@/components/ep";
export function IoTProductionDashboard(props: IoTProductionDashboardProps) {
  const {
    lang, setLang, workerName, currentTime, activeSession, shiftInfo, shiftRemaining,
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
    <div className="min-h-screen bg-background font-inter" data-testid="iot-tablet-production">
      {energySaving && (
        <EnergySavingOverlay currentTime={currentTime} lang={lang} onDismiss={() => setEnergySaving(false)} />
      )}

      {/* SOS Dialog */}
      <Dialog open={showSOSDialog} onOpenChange={setShowSOSDialog}>
        <DialogContent className="max-w-sm bg-card border-border shadow-xl p-6">
          <DialogHeader><DialogTitle className="text-[var(--ep-red)] flex items-center gap-2"><Phone className="h-5 w-5" />{t("SOS — Shoshilinch xabar", "SOS — Срочное сообщение")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                  className={sosType === opt.value ? "bg-[var(--ep-red)] text-white border-none" : "border-border text-muted-foreground"}
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
              className="bg-background border-border text-foreground"
            />
            <Button variant="destructive" className="w-full h-14 text-lg font-bold bg-[var(--ep-red)] text-white rounded-xl gap-2" onClick={handleSOSSend} data-testid="button-sos-send">
              <Phone className="h-6 w-6" />{t("Sex boshlig'iga yuborish", "Отправить начальнику цеха")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Handover Dialog */}
      <Dialog open={showHandoverDialog} onOpenChange={setShowHandoverDialog}>
        <DialogContent className="max-w-md bg-card border-border shadow-xl p-6">
          <DialogHeader><DialogTitle className="text-2xl font-bold text-foreground">{t("Smena topshirish akti", "Акт сдачи смены")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {([
              { key: "machineStatus", uzLabel: "Uskuna holati", ruLabel: "Состояние оборудования" },
              { key: "pendingTasks", uzLabel: "Bajarilmagan vazifalar", ruLabel: "Невыполненные задачи" },
              { key: "qualityIssues", uzLabel: "Sifat muammolari", ruLabel: "Проблемы with качеством" },
              { key: "safetyNotes", uzLabel: "Xavfsizlik eslatmalari", ruLabel: "Примечания по безопасности" },
              { key: "materialStatus", uzLabel: "Material holati", ruLabel: "Статус материалов" },
            ]).map(({ key, uzLabel, ruLabel }) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{lang === "uz" ? uzLabel : ruLabel}</Label>
                <Textarea value={handoverNotes[key as keyof typeof handoverNotes]} onChange={e => setHandoverNotes({ ...handoverNotes, [key]: e.target.value })} placeholder={lang === "uz" ? `${uzLabel}...` : `${ruLabel}...`} className="bg-background border-border text-foreground text-base h-20" data-testid={`handover-${key}`} />
              </div>
            ))}
            <div className="space-y-1.5 pt-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-[var(--ep-red)]">{t("Raqamli imzo (majburiy)", "Цифровая подпись (обязательно)")}</Label>
              <Input value={handoverSignature} onChange={e => setHandoverSignature(e.target.value)} placeholder={t("Tabel raqami yoki FIO ni kiriting", "Введите табельный номер или ФИО")} className="bg-background border-border text-foreground h-12 text-lg font-medium" data-testid="input-handover-signature" />
              <p className="text-xs text-muted-foreground font-medium italic">{t("Imzo akt yaratilishini tasdiqlaydi", "Подпись подтверждает создание акта")}</p>
            </div>
            <Button className="w-full h-16 text-xl font-bold bg-primary text-white rounded-xl mt-2" onClick={() => submitHandover.mutate()} disabled={submitHandover.isPending || !handoverSignature.trim()} data-testid="button-submit-handover">
              {submitHandover.isPending ? <EPLoader size={24} className="mr-2" /> : <ArrowRightLeft className="h-6 w-6 mr-2" />}
              {t("Smena topshirish", "Сдать смену")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QC Form Dialog */}
      <Dialog open={showQcFormDialog} onOpenChange={setShowQcFormDialog}>
        <DialogContent className="max-w-sm bg-card border-border shadow-xl p-6">
          <DialogHeader><DialogTitle className="text-2xl font-bold text-foreground">{t("Inline sifat nazorati", "Встроенный контроль качества")}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm font-semibold text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-lg border border-border/30">{t(`Hozirgi miqdor: ${activeSession?.actualQuantity} ta`, `Текущее кол-во: ${activeSession?.actualQuantity} шт`)}</p>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("Namuna hajmi", "Размер выборки")}</Label>
              <Input type="number" min={1} value={qcSampleSize} onChange={e => setQcSampleSize(e.target.value)} placeholder="10" className="bg-background border-border text-foreground h-12 text-xl font-bold text-center" data-testid="input-qc-sample-size" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("Brak soni", "Кол-во дефектов")}</Label>
              <Input type="number" min={0} value={qcDefectCount} onChange={e => setQcDefectCount(e.target.value)} placeholder="0" className="bg-background border-border text-foreground h-12 text-xl font-bold text-center text-[var(--ep-red)]" data-testid="input-qc-defect-count" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("Izoh", "Примечание")}</Label>
              <Textarea value={qcNotes} onChange={e => setQcNotes(e.target.value)} placeholder={t("Izohlang...", "Комментарий...")} rows={3} className="bg-background border-border text-foreground text-base" data-testid="input-qc-notes" />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-14 text-lg font-bold border-border text-muted-foreground hover:bg-muted" onClick={() => setShowQcFormDialog(false)} data-testid="button-qc-cancel">{t("Bekor", "Отмена")}</Button>
            <Button className="flex-1 h-14 text-lg font-bold bg-primary text-white" onClick={() => submitInlineQC.mutate()} disabled={submitInlineQC.isPending} data-testid="button-qc-submit">
              {submitInlineQC.isPending ? <EPLoader size={20} className="mr-2" /> : null}{t("Saqlash", "Сохранить")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DashboardHeader
        lang={lang} setLang={setLang} workerName={workerName} currentTime={currentTime}
        activeSession={activeSession} shiftInfo={shiftInfo} shiftRemaining={shiftRemaining}
        effectiveStatus={effectiveStatus} isSettingUp={isSettingUp} formatTime={formatTime}
      />

      <div className="p-4 space-y-4">
        <OrderCard
          lang={lang} activeSession={activeSession} selectedOrder={selectedOrder}
          sessionProductName={sessionProductName} sessionEquipmentName={sessionEquipmentName}
          orderBarcode={orderBarcode} workerName={workerName} setupTime={setupTime} formatTime={formatTime}
        />
        <MetricsCards
          lang={lang} elapsedTime={elapsedTime} activeSession={activeSession}
          estimatedTimeSeconds={estimatedTimeSeconds} formatTime={formatTime} formatEstimatedTime={formatEstimatedTime}
        />
        <MachineStatusPanel
          lang={lang} activeSession={activeSession} sessionEquipmentName={sessionEquipmentName}
          effectiveStatus={effectiveStatus} isAutoStopped={isAutoStopped} secondsSinceLastSignal={secondsSinceLastSignal}
        />
        {qcReminderVisible && (
          <QcReminderBanner lang={lang} activeSession={activeSession} onOpen={() => setShowQcFormDialog(true)} />
        )}
        <ProgressSection lang={lang} progressPercent={progressPercent} activeSession={activeSession} />
        <ActionButtons
          lang={lang} activeSession={activeSession} isSettingUp={isSettingUp} startSession={startSession}
          showDefectDialog={showDefectDialog} setShowDefectDialog={setShowDefectDialog}
          showDowntimeDialog={showDowntimeDialog} setShowDowntimeDialog={setShowDowntimeDialog}
          defectQty={defectQty} setDefectQty={setDefectQty}
          defectReason={defectReason} setDefectReason={setDefectReason}
          defectStage={defectStage} setDefectStage={setDefectStage}
          defectReasons={defectReasons} defectReasonsLoading={defectReasonsLoading} reportDefect={reportDefect}
          selectedReasonCode={selectedReasonCode} setSelectedReasonCode={setSelectedReasonCode}
          downtimeMinutes={downtimeMinutes} setDowntimeMinutes={setDowntimeMinutes}
          downtimeNotes={downtimeNotes} setDowntimeNotes={setDowntimeNotes}
          reasonCodes={reasonCodes} reportDowntime={reportDowntime}
        />
      </div>

      <BottomActionsBar
        lang={lang} activeSession={activeSession} stopSession={stopSession}
        setEnergySaving={setEnergySaving} setShowSOSDialog={setShowSOSDialog}
        setShowHandoverDialog={setShowHandoverDialog}
      />
    </div>
  );
}
