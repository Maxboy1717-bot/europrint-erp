/**
 * @module IoTProductionDashboardSections
 * @description Layout section components for IoTProductionDashboard (header, cards, metrics, progress).
 */

import { Button } from "@/components/ui/button";
import { Moon, Timer, Target, Clock, Barcode, User, XCircle, AlertTriangle, Activity, Gauge, Wifi, WifiOff } from "lucide-react";
import { IotLang, ProductionSession } from "./iot-types";
import { useTranslation } from "@/lib/i18n";

// ─── helpers ──────────────────────────────────────────────────────────────────
/** Coerce a numeric/text/null OEE-factor column to a finite number, or null. */
function toNum(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Format an OEE-factor percent (0..100) for display, or em-dash when absent. */
function pct(v: number | string | null | undefined): string {
  const n = toNum(v);
  return n === null ? "—" : `${n.toFixed(1)}%`;
}

// ─── Energy Saving Overlay ────────────────────────────────────────────────────
export function EnergySavingOverlay({
  currentTime, onDismiss,
}: {
  currentTime: string;
  onDismiss: () => void;
}) {
  const { t } = useTranslation("iot");
  return (
    <div
      className="fixed inset-0 bg-black/95 z-[9999] flex flex-col items-center justify-center cursor-pointer select-none"
      onClick={onDismiss}
      data-testid="energy-saving-overlay"
    >
      <Moon className="h-16 w-16 text-primary mb-4 opacity-70" />
      <p className="text-white/60 text-xl font-light mb-2">{t("pdEnergyModeTitle")}</p>
      <p className="text-white/40 text-sm">{currentTime}</p>
      <p className="text-white/30 text-xs mt-6">{t("pdTapToActivate")}</p>
    </div>
  );
}

// ─── Dashboard Header ─────────────────────────────────────────────────────────
export function DashboardHeader({
  lang, setLang, workerName, currentTime, activeSession, shiftInfo, shiftRemaining,
  effectiveStatus, isSettingUp, formatTime,
}: {
  lang: IotLang;
  setLang: (l: IotLang) => void;
  workerName: string;
  currentTime: string;
  activeSession: ProductionSession | null;
  shiftInfo: { name: string; nameRu: string; startTime: string; endTime: string } | null;
  shiftRemaining: number;
  effectiveStatus: string | undefined;
  isSettingUp: boolean;
  formatTime: (s: number) => string;
}) {
  const { t } = useTranslation("iot");
  return (
    <div className="bg-primary text-white p-4 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost" size="icon"
            className="text-white hover:bg-card/10 rounded-full h-12 w-12"
            onClick={() => setLang(lang === "uz" ? "ru" : "uz")}
            data-testid="button-lang-prod"
          >
            <span className="text-lg font-bold">{lang === "uz" ? "RU" : "UZ"}</span>
          </Button>
          <div>
            <p className="text-xs font-bold opacity-70 tracking-widest uppercase">{activeSession?.sessionNumber}</p>
            <p className="text-xl font-black tracking-tight">{workerName}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className={`px-5 py-2 rounded-xl text-lg font-black shadow-inner border border-white/20 flex items-center gap-2 ${effectiveStatus === "running" ? "bg-green-500/20 text-green-300" : "bg-[var(--ep-red)]/20 text-[var(--ep-red)] animate-pulse"}`}>
            <div className={`h-2.5 w-2.5 rounded-full ${effectiveStatus === "running" ? "bg-green-400" : "bg-[var(--ep-red)] animate-pulse"}`} />
            {isSettingUp ? t("pdSettingUp") : effectiveStatus === "running" ? t("pdRunning") : t("pdStopped")}
          </div>
          {shiftInfo && (
            <div className="text-center bg-card/10 rounded-xl px-4 py-2 border border-white/10">
              <p className="text-xs font-bold opacity-70 uppercase tracking-wider">{lang === "ru" ? shiftInfo.nameRu : shiftInfo.name}</p>
              <p className="text-base font-black">{shiftInfo.startTime} - {shiftInfo.endTime}</p>
              {shiftRemaining > 0
                ? <p className="text-xs font-bold text-yellow-300 mt-0.5">{t("pdRemainingLabel")}: {formatTime(shiftRemaining)}</p>
                : <p className="text-xs font-bold text-[var(--ep-red)] animate-pulse mt-0.5">{t("pdShiftEnded")}</p>
              }
            </div>
          )}
          <div className="text-right bg-black/20 px-5 py-2 rounded-xl border border-white/10">
            <p className="text-3xl font-mono font-black tracking-tighter">{currentTime}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────
export function OrderCard({
  activeSession, selectedOrder, sessionProductName, sessionEquipmentName,
  orderBarcode, workerName, setupTime, formatTime,
}: {
  activeSession: ProductionSession | null;
  selectedOrder: { orderNumber?: string; productName?: string } | null;
  sessionProductName: string | undefined;
  sessionEquipmentName: string | undefined;
  orderBarcode: string;
  workerName: string;
  setupTime: number;
  formatTime: (s: number) => string;
}) {
  const { t } = useTranslation("iot");
  return (
    <div className="bg-card rounded-xl p-6 border border-border shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
      <div className="flex items-start justify-between gap-6 relative z-10">
        <div className="flex-1 space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("pdOrderProductTitle")}</p>
          <h1 className="ep-h1 text-primary">{activeSession?.orderNumber || selectedOrder?.orderNumber}</h1>
          <p className="text-2xl font-bold text-foreground leading-tight">{sessionProductName || t("pdProductFallback")}</p>
        </div>
        <div className="text-right space-y-1 bg-muted/60 px-6 py-4 rounded-xl border border-border/30">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("pdTargetLabel")}</p>
          <p className="text-5xl font-black text-foreground tracking-tighter">{(activeSession?.targetQuantity || 0).toLocaleString()}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("spUnit")}</p>
        </div>
      </div>
      <div className="mt-6 p-5 bg-background rounded-xl border border-border/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Barcode className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t("pdBarcodeLabel")}:</span>
          </div>
          <span className="font-mono text-2xl font-black tracking-[0.2em] text-foreground">{orderBarcode}</span>
        </div>
        <div className="h-14 bg-card flex items-center justify-center rounded-xl border border-border/20 shadow-inner">
          <div className="flex gap-[1.5px] items-center">
            {orderBarcode.split("").map((digit, i) => (
              <div key={`k-${i}`} className={`h-10 ${parseInt(digit) % 2 === 0 ? "w-1.5 bg-on-surface" : "w-0.5 bg-on-surface"}`} />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-6 pt-6 border-t border-border/30 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shadow-sm">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("pdOperatorLabel")}</p>
            <p className="text-lg font-black text-foreground">{workerName}</p>
          </div>
        </div>
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("pdEquipmentLabel")}</p>
          <p className="text-lg font-black text-foreground">{sessionEquipmentName || "—"}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("pdSetupTimeLabel")}</p>
          <p className="text-xl font-black font-mono text-primary">{formatTime(setupTime)}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Metrics Cards ────────────────────────────────────────────────────────────
export function MetricsCards({
  elapsedTime, activeSession, estimatedTimeSeconds, formatTime, formatEstimatedTime,
}: {
  elapsedTime: number;
  activeSession: ProductionSession | null;
  estimatedTimeSeconds: number;
  formatTime: (s: number) => string;
  formatEstimatedTime: (s: number) => string;
}) {
  const { t } = useTranslation("iot");
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-card rounded-xl p-5 border border-border shadow-sm text-center space-y-2">
        <Timer className="h-8 w-8 mx-auto text-primary" />
        <p className="text-3xl font-mono font-black tracking-tighter text-foreground">{formatTime(elapsedTime)}</p>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("pdWorkTimeLabel")}</p>
      </div>
      <div className="bg-card rounded-xl p-5 border border-border shadow-sm text-center space-y-2">
        <Target className="h-8 w-8 mx-auto text-[var(--ep-green)]" />
        <p className="text-3xl font-black tracking-tighter text-foreground">{activeSession?.actualQuantity?.toLocaleString() || 0}</p>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">/ {activeSession?.targetQuantity?.toLocaleString()}</p>
      </div>
      <div className="bg-card rounded-xl p-5 border border-border shadow-sm text-center space-y-2">
        <XCircle className="h-8 w-8 mx-auto text-[var(--ep-red)]" />
        <p className="text-3xl font-black tracking-tighter text-[var(--ep-red)]">{activeSession?.defectQuantity?.toLocaleString() || 0}</p>
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--ep-red)]">{t("crDefect")}</p>
      </div>
      <div className="bg-card rounded-xl p-5 border border-border shadow-sm text-center space-y-2">
        <Clock className="h-8 w-8 mx-auto text-[var(--ep-yellow)]" />
        <p className="text-3xl font-black tracking-tighter text-foreground">{formatEstimatedTime(estimatedTimeSeconds)}</p>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("pdRemainingLabel")}</p>
      </div>
    </div>
  );
}

