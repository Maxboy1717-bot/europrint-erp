/**
 * @module PosMovements.card
 * @description Kitchen-display style card + ElapsedBadge for PosMovements.
 *   Split out so the page composition stays under 300 lines.
 */

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import type { Movement } from "./PosMovements.types";
import { STATUS_CFG, TYPE_ICON, TYPE_LABEL, getMovementAction } from "./PosMovements.types";

export function ElapsedBadge({ createdAt }: { createdAt: string }) {
  const [elapsed, setElapsed] = useState("");
  useEffect(() => {
    function calc() {
      const diff = Date.now() - new Date(createdAt).getTime();
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(`${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [createdAt]);

  const diff = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60000);
  const urgent = mins > 30;
  const warn = mins > 10;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        background: urgent ? "rgba(220,38,38,0.25)" : warn ? "rgba(245,158,11,0.25)" : "rgba(0,0,0,0.2)",
        color: "var(--pos-card)",
        borderRadius: 20,
        padding: "2px 8px",
        fontSize: 11,
        fontFamily: "monospace",
        fontWeight: 700,
      }}
    >
      🕐 {elapsed}
    </span>
  );
}

export function MovementCard({
  mov,
  onAction,
  onPrint,
  actionLoading,
}: {
  mov: Movement;
  onAction: (id: number, status: string) => void;
  onPrint: (id: number) => void;
  actionLoading: number | null;
}) {
  const { t } = useTranslation("common");
  const cfg = STATUS_CFG[mov.status] ?? STATUS_CFG.draft;
  const isDone = mov.status === "completed" || mov.status === "cancelled";

  const action = getMovementAction(mov.status);
  const warehouseLabel = mov.toWarehouseId ?? mov.fromWarehouseId ?? "—";
  const whCode = warehouseLabel.length > 6 ? warehouseLabel.slice(0, 6) : warehouseLabel;

  return (
    <div
      style={{
        background: "var(--pos-card)",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
        opacity: isDone ? 0.75 : 1,
        transition: "box-shadow 0.2s",
        border: "1px solid var(--pos-border)",
      }}
    >
      <div
        style={{
          background: cfg.headerBg,
          color: cfg.headerText,
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: 0.5 }}>
          #{mov.movementNumber ?? String(mov.id).padStart(3, "0")}
        </span>
        <ElapsedBadge createdAt={mov.createdAt} />
        <div style={{ flex: 1 }} />
        <span
          style={{
            background: "rgba(255,255,255,0.25)",
            borderRadius: 20,
            padding: "2px 8px",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {whCode}
        </span>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          👤
        </div>
      </div>

      <div style={{ padding: "12px 14px", flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <span style={{ fontSize: 18 }}>{TYPE_ICON[mov.movementType] ?? "📋"}</span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              textDecoration: isDone && mov.status === "cancelled" ? "line-through" : "none",
              color: isDone && mov.status === "cancelled" ? "var(--pos-text-muted)" : "var(--pos-text)",
            }}
          >
            {TYPE_LABEL[mov.movementType] ?? mov.movementType}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 12, color: "var(--pos-text-muted)" }}>
          {mov.fromWarehouseId && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{t("kimdan")}</span>
              <span style={{ color: "var(--pos-text-muted)", fontWeight: 500 }}>{mov.fromWarehouseId}</span>
            </div>
          )}
          {mov.toWarehouseId && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{t("qayerga")}</span>
              <span style={{ color: "var(--pos-text-muted)", fontWeight: 500 }}>{mov.toWarehouseId}</span>
            </div>
          )}
          {mov.supplierName && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{t("taminotchi")}</span>
              <span
                style={{
                  color: "var(--pos-text-muted)",
                  fontWeight: 500,
                  maxWidth: 120,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {mov.supplierName}
              </span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span>{t("date")}</span>
            <span style={{ color: "var(--pos-text-muted)", fontFamily: "monospace" }}>
              {new Date(mov.createdAt).toLocaleDateString("uz-UZ")}
            </span>
          </div>
          {(mov.totalAmount ?? 0) > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{t("summa")}</span>
              <span style={{ color: "var(--pos-success)", fontWeight: 700, fontFamily: "monospace" }}>
                {(mov.totalAmount ?? 0).toLocaleString("uz-UZ")}
              </span>
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          padding: "10px 12px",
          borderTop: "1px solid var(--pos-bg)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <button
          style={{
            background: "none",
            border: "1px solid var(--pos-border)",
            borderRadius: 8,
            padding: "6px 10px",
            cursor: "pointer",
            fontSize: 16,
            color: "var(--pos-text-muted)",
          }}
          onClick={() => onPrint(mov.id)}
          title={t("print1")}
        >
          🖨️
        </button>

        {action && !isDone ? (
          <button
            onClick={() => onAction(mov.id, action.newStatus)}
            disabled={actionLoading === mov.id}
            style={{
              flex: 1,
              background: action.bg,
              color: "var(--pos-card)",
              border: "none",
              borderRadius: 8,
              padding: "8px 0",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              opacity: actionLoading === mov.id ? 0.7 : 1,
            }}
          >
            {actionLoading === mov.id ? "⏳ Kuting..." : action.label}
          </button>
        ) : isDone ? (
          <div
            style={{
              flex: 1,
              textAlign: "center",
              color: mov.status === "completed" ? "var(--pos-success)" : "var(--pos-text-muted)",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {mov.status === "completed" ? "✅ Yakunlandi" : "❌ Bekor qilindi"}
          </div>
        ) : (
          <button
            onClick={() => window.location.assign(`/pos-monitor/movements/${mov.id}`)}
            style={{
              flex: 1,
              background: "var(--pos-bg)",
              color: "var(--pos-text-muted)",
              border: "1px solid var(--pos-border)",
              borderRadius: 8,
              padding: "8px 0",
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {t("korish")}
          </button>
        )}
      </div>
    </div>
  );
}
