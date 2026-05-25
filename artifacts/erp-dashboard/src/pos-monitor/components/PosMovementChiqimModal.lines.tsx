/**
 * @module PosMovementChiqimModal.lines
 * @description Scanned-lines list view for PosMovementChiqimModal.
 *   Split out so the parent stays under 300 lines.
 */

import type { RefObject } from "react";
import type { ScannedLine } from "./PosMovementChiqimModal.types";

export function LinesList({
  lines,
  qtyRefs,
  totalItems,
  onUpdateQty,
  onRemoveLine,
  t,
}: {
  lines: ScannedLine[];
  qtyRefs: RefObject<Record<string, HTMLInputElement | null>>;
  totalItems: number;
  onUpdateQty: (key: string, val: string) => void;
  onRemoveLine: (key: string) => void;
  t: (k: string) => string;
}) {
  if (lines.length === 0) return null;
  return (
    <div
      style={{
        border: "1px solid var(--pos-border)",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "8px 12px",
          background: "rgba(248,250,252,0.8)",
          borderBottom: "1px solid var(--pos-border)",
          fontSize: 11,
          fontWeight: 700,
          color: "var(--pos-text-muted)",
          textTransform: "uppercase",
          letterSpacing: 0.4,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>{t("skanerlanganMahsulotlar")}</span>
        <span>
          {lines.length} ta · {totalItems.toLocaleString("uz-UZ")} dona
        </span>
      </div>
      <div style={{ maxHeight: 240, overflowY: "auto" }}>
        {lines.map((line, idx) => (
          <div
            key={line._key}
            className="pos-slide-in"
            style={{
              padding: "10px 12px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              borderBottom: idx < lines.length - 1 ? "1px solid rgba(226,232,240,0.6)" : "none",
              background: idx % 2 ? "rgba(248,250,252,0.4)" : "transparent",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {line.materialName}
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
                <span className="pos-mono" style={{ fontSize: 10, color: "var(--pos-text-muted)" }}>
                  {line.barcode}
                </span>
                <span
                  className={`pos-badge ${line.availableQty > 0 ? "pos-badge-green" : "pos-badge-red"}`}
                  style={{ fontSize: 9 }}
                >
                  {line.availableQty}
                </span>
                {line.batchNumber && (
                  <span className="pos-badge pos-badge-blue" style={{ fontSize: 9 }}>
                    {line.batchNumber}
                  </span>
                )}
              </div>
            </div>
            <input
              ref={(el) => {
                if (qtyRefs.current) qtyRefs.current[line._key] = el;
              }}
              className="pos-input pos-mono"
              type="number"
              min="0.001"
              step="any"
              value={line.quantity}
              onChange={(e) => onUpdateQty(line._key, e.target.value)}
              style={{ width: 64, textAlign: "center", padding: "5px 6px", fontSize: 13 }}
            />
            <button
              className="pos-btn pos-btn-ghost"
              style={{ padding: "5px 7px", color: "var(--pos-danger)", flexShrink: 0 }}
              onClick={() => onRemoveLine(line._key)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
