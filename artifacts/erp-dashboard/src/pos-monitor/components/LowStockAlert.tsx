/**
 * @module LowStockAlert
 * @description React UI component.
 */

import { useState, useEffect, useCallback } from "react";
import { usePosI18n } from "../i18n/usePosI18n";
import { stockApi } from "../api/pos-monitor.api";

interface LowStockItem {
  materialId: number;
  materialCode: string;
  materialNameUz?: string;
  warehouseId: number;
  warehouseName?: string;
  currentQty: number;
  minQty: number;
  unit?: string;
}

interface LowStockAlertProps {
  limit?: number;
  autoRefresh?: boolean;
  onOrder?: (materialId: number) => void;
}

export function LowStockAlert({ limit = 10, autoRefresh = true, onOrder }: LowStockAlertProps) {
  const { t } = usePosI18n();
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await stockApi.getLowAlerts();
      setItems(Array.isArray(data) ? data as LowStockItem[] : []);
    } catch { /* noop */ } finally { setLoading(false); }
  }, [limit]);

  useEffect(() => {
    void load();
    if (!autoRefresh) return;
    const interval = setInterval(() => void load(), 60_000);
    return () => clearInterval(interval);
  }, [load, autoRefresh]);

  if (!loading && items.length === 0) return null;

  return (
    <div className="pos-card" style={{ borderLeft: "3px solid var(--pos-warning)" }}>
      <div
        style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: collapsed ? 0 : 12 }}
        onClick={() => setCollapsed(c => !c)}
      >
        <span style={{ fontSize: 16 }}>⚠️</span>
        <span style={{ fontWeight: 700, fontSize: 14, color: "var(--pos-warning)", flex: 1 }}>
          {t("lowstock.title")} {!loading && `(${items.length})`}
        </span>
        <span style={{ color: "var(--pos-text-muted)", fontSize: 18 }}>{collapsed ? "›" : "‹"}</span>
      </div>

      {!collapsed && (
        loading ? (
          <div style={{ color: "var(--pos-text-muted)", fontSize: 13 }}>{t("common.loading")}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {items.map((item, i) => {
              const pct = Math.min((item.currentQty / item.minQty) * 100, 100);
              const isCritical = item.currentQty <= 0;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: i < items.length - 1 ? "1px solid var(--pos-border)" : undefined }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                      {isCritical ? "🔴" : "🟡"} {item.materialCode}
                      {item.materialNameUz && <span style={{ fontSize: 11, color: "var(--pos-text-muted)", fontWeight: 400 }}>— {item.materialNameUz}</span>}
                    </div>
                    <div style={{ marginTop: 4, height: 4, background: "var(--pos-border)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: isCritical ? "var(--pos-danger)" : "var(--pos-warning)", borderRadius: 2, transition: "width 0.3s" }} />
                    </div>
                    <div style={{ fontSize: 11, color: "var(--pos-text-muted)", marginTop: 2 }}>
                      {item.currentQty} / {item.minQty} {item.unit ?? ""}
                      {item.warehouseName && ` • ${item.warehouseName}`}
                    </div>
                  </div>
                  {onOrder && (
                    <button
                      className="pos-btn pos-btn-ghost"
                      style={{ fontSize: 11, padding: "3px 8px", flexShrink: 0 }}
                      onClick={e => { e.stopPropagation(); onOrder(item.materialId); }}
                    >
                      {t("sorov1")}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

export default LowStockAlert;
