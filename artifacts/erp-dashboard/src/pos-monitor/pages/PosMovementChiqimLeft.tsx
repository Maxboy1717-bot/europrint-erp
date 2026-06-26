/** @module PosMovementChiqimLeft @description Left-panel sections: MovementTypeSelector, ScanZone, ContextFields (return-reason, damage, employee). */

import { useRef } from "react";
import type { MovementTypeCode, ScannedLine } from "./PosMovementChiqimTypes";
import { MOVEMENT_TYPES } from "./PosMovementChiqimTypes";
import { EmployeeSearch } from "./PosMovementChiqimHelpers";
import { useTranslation } from '@/lib/i18n';

// ─── Movement type selector ───────────────────────────────────────────────────

interface MovementTypeSelectorProps {
  selectedType: MovementTypeCode;
  onSelect: (code: MovementTypeCode) => void;
}

export function MovementTypeSelector({ selectedType, onSelect }: MovementTypeSelectorProps) {
  const { t } = useTranslation("common");
  return (
    <div className="pos-card" style={{ padding: "16px 20px" }}>
      <div style={{ fontSize: 11, color: "var(--pos-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
        {t("harakatTuri1")}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {MOVEMENT_TYPES.map(t => (
          <button
            key={t.code}
            onClick={() => onSelect(t.code)}
            style={{
              padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              cursor: "pointer", border: "none", transition: "all 0.18s",
              background: selectedType === t.code
                ? `linear-gradient(135deg, ${t.color}, ${t.color}cc)`
                : "rgba(163,177,198,0.10)",
              color: selectedType === t.code ? "var(--pos-card)" : "var(--pos-text-muted)",
              boxShadow: selectedType === t.code ? `0 2px 8px ${t.color}40` : "none",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Scan zone ────────────────────────────────────────────────────────────────

interface ScanZoneProps {
  fromWarehouseId: string;
  scanFlash: "success" | "error" | null;
  scanning: boolean;
  onCameraOpen: () => void;
}

export function ScanZone({ fromWarehouseId, scanFlash, scanning, onCameraOpen }: ScanZoneProps) {
  const { t } = useTranslation("common");
  const borderColor = scanFlash === "success"
    ? "2px solid var(--pos-success)"
    : scanFlash === "error"
      ? "2px solid var(--pos-danger)"
      : "1px solid var(--pos-border)";

  const boxShadow = scanFlash === "success"
    ? "0 0 24px rgba(16,185,129,0.20)"
    : scanFlash === "error"
      ? "0 0 24px rgba(239,68,68,0.20)"
      : undefined;

  return (
    <div className="pos-card" style={{ padding: 0, overflow: "hidden", border: borderColor, transition: "border-color 0.15s", boxShadow }}>
      {/* Scanner visual */}
      <div style={{
        background: fromWarehouseId ? "linear-gradient(180deg, color-mix(in srgb, var(--pos-text) 70%, black) 0%, var(--pos-text) 100%)" : "var(--pos-text)",
        minHeight: 220, position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12,
      }}>
        {fromWarehouseId && (
          <>
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: `linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)`,
              backgroundSize: "30px 30px", pointerEvents: "none",
            }} />
            {[
              { top: 24, left: 24, borderTop: "2px solid", borderLeft: "2px solid" },
              { top: 24, right: 24, borderTop: "2px solid", borderRight: "2px solid" },
              { bottom: 24, left: 24, borderBottom: "2px solid", borderLeft: "2px solid" },
              { bottom: 24, right: 24, borderBottom: "2px solid", borderRight: "2px solid" },
            ].map((s, i) => (
              <div key={i} style={{ position: "absolute", width: 24, height: 24, borderColor: "rgba(59,130,246,0.6)", borderRadius: 2, ...s }} />
            ))}
            <div style={{
              position: "absolute", left: 40, right: 40, height: 2,
              background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.8), rgba(59,130,246,1), rgba(59,130,246,0.8), transparent)",
              boxShadow: "0 0 8px rgba(59,130,246,0.6)",
              animation: "chiqim-scan-beam 2s ease-in-out infinite",
            }} />
          </>
        )}
        {!fromWarehouseId ? (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", zIndex: 1 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🏭</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{t("avvalManbaOmboriniTanlang")}</div>
            <div style={{ fontSize: 12, marginTop: 4, opacity: 0.7 }}>{t("quyidagiManbaOmboriMaydoniniToldiring")}</div>
          </div>
        ) : (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.8)", zIndex: 1 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{scanning ? "⏳" : "📷"}</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{scanning ? t("skanerlanyaptiDots") : t("barcodeSkanerlang")}</div>
            <div style={{ fontSize: 12, marginTop: 4, opacity: 0.6 }}>{t("usbBluetoothSkanerYokiKamera")}</div>
          </div>
        )}
      </div>
      {/* Actions bar */}
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, borderTop: "1px solid var(--pos-border)", background: "var(--pos-card)" }}>
        <div style={{ flex: 1, fontSize: 12, color: "var(--pos-text-muted)" }}>
          {fromWarehouseId
            ? <span className="pos-live" style={{ color: "var(--pos-success)", fontWeight: 600 }}>{t("skanerKutmoqda")}</span>
            : t("omborTanlanmagan")}
        </div>
        <button className="pos-btn pos-btn-primary" style={{ fontSize: 12 }} disabled={!fromWarehouseId} onClick={onCameraOpen}>
          {t("kamera")}
        </button>
      </div>
    </div>
  );
}

// ─── Context fields ───────────────────────────────────────────────────────────

interface ContextFieldsProps {
  selectedType: MovementTypeCode;
  returnReason: string;
  onReturnReasonChange: (v: string) => void;
  notes: string;
  onNotesChange: (v: string) => void;
  damagePhotos: File[];
  onDamagePhotosChange: (files: File[]) => void;
}

export function ContextFields({
  selectedType, returnReason, onReturnReasonChange,
  notes, onNotesChange, damagePhotos, onDamagePhotosChange,
}: ContextFieldsProps) {
  const { t } = useTranslation("common");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const needsReturnReason = selectedType === "INTERNAL_RETURN";
  const needsDamageDesc   = selectedType === "DAMAGE";

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    onDamagePhotosChange([...damagePhotos, ...files]);
  }

  if (!needsReturnReason && !needsDamageDesc) return null;

  return (
    <div className="pos-card">
      {needsReturnReason && (
        <>
          <label style={{ fontSize: 11, color: "var(--pos-text-muted)", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.3 }}>
            {t("qaytarishSababiMajburiy")}
          </label>
          <textarea className="pos-input" rows={3} value={returnReason} onChange={e => onReturnReasonChange(e.target.value)} placeholder={t("nimaUchunQaytarilmoqda")} style={{ resize: "vertical" }} />
        </>
      )}
      {needsDamageDesc && (
        <>
          <label style={{ fontSize: 11, color: "var(--pos-text-muted)", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.3 }}>
            {t("zararTavsifiMajburiy")}
          </label>
          <textarea className="pos-input" rows={3} value={notes} onChange={e => onNotesChange(e.target.value)} placeholder={t("zararTuriVaSababi")} style={{ resize: "vertical", marginBottom: 10 }} />
          <button className="pos-btn pos-btn-ghost" style={{ fontSize: 12 }} onClick={() => photoInputRef.current?.click()}>
            📎 {t("fotoBiriktirish")} {damagePhotos.length > 0 && t("nTa", { count: damagePhotos.length })}
          </button>
          <input ref={photoInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handlePhotoChange} />
          {damagePhotos.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
              {damagePhotos.map((f, i) => (
                <div key={i} style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: "1px solid var(--pos-border)" }}>
                  <img src={URL.createObjectURL(f)} alt="" style={{ width: 72, height: 72, objectFit: "cover", display: "block" }} />
                  <button
                    onClick={() => onDamagePhotosChange(damagePhotos.filter((_, idx) => idx !== i))}
                    style={{ position: "absolute", top: 2, right: 2, background: "color-mix(in srgb, black 60%, transparent)", color: "var(--pos-card)", border: "none", borderRadius: 4, width: 18, height: 18, fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Bottom bar (warehouse / employee / notes / submit) ───────────────────────

interface BottomBarProps {
  selectedType: MovementTypeCode;
  fromWarehouseId: string;
  onFromWarehouseChange: (v: string) => void;
  toWarehouseId: string;
  onToWarehouseChange: (v: string) => void;
  employeeName: string;
  onEmployeeChange: (id: string, name: string) => void;
  notes: string;
  onNotesChange: (v: string) => void;
  submitting: boolean;
  linesCount: number;
  onSaveDraft: () => void;
  onSubmit: () => void;
}

export function BottomBar({
  selectedType, fromWarehouseId, onFromWarehouseChange,
  toWarehouseId, onToWarehouseChange,
  employeeName, onEmployeeChange,
  notes, onNotesChange,
  submitting, linesCount, onSaveDraft, onSubmit,
}: BottomBarProps) {
  const { t } = useTranslation("common");
  const needsToWarehouse  = selectedType === "INTERNAL_ISSUE" || selectedType === "INTERNAL_TRANSFER";
  const needsEmployee     = selectedType === "INTERNAL_ISSUE";
  const needsDamageDesc   = selectedType === "DAMAGE";
  const needsReturnReason = selectedType === "INTERNAL_RETURN";

  return (
    <div className="pos-card" style={{ marginTop: 16, padding: "18px 20px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
        <div>
          <label style={{ fontSize: 11, color: "var(--pos-text-muted)", fontWeight: 600, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.3 }}>{t("manbaOmbori")}</label>
          <input className="pos-input" value={fromWarehouseId} onChange={e => onFromWarehouseChange(e.target.value)} placeholder={t("omborIdYokiKodi")} />
        </div>
        {needsToWarehouse && (
          <div>
            <label style={{ fontSize: 11, color: "var(--pos-text-muted)", fontWeight: 600, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.3 }}>{t("manzilOmbori")}</label>
            <input className="pos-input" value={toWarehouseId} onChange={e => onToWarehouseChange(e.target.value)} placeholder={t("omborIdYokiKodi")} />
          </div>
        )}
        {needsEmployee && (
          <div>
            <label style={{ fontSize: 11, color: "var(--pos-text-muted)", fontWeight: 600, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.3 }}>{t("xodim1")}</label>
            <EmployeeSearch value={employeeName} onChange={onEmployeeChange} />
          </div>
        )}
        {!needsDamageDesc && !needsReturnReason && (
          <div>
            <label style={{ fontSize: 11, color: "var(--pos-text-muted)", fontWeight: 600, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.3 }}>{t("Izoh")}</label>
            <input className="pos-input" value={notes} onChange={e => onNotesChange(e.target.value)} placeholder={t("qoshimchaIzoh")} />
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
        <button className="pos-btn pos-btn-ghost" style={{ minWidth: 140, justifyContent: "center", padding: "10px 20px" }} disabled={submitting || linesCount === 0} onClick={onSaveDraft}>
          {submitting ? "⏳..." : `💾 ${t("qoralama")}`}
        </button>
        <button className="pos-btn pos-btn-danger" style={{ minWidth: 160, justifyContent: "center", padding: "10px 24px", fontSize: 14 }} disabled={submitting || linesCount === 0} onClick={onSubmit}>
          {submitting ? `⏳ ${t("yuborilmoqda")}` : t("yuborish")}
        </button>
      </div>
    </div>
  );
}
