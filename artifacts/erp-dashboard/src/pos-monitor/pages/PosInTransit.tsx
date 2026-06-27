/**
 * @module PosInTransit
 * @description POS Monitor — Import xom-ashyo YO'LDA jo'natmalari + import hujjatlari
 *   (GTD/invoys/sertifikat). Holat o'tishi: shipped → customs → arrived (yoki cancel).
 *   POS-DIZAYN (pos-theme: pos-btn / pos-modal / pos-badge / pos-input). API =
 *   pos-monitor.api.ts inTransitShipmentsApi (FE-P1, kanonik BE yo'liga mos).
 *   Q-43: yangi jo'natma REAL saqlanadi (POST → BE → DB). Q-14: bekor qilish tasdiq bilan.
 */

import { useState, useEffect, useCallback } from "react";

import { inTransitShipmentsApi } from "../api/pos-monitor.api";

// ─── Tiplar (BE wms_in_transit_shipments / wms_import_documents qatoriga mos) ──
interface Shipment {
  id: number;
  shipment_number?: string;
  supplier_name?: string | null;
  origin_country?: string | null;
  status?: string;
  eta?: string | null;
  shipped_date?: string | null;
  customs_date?: string | null;
  arrived_date?: string | null;
  currency?: string | null;
  declared_value?: number | string | null;
  incoterm?: string | null;
  invoice_number?: string | null;
  notes?: string | null;
}

interface ImportDocument {
  id: number;
  doc_type?: string;
  doc_number?: string | null;
  file_url?: string | null;
  issued_date?: string | null;
  notes?: string | null;
}

const STATUS_BADGE: Record<string, { cls: string; label: string; icon: string }> = {
  shipped:   { cls: "pos-badge-blue",   label: "Yo'lda",       icon: "🚢" },
  customs:   { cls: "pos-badge-yellow", label: "Bojxonada",    icon: "🛃" },
  arrived:   { cls: "pos-badge-green",  label: "Yetib keldi",  icon: "✅" },
  cancelled: { cls: "pos-badge-red",    label: "Bekor",        icon: "🚫" },
};

const DOC_TYPES = ["GTD", "invoice", "cert", "packing_list", "other"] as const;

