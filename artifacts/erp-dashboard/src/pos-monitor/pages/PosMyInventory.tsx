/**
 * @module PosMyInventory
 * @description React page component. Route-level UI.
 */

import { useState, useEffect, useCallback } from "react";
import { usePosI18n } from "../i18n/usePosI18n";
import { ledgerApi, employeeApi } from "../api/pos-monitor.api";

interface InventoryItem {
  materialCardId: number;
  materialCode: string;
  materialName: string;
  unitOfMeasure: string;
  given: number;
  returned: number;
  balance: number;
  totalValue: number;
}

interface ReturnModalProps {
  item: InventoryItem;
  onClose: () => void;
  onDone: () => void;
  t: (k: string) => string;
}

function ReturnModal({ item, onClose, onDone, t }: ReturnModalProps) {
  const [qty, setQty]       = useState<string>(String(item.balance));
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  async function submit() {
    const q = parseFloat(qty);
    if (!q || q <= 0 || q > item.balance) {
      setError(`Miqdor 0 dan katta va ${item.balance} dan kichik bo'lishi kerak`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await employeeApi.requestReturn({
        materialCardId: item.materialCardId,
        quantity: q,
        reason: reason || undefined,
      });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pos-modal-overlay">
      <div className="pos-modal" style={{ maxWidth: 480 }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 18 }}>
          📦 {t("myInventory.returnModal")}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 18 }}>
          {/* Material name — read-only */}
          <div>
            <label style={{ fontSize: 11, color: "var(--pos-text-muted)", display: "block", marginBottom: 4 }}>
              {t("common.name")}
            </label>
            <div
              style={{
                background: "rgba(248,250,252,1)",
                border: "1px solid var(--pos-border)",
                borderRadius: 10,
                padding: "9px 13px",
                fontSize: 14,
                color: "var(--pos-text)",
              }}
            >
              <span className="pos-mono" style={{ fontSize: 12, color: "var(--pos-text-muted)", marginRight: 8 }}>
                {item.materialCode}
              </span>
              {item.materialName}
            </div>
          </div>

          {/* Qty */}
          <div>
            <label style={{ fontSize: 11, color: "var(--pos-text-muted)", display: "block", marginBottom: 4 }}>
              {t("myInventory.givenQty")} (max: {item.balance} {item.unitOfMeasure})
            </label>
            <input
              type="number"
              className="pos-input"
              min={0.001}
              max={item.balance}
              step={0.001}
              value={qty}
              onChange={e => setQty(e.target.value)}
            />
          </div>

          {/* Reason */}
          <div>
            <label style={{ fontSize: 11, color: "var(--pos-text-muted)", display: "block", marginBottom: 4 }}>
              {t("ledger.returnReason")} ({t("common.notes").toLowerCase()})
            </label>
            <textarea
              className="pos-input"
              rows={3}
              placeholder={t("myInventory.optionalNote")}
              value={reason}
              onChange={e => setReason(e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>

          {error && <div style={{ color: "var(--pos-danger)", fontSize: 12 }}>{error}</div>}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="pos-btn pos-btn-ghost" onClick={onClose} disabled={saving}>
            {t("common.cancel")}
          </button>
          <button className="pos-btn pos-btn-success" onClick={() => void submit()} disabled={saving}>
            {saving ? "…" : `✅ ${t("myInventory.returnButton")}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr>
      {[...Array(8)].map((_, i) => (
        <td key={i}>
          <div
            style={{
              height: 14,
              borderRadius: 6,
              background: "var(--ep-primary)",
              backgroundSize: "200% 100%",
              animation: "pos-pulse 1.4s ease-in-out infinite",
              width: i === 1 ? "80%" : "60%",
            }}
          />
        </td>
      ))}
    </tr>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="pos-stat-card pos-fade-in">
      <div className="pos-stat-value" style={{ color: color ?? "var(--pos-text)", fontSize: 22 }}>
        {value}
      </div>
      <div className="pos-stat-label">{label}</div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function PosMyInventory() {
  const { t } = usePosI18n();
  const [items, setItems]               = useState<InventoryItem[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [returnTarget, setReturnTarget] = useState<InventoryItem | null>(null);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [checkedIds, setCheckedIds]     = useState<Set<number>>(new Set());

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await ledgerApi.getMyBalance2();
      setItems((Array.isArray(data) ? data : []) as InventoryItem[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalGiven     = items.reduce((s, i) => s + i.given, 0);
  const totalBalance   = items.reduce((s, i) => s + i.balance, 0);
  const totalReturned  = items.reduce((s, i) => s + i.returned, 0);
  const totalValue     = items.reduce((s, i) => s + i.totalValue, 0);
  const pendingItems   = items.filter(i => i.balance > 0);

  function toggleCheck(id: number) {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function fmtNum(n: number) {
    return n.toLocaleString("uz-UZ", { maximumFractionDigits: 3 });
  }

  function fmtCurrency(n: number) {
    return n.toLocaleString("uz-UZ", { maximumFractionDigits: 0 });
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <div style={{ color: "var(--pos-danger)", fontWeight: 600, marginBottom: 16 }}>{error}</div>
        <button className="pos-btn pos-btn-primary" onClick={() => void loadData()}>
          🔄 {t("common.refresh")}
        </button>
      </div>
    );
  }

  return (
    <div className="pos-fade-in">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
          🎒 {t("myInventory.title")}
        </h2>
        <span className="pos-badge pos-badge-blue" style={{ fontSize: 13, padding: "5px 14px" }}>
          {t("myInventory.totalValue")}: {fmtCurrency(totalValue)} UZS
        </span>
        <div style={{ flex: 1 }} />
        <button
          className="pos-btn pos-btn-ghost"
          onClick={() => void loadData()}
          title={t("common.refresh")}
        >
          🔄
        </button>
        <button
          className="pos-btn pos-btn-primary"
          onClick={() => {
            const url = `/api/pos/employees/me/inventory/pdf`;
            window.open(url, "_blank");
          }}
        >
          {t("myInventory.downloadReport")}
        </button>
      </div>

      {/* ── KPI row ────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        <KpiCard label={t("myInventory.givenCount")} value={fmtNum(totalGiven)} color="var(--pos-accent)" />
        <KpiCard label={t("myInventory.currentBalance")} value={fmtNum(totalBalance)} color={totalBalance > 0 ? "var(--pos-warning)" : "var(--pos-success)"} />
        <KpiCard label={t("myInventory.returnedCount")} value={fmtNum(totalReturned)} color="var(--pos-success)" />
        <KpiCard label={t("myInventory.totalValue")} value={`${fmtCurrency(totalValue)} UZS`} />
      </div>

      {/* ── Materials table ─────────────────────────────────────────────────── */}
      <div className="pos-card" style={{ marginBottom: 20, overflow: "hidden" }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
          {t("myInventory.itemsList")}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="pos-table">
            <thead>
              <tr>
                <th>{t("common.code")}</th>
                <th>{t("common.name")}</th>
                <th>{t("common.unit")}</th>
                <th>{t("myInventory.givenQty")}</th>
                <th>{t("myInventory.returnedQty")}</th>
                <th>{t("myInventory.balance")}</th>
                <th>{t("myInventory.totalValue")}</th>
                <th>{t("common.action")}</th>
              </tr>
            </thead>
            <tbody>
              {loading && [...Array(5)].map((_, i) => <SkeletonRow key={i} />)}

              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 48, color: "var(--pos-text-muted)" }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                    <div>{t("myInventory.noItems")}</div>
                  </td>
                </tr>
              )}

              {!loading &&
                items.map(item => {
                  const hasBalance = item.balance > 0;
                  return (
                    <tr
                      key={item.materialCardId}
                      style={{
                        background: hasBalance
                          ? "rgba(245,158,11,0.06)"
                          : "transparent",
                        opacity: hasBalance ? 1 : 0.6,
                      }}
                    >
                      <td>
                        <span className="pos-mono" style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>
                          {item.materialCode}
                        </span>
                      </td>
                      <td style={{ fontWeight: hasBalance ? 600 : 400 }}>{item.materialName}</td>
                      <td style={{ color: "var(--pos-text-muted)" }}>{item.unitOfMeasure}</td>
                      <td>{fmtNum(item.given)}</td>
                      <td style={{ color: "var(--pos-success)" }}>{fmtNum(item.returned)}</td>
                      <td>
                        <span
                          className={`pos-badge ${hasBalance ? "pos-badge-yellow" : "pos-badge-green"}`}
                        >
                          {fmtNum(item.balance)}
                        </span>
                      </td>
                      <td style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12 }}>
                        {fmtCurrency(item.totalValue)}
                      </td>
                      <td>
                        {hasBalance ? (
                          <button
                            className="pos-btn pos-btn-ghost"
                            style={{ fontSize: 12, padding: "4px 12px" }}
                            onClick={() => setReturnTarget(item)}
                          >
                            ↩️ {t("myInventory.returnButton")}
                          </button>
                        ) : (
                          <span className="pos-badge pos-badge-green" style={{ fontSize: 10 }}>✓</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── HR Checklist (collapsible) ──────────────────────────────────────── */}
      {!loading && pendingItems.length > 0 && (
        <div className="pos-card pos-fade-in">
          {/* Warning banner */}
          <div
            className="pos-offline-banner"
            style={{
              background: "linear-gradient(135deg,rgba(239,68,68,0.08),rgba(239,68,68,0.03))",
              borderColor: "rgba(239,68,68,0.28)",
              color: "var(--pos-danger)",
              marginBottom: 0,
            }}
          >
            <span style={{ fontSize: 18 }}>⚠️</span>
            <span>
              {t("myInventory.hrWarningDetail", { count: pendingItems.length })}
            </span>
            <div style={{ flex: 1 }} />
            <button
              className="pos-btn pos-btn-ghost"
              style={{ fontSize: 12, padding: "4px 10px", color: "var(--pos-danger)" }}
              onClick={() => setChecklistOpen(o => !o)}
            >
              {checklistOpen ? "▲ Yopish" : "▼ Ko'rish"}
            </button>
          </div>

          {checklistOpen && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
                ✅ {t("myInventory.checklist")}
              </div>
              <table className="pos-table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}></th>
                    <th>{t("common.code")}</th>
                    <th>{t("common.name")}</th>
                    <th>{t("myInventory.balance")}</th>
                    <th>{t("common.unit")}</th>
                    <th>{t("common.action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingItems.map(item => (
                    <tr key={item.materialCardId}>
                      <td>
                        <input
                          type="checkbox"
                          checked={checkedIds.has(item.materialCardId)}
                          onChange={() => toggleCheck(item.materialCardId)}
                          style={{ cursor: "pointer", width: 16, height: 16 }}
                        />
                      </td>
                      <td>
                        <span className="pos-mono" style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>
                          {item.materialCode}
                        </span>
                      </td>
                      <td>{item.materialName}</td>
                      <td>
                        <span className="pos-badge pos-badge-yellow">{fmtNum(item.balance)}</span>
                      </td>
                      <td style={{ color: "var(--pos-text-muted)" }}>{item.unitOfMeasure}</td>
                      <td>
                        <button
                          className="pos-btn pos-btn-ghost"
                          style={{ fontSize: 11, padding: "3px 10px" }}
                          onClick={() => setReturnTarget(item)}
                        >
                          ↩️ {t("myInventory.returnButton")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Bulk action */}
              <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
                <button
                  className="pos-btn pos-btn-danger"
                  disabled={checkedIds.size === 0}
                  style={{ fontSize: 13 }}
                  onClick={() => {
                    // Opens the first checked item for return (serial process)
                    const firstId = [...checkedIds][0];
                    const target = pendingItems.find(i => i.materialCardId === firstId);
                    if (target) setReturnTarget(target);
                  }}
                >
                  📦 Hammasini qaytarish so'rovi ({checkedIds.size})
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Return modal ────────────────────────────────────────────────────── */}
      {returnTarget && (
        <ReturnModal
          item={returnTarget}
          onClose={() => setReturnTarget(null)}
          onDone={() => {
            setReturnTarget(null);
            void loadData();
          }}
          t={t}
        />
      )}
    </div>
  );
}
