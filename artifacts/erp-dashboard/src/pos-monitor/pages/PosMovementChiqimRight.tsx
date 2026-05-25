/** @module PosMovementChiqimRight @description Right-panel section: LinesPanel (scanned items list with qty controls and totals) + SuccessScreen. */

import type { ScannedLine, MovementTypeCode } from "./PosMovementChiqimTypes";
import { MOVEMENT_TYPES } from "./PosMovementChiqimTypes";
import { useTranslation } from '@/lib/i18n';

// ─── Lines panel ──────────────────────────────────────────────────────────────

interface LinesPanelProps {
  lines: ScannedLine[];
  totalItems: number;
  totalValue: number;
  qtyInputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
  onUpdateQty: (key: string, val: string) => void;
  onRemoveLine: (key: string) => void;
}

export function LinesPanel({
  lines, totalItems, totalValue, qtyInputRefs, onUpdateQty, onRemoveLine,
}: LinesPanelProps) {
  const { t } = useTranslation("common");
  return (
    <div className="pos-card" style={{ padding: 0, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--pos-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--pos-text)" }}>
          {t("skanerlanganMahsulotlar")}
        </span>
        <span className="pos-badge pos-badge-blue" style={{ fontSize: 11 }}>
          {lines.length} ta
        </span>
      </div>

      {/* Empty state */}
      {lines.length === 0 ? (
        <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--pos-text-muted)", fontSize: 13 }}>
          <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.4 }}>📦</div>
          {t("haliHechNarsaSkanerlanganEmas")}
          <br />
          <span style={{ fontSize: 12 }}>{t("barcodeSkaneringBoshlang")}</span>
        </div>
      ) : (
        <div style={{ maxHeight: 420, overflowY: "auto" }}>
          {lines.map((line, idx) => {
            const stockOk = line.availableQty > 0;
            const qtyExceedsStock = line.quantity > line.availableQty && line.availableQty > 0;
            return (
              <div
                key={line._key}
                className="pos-slide-in"
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid rgba(226,232,240,0.6)",
                  background: idx % 2 === 0 ? "transparent" : "rgba(248,250,252,0.4)",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--pos-text)", marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {line.materialName}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span className="pos-mono" style={{ fontSize: 10, color: "var(--pos-text-muted)" }}>{line.barcode}</span>
                      {line.materialCode && (
                        <span className="pos-mono" style={{ fontSize: 10, color: "var(--pos-text-muted)" }}>· {line.materialCode}</span>
                      )}
                      {line.batchNumber && (
                        <span className="pos-badge pos-badge-blue" style={{ fontSize: 9, padding: "1px 6px" }}>{line.batchNumber}</span>
                      )}
                    </div>
                    <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                      <span className={`pos-badge ${stockOk ? "pos-badge-green" : "pos-badge-red"}`} style={{ fontSize: 10 }}>
                        Qoldiq: {line.availableQty}
                      </span>
                      {qtyExceedsStock && (
                        <span className="pos-badge pos-badge-yellow" style={{ fontSize: 9 }}>{t("kam1")}</span>
                      )}
                    </div>
                  </div>
                  {/* Qty + remove */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <input
                      ref={el => { qtyInputRefs.current[line._key] = el; }}
                      className="pos-input pos-mono"
                      type="number"
                      min="0.001"
                      step="any"
                      value={line.quantity}
                      onChange={e => onUpdateQty(line._key, e.target.value)}
                      style={{ width: 72, textAlign: "center", padding: "6px 8px" }}
                    />
                    <button
                      className="pos-btn pos-btn-ghost"
                      style={{ padding: "6px 8px", color: "var(--pos-danger)", flexShrink: 0 }}
                      onClick={() => onRemoveLine(line._key)}
                      title={t("delete")}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Totals */}
      {lines.length > 0 && (
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--pos-border)", background: "rgba(59,130,246,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>
            {t("jamiMahsulotlar")}<strong className="pos-mono">{totalItems.toLocaleString("uz-UZ")}</strong>
          </span>
          {totalValue > 0 && (
            <span style={{ fontSize: 13, fontWeight: 700 }}>
              <span className="pos-mono" style={{ color: "var(--pos-accent)" }}>
                {totalValue.toLocaleString("uz-UZ")} UZS
              </span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────

interface SuccessScreenProps {
  documentNumber?: string;
  selectedType: MovementTypeCode;
  onNewChiqim: () => void;
  onGoToList: () => void;
}

export function SuccessScreen({ documentNumber, selectedType, onNewChiqim, onGoToList }: SuccessScreenProps) {
  const { t } = useTranslation("common");
  const typeInfo = MOVEMENT_TYPES.find(t => t.code === selectedType);
  return (
    <div className="pos-fade-in" style={{ maxWidth: 560, margin: "60px auto", textAlign: "center" }}>
      <div className="pos-card">
        <div style={{ fontSize: 60, marginBottom: 12 }}>✅</div>
        <h3 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700, color: "var(--pos-success)" }}>
          {t("chiqimHujjatiYaratildi")}
        </h3>
        {documentNumber && (
          <div className="pos-mono" style={{ fontSize: 16, color: "var(--pos-text-muted)", marginBottom: 16 }}>
            {t("hujjatRaqami1")}<strong style={{ color: "var(--pos-text)" }}>{documentNumber}</strong>
          </div>
        )}
        <div className="pos-badge pos-badge-blue" style={{ fontSize: 13, padding: "6px 16px", marginBottom: 20 }}>
          {typeInfo?.label}
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button className="pos-btn pos-btn-ghost" onClick={onNewChiqim}>
            {t("yangiChiqim")}
          </button>
          <button className="pos-btn pos-btn-primary" onClick={onGoToList}>
            {t("harakatlarRoyxatiga")}
          </button>
        </div>
      </div>
    </div>
  );
}
