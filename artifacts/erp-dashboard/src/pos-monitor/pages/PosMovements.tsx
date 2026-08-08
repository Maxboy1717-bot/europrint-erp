/**
 * POS Harakatlar — Kitchen Display uslubida
 * Card + status maps split to companion files so this page stays under
 * the 300-line file budget.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { usePosI18n } from "../i18n/usePosI18n";
import { movementsApi } from "../api/pos-monitor.api";
import type { Movement, MovementTab } from "./PosMovements.types";
import { STATUS_CFG, TYPE_ICON, TYPE_LABEL, TYPE_LIST } from "./PosMovements.types";
import { MovementCard } from "./PosMovements.card";

export default function PosMovements() {
  const [, navigate] = useLocation();
  const { t } = usePosI18n();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<MovementTab>("all");
  const [filterType, setFilterType] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await movementsApi.getAll();
      setMovements((Array.isArray(data) ? data : []) as Movement[]);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
    pollRef.current = setInterval(() => {
      void loadData();
    }, 30_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadData]);

  const tabCounts = {
    new: movements.filter((m) => STATUS_CFG[m.status]?.tab === "new").length,
    process: movements.filter((m) => STATUS_CFG[m.status]?.tab === "process").length,
    done: movements.filter((m) => STATUS_CFG[m.status]?.tab === "done").length,
  };

  const displayed = movements.filter((m) => {
    if (activeTab !== "all" && STATUS_CFG[m.status]?.tab !== activeTab) return false;
    if (filterType && m.movementType !== filterType) return false;
    return true;
  });

  async function handleAction(id: number, newStatus: string) {
    setActionLoading(id);
    try {
      await movementsApi.updateStatus(id, newStatus);
      await loadData();
    } catch {
      /* noop */
    } finally {
      setActionLoading(null);
    }
  }

  function handlePrint(id: number) {
    window.open(movementsApi.getPdf(id), "_blank");
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--pos-bg)", padding: "0 0 32px 0" }}>
      <div
        style={{
          background: "var(--pos-card)",
          borderBottom: "1px solid var(--pos-border)",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--pos-text)" }}>{t("actions")}</h2>
        <span style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>{movements.length} ta jami</span>
        <div style={{ flex: 1 }} />
        <button
          className="pos-btn pos-btn-ghost"
          style={{ fontSize: 12 }}
          onClick={() => setShowFilter((f) => !f)}
        >
          {t("turBoyichaFiltr")}
        </button>
        <button className="pos-btn pos-btn-ghost" style={{ fontSize: 12 }} onClick={() => void loadData()}>
          {t("yangilash")}
        </button>
        <button
          onClick={() => navigate("/pos-monitor/movements/new")}
          style={{
            background: "var(--pos-warning)",
            color: "var(--pos-card)",
            border: "none",
            borderRadius: 8,
            padding: "8px 16px",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          {t("yangiHarakat")}
        </button>
      </div>

      {showFilter && (
        <div
          style={{
            background: "var(--pos-card)",
            borderBottom: "1px solid var(--pos-border)",
            padding: "10px 20px",
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => setFilterType("")}
            style={{
              padding: "5px 14px",
              borderRadius: 20,
              border: "1px solid var(--pos-border)",
              background: !filterType ? "var(--pos-warning)" : "var(--pos-bg)",
              color: !filterType ? "var(--pos-card)" : "var(--pos-text-muted)",
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {t("Barchasi")}
          </button>
          {TYPE_LIST.map((tp) => (
            <button
              key={tp}
              onClick={() => setFilterType(tp)}
              style={{
                padding: "5px 14px",
                borderRadius: 20,
                border: "1px solid var(--pos-border)",
                background: filterType === tp ? "var(--pos-warning)" : "var(--pos-bg)",
                color: filterType === tp ? "var(--pos-card)" : "var(--pos-text-muted)",
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {TYPE_ICON[tp]} {TYPE_LABEL[tp]}
            </button>
          ))}
        </div>
      )}

      <div
        style={{
          background: "var(--pos-card)",
          borderBottom: "1px solid var(--pos-border)",
          padding: "0 20px",
          display: "flex",
          gap: 4,
        }}
      >
        {(
          [
            ["all", "Hammasi", movements.length],
            ["new", "Yangi", tabCounts.new],
            ["process", "Jarayonda", tabCounts.process],
            ["done", "Yakunlangan", tabCounts.done],
          ] as const
        ).map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding: "12px 4px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: activeTab === key ? 700 : 500,
              color: activeTab === key ? "var(--pos-text)" : "var(--pos-text-muted)",
              borderBottom: activeTab === key ? "2px solid var(--pos-warning)" : "2px solid transparent",
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginRight: 12,
            }}
          >
            {label}
            {count > 0 && (
              <span
                style={{
                  background: key === "new" ? "var(--pos-warning)" : key === "process" ? "var(--pos-success)" : "var(--pos-text-muted)",
                  color: "var(--pos-card)",
                  borderRadius: 20,
                  padding: "1px 7px",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ padding: "20px" }}>
        {loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                style={{
                  background: "var(--pos-card)",
                  borderRadius: 12,
                  overflow: "hidden",
                  border: "1px solid var(--pos-border)",
                  animation: "pos-pulse 1.4s ease-in-out infinite",
                  animationDelay: `${i * 80}ms`,
                }}
              >
                <div style={{ height: 52, background: "var(--pos-border)" }} />
                <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ height: 14, width: "60%", borderRadius: 4, background: "var(--pos-bg)" }} />
                  <div style={{ height: 12, width: "80%", borderRadius: 4, background: "var(--pos-bg)" }} />
                  <div style={{ height: 12, width: "50%", borderRadius: 4, background: "var(--pos-bg)" }} />
                </div>
                <div style={{ height: 50, borderTop: "1px solid var(--pos-bg)", background: "var(--pos-bg)" }} />
              </div>
            ))}
          </div>
        )}

        {!loading && displayed.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--pos-text-muted)" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: "var(--pos-text-muted)" }}>{t("harakatlarYoq")}</div>
            <div style={{ fontSize: 13, marginBottom: 24 }}>
              {activeTab === "all" ? "Hali hech qanday harakat yaratilmagan" : "Bu toifada harakatlar yo'q"}
            </div>
            <button
              onClick={() => navigate("/pos-monitor/movements/new")}
              style={{
                background: "var(--pos-warning)",
                color: "var(--pos-card)",
                border: "none",
                borderRadius: 8,
                padding: "10px 24px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {t("yangiHarakatYaratish")}
            </button>
          </div>
        )}

        {!loading && displayed.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {displayed.map((mov) => (
              <MovementCard
                key={mov.id}
                mov={mov}
                onAction={handleAction}
                onPrint={handlePrint}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
