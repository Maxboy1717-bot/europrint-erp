/**
 * @module MaterialCard
 * @description React UI component.
 */

import { StockBadge } from "./StockBadge";

export interface Material {
  id: number;
  code: string;
  nameUz: string;
  nameRu?: string;
  unit: string;
  barcode?: string;
  currentQty?: number;
  minQty?: number;
  categoryName?: string;
  isActive?: boolean;
}

interface MaterialCardProps {
  material: Material;
  onClick?: (m: Material) => void;
  selected?: boolean;
  showStock?: boolean;
  compact?: boolean;
}

export function MaterialCard({ material: m, onClick, selected, showStock = true, compact }: MaterialCardProps) {
  return (
    <div
      className="pos-card pos-fade-in"
      onClick={() => onClick?.(m)}
      style={{
        cursor: onClick ? "pointer" : "default",
        borderLeft: selected ? "3px solid var(--pos-accent)" : "3px solid transparent",
        background: selected ? "rgba(0,212,255,0.05)" : undefined,
        padding: compact ? "10px 14px" : undefined,
        transition: "border-color 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: compact ? 32 : 40, height: compact ? 32 : 40, borderRadius: 8, flexShrink: 0,
          background: "linear-gradient(135deg,var(--pos-accent)22,var(--pos-accent)44)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: compact ? 16 : 20,
        }}>📦</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: compact ? 13 : 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {m.nameUz}
          </div>
          <div style={{ fontSize: 11, color: "var(--pos-text-muted)", marginTop: 2, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span>#{m.code}</span>
            {m.barcode && <span>🔖 {m.barcode}</span>}
            {m.categoryName && <span>📂 {m.categoryName}</span>}
          </div>
        </div>

        {showStock && m.currentQty !== undefined && (
          <StockBadge qty={m.currentQty} minQty={m.minQty} unit={m.unit} size={compact ? "sm" : "md"} />
        )}
      </div>
    </div>
  );
}

export default MaterialCard;
