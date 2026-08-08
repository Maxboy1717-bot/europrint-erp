/**
 * @module PosMovementChiqimRight
 * @description Right-panel for scanner-only CHIQIM (spec 2026-06-27): LinesPanel (skanlangan
 * material + qoldiq + bo'sh qoldiq + BRON qizil ogohlantirish + override) + reason picker +
 * katta qizil TASDIQ tugma + SuccessScreen.
 */

import type { ScannedLine } from "./PosMovementChiqimTypes";
import { exceedsAllowed } from "./PosMovementChiqimTypes";
import { ReasonPicker, type ReasonState } from "./PosMovementChiqimHelpers";
import { useTranslation } from '@/lib/i18n';

// ─── Single scanned line (material + qoldiq + bron) ───────────────────────────

interface LineRowProps {
  line: ScannedLine;
  onOpenQty: (key: string) => void;
  onOverride: (key: string) => void;
  onRemove: (key: string) => void;
}

function LineRow({ line, onOpenQty, onOverride, onRemove }: LineRowProps) {
  const { t } = useTranslation("common");
  const exceeds = exceedsAllowed(line);

  return (
    <div className="pos-slide-in" style={{ padding: "14px 16px", borderBottom: "1px solid rgba(226,232,240,0.7)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--pos-text)", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {line.materialName}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
            <span className="pos-mono" style={{ fontSize: 10, color: "var(--pos-text-muted)" }}>{line.barcode}</span>
            {line.materialCode && <span className="pos-mono" style={{ fontSize: 10, color: "var(--pos-text-muted)" }}>· {line.materialCode}</span>}
            {line.warehouseCode && <span className="pos-badge pos-badge-gray" style={{ fontSize: 9 }}>{line.warehouseCode}</span>}
          </div>
          {/* Qoldiq tafsiloti: jami / bron / bo'sh */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span className="pos-badge pos-badge-gray" style={{ fontSize: 10 }}>
              {t("jamiQoldiq", "Jami qoldiq")}: <strong className="pos-mono">{line.onHand}</strong> {line.unit}
            </span>
            <span className={`pos-badge ${line.freeStock > 0 ? "pos-badge-green" : "pos-badge-red"}`} style={{ fontSize: 10 }}>
              {t("boshQoldiq", "Bo'sh qoldiq")}: <strong className="pos-mono">{line.freeStock}</strong> {line.unit}
            </span>
            {line.reserved > 0 && (
              <span className="pos-badge pos-badge-yellow" style={{ fontSize: 10 }}>
                {t("bronLabel", "Bron")}: <strong className="pos-mono">{line.reserved}</strong> {line.unit}
              </span>
            )}
          </div>
        </div>
        {/* Qty (ekran-klaviatura/tarozi) + remove */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => onOpenQty(line._key)}
            className="pos-btn"
            style={{
              minWidth: 92, justifyContent: "center", padding: "8px 10px",
              fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700,
              background: exceeds ? "rgba(239,68,68,0.12)" : "rgba(148,163,184,0.12)",
              color: exceeds ? "var(--pos-action-chiqim)" : "var(--pos-text)",
            }}
            title={t("miqdorniOzgartirish", "Miqdorni o'zgartirish")}
          >
            {line.quantity} {line.unit}
          </button>
          <button
            className="pos-btn pos-btn-ghost"
            style={{ padding: "4px 8px", color: "var(--pos-action-chiqim)", fontSize: 12 }}
            onClick={() => onRemove(line._key)}
            title={t("delete", "O'chirish")}
          >✕</button>
        </div>
      </div>

      {/* BRON-BLOK — qizil ogohlantirish (spec: 'bron qilingan, faqat bo'sh qoldiq') */}
      {line.blocked && !line.overridden && (
        <div style={{
          marginTop: 10, padding: "10px 12px", borderRadius: 10,
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>⛔</span>
          <div style={{ flex: 1, fontSize: 12, color: "var(--pos-action-chiqim-dark)", fontWeight: 600 }}>
            {t("bronOgohlantirish", "Bron qilingan — faqat bo'sh qoldiq chiqarilishi mumkin")}
            {line.reservations.some(r => r.reservedByAi) && (
              <span style={{ display: "block", fontSize: 10, fontWeight: 500, opacity: 0.85, marginTop: 2 }}>
                {t("aiPlanningBron", "AI-planning buyurtmaga bron qilgan")}
              </span>
            )}
          </div>
          {line.canOverride && (
            <button
              className="pos-btn"
              style={{ fontSize: 11, padding: "6px 10px", background: "var(--pos-action-chiqim)", color: "#fff" }}
              onClick={() => onOverride(line._key)}
            >
              {t("bronniBuzish", "Bronni buzish")}
            </button>
          )}
        </div>
      )}
      {line.overridden && (
        <div style={{ marginTop: 8, fontSize: 11, color: "var(--pos-warning)", fontWeight: 600 }}>
          ⚠️ {t("bronBuzildiOverride", "Bron buzildi (favqulodda ruxsat) — jami qoldiqgacha chiqarish mumkin")}
        </div>
      )}
      {exceeds && !line.blocked && (
        <div style={{ marginTop: 8, fontSize: 11, color: "var(--pos-action-chiqim)", fontWeight: 600 }}>
          {t("miqdorQoldiqdanKop", "Miqdor mavjud qoldiqdan ko'p")}
        </div>
      )}
    </div>
  );
}

// ─── Lines panel + reason + submit ────────────────────────────────────────────

interface LinesPanelProps {
  lines: ScannedLine[];
  reason: ReasonState;
  onReasonChange: (v: ReasonState) => void;
  /** VISION-3340 #60: ixtiyoriy foto-dalil URL (pos_movements.photo_evidence_url). */
  photoUrl: string;
  onPhotoUrlChange: (v: string) => void;
  reasons: { code: string; label: string }[];
  onOpenQty: (key: string) => void;
  onOverride: (key: string) => void;
  onRemove: (key: string) => void;
  submitting: boolean;
  /** Tur-ga mos tasdiq-tugma matni (?type= — masalan "Ko'chirishni tasdiqlash"). */
  confirmLabel: string;
  onSubmit: () => void;
}

export function LinesPanel({
  lines, reason, onReasonChange, photoUrl, onPhotoUrlChange, reasons,
  onOpenQty, onOverride, onRemove, submitting, confirmLabel, onSubmit,
}: LinesPanelProps) {
  const { t } = useTranslation("common");
  const totalItems = lines.reduce((s, l) => s + l.quantity, 0);

  return (
    <div className="pos-card" style={{ padding: 0, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--pos-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--pos-text)" }}>
          {t("skanerlanganMahsulotlar", "Skanerlangan mahsulotlar")}
        </span>
        <span className="pos-badge pos-badge-red" style={{ fontSize: 11 }}>
          {t("nTa", { count: lines.length })}
        </span>
      </div>

      {/* Lines or empty */}
      {lines.length === 0 ? (
        <div style={{ padding: "44px 20px", textAlign: "center", color: "var(--pos-text-muted)", fontSize: 13 }}>
          <div style={{ fontSize: 34, marginBottom: 8, opacity: 0.4 }}>📦</div>
          {t("haliHechNarsaSkanerlanganEmas", "Hali hech narsa skanerlanmadi")}
          <br />
          <span style={{ fontSize: 12 }}>{t("barcodeSkaneringBoshlang", "Barkod skanerlashni boshlang")}</span>
        </div>
      ) : (
        <div style={{ maxHeight: 380, overflowY: "auto" }}>
          {lines.map(line => (
            <LineRow key={line._key} line={line} onOpenQty={onOpenQty} onOverride={onOverride} onRemove={onRemove} />
          ))}
        </div>
      )}

      {/* Reason + submit */}
      {lines.length > 0 && (
        <div style={{ padding: "16px", borderTop: "1px solid var(--pos-border)", background: "rgba(248,250,252,0.5)" }}>
          <ReasonPicker reasons={reasons} value={reason} onChange={onReasonChange} />

          {/* VISION-3340 #60: ixtiyoriy foto-dalil URL (shift-handover formasi bilan bir xil naqsh) */}
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 12, color: "var(--pos-text-muted)", marginBottom: 4, display: "block" }}>
              {t("fotoDalilUrl", "Foto-dalil URL (ixtiyoriy)")}
            </label>
            <input
              className="pos-input"
              style={{ width: "100%" }}
              placeholder="https://..."
              value={photoUrl}
              onChange={e => onPhotoUrlChange(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "16px 0 12px" }}>
            <span style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>
              {t("jamiMahsulotlar", "Jami: ")}<strong className="pos-mono" style={{ fontSize: 15, color: "var(--pos-text)" }}>{totalItems.toLocaleString("uz-UZ")}</strong>
            </span>
          </div>

          {/* Katta qizil TASDIQ tugma (spec) */}
          <button
            className="pos-btn"
            style={{
              width: "100%", justifyContent: "center", padding: "16px 24px",
              fontSize: 17, fontWeight: 800, letterSpacing: 0.4,
              background: "linear-gradient(135deg, var(--pos-action-chiqim), var(--pos-action-chiqim-dark))",
              color: "#fff", boxShadow: "0 6px 18px -6px var(--pos-action-chiqim)",
              opacity: submitting ? 0.6 : 1,
            }}
            disabled={submitting}
            onClick={onSubmit}
          >
            {submitting ? `⏳ ${t("yuborilmoqda", "Yuborilmoqda...")}` : `✓ ${confirmLabel}`}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────

interface SuccessScreenProps {
  documentNumber?: string;
  /** Tur-ga mos success sarlavha (masalan "Ko'chirish hujjati yaratildi"). */
  successTitle: string;
  /** Tur-ga mos badge matni (masalan "Ombor → ombor ko'chirish"). */
  typeBadge: string;
  onNewChiqim: () => void;
  onGoToList: () => void;
}

export function SuccessScreen({ documentNumber, successTitle, typeBadge, onNewChiqim, onGoToList }: SuccessScreenProps) {
  const { t } = useTranslation("common");
  return (
    <div className="pos-fade-in" style={{ maxWidth: 560, margin: "60px auto", textAlign: "center" }}>
      <div className="pos-card">
        <div style={{ fontSize: 60, marginBottom: 12 }}>✅</div>
        <h3 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700, color: "var(--pos-success)" }}>
          {successTitle}
        </h3>
        {documentNumber && (
          <div className="pos-mono" style={{ fontSize: 16, color: "var(--pos-text-muted)", marginBottom: 16 }}>
            {t("hujjatRaqami1", "Hujjat raqami: ")}<strong style={{ color: "var(--pos-text)" }}>{documentNumber}</strong>
          </div>
        )}
        <div className="pos-badge pos-badge-red" style={{ fontSize: 13, padding: "6px 16px", marginBottom: 20 }}>
          {typeBadge}
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button className="pos-btn pos-btn-ghost" onClick={onNewChiqim}>
            {t("yangiChiqim", "Yangi chiqim")}
          </button>
          <button className="pos-btn pos-btn-primary" onClick={onGoToList}>
            {t("harakatlarRoyxatiga", "Harakatlar ro'yxatiga")}
          </button>
        </div>
      </div>
    </div>
  );
}
