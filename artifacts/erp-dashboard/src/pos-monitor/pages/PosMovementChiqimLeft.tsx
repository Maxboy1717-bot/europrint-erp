/**
 * @module PosMovementChiqimLeft
 * @description Left-panel sections for scanner-only CHIQIM (spec 2026-06-27):
 * WarehouseBar (manba ombor — ko'p ombor bo'lsa almashtirish) + DestinationWarehouseBar
 * (faqat INTERNAL_TRANSFER uchun — manzil ombor) + ScanZone (asosiy skaner maydoni,
 * qizil-chiqim mavzusi). Qo'lda material-tanlash YO'Q — faqat skan.
 *
 * Audit 2026-08-08: "KO'CHIRISH" (INTERNAL_TRANSFER) tugmasi PosHome.tsx'da "Ombor → ombor"
 * deb va'da beradi, lekin bu ekranda manzil-ombor maydoni UMUMAN YO'Q edi — material manba
 * ombordan kamayadi, qayerga borishi ekranda ko'rsatilmasdi (docs/audit/POS-KIRIM-CHIQIM-
 * VA-MES-JADVAL-TAHLILI-2026-08-08.md §A.3). DestinationWarehouseBar shu bo'shliqni yopadi —
 * PosMovementKirimSteps.tsx Step1Header'dagi bir xil <select>+warehousesApi.getAll() naqshi
 * (xavfsizroq — erkin-matn ID emas, haqiqiy ombor ro'yxatidan tanlanadi).
 */

import { useRef, useEffect, useState } from "react";
import { useTranslation } from '@/lib/i18n';
import { warehousesApi } from "../api/pos-monitor.api";

interface WarehouseOption {
  id: string;
  code?: string | null;
  name?: string | null;
  type?: string | null;
}

// ─── Warehouse bar ────────────────────────────────────────────────────────────
// Spec: kirgach is_primary ombor avto-ochiladi; bir necha ombor bo'lsa almashtirish.
// Bu yerda omborni kiritish/almashtirish; skan shu ombor qoldig'iga ishlaydi.

interface WarehouseBarProps {
  fromWarehouseId: string;
  onFromWarehouseChange: (v: string) => void;
}

export function WarehouseBar({ fromWarehouseId, onFromWarehouseChange }: WarehouseBarProps) {
  const { t } = useTranslation("common");
  return (
    <div className="pos-card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <span style={{ fontSize: 22 }}>🏭</span>
      <div style={{ flex: 1, minWidth: 180 }}>
        <label style={{ fontSize: 11, color: "var(--pos-text-muted)", fontWeight: 600, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.3 }}>
          {t("manbaOmbori", "Manba ombori")}
        </label>
        <input
          className="pos-input"
          value={fromWarehouseId}
          onChange={e => onFromWarehouseChange(e.target.value)}
          placeholder={t("omborIdYokiKodi", "Ombor ID yoki kodi")}
        />
      </div>
      {fromWarehouseId && (
        <span className="pos-badge pos-badge-green" style={{ fontSize: 11 }}>
          {t("omborTanlandi", "Ombor tanlandi")}
        </span>
      )}
    </div>
  );
}

// ─── Destination warehouse bar (FAQAT INTERNAL_TRANSFER uchun) ────────────────
// Manzil ombor — haqiqiy ombor ro'yxatidan (`warehousesApi.getAll()`), erkin-matn emas.
// Manba omborni takrorlash oldini olish uchun tanlangan `fromWarehouseId` chiqarib tashlanadi.

interface DestinationWarehouseBarProps {
  fromWarehouseId: string;
  toWarehouseId: string;
  onToWarehouseChange: (v: string) => void;
  error?: string;
}

export function DestinationWarehouseBar({
  fromWarehouseId, toWarehouseId, onToWarehouseChange, error,
}: DestinationWarehouseBarProps) {
  const { t } = useTranslation("common");
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const raw = await warehousesApi.getAll();
        const list = (Array.isArray(raw) ? raw : []) as WarehouseOption[];
        if (!cancelled) setWarehouses(list);
      } catch { /* offline — bo'sh ro'yxat, foydalanuvchi qayta urinishi mumkin */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const options = warehouses.filter(w => String(w.id) !== String(fromWarehouseId));

  return (
    <div className="pos-card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", border: error ? "1px solid var(--pos-action-chiqim)" : undefined }}>
      <span style={{ fontSize: 22 }}>🎯</span>
      <div style={{ flex: 1, minWidth: 180 }}>
        <label style={{ fontSize: 11, color: "var(--pos-text-muted)", fontWeight: 600, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.3 }}>
          {t("manzilOmbori", "Manzil ombori")}
        </label>
        <select
          className="pos-input"
          value={toWarehouseId}
          onChange={e => onToWarehouseChange(e.target.value)}
          disabled={loading}
        >
          <option value="">{loading ? t("yuklanmoqda", "Yuklanmoqda...") : t("omborTanlang", "Ombor tanlang")}</option>
          {options.map(w => (
            <option key={w.id} value={w.id}>
              {w.code ? `${w.code} — ${w.name ?? ""}` : (w.name ?? w.id)}
            </option>
          ))}
        </select>
        {error && <div style={{ fontSize: 11, color: "var(--pos-action-chiqim)", marginTop: 3 }}>{error}</div>}
      </div>
      {toWarehouseId && (
        <span className="pos-badge pos-badge-green" style={{ fontSize: 11 }}>
          {t("omborTanlandi", "Ombor tanlandi")}
        </span>
      )}
    </div>
  );
}

