/**
 * @module PosHandovers
 * @description POS Monitor — Smena-topshirish (2-imzo) aktlari. Topshiruvchi/qabul
 *   qiluvchi imzo tugmalari (from/to), bekor qilish (ConfirmDialog), foto-dalil URL,
 *   va qaytariladigan-tara (poddon/rohler) balansi. POS-DIZAYN (pos-theme: pos-btn /
 *   pos-modal / pos-badge / pos-input). API = pos-monitor.api.ts handoversApi (FE-P1).
 *   Q-43: yangi akt REAL saqlanadi (POST → BE → DB). Q-14: bekor qilish tasdiq bilan.
 */

import { useState, useEffect, useCallback } from "react";

import { handoversApi } from "../api/pos-monitor.api";

// ─── Tiplar (BE pos_shift_handovers qatoriga mos) ─────────────────────────────
interface HandoverItem {
  materialCardId?: number;
  quantity?: number;
  unit?: string;
  note?: string;
}

interface Handover {
  id: number;
  handover_number?: string;
  warehouse_id?: string | null;
  from_user_id?: number;
  to_user_id?: number;
  items?: HandoverItem[];
  notes?: string | null;
  photo_evidence_url?: string | null;
  status?: string;
  from_signed_at?: string | null;
  to_signed_at?: string | null;
  cancel_reason?: string | null;
  created_at?: string;
}

interface PalletBalanceRow {
  pallet_type?: string;
  counterparty_id?: number | null;
  issued?: number | string;
  returned?: number | string;
  outstanding?: number | string;
}

const STATUS_BADGE: Record<string, { cls: string; label: string }> = {
  draft:     { cls: "pos-badge-gray",   label: "Qoralama" },
  partial:   { cls: "pos-badge-yellow", label: "Qisman imzolangan" },
  closed:    { cls: "pos-badge-green",  label: "Yopilgan (2-imzo)" },
  cancelled: { cls: "pos-badge-red",    label: "Bekor qilingan" },
};

function num(v: number | string | undefined): number {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isFinite(n as number) ? (n as number) : 0;
}