export default function PosInTransit() {
  const [items, setItems] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Yangi jo'natma formasi
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    shipment_number: "", supplier_name: "", origin_country: "",
    eta: "", currency: "USD", declared_value: "", incoterm: "", invoice_number: "", notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Hujjatlar paneli
  const [docsFor, setDocsFor] = useState<number | null>(null);
  const [docs, setDocs] = useState<ImportDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docForm, setDocForm] = useState({ doc_type: "GTD", doc_number: "", file_url: "", issued_date: "" });

  // Bekor qilish tasdig'i (Q-14)
  const [cancelId, setCancelId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await inTransitShipmentsApi.list(statusFilter || undefined);
      const list = r && Array.isArray((r as { items?: unknown[] }).items) ? (r as { items: Shipment[] }).items : [];
      setItems(list);
    } catch (e: unknown) {
      setError((e as Error).message ?? "Yuklashda xato");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { void load(); }, [load]);

  function upd(k: keyof typeof form, v: string) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function handleCreate() {
    if (!form.shipment_number.trim()) { setError("Jo'natma raqami shart"); return; }
    setSubmitting(true);
    setError("");
    try {
      const body: Record<string, unknown> = { shipment_number: form.shipment_number.trim() };
      if (form.supplier_name.trim())   body.supplier_name = form.supplier_name.trim();
      if (form.origin_country.trim())  body.origin_country = form.origin_country.trim();
      if (form.eta.trim())             body.eta = form.eta.trim();
      if (form.currency.trim())        body.currency = form.currency.trim();
      if (form.declared_value.trim())  body.declared_value = parseFloat(form.declared_value);
      if (form.incoterm.trim())        body.incoterm = form.incoterm.trim();
      if (form.invoice_number.trim())  body.invoice_number = form.invoice_number.trim();
      if (form.notes.trim())           body.notes = form.notes.trim();
      await inTransitShipmentsApi.create(body);
      setShowCreate(false);
      setForm({ shipment_number: "", supplier_name: "", origin_country: "", eta: "", currency: "USD", declared_value: "", incoterm: "", invoice_number: "", notes: "" });
      void load();
    } catch (e: unknown) {
      setError((e as Error).message ?? "Saqlashda xato");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTransition(id: number, to: "customs" | "arrived") {
    setError("");
    try {
      if (to === "customs") await inTransitShipmentsApi.markCustoms(id);
      else await inTransitShipmentsApi.markArrived(id);
      void load();
    } catch (e: unknown) {
      setError((e as Error).message ?? "Holat o'zgartirishda xato");
    }
  }

  async function handleCancel() {
    if (cancelId === null) return;
    setSubmitting(true);
    setError("");
    try {
      await inTransitShipmentsApi.cancel(cancelId);
      setCancelId(null);
      void load();
    } catch (e: unknown) {
      setError((e as Error).message ?? "Bekor qilishda xato");
    } finally {
      setSubmitting(false);
    }
  }

  const loadDocs = useCallback(async (id: number) => {
    setDocsLoading(true);
    try {
      const r = await inTransitShipmentsApi.listDocuments(id);
      const list = r && Array.isArray((r as { items?: unknown[] }).items) ? (r as { items: ImportDocument[] }).items : [];
      setDocs(list);
    } catch { setDocs([]); } finally { setDocsLoading(false); }
  }, []);

  function openDocs(id: number) {
    setDocsFor(id);
    setDocForm({ doc_type: "GTD", doc_number: "", file_url: "", issued_date: "" });
    setError("");
    void loadDocs(id);
  }

  async function handleAddDoc() {
    if (docsFor === null) return;
    setSubmitting(true);
    setError("");
    try {
      const body: Record<string, unknown> = { doc_type: docForm.doc_type };
      if (docForm.doc_number.trim())  body.doc_number = docForm.doc_number.trim();
      if (docForm.file_url.trim())    body.file_url = docForm.file_url.trim();
      if (docForm.issued_date.trim()) body.issued_date = docForm.issued_date.trim();
      await inTransitShipmentsApi.addDocument(docsFor, body);
      setDocForm({ doc_type: "GTD", doc_number: "", file_url: "", issued_date: "" });
      void loadDocs(docsFor);
    } catch (e: unknown) {
      setError((e as Error).message ?? "Hujjat qo'shishda xato");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>🚢 Import — Yo'ldagi jo'natmalar</h2>
        <div style={{ flex: 1 }} />
        <select
          className="pos-input"
          style={{ width: 160 }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">Barcha holat</option>
          <option value="shipped">Yo'lda</option>
          <option value="customs">Bojxonada</option>
          <option value="arrived">Yetib keldi</option>
          <option value="cancelled">Bekor</option>
        </select>
        <button className="pos-btn pos-btn-ghost" onClick={() => void load()}>🔄 Yangilash</button>
        <button className="pos-btn pos-btn-primary" onClick={() => { setShowCreate(true); setError(""); }}>
          ➕ Yangi jo'natma
        </button>
      </div>

      {error && (
        <div className="pos-card" style={{ borderLeft: "3px solid var(--pos-danger)", color: "var(--pos-danger)", fontSize: 13, marginBottom: 16 }}>
          ❌ {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--pos-text-muted)" }}>Yuklanmoqda...</div>
      ) : items.length === 0 ? (
        <div className="pos-card" style={{ textAlign: "center", padding: 48, color: "var(--pos-text-muted)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🚢</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Yo'lda jo'natma yo'q</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>"Yangi jo'natma" tugmasi orqali import yuk qo'shing.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map(s => {
            const st = STATUS_BADGE[s.status ?? "shipped"] ?? STATUS_BADGE.shipped;
            const isActive = s.status !== "arrived" && s.status !== "cancelled";
            return (
              <div key={s.id} className="pos-card pos-fade-in">
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{s.shipment_number ?? `Jo'natma #${s.id}`}</span>
                      <span className={`pos-badge ${st.cls}`}>{st.icon} {st.label}</span>
                    </div>
                    <div style={{ display: "flex", gap: 24, marginTop: 8, fontSize: 13, color: "var(--pos-text-muted)", flexWrap: "wrap" }}>
                      {s.supplier_name && <span>🏭 {s.supplier_name}</span>}
                      {s.origin_country && <span>🌍 {s.origin_country}</span>}
                      {s.incoterm && <span>📑 {s.incoterm}</span>}
                      {s.declared_value != null && <span>💰 {s.declared_value} {s.currency ?? ""}</span>}
                      {s.eta && <span>📅 ETA: {String(s.eta).slice(0, 10)}</span>}
                    </div>
                    {s.invoice_number && <div style={{ marginTop: 6, fontSize: 12, color: "var(--pos-text-muted)" }}>Invoys: {s.invoice_number}</div>}
                    {s.notes && <div style={{ marginTop: 6, fontSize: 13 }}>📝 {s.notes}</div>}
                  </div>

                  {/* Amallar */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                    <button className="pos-btn pos-btn-ghost" onClick={() => openDocs(s.id)}>📄 Hujjatlar</button>
                    {isActive && s.status === "shipped" && (
                      <button className="pos-btn pos-btn-ghost" onClick={() => void handleTransition(s.id, "customs")}>🛃 Bojxonaga</button>
                    )}
                    {isActive && s.status === "customs" && (
                      <button className="pos-btn pos-btn-primary" onClick={() => void handleTransition(s.id, "arrived")}>✅ Yetib keldi</button>
                    )}
                    {isActive && (
                      <button
                        className="pos-btn pos-btn-ghost"
                        style={{ color: "var(--pos-danger)" }}
                        onClick={() => { setCancelId(s.id); setError(""); }}
                      >
                        🚫 Bekor qilish
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Yangi jo'natma modal (Q-43 real saqlash) ── */}
      {showCreate && (
        <div className="pos-modal-overlay" onClick={() => !submitting && setShowCreate(false)}>
          <div className="pos-modal" style={{ minWidth: 460, maxWidth: "94vw" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>➕ Yangi import jo'natmasi</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Jo'natma raqami *" value={form.shipment_number} onChange={v => upd("shipment_number", v)} placeholder="SHIP-2026-001" />
              <Field label="Yetkazib beruvchi" value={form.supplier_name} onChange={v => upd("supplier_name", v)} placeholder="Supplier nomi" />
              <Field label="Kelib chiqqan davlat" value={form.origin_country} onChange={v => upd("origin_country", v)} placeholder="CN / TR / ..." />
              <Field label="ETA (sana)" value={form.eta} onChange={v => upd("eta", v)} placeholder="2026-07-01" type="date" />
              <Field label="Valyuta" value={form.currency} onChange={v => upd("currency", v)} placeholder="USD" />
              <Field label="Deklaratsiya qiymati" value={form.declared_value} onChange={v => upd("declared_value", v)} placeholder="0" type="number" />
              <Field label="Incoterm" value={form.incoterm} onChange={v => upd("incoterm", v)} placeholder="FOB / CIF / ..." />
              <Field label="Invoys raqami" value={form.invoice_number} onChange={v => upd("invoice_number", v)} placeholder="INV-..." />
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 12, color: "var(--pos-text-muted)", marginBottom: 4, display: "block" }}>Izoh</label>
              <textarea
                className="pos-input"
                style={{ width: "100%", minHeight: 60, resize: "vertical" }}
                value={form.notes}
                onChange={e => upd("notes", e.target.value)}
              />
            </div>

            {error && <div style={{ color: "var(--pos-danger)", fontSize: 13, marginTop: 12 }}>❌ {error}</div>}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
              <button className="pos-btn pos-btn-ghost" disabled={submitting} onClick={() => setShowCreate(false)}>Bekor</button>
              <button className="pos-btn pos-btn-primary" disabled={submitting} onClick={() => void handleCreate()}>
                {submitting ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Hujjatlar paneli (ko'rish + qo'shish) ── */}
      {docsFor !== null && (
        <div className="pos-modal-overlay" onClick={() => !submitting && setDocsFor(null)}>
          <div className="pos-modal" style={{ minWidth: 480, maxWidth: "94vw" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>📄 Import hujjatlari</div>
              <div style={{ flex: 1 }} />
              <button className="pos-btn pos-btn-ghost" onClick={() => setDocsFor(null)}>✕</button>
            </div>

            {docsLoading ? (
              <div style={{ color: "var(--pos-text-muted)", fontSize: 13, padding: 16 }}>Yuklanmoqda...</div>
            ) : docs.length === 0 ? (
              <div style={{ color: "var(--pos-text-muted)", fontSize: 13, marginBottom: 12 }}>Hujjat biriktirilmagan.</div>
            ) : (
              <table className="pos-table" style={{ marginBottom: 16 }}>
                <thead>
                  <tr><th>Tur</th><th>Raqam</th><th>Sana</th><th>Fayl</th></tr>
                </thead>
                <tbody>
                  {docs.map(d => (
                    <tr key={d.id}>
                      <td><span className="pos-badge pos-badge-gray">{d.doc_type}</span></td>
                      <td>{d.doc_number ?? "—"}</td>
                      <td>{d.issued_date ? String(d.issued_date).slice(0, 10) : "—"}</td>
                      <td>
                        {d.file_url
                          ? <a href={d.file_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--pos-accent)" }}>Ochish</a>
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Hujjat qo'shish */}
            <div style={{ borderTop: "1px solid var(--pos-border)", paddingTop: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>➕ Hujjat qo'shish</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: "var(--pos-text-muted)", marginBottom: 4, display: "block" }}>Tur</label>
                  <select className="pos-input" style={{ width: "100%" }} value={docForm.doc_type} onChange={e => setDocForm(p => ({ ...p, doc_type: e.target.value }))}>
                    {DOC_TYPES.map(dt => <option key={dt} value={dt}>{dt}</option>)}
                  </select>
                </div>
                <Field label="Raqam" value={docForm.doc_number} onChange={v => setDocForm(p => ({ ...p, doc_number: v }))} placeholder="hujjat raqami" />
                <Field label="Sana" value={docForm.issued_date} onChange={v => setDocForm(p => ({ ...p, issued_date: v }))} type="date" />
                <Field label="Fayl URL" value={docForm.file_url} onChange={v => setDocForm(p => ({ ...p, file_url: v }))} placeholder="https://..." />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                <button className="pos-btn pos-btn-primary" disabled={submitting} onClick={() => void handleAddDoc()}>
                  {submitting ? "Saqlanmoqda..." : "Qo'shish"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Bekor qilish tasdig'i (Q-14) ── */}
      {cancelId !== null && (
        <div className="pos-modal-overlay" onClick={() => !submitting && setCancelId(null)}>
          <div className="pos-modal" style={{ minWidth: 360, maxWidth: "92vw" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: "var(--pos-danger)" }}>🚫 Jo'natmani bekor qilish</div>
            <div style={{ fontSize: 13, color: "var(--pos-text-muted)", marginBottom: 16 }}>
              Bu jo'natma bekor qilinadi. Davom etasizmi?
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="pos-btn pos-btn-ghost" disabled={submitting} onClick={() => setCancelId(null)}>Yo'q</button>
              <button
                className="pos-btn pos-btn-primary"
                style={{ background: "var(--pos-danger)", borderColor: "var(--pos-danger)" }}
                disabled={submitting}
                onClick={() => void handleCancel()}
              >
                {submitting ? "Bekor qilinmoqda..." : "Ha, bekor qil"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Kichik input helper ──────────────────────────────────────────────────────
function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label style={{ fontSize: 12, color: "var(--pos-text-muted)", marginBottom: 4, display: "block" }}>{props.label}</label>
      <input
        className="pos-input"
        style={{ width: "100%" }}
        type={props.type ?? "text"}
        placeholder={props.placeholder}
        value={props.value}
        onChange={e => props.onChange(e.target.value)}
      />
    </div>
  );
}
