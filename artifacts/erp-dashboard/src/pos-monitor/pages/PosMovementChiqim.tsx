/**
 * @module PosMovementChiqim
 * @description Scanner-only outbound (CHIQIM) terminal page — egasi spec 2026-06-27.
 *
 * Oqim (FAQAT SKANER, qo'lda material-tanlash YO'Q):
 *   skaner/Enter → GET /api/pos/stock/issuable/:barcode → material + jami qoldiq + bron →
 *   bo'sh qoldiq ko'rsatiladi. Bron > 0 → QIZIL ogohlantirish 'bron qilingan, faqat bo'sh
 *   qoldiq'; super_admin/direktor "Bronni buzish" tugmasi bilan override qiladi.
 *   Keyin: miqdor (ekran-klaviatura/tarozi) → sabab/buyurtma → katta qizil TASDIQ.
 *
 * Q-43 real saqlash: TASDIQ → movementsApi.create (movementTypeCode=EXTERNAL_OUT,
 * fromWarehouseId, lines[], notes=sabab) → mavjud chiqim BE oqimi (buzilmaydi, Q-46).
 */

import { useState, useCallback, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { stockApi, movementsApi, type IssuableResult } from "../api/pos-monitor.api";
import { useHardwareScanner } from "../hooks/useHardwareScanner";
import PosBarcodeScanner from "../components/PosBarcodeScanner";

import {
  type ScannedLine, type Toast,
  CHIQIM_REASONS, CHIQIM_TYPE_META, resolveChiqimType,
  mkKey, playBeep, exceedsAllowed,
} from "./PosMovementChiqimTypes";
import {
  ToastContainer, ScanNotFoundModal, NumericKeypad,
  initialReason, type ReasonState,
} from "./PosMovementChiqimHelpers";
import { WarehouseBar, ScanZone } from "./PosMovementChiqimLeft";
import { LinesPanel, SuccessScreen } from "./PosMovementChiqimRight";
import { useTranslation } from '@/lib/i18n';

export default function PosMovementChiqim() {
  const { t } = useTranslation("common");
  const [, navigate] = useLocation();

  // PosHome tugmalari ?type= bilan keladi (KOCHIRISH=INTERNAL_TRANSFER, QAYTARISH=
  // INTERNAL_RETURN, ZARAR=DAMAGE); ruxsat-ro'yxatdan tashqari qiymat → EXTERNAL_OUT.
  const search = useSearch();
  const movementType = resolveChiqimType(new URLSearchParams(search).get("type"));
  const typeMeta = CHIQIM_TYPE_META[movementType];

  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [lines, setLines] = useState<ScannedLine[]>([]);
  const [reason, setReason] = useState<ReasonState>(initialReason());

  // Skan + UI holati
  const [scanValue, setScanValue] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [scanFlash, setScanFlash] = useState<"success" | "error" | null>(null);
  const [notFound, setNotFound] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [submitted, setSubmitted] = useState<{ id: number; documentNumber?: string } | null>(null);

  // Ekran-klaviatura (qty) target qator
  const [keypadKey, setKeypadKey] = useState<string | null>(null);
  const [keypadDraft, setKeypadDraft] = useState("");

  const scanningRef = useRef(false);

  // ── Toast ────────────────────────────────────────────────────────────────
  const addToast = useCallback((message: string, type: Toast["type"]) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 4000);
  }, []);
  const dismissToast = useCallback((id: string) => setToasts(prev => prev.filter(x => x.id !== id)), []);

  const flash = useCallback((kind: "success" | "error") => {
    playBeep(kind === "success");
    setScanFlash(kind);
    setTimeout(() => setScanFlash(null), 600);
  }, []);

  // ── Scan handler — issuable (material + qoldiq + bron) ─────────────────────
  const handleScan = useCallback(async (barcode: string) => {
    const code = barcode.trim();
    if (!code) return;
    if (!fromWarehouseId.trim()) { addToast(t("avvalManbaOmboriniTanlang", "Avval manba omborini tanlang"), "error"); return; }
    if (scanningRef.current) return;

    scanningRef.current = true;
    setScanning(true);
    setScanValue("");
    try {
      const res: IssuableResult = await stockApi.getIssuable(code, fromWarehouseId);

      if (!res || !res.found || !res.materialCardId) {
        flash("error");
        setNotFound(code);
        return;
      }

      const matId = res.materialCardId;
      const existing = lines.find(l => l.materialCardId === matId);
      if (existing) {
        // Bir xil material qayta skanlandi → miqdorni 1 oshir (cheklov ichida)
        setLines(prev => prev.map(l => {
          if (l.materialCardId !== matId) return l;
          const cap = l.overridden ? l.onHand : l.freeStock;
          const next = Math.min(l.quantity + 1, cap > 0 ? cap : l.quantity + 1);
          return { ...l, quantity: next };
        }));
        flash("success");
        addToast(t("materialMiqdoriOshirildi", { material: existing.materialName }), "success");
        return;
      }

      const newLine: ScannedLine = {
        _key: mkKey(),
        barcode: code,
        materialCardId: matId,
        materialName: res.materialName ?? t("nomalumMaterial", "Noma'lum material"),
        materialCode: res.materialCode ?? "",
        unit: res.unit ?? "dona",
        warehouseId: res.warehouseId,
        warehouseCode: res.warehouseCode,
        onHand: res.onHand,
        reserved: res.reserved,
        freeStock: res.freeStock,
        blocked: res.blocked,
        canOverride: res.canOverride,
        overridden: false,
        reservations: res.reservations,
        quantity: res.freeStock > 0 ? 1 : 0,
      };
      setLines(prev => [...prev, newLine]);
      flash("success");
      if (res.blocked) {
        addToast(`${newLine.materialName} — ${t("bronOgohlantirish", "bron qilingan, faqat bo'sh qoldiq")}`, "warning");
      } else {
        addToast(t("materialQoshildi", { material: newLine.materialName }), "success");
      }
    } catch {
      flash("error");
      setNotFound(code);
    } finally {
      scanningRef.current = false;
      setScanning(false);
    }
  }, [fromWarehouseId, lines, addToast, flash, t]);

  // USB/Bluetooth skaner (wedge+HID+Serial) — avval useBarcode ikki marta lookup qilardi
  // (o'zining barcodeApi.scan() + shu yerdagi stockApi.getIssuable(), natija tashlanardi).
  // useHardwareScanner sof input-detektor — bitta lookup, kamroq kechikish (Q-46: handleScan
  // biznes-mantig'i o'zgarmadi, faqat wedge-input mexanizmi almashtirildi).
  useHardwareScanner({ onScan: (e) => { void handleScan(e.barcode); } });

  // ── Line ops ───────────────────────────────────────────────────────────────
  function openKeypad(key: string) {
    const line = lines.find(l => l._key === key);
    setKeypadKey(key);
    setKeypadDraft(line ? String(line.quantity) : "");
  }
  function commitKeypad() {
    if (!keypadKey) return;
    const n = parseFloat(keypadDraft || "0");
    if (!isNaN(n) && n >= 0) {
      setLines(prev => prev.map(l => l._key === keypadKey ? { ...l, quantity: n } : l));
    }
    setKeypadKey(null); setKeypadDraft("");
  }
  function overrideLine(key: string) {
    setLines(prev => prev.map(l => l._key === key ? { ...l, overridden: true } : l));
    addToast(t("bronBuzildiToast", "Bron buzildi — favqulodda ruxsat berildi"), "warning");
  }
  function removeLine(key: string) { setLines(prev => prev.filter(l => l._key !== key)); }

  // ── Validation ─────────────────────────────────────────────────────────────
  function validate(): string | null {
    if (lines.length === 0) return t("kamidaBittaMahsulotSkanerlangan", "Kamida bitta mahsulot skanerlang");
    if (!fromWarehouseId.trim()) return t("manbaOmboriniTanlang", "Manba omborini tanlang");
    const zero = lines.find(l => l.quantity <= 0);
    if (zero) return `${zero.materialName}: ${t("miqdorNolBolmasin", "miqdor 0 dan katta bo'lsin")}`;
    const over = lines.find(l => exceedsAllowed(l));
    if (over) {
      return over.blocked && !over.overridden
        ? `${over.materialName}: ${t("bronBlokTasdiqlanmaydi", "bron qilingan, faqat bo'sh qoldiq chiqariladi")}`
        : `${over.materialName}: ${t("miqdorQoldiqdanKopXato", "miqdor mavjud qoldiqdan ko'p")}`;
    }
    if (reason.reasonCode === "ORDER" && !reason.orderRef.trim()) return t("buyurtmaRaqamiMajburiy", "Buyurtma raqami majburiy");
    if (reason.reasonCode === "OTHER" && !reason.note.trim()) return t("sababIzohMajburiy", "Sabab izohi majburiy");
    return null;
  }

  function buildNotes(): string {
    const r = CHIQIM_REASONS.find(x => x.code === reason.reasonCode);
    const parts = [r?.label ?? reason.reasonCode];
    if (reason.reasonCode === "ORDER" && reason.orderRef.trim()) parts.push(`#${reason.orderRef.trim()}`);
    if (reason.note.trim()) parts.push(reason.note.trim());
    if (lines.some(l => l.overridden)) parts.push(t("bronOverrideIzoh", "[bron buzildi — favqulodda]"));
    return parts.join(" — ");
  }

  // ── Submit (Q-43 real saqlash → mavjud BE chiqim oqimi) ───────────────────
  const handleSubmit = useCallback(async () => {
    const err = validate();
    if (err) { setGlobalError(err); return; }
    setGlobalError(""); setSubmitting(true);

    const payload: Record<string, unknown> = {
      movementTypeCode: movementType,
      fromWarehouseId,
      notes: buildNotes(),
      // BE (pos-movement.service): INTERNAL_RETURN uchun returnReason MAJBURIY —
      // sabab-katalog matni (buildNotes) qaytarish sababi sifatida yoziladi.
      ...(movementType === "INTERNAL_RETURN" ? { returnReason: buildNotes() } : {}),
      lines: lines.map(l => ({ materialCardId: l.materialCardId, quantity: l.quantity })),
      submit: true,
      // Savdo-sity referens H-8 naqshi: double-tap "Tasdiqlash" bir xil chiqimni ikki marta yaratmasin.
      idempotencyKey: crypto.randomUUID(),
    };

    try {
      const result = await movementsApi.create(payload) as { id: number; documentNumber?: string };
      setSubmitted(result ?? { id: 0 });
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : t("xatolikYuzBerdi", "Xatolik yuz berdi"));
    } finally {
      setSubmitting(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromWarehouseId, lines, reason, movementType]);

  function resetForm() {
    setLines([]); setSubmitted(null); setReason(initialReason()); setScanValue("");
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <SuccessScreen
        documentNumber={submitted.documentNumber}
        successTitle={t(typeMeta.successKey, typeMeta.successFallback)}
        typeBadge={t(typeMeta.badgeKey, typeMeta.badgeFallback)}
        onNewChiqim={resetForm}
        onGoToList={() => navigate("/pos-monitor/movements")}
      />
    );
  }

  const keypadLine = keypadKey ? lines.find(l => l._key === keypadKey) : null;
  const keypadMax = keypadLine ? (keypadLine.overridden ? keypadLine.onHand : keypadLine.freeStock) : 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="pos-fade-in">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      {notFound && <ScanNotFoundModal barcode={notFound} onClose={() => setNotFound(null)} />}
      {keypadLine && (
        <NumericKeypad
          value={keypadDraft}
          unit={keypadLine.unit}
          maxAllowed={keypadMax}
          onChange={setKeypadDraft}
          onConfirm={commitKeypad}
          onClose={() => { setKeypadKey(null); setKeypadDraft(""); }}
        />
      )}
      {showCamera && (
        <PosBarcodeScanner
          onResult={async r => { setShowCamera(false); if (r.barcode) await handleScan(r.barcode); }}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button className="pos-btn pos-btn-ghost" style={{ padding: "6px 12px" }} onClick={() => navigate("/pos-monitor/movements")}>
          {t("orqaga", "Orqaga")}
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{t(typeMeta.titleKey, typeMeta.titleFallback)}</h2>
          <div style={{ fontSize: 12, color: "var(--pos-text-muted)", marginTop: 2 }}>
            {t("faqatSkanerChiqim", "Chiqim faqat skaner orqali — qo'lda material tanlash yo'q")}
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <span className="pos-badge pos-badge-red" style={{ fontSize: 11 }}>{t(typeMeta.badgeKey, typeMeta.badgeFallback)}</span>
          {scanning && <span className="pos-badge pos-badge-blue pos-live" style={{ fontSize: 11 }}>{t("skanerlanyapti", "Skanerlanyapti")}</span>}
        </div>
      </div>

      {/* Error banner */}
      {globalError && (
        <div className="pos-offline-banner" style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.3)", color: "var(--pos-action-chiqim-dark)", marginBottom: 16 }}>
          ⚠️ {globalError}
          <button className="pos-btn pos-btn-ghost" style={{ marginLeft: "auto", padding: "2px 8px", fontSize: 11 }} onClick={() => setGlobalError("")}>✕</button>
        </div>
      )}

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "55fr 45fr", gap: 16, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <WarehouseBar fromWarehouseId={fromWarehouseId} onFromWarehouseChange={setFromWarehouseId} />
          <ScanZone
            fromWarehouseId={fromWarehouseId}
            scanValue={scanValue}
            onScanValueChange={setScanValue}
            onScanSubmit={handleScan}
            scanFlash={scanFlash}
            scanning={scanning}
            onCameraOpen={() => setShowCamera(true)}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <LinesPanel
            lines={lines}
            reason={reason}
            onReasonChange={setReason}
            reasons={CHIQIM_REASONS}
            onOpenQty={openKeypad}
            onOverride={overrideLine}
            onRemove={removeLine}
            submitting={submitting}
            confirmLabel={t(typeMeta.confirmKey, typeMeta.confirmFallback)}
            onSubmit={() => void handleSubmit()}
          />
        </div>
      </div>

      <style>{`
        @keyframes chiqim-scan-beam {
          0%   { top: 20%; opacity: 0.9; }
          50%  { top: 75%; opacity: 1;   }
          100% { top: 20%; opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}