// ─── Progress Section ─────────────────────────────────────────────────────────
export function ProgressSection({
  progressPercent,
}: {
  progressPercent: number;
  activeSession: ProductionSession | null;
}) {
  const { t } = useTranslation("iot");
  return (
    <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
      <div className="flex justify-between items-end mb-4">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("pdProgressLabel")}</p>
          <h3 className="text-xl font-black text-foreground tracking-tight">{t("pdCompletionLabel")}</h3>
        </div>
        <p className="text-4xl font-black text-primary tracking-tighter">{progressPercent.toFixed(1)}%</p>
      </div>
      <div className="h-6 bg-muted/60 rounded-full overflow-hidden border border-border/30 shadow-inner">
        <div
          className="h-full bg-primary transition-all duration-500 relative"
          style={{ width: `${progressPercent}%` }}
        >
          <div className="absolute inset-0 bg-card/20 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// ─── QC Reminder Banner ───────────────────────────────────────────────────────
export function QcReminderBanner({
  activeSession, onOpen,
}: {
  activeSession: ProductionSession | null;
  onOpen: () => void;
}) {
  const { t } = useTranslation("iot");
  return (
    <div
      className="rounded-xl border-l-8 border-amber-500 bg-amber-50 p-6 flex items-center justify-between gap-6 animate-in slide-in-from-left duration-300"
      data-testid="banner-qc-reminder"
    >
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center text-[var(--ep-yellow)]">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <p className="text-xl font-black text-amber-900 tracking-tight">{t("pdQcReminderTitle")}</p>
          <p className="text-base font-bold text-[var(--ep-yellow)]">
            {t("pdQcReminderBody", { qty: activeSession?.actualQuantity ?? 0 })}
          </p>
        </div>
      </div>
      <Button
        size="lg"
        className="h-14 px-8 text-lg font-black bg-[var(--ep-yellow)] text-white rounded-xl hover:bg-[var(--ep-yellow)]/90 active:scale-95 transition-all"
        onClick={onOpen}
        data-testid="button-qc-reminder-open"
      >
        {t("pdQcFormButton")}
      </Button>
    </div>
  );
}

// ─── Machine Status / Sensor Panel ─────────────────────────────────────────────
/**
 * Operator-facing live machine status + sensor panel (A82).
 *
 * Surfaces REAL signal data already carried by the active production session:
 *   - live signal status (running / stopped, derived from last_signal_at)
 *   - OEE factor breakdown (availability / performance / quality) + composite OEE
 *   - last-signal timestamp ("seconds since")
 *
 * Per-channel sensor telemetry (temperature / speed / vibration ...) is NOT
 * fabricated: the device-feed tables (iot_sensors / sensor_readings) carry no
 * data for the tablet token, so an honest empty-state is shown instead of fake
 * numbers (Q-40). When a feed is wired, the empty-state is replaced by readings.
 */
export function MachineStatusPanel({
  activeSession, sessionEquipmentName, effectiveStatus, isAutoStopped, secondsSinceLastSignal,
}: {
  activeSession: ProductionSession | null;
  sessionEquipmentName: string | undefined;
  effectiveStatus: string | undefined;
  isAutoStopped: boolean;
  secondsSinceLastSignal: number | null;
}) {
  const { t } = useTranslation("iot");
  const online = !isAutoStopped && effectiveStatus === "running";
  const hasSignal = secondsSinceLastSignal !== null;

  const factors = [
    { key: "avail", icon: Wifi, label: t("pdFactorAvail"), value: activeSession?.availability, color: "var(--ep-green)" },
    { key: "perf", icon: Gauge, label: t("pdFactorPerf"), value: activeSession?.performance, color: "var(--mod-primary, var(--ep-blue))" },
    { key: "qual", icon: Target, label: t("crQuality"), value: activeSession?.quality, color: "var(--ep-yellow)" },
    { key: "oee", icon: Activity, label: "OEE", value: activeSession?.oee, color: "var(--ep-purple, var(--mod-primary))" },
  ] as const;

  const anyFactor = factors.some(f => toNum(f.value) !== null);

  return (
    <div className="bg-card rounded-xl p-6 border border-border shadow-sm" data-testid="iot-machine-status-panel">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-primary" />
          <div className="space-y-0.5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("pdMachineStatusLabel")}</p>
            <h3 className="text-xl font-black text-foreground tracking-tight">{sessionEquipmentName || t("pdEquipmentLabel")}</h3>
          </div>
        </div>
        <div
          className={`px-4 py-2 rounded-xl text-base font-black flex items-center gap-2 border ${online ? "bg-green-500/15 text-green-600 border-green-500/30" : "bg-[var(--ep-red)]/15 text-[var(--ep-red)] border-[var(--ep-red)]/30"}`}
          data-testid="iot-machine-signal-status"
        >
          {online ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
          {online ? t("pdOnline") : t("pdNoSignal")}
        </div>
      </div>

      {/* OEE factor breakdown — real columns; em-dash when a factor is not yet computed */}
      {anyFactor ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="iot-machine-factors">
          {factors.map(f => (
            <div key={f.key} className="bg-background rounded-xl p-4 border border-border/40 text-center space-y-1.5" data-testid={`iot-factor-${f.key}`}>
              <f.icon className="h-6 w-6 mx-auto" style={{ color: f.color }} />
              <p className="text-2xl font-black tracking-tighter text-foreground">{pct(f.value)}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{f.label}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 px-5 py-6 text-center" data-testid="iot-machine-factors-empty">
          <Gauge className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2" />
          <p className="text-sm font-bold text-muted-foreground">{t("pdSensorsNotConnected")}</p>
          <p className="text-xs text-muted-foreground/70 mt-1">{t("pdOeeAfterSession")}</p>
        </div>
      )}

      {/* Last-signal line */}
      <div className="mt-4 flex items-center justify-between text-sm border-t border-border/30 pt-4">
        <span className="font-bold uppercase tracking-wider text-muted-foreground">{t("pdLastSignalLabel")}</span>
        <span className={`font-black font-mono ${online ? "text-green-600" : "text-muted-foreground"}`} data-testid="iot-machine-last-signal">
          {hasSignal
            ? t("pdSecondsAgo", { sec: secondsSinceLastSignal ?? 0 })
            : t("noData")}
        </span>
      </div>
    </div>
  );
}
