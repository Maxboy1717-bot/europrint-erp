/**
 * @module StockBadge
 * @description React UI component.
 */

interface StockBadgeProps {
  qty: number;
  minQty?: number;
  unit?: string;
  size?: "sm" | "md" | "lg";
}

export function StockBadge({ qty, minQty, unit = "", size = "md" }: StockBadgeProps) {
  const isCritical = minQty !== undefined && qty <= 0;
  const isLow      = minQty !== undefined && qty > 0 && qty < minQty;
  const isOk       = !isCritical && !isLow;

  const color = isCritical ? "var(--pos-danger)" : isLow ? "var(--pos-warning)" : "var(--pos-success)";
  const bg    = isCritical ? "rgba(255,71,87,0.1)" : isLow ? "rgba(255,184,0,0.1)" : "rgba(46,213,115,0.1)";
  const icon  = isCritical ? "🔴" : isLow ? "🟡" : "🟢";

  const fontSizes = { sm: 11, md: 13, lg: 15 };
  const fontSize = fontSizes[size];

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: bg, color, border: `1px solid ${color}30`,
      borderRadius: 6, padding: size === "sm" ? "2px 6px" : "3px 10px",
      fontSize, fontWeight: 600, whiteSpace: "nowrap",
    }}>
      {icon} {qty.toLocaleString()} {unit}
      {isLow && minQty && <span style={{ opacity: 0.7, fontSize: fontSize - 2 }}>/ min {minQty}</span>}
    </span>
  );
}

export default StockBadge;