export default function PosHandovers() {
  const [items, setItems] = useState<Handover[]>([]);
  const [pallets, setPallets] = useState<PalletBalanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Yangi akt formasi
  const [showCreate, setShowCreate] = useState(false);
  const [toUserId, setToUserId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [notes, setNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Bekor qilish tasdig'i (Q-14 ConfirmDialog)
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [hs, pb] = await Promise.all([
        handoversApi.getAll({ limit: 100 }),
        handoversApi.getPalletBalance(),
      ]);
      setItems(Array.isArray(hs) ? (hs as Handover[]) : []);
      setPallets(Array.isArray(pb) ? (pb as PalletBalanceRow[]) : []);
    } catch (e: unknown) {
      setError((e as Error).message ?? "Yuklashda xato");
      setItems([]);
      setPallets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleCreate() {
    const toUid = parseInt(toUserId, 10);
    if (!Number.isInteger(toUid) || toUid <= 0) {
      setError("Qabul qiluvchi (toUserId) to'g'ri kiritilishi shart");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await handoversApi.create({
        toUserId: toUid,
        warehouseId: warehouseId.trim() || undefined,
        notes: notes.trim() || undefined,
        photoEvidenceUrl: photoUrl.trim() || undefined,
        items: [],
      });
      setShowCreate(false);
      setToUserId(""); setWarehouseId(""); setNotes(""); setPhotoUrl("");
      void load();
    } catch (e: unknown) {
      setError((e as Error).message ?? "Saqlashda xato");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSign(id: number, role: "from" | "to") {
    setError("");
    try {
      await handoversApi.sign(id, { role });
      void load();
    } catch (e: unknown) {
      setError((e as Error).message ?? "Imzolashda xato");
    }
  }

  async function handleCancel() {
    if (cancelId === null) return;
    if (!cancelReason.trim()) { setError("Bekor qilish sababi shart"); return; }
    setSubmitting(true);
    setError("");
    try {
      await handoversApi.cancel(cancelId, cancelReason.trim());
      setCancelId(null);
      setCancelReason("");
      void load();
    } catch (e: unknown) {
      setError((e as Error).message ?? "Bekor qilishda xato");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>🤝 Smena topshirish (2-imzo)</h2>
        <div style={{ flex: 1 }} />
        <button className="pos-btn pos-btn-ghost" onClick={() => void load()}>🔄 Yangilash</button>
        <button className="pos-btn pos-btn-primary" onClick={() => { setShowCreate(true); setError(""); }}>
          ➕ Yangi akt
        </button>
      </div>

      {error && (
        <div className="pos-card" style={{ borderLeft: "3px solid var(--pos-danger)", color: "var(--pos-danger)", fontSize: 13, marginBottom: 16 }}>
          ❌ {error}
        </div>
      )}

      {/* ── Qaytariladigan-tara balansi ── */}
      <div className="pos-card" style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>📦 Qaytariladigan tara balansi (poddon / rohler)</div>
        {pallets.length === 0 ? (
          <div style={{ color: "var(--pos-text-muted)", fontSize: 13 }}>Tara yozuvi yo'q.</div>
        ) : (
          <table className="pos-table">
            <thead>
              <tr>
                <th>Tara turi</th>
                <th>Kontragent</th>
                <th style={{ textAlign: "right" }}>Berilgan</th>
                <th style={{ textAlign: "right" }}>Qaytgan</th>
                <th style={{ textAlign: "right" }}>Qoldiq (qarz)</th>
              </tr>
            </thead>
            <tbody>
              {pallets.map((p, i) => {
                const outstanding = num(p.outstanding);
                return (
                  <tr key={`${p.pallet_type}-${p.counterparty_id}-${i}`}>
                    <td style={{ fontWeight: 600 }}>{p.pallet_type ?? "—"}</td>
                    <td>{p.counterparty_id ?? "—"}</td>
                    <td style={{ textAlign: "right" }}>{num(p.issued)}</td>
                    <td style={{ textAlign: "right" }}>{num(p.returned)}</td>
                    <td style={{ textAlign: "right" }}>
                      <span className={`pos-badge ${outstanding > 0 ? "pos-badge-red" : "pos-badge-green"}`}>
                        {outstanding}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Aktlar ro'yxati ── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--pos-text-muted)" }}>Yuklanmoqda...</div>
      ) : items.length === 0 ? (
        <div className="pos-card" style={{ textAlign: "center", padding: 48, color: "var(--pos-text-muted)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🤝</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Smena-topshirish akti yo'q</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>"Yangi akt" tugmasi orqali topshiriq oching.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map(h => {
            const st = STATUS_BADGE[h.status ?? "draft"] ?? STATUS_BADGE.draft;
            const fromSigned = !!h.from_signed_at;
            const toSigned = !!h.to_signed_at;
            const isClosed = h.status === "closed";
            const isCancelled = h.status === "cancelled";
            return (
              <div key={h.id} className="pos-card pos-fade-in">
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>
                        {h.handover_number ?? `Akt #${h.id}`}
                      </span>
                      <span className={`pos-badge ${st.cls}`}>{st.label}</span>
                    </div>
                    <div style={{ display: "flex", gap: 24, marginTop: 8, fontSize: 13, color: "var(--pos-text-muted)", flexWrap: "wrap" }}>
                      {h.warehouse_id && <span>🏭 {h.warehouse_id}</span>}
                      <span>↗️ Topshiruvchi: #{h.from_user_id ?? "—"}</span>
                      <span>↘️ Qabul: #{h.to_user_id ?? "—"}</span>
                      <span>📋 {Array.isArray(h.items) ? h.items.length : 0} pozitsiya</span>
                    </div>
                    {/* Imzo holati */}
                    <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 12 }}>
                      <span style={{ color: fromSigned ? "var(--pos-success)" : "var(--pos-text-muted)" }}>
                        {fromSigned ? "✅" : "⬜"} Topshiruvchi imzosi
                      </span>
                      <span style={{ color: toSigned ? "var(--pos-success)" : "var(--pos-text-muted)" }}>
                        {toSigned ? "✅" : "⬜"} Qabul qiluvchi imzosi
                      </span>
                    </div>
                    {h.notes && <div style={{ marginTop: 8, fontSize: 13 }}>📝 {h.notes}</div>}
                    {h.photo_evidence_url && (
                      <a
                        href={h.photo_evidence_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ marginTop: 6, display: "inline-block", fontSize: 12, color: "var(--pos-accent)" }}
                      >
                        📷 Foto-dalil
                      </a>
                    )}
                    {isCancelled && h.cancel_reason && (
                      <div style={{ marginTop: 8, fontSize: 12, color: "var(--pos-danger)" }}>
                        Bekor sababi: {h.cancel_reason}
                      </div>
                    )}
                  </div>

                  {/* Amallar */}
                  {!isClosed && !isCancelled && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                      <button
                        className="pos-btn pos-btn-ghost"
                        disabled={fromSigned}
                        onClick={() => void handleSign(h.id, "from")}
                      >
                        ✍️ Topshiruvchi imzo
                      </button>
                      <button
                        className="pos-btn pos-btn-primary"
                        disabled={toSigned}
                        onClick={() => void handleSign(h.id, "to")}
                      >
                        ✍️ Qabul imzo
                      </button>
                      <button
                        className="pos-btn pos-btn-ghost"
                        style={{ color: "var(--pos-danger)" }}
                        onClick={() => { setCancelId(h.id); setCancelReason(""); setError(""); }}
                      >
                        🚫 Bekor qilish
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Yangi akt modal (Q-43 real saqlash) ── */}
      {showCreate && (
        <div className="pos-modal-overlay" onClick={() => !submitting && setShowCreate(false)}>
          <div className="pos-modal" style={{ minWidth: 420, maxWidth: "92vw" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>➕ Yangi smena-topshirish akti</div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "var(--pos-text-muted)", marginBottom: 4, display: "block" }}>
                Qabul qiluvchi (foydalanuvchi ID) *
              </label>
              <input
                className="pos-input"
                style={{ width: "100%" }}
                type="number"
                inputMode="numeric"
                placeholder="masalan: 12"
                value={toUserId}
                onChange={e => setToUserId(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "var(--pos-text-muted)", marginBottom: 4, display: "block" }}>Ombor (ixtiyoriy)</label>
              <input
                className="pos-input"
                style={{ width: "100%" }}
                placeholder="ombor kodi / ID"
                value={warehouseId}
                onChange={e => setWarehouseId(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "var(--pos-text-muted)", marginBottom: 4, display: "block" }}>Foto-dalil URL (ixtiyoriy)</label>
              <input
                className="pos-input"
                style={{ width: "100%" }}
                placeholder="https://..."
                value={photoUrl}
                onChange={e => setPhotoUrl(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "var(--pos-text-muted)", marginBottom: 4, display: "block" }}>Izoh (ixtiyoriy)</label>
              <textarea
                className="pos-input"
                style={{ width: "100%", minHeight: 70, resize: "vertical" }}
                placeholder="Smena holati, qoldiq, eslatma..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            {error && <div style={{ color: "var(--pos-danger)", fontSize: 13, marginBottom: 12 }}>❌ {error}</div>}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="pos-btn pos-btn-ghost" disabled={submitting} onClick={() => setShowCreate(false)}>Bekor</button>
              <button className="pos-btn pos-btn-primary" disabled={submitting} onClick={() => void handleCreate()}>
                {submitting ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bekor qilish tasdig'i (Q-14) ── */}
      {cancelId !== null && (
        <div className="pos-modal-overlay" onClick={() => !submitting && setCancelId(null)}>
          <div className="pos-modal" style={{ minWidth: 380, maxWidth: "92vw" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: "var(--pos-danger)" }}>🚫 Aktni bekor qilish</div>
            <div style={{ fontSize: 13, color: "var(--pos-text-muted)", marginBottom: 12 }}>
              Bu amalni qaytarib bo'lmaydi. Bekor qilish sababini kiriting.
            </div>
            <textarea
              className="pos-input"
              style={{ width: "100%", minHeight: 70, resize: "vertical", marginBottom: 12 }}
              placeholder="Bekor qilish sababi *"
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
            />
            {error && <div style={{ color: "var(--pos-danger)", fontSize: 13, marginBottom: 12 }}>❌ {error}</div>}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="pos-btn pos-btn-ghost" disabled={submitting} onClick={() => setCancelId(null)}>Yopish</button>
              <button
                className="pos-btn pos-btn-primary"
                style={{ background: "var(--pos-danger)", borderColor: "var(--pos-danger)" }}
                disabled={submitting || !cancelReason.trim()}
                onClick={() => void handleCancel()}
              >
                {submitting ? "Bekor qilinmoqda..." : "Bekor qilish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
