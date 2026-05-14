/**
 * @module MovementCard
 * @description React UI component.
 */

import { usePosI18n } from "../i18n/usePosI18n";

export interface Movement {
  id: number;
  movementNumber?: string;
  movementType: string;
  status: string;
  totalAmount?: number;
  createdAt: string;
  fromWarehouseName?: string;
  toWarehouseName?: string;
  lines?: { materialNameUz?: string; qty?: number; unit?: string }[];
}

interface MovementCardProps {
  movement: Movement;
  onClick?: (m: Movement) => void;
  compact?: boolean;
}

const TYPE_ICON: Record<string, string> = {
  EXTERNAL_IN: "📥", EXTERNAL_OUT: "📤",
  INTERNAL_ISSUE: "➡️", INTERNAL_RETURN: "↩️",
  INTERNAL_TRANSFER: "🔄", DAMAGE: "💥",
  INVENTORY_ADJ_PLUS: "➕", INVENTORY_ADJ_MINUS: "➖",
};

const STATUS_COLOR: Record<string, string> = {
  draft: "#95A5A6", karantin: "#9B59B6", qc_pending: "#F1C40F",
  qc_approved: "#00D2FF", pending: "#F39C12", approved: "#2ECC71",
  ai_processing: "#3498DB", completed: "#00D2FF", cancelled: "#E74C3C",
};

export function MovementCard({ movement: m, onClick, compact }: MovementCardProps) {
  const { t } = usePosI18n();
  const icon  = TYPE_ICON[m.movementType] ?? "📋";
  const color = STATUS_COLOR[m.status] ?? "#95A5A6";

  return (
    <div
      className="pos-card pos-fade-in"
      onClick={() => onClick?.(m)}
      style={{
        cursor: onClick ? "pointer" : "default",
        borderLeft: `3px solid ${color}`,
        padding: compact ? "10px 14px" : undefined,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: compact ? 20 : 28, flexShrink: 0 }}>{icon}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: compact ? 13 : 14 }}>
              {m.movementNumber ?? `#${m.id}`}
            </span>
            <span style={{ fontSize: 11, background: `${color}22`, color, borderRadius: 4, padding: "1px 6px", fontWeight: 600 }}>
              {t(`status.${m.status}`)}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "var(--pos-text-muted)", marginTop: 3, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span>{t(`movType.${m.movementType}`)}</span>
            {m.fromWarehouseName && <span>📤 {m.fromWarehouseName}</span>}
            {m.toWarehouseName   && <span>📥 {m.toWarehouseName}</span>}
            <span>{new Date(m.createdAt).toLocaleDateString("uz-UZ")}</span>
          </div>
        </div>

        {m.totalAmount != null && (
          <div style={{ fontWeight: 700, fontSize: compact ? 13 : 14, color: "var(--pos-accent)", flexShrink: 0 }}>
            {m.totalAmount.toLocaleString()} so'm
          </div>
        )}
      </div>
    </div>
  );
}

export default MovementCard;