// ─── Scan zone (asosiy — FAQAT SKANER) ────────────────────────────────────────

interface ScanZoneProps {
  fromWarehouseId: string;
  scanValue: string;
  onScanValueChange: (v: string) => void;
  onScanSubmit: (barcode: string) => void;
  scanFlash: "success" | "error" | null;
  scanning: boolean;
  onCameraOpen: () => void;
}

export function ScanZone({
  fromWarehouseId, scanValue, onScanValueChange, onScanSubmit,
  scanFlash, scanning, onCameraOpen,
}: ScanZoneProps) {
  const { t } = useTranslation("common");
  const inputRef = useRef<HTMLInputElement>(null);

  // Skaner maydoniga avto-fokus — USB/Bluetooth skaner Enter bilan tugatadi.
  useEffect(() => {
    if (fromWarehouseId) inputRef.current?.focus();
  }, [fromWarehouseId, scanning]);

  const borderColor = scanFlash === "success"
    ? "2px solid var(--pos-success)"
    : scanFlash === "error"
      ? "2px solid var(--pos-action-chiqim)"
      : "1px solid var(--pos-border)";
  const boxShadow = scanFlash === "success"
    ? "0 0 24px rgba(16,185,129,0.20)"
    : scanFlash === "error"
      ? "0 0 24px rgba(239,68,68,0.22)"
      : undefined;

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const v = scanValue.trim();
      if (v) onScanSubmit(v);
    }
  }

  return (
    <div className="pos-card" style={{ padding: 0, overflow: "hidden", border: borderColor, transition: "border-color 0.15s", boxShadow }}>
      {/* Scanner visual */}
      <div style={{
        background: fromWarehouseId
          ? "linear-gradient(180deg, color-mix(in srgb, var(--pos-text) 70%, black) 0%, var(--pos-text) 100%)"
          : "var(--pos-text)",
        minHeight: 240, position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12,
      }}>
        {fromWarehouseId && (
          <>
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: `linear-gradient(rgba(239,68,68,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.05) 1px, transparent 1px)`,
              backgroundSize: "30px 30px", pointerEvents: "none",
            }} />
            {[
              { top: 24, left: 24, borderTop: "2px solid", borderLeft: "2px solid" },
              { top: 24, right: 24, borderTop: "2px solid", borderRight: "2px solid" },
              { bottom: 24, left: 24, borderBottom: "2px solid", borderLeft: "2px solid" },
              { bottom: 24, right: 24, borderBottom: "2px solid", borderRight: "2px solid" },
            ].map((s, i) => (
              <div key={i} style={{ position: "absolute", width: 24, height: 24, borderColor: "rgba(239,68,68,0.65)", borderRadius: 2, ...s }} />
            ))}
            <div style={{
              position: "absolute", left: 40, right: 40, height: 2,
              background: "linear-gradient(90deg, transparent, rgba(239,68,68,0.8), rgba(239,68,68,1), rgba(239,68,68,0.8), transparent)",
              boxShadow: "0 0 8px rgba(239,68,68,0.6)",
              animation: "chiqim-scan-beam 2s ease-in-out infinite",
            }} />
          </>
        )}
        {!fromWarehouseId ? (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", zIndex: 1 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🏭</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{t("avvalManbaOmboriniTanlang", "Avval manba omborini tanlang")}</div>
            <div style={{ fontSize: 12, marginTop: 4, opacity: 0.7 }}>{t("yuqoridaManbaOmboriniKiriting", "Yuqorida manba omborini kiriting")}</div>
          </div>
        ) : (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.85)", zIndex: 1 }}>
            <div style={{ fontSize: 52, marginBottom: 8 }}>{scanning ? "⏳" : "📷"}</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{scanning ? t("skanerlanyaptiDots", "Skanerlanyapti...") : t("barcodeSkanerlang", "Barkodni skanerlang")}</div>
            <div style={{ fontSize: 12, marginTop: 4, opacity: 0.6 }}>{t("faqatSkanerChiqim", "Chiqim faqat skaner orqali — qo'lda material tanlash yo'q")}</div>
          </div>
        )}
      </div>

      {/* Scan input + camera (FAQAT SKANER kiritish — material picker YO'Q) */}
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, borderTop: "1px solid var(--pos-border)", background: "var(--pos-card)" }}>
        <input
          ref={inputRef}
          className="pos-input pos-mono"
          value={scanValue}
          disabled={!fromWarehouseId || scanning}
          onChange={e => onScanValueChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder={t("barcodeSkanerlangYokiEnter", "Barkodni skanerlang (USB/Bluetooth) yoki kiritib Enter bosing")}
          style={{ flex: 1 }}
        />
        <button
          className="pos-btn"
          style={{ fontSize: 12, background: "var(--pos-action-chiqim)", color: "#fff" }}
          disabled={!fromWarehouseId || scanning}
          onClick={onCameraOpen}
        >
          📷 {t("kamera", "Kamera")}
        </button>
      </div>
    </div>
  );
}
