import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { usePosI18n } from "../i18n/usePosI18n";
import { ledgerApi, movementsApi } from "../api/pos-monitor.api";

interface LedgerItem { id: number; materialCardId: number; materialName?: string; qty: number; unit?: string; issuedDate: string; returnDeadline?: string; status: string; }
interface BalanceSummary { totalItems?: number; totalValue?: number; expiringSoon?: number; items?: LedgerItem[]; }
interface HistoryEntry { id: number; movementNumber?: string; movementType: string; status: string; totalAmount?: number; createdAt: string; }

function getDaysLeft(dateStr?: string): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

const MOV_TYPE_COLOR: Record<string, string> = {
  EXTERNAL_IN: "pos-badge-green", EXTERNAL_OUT: "pos-badge-red", INTERNAL_ISSUE: "pos-badge-yellow",
  INTERNAL_RETURN: "pos-badge-blue", INTERNAL_TRANSFER: "pos-badge-blue", DAMAGE: "pos-badge-red",
  INVENTORY_ADJ_PLUS: "pos-badge-green", INVENTORY_ADJ_MINUS: "pos-badge-red",
};

export default function PosLedger() {
  const [, navigate] = useLocation();
  const { t } = usePosI18n();
  const [data, setData]       = useState<BalanceSummary>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<"active" | "returned" | "history">("active");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [histLoading, setHistLoading] = useState(false);
  const [returnModal, setReturnModal] = useState<{ item: LedgerItem } | null>(null);
  const [returnQty, setReturnQty]     = useState("");
  const [returnReason, setReturnReason] = useState("");

  const loadData = useCallback(async () => {
    try {
      const res = await ledgerApi.getMyBalance2();
      setData((res as BalanceSummary) ?? {});
    } catch { /* noop */ } finally { setLoading(false); }
  }, []);

  async function loadHistory() {
    setHistLoading(true);
    try {
      const res = await movementsApi.getAll({ status: "completed" }).catch(() => []);
      setHistory((Array.isArray(res) ? res : []) as HistoryEntry[]);
    } catch { /* noop */ } finally { setHistLoading(false); }
  }

  function switchTab(t: "active" | "returned" | "history") {
    setTab(t);
    if (t === "history" && history.length === 0) void loadHistory();
  }

  useEffect(() => { void loadData(); }, [loadData]);

  async function handleReturn() {
    if (!returnModal) return;
    const qty = parseFloat(returnQty);
    if (!qty || qty <= 0) return;
    try {
      await ledgerApi.returnItem({
        movementType: "INTERNAL_RETURN",
        lines: [{ materialCardId: returnModal.item.materialCardId, qty, note: returnReason }],
        submit: true,
      } as Record<string, unknown>);
      setReturnModal(null); setReturnQty(""); setReturnReason("");
      void loadData();
    } catch { /* noop */ }
  }

  const items = (data.items ?? []);
  const active   = items.filter(i => i.status === "active");
  const returned = items.filter(i => i.status !== "active");

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{t("ledger.title")}</h2>
        <div style={{ flex: 1 }} />
        <a className="pos-btn pos-btn-ghost" href={`${(import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "")}/api/pos/reports/statement/pdf`} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
          📄 {t("ledger.getPdf")}
        </a>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
        <div className="pos-stat-card">
          <div className="pos-stat-value" style={{ color: "var(--pos-accent)" }}>{loading ? "..." : (data.totalItems ?? items.length)}</div>
          <div className="pos-stat-label">{t("ledger.totalItems")}</div>
        </div>
        <div className="pos-stat-card">
          <div className="pos-stat-value" style={{ color: "var(--pos-success)" }}>{loading ? "..." : (data.totalValue ?? 0).toFixed(2)}</div>
          <div className="pos-stat-label">{t("ledger.totalValue")}</div>
        </div>
        <div className="pos-stat-card">
          <div className="pos-stat-value" style={{ color: "var(--pos-warning)" }}>{loading ? "..." : (data.expiringSoon ?? 0)}</div>
          <div className="pos-stat-label">{t("ledger.expiringSoon")}</div>
        </div>
      </div>

      <div className="pos-tabs">
        <div className={`pos-tab ${tab === "active" ? "active" : ""}`} onClick={() => switchTab("active")}>Faol ({active.length})</div>
        <div className={`pos-tab ${tab === "returned" ? "active" : ""}`} onClick={() => switchTab("returned")}>Qaytarilgan ({returned.length})</div>
        <div className={`pos-tab ${tab === "history" ? "active" : ""}`} onClick={() => switchTab("history")}>{t("ledger.history")}</div>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40, color: "var(--pos-text-muted)" }}>{t("common.loading")}</div>}

      {!loading && tab === "active" && (
        <div className="pos-card" style={{ overflowX: "auto" }}>
          <table className="pos-table">
            <thead>
              <tr>
                <th>Material</th>
                <th>{t("common.qty")}</th>
                <th>{t("ledger.issuedDate")}</th>
                <th>{t("ledger.returnDeadline")}</th>
                <th>Qolgan kun</th>
                <th>Amal</th>
              </tr>
            </thead>
            <tbody>
              {(active ?? []).map(item => {
                const days = getDaysLeft(item.returnDeadline);
                const daysColor = days === null ? "var(--pos-text-muted)" : days < 7 ? "var(--pos-danger)" : days < 14 ? "var(--pos-warning)" : "var(--pos-success)";
                return (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 500 }}>{item.materialName ?? `#${item.materialCardId}`}</td>
                    <td className="pos-mono">{item.qty} {item.unit ?? ""}</td>
                    <td style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>{new Date(item.issuedDate).toLocaleDateString("uz-UZ")}</td>
                    <td style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>{item.returnDeadline ? new Date(item.returnDeadline).toLocaleDateString("uz-UZ") : "—"}</td>
                    <td className="pos-mono" style={{ fontWeight: 600, color: daysColor }}>{days !== null ? days : "∞"}</td>
                    <td>
                      <button className="pos-btn pos-btn-ghost" style={{ fontSize: 11, padding: "3px 8px" }} onClick={() => setReturnModal({ item })}>
                        ↩ {t("ledger.returnItem")}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {active.length === 0 && <div style={{ textAlign: "center", padding: 24, color: "var(--pos-text-muted)" }}>{t("common.noData")}</div>}
        </div>
      )}

      {!loading && tab === "returned" && (
        <div className="pos-card" style={{ overflowX: "auto" }}>
          <table className="pos-table">
            <thead><tr><th>Material</th><th>Miqdor</th><th>Qaytarilgan sana</th></tr></thead>
            <tbody>
              {(returned ?? []).map(item => (
                <tr key={item.id}>
                  <td>{item.materialName ?? `#${item.materialCardId}`}</td>
                  <td className="pos-mono">{item.qty}</td>
                  <td style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>{new Date(item.issuedDate).toLocaleDateString("uz-UZ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {returned.length === 0 && <div style={{ textAlign: "center", padding: 24, color: "var(--pos-text-muted)" }}>{t("common.noData")}</div>}
        </div>
      )}

      {!loading && tab === "history" && (
        <div className="pos-card" style={{ overflowX: "auto" }}>
          {histLoading && (
            <div style={{ textAlign: "center", padding: 32, color: "var(--pos-text-muted)" }}>Yuklanmoqda…</div>
          )}
          {!histLoading && history.length === 0 && (
            <div style={{ textAlign: "center", padding: 32, color: "var(--pos-text-muted)", fontSize: 13 }}>
              Yakunlangan harakatlar topilmadi
            </div>
          )}
          {!histLoading && history.length > 0 && (
            <table className="pos-table">
              <thead>
                <tr>
                  <th>Doc No</th>
                  <th>Tur</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Summa</th>
                  <th>Sana</th>
                </tr>
              </thead>
              <tbody>
                {history.map(m => (
                  <tr key={m.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/pos-monitor/movements/${m.id}`)}>
                    <td className="pos-mono" style={{ color: "var(--pos-accent)", fontWeight: 600 }}>
                      {m.movementNumber ?? `#${m.id}`}
                    </td>
                    <td>
                      <span className={`pos-badge ${MOV_TYPE_COLOR[m.movementType] ?? "pos-badge-gray"}`} style={{ fontSize: 10 }}>
                        {m.movementType}
                      </span>
                    </td>
                    <td>
                      <span className="pos-badge pos-badge-green" style={{ fontSize: 10 }}>{m.status}</span>
                    </td>
                    <td className="pos-mono" style={{ textAlign: "right", fontWeight: 600 }}>
                      {m.totalAmount != null ? new Intl.NumberFormat("uz-UZ").format(m.totalAmount) : "—"}
                    </td>
                    <td style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>
                      {new Date(m.createdAt).toLocaleDateString("uz-UZ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Return modal */}
      {returnModal && (
        <div className="pos-modal-overlay">
          <div className="pos-modal" style={{ maxWidth: 440 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>↩ {t("ledger.returnItem")}</div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 4, display: "block" }}>{t("ledger.returnQty")}</label>
              <input className="pos-input pos-mono" type="number" value={returnQty} onChange={e => setReturnQty(e.target.value)} placeholder={`Max: ${returnModal.item.qty}`} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 4, display: "block" }}>{t("ledger.returnReason")}</label>
              <textarea className="pos-input" rows={2} value={returnReason} onChange={e => setReturnReason(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="pos-btn pos-btn-ghost" onClick={() => setReturnModal(null)}>{t("common.cancel")}</button>
              <button className="pos-btn pos-btn-primary" onClick={() => void handleReturn()}>↩ {t("common.confirm")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
