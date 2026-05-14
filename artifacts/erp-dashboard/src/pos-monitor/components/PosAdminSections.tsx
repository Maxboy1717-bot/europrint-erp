/**
 * @module PosAdminSections
 * @description React UI component.
 */

import { glApi } from "../api/pos-monitor.api";
import { apiRequest } from "@/lib/queryClient";

import { useTranslation } from '@/lib/i18n';
/**
 * Universal safe array helper — backend turli format yuborsa ham
 * ([] | {items:[]} | {data:[]} | undefined | null) → har doim T[].
 * TypeError himoyasi.
 */
function safeArr<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.results)) return obj.results as T[];
    if (Array.isArray(obj.rows)) return obj.rows as T[];
  }
  return [];
}

export interface Warehouse  { id: number; name: string; code?: string; isActive?: boolean; warehouseType?: string; }
export interface Category   { id: number; name: string; code?: string; description?: string; }
export interface Unit       { id: number; name: string; symbol?: string; unitType?: string; }
export interface Supplier   { id: number; supplierName?: string; totalOrders?: number; avgLeadDays?: number; rating?: number; }
export interface Printer    { id: number; name: string; ipAddress?: string; port?: number; isDefault?: boolean; isActive?: boolean; }
export interface GlLog      { id: number; movementId: number; stageName: string; status: string; glEntries: Array<{ accountCode?: string; debit?: number; credit?: number }>; createdAt?: string; }
export interface AuditEntry { id: number; action: string; resource?: string; userId?: number; createdAt?: string; ipAddress?: string; }
export interface SyncStatus { total: number; pending: number; synced: number; conflict: number; }

export function SectionHeader({ title, onRefresh }: { title: string; onRefresh: () => void }) { return ( <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}> <div style={{ fontWeight: 600, fontSize: 15 }}>{title}</div> <button className="pos-btn pos-btn-ghost" style={{ fontSize: 12 }} onClick={onRefresh}>🔄 Yangilash</button> </div> ); } export function LoadingOrError({ loading, error }: { loading: boolean; error: string }) { if (loading) return <div style={{ textAlign: "center", padding: 32, color: "var(--pos-text-muted)" }}>Yuklanmoqda…</div>; if (error) return <div style={{ textAlign: "center", padding: 16, color: "var(--pos-danger)", fontSize: 13 }}>{error}</div>; return null; } export function WarehousesSection({ data, loading, error, onRefresh, onToggle }: { data: Warehouse[] | null; loading: boolean; error: string; onRefresh: () => void; onToggle: (id: number, active: boolean) => void; }) {
  const { t } = useTranslation('common');
  return (
    <div className="pos-card">
      <SectionHeader title="Omborlar" onRefresh={onRefresh} />
      <LoadingOrError loading={loading} error={error} />
      {!loading && !error && (
        <table className="pos-table">
          <thead><tr><th>Kod</th><th>Nomi</th><th>Turi</th><th>Holat</th><th>Amal</th></tr></thead>
          <tbody>
            {safeArr<Warehouse>(data).map(w => (
              <tr key={w.id}>
                <td className="pos-mono" style={{ color: "var(--pos-accent)" }}>{w.code ?? `#${w.id}`}</td>
                <td style={{ fontWeight: 500 }}>{w.name}</td>
                <td style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>{w.warehouseType ?? "—"}</td>
                <td><span className={`pos-badge ${w.isActive !== false ? "pos-badge-green" : "pos-badge-red"}`} style={{ fontSize: 10 }}>{w.isActive !== false ? "Faol" : "Nofaol"}</span></td>
                <td><button className="pos-btn pos-btn-ghost" style={{ fontSize: 11, padding: "3px 8px" }} onClick={() => onToggle(w.id, w.isActive !== false)}>{w.isActive !== false ? "O'chirish" : "Yoqish"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!loading && !error && safeArr<Warehouse>(data).length === 0 && <div style={{ textAlign: "center", padding: 24, color: "var(--pos-text-muted)", fontSize: 13 }}>Omborlar topilmadi</div>}
    </div>
  );
}

export function CategoriesSection({ data, loading, error, onRefresh }: { data: Category[] | null; loading: boolean; error: string; onRefresh: () => void }) {
  return (
    <div className="pos-card">
      <SectionHeader title="Kategoriyalar" onRefresh={onRefresh} />
      <LoadingOrError loading={loading} error={error} />
      {!loading && !error && (
        <table className="pos-table">
          <thead><tr><th>ID</th><th>Nomi</th><th>Kod</th><th>Tavsif</th></tr></thead>
          <tbody>
            {safeArr(data).map(c => (
              <tr key={c.id}>
                <td className="pos-mono" style={{ color: "var(--pos-accent)" }}>#{c.id}</td>
                <td style={{ fontWeight: 500 }}>{c.name}</td>
                <td className="pos-mono" style={{ fontSize: 12 }}>{c.code ?? "—"}</td>
                <td style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>{c.description ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!loading && !error && safeArr(data).length === 0 && <div style={{ textAlign: "center", padding: 24, color: "var(--pos-text-muted)", fontSize: 13 }}>Kategoriyalar topilmadi</div>}
    </div>
  );
}

export function UnitsSection({ data, loading, error, onRefresh }: { data: Unit[] | null; loading: boolean; error: string; onRefresh: () => void }) {
  return (
    <div className="pos-card">
      <SectionHeader title="O'lchov birliklari" onRefresh={onRefresh} />
      <LoadingOrError loading={loading} error={error} />
      {!loading && !error && (
        <table className="pos-table">
          <thead><tr><th>ID</th><th>Nomi</th><th>Belgi</th><th>Turi</th></tr></thead>
          <tbody>
            {safeArr(data).map(u => (
              <tr key={u.id}>
                <td className="pos-mono" style={{ color: "var(--pos-accent)" }}>#{u.id}</td>
                <td style={{ fontWeight: 500 }}>{u.name}</td>
                <td className="pos-mono" style={{ fontSize: 13 }}>{u.symbol ?? "—"}</td>
                <td style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>{u.unitType ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!loading && !error && safeArr(data).length === 0 && <div style={{ textAlign: "center", padding: 24, color: "var(--pos-text-muted)", fontSize: 13 }}>O'lchov birliklari topilmadi</div>}
    </div>
  );
}

export function SuppliersSection({ data, loading, error, onRefresh }: { data: Supplier[] | null; loading: boolean; error: string; onRefresh: () => void }) {
  return (
    <div className="pos-card">
      <SectionHeader title="Yetkazuvchilar" onRefresh={onRefresh} />
      <LoadingOrError loading={loading} error={error} />
      {!loading && !error && (
        <table className="pos-table">
          <thead><tr><th>ID</th><th>Yetkazuvchi</th><th>Buyurtmalar</th><th>O'rtacha yetkazish</th><th>Reyting</th></tr></thead>
          <tbody>
            {safeArr(data).map((s, i) => (
              <tr key={`${s.id}-${i}`}>
                <td className="pos-mono" style={{ color: "var(--pos-accent)" }}>#{s.id}</td>
                <td style={{ fontWeight: 500 }}>{s.supplierName ?? "—"}</td>
                <td>{s.totalOrders ?? 0}</td>
                <td style={{ fontSize: 12 }}>{s.avgLeadDays != null ? `${s.avgLeadDays} kun` : "—"}</td>
                <td>{s.rating != null ? <span className={`pos-badge ${s.rating >= 4 ? "pos-badge-green" : s.rating >= 3 ? "pos-badge-yellow" : "pos-badge-red"}`} style={{ fontSize: 10 }}>{s.rating.toFixed(1)} ★</span> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!loading && !error && safeArr(data).length === 0 && <div style={{ textAlign: "center", padding: 24, color: "var(--pos-text-muted)", fontSize: 13 }}>Yetkazuvchilar topilmadi</div>}
    </div>
  );
}

export function TerminalsSection({ data, loading, error, onRefresh }: { data: SyncStatus | null; loading: boolean; error: string; onRefresh: () => void }) {
  return (
    <div className="pos-card">
      <SectionHeader title="Terminallar" onRefresh={onRefresh} />
      <LoadingOrError loading={loading} error={error} />
      {!loading && !error && data && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
            {([
              { label: "Jami",       value: data.total,    color: "var(--pos-accent)" },
              { label: "Kutayotgan", value: data.pending,  color: "var(--pos-warning)" },
              { label: "Sinxron",    value: data.synced,   color: "var(--pos-success)" },
              { label: "Ziddiyat",   value: data.conflict, color: "var(--pos-danger)" },
            ] as const).map(({ label, value, color }) => (
              <div key={label} style={{ background: "rgba(0,212,255,0.04)", border: "1px solid var(--pos-border)", borderRadius: 10, padding: "16px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
                <div style={{ fontSize: 12, color: "var(--pos-text-muted)", marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 13, color: "var(--pos-text-muted)", textAlign: "center" }}>
            Terminal holati real vaqt sinxronizatsiya navbati orqali kuzatiladi.
          </div>
        </div>
      )}
    </div>
  );
}

export function PrintersSection({ data, loading, error, onRefresh }: { data: Printer[] | null; loading: boolean; error: string; onRefresh: () => void }) {
  return (
    <div className="pos-card">
      <SectionHeader title="Printerlar" onRefresh={onRefresh} />
      <LoadingOrError loading={loading} error={error} />
      {!loading && !error && (
        <table className="pos-table">
          <thead><tr><th>Nomi</th><th>IP manzil</th><th>Port</th><th>Standart</th><th>Holat</th></tr></thead>
          <tbody>
            {safeArr(data).map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 500 }}>{p.name}</td>
                <td className="pos-mono">{p.ipAddress ?? "—"}</td>
                <td className="pos-mono">{p.port ?? "—"}</td>
                <td>{p.isDefault ? <span className="pos-badge pos-badge-green" style={{ fontSize: 10 }}>Ha</span> : "—"}</td>
                <td><span className={`pos-badge ${p.isActive !== false ? "pos-badge-green" : "pos-badge-red"}`} style={{ fontSize: 10 }}>{p.isActive !== false ? "Faol" : "Nofaol"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!loading && !error && safeArr(data).length === 0 && <div style={{ textAlign: "center", padding: 24, color: "var(--pos-text-muted)", fontSize: 13 }}>Printerlar sozlanmagan</div>}
    </div>
  );
}

export function GlMappingSection({ data, loading, error, onRefresh, onApprove }: {
  data: GlLog[] | null; loading: boolean; error: string;
  onRefresh: () => void; onApprove: (id: number) => void;
}) {
  return (
    <div className="pos-card">
      <SectionHeader title="GL Mapping — Kutayotgan postinglar" onRefresh={onRefresh} />
      <LoadingOrError loading={loading} error={error} />
      {!loading && !error && (
        <table className="pos-table">
          <thead><tr><th>Harakat</th><th>Bosqich</th><th>Yozuvlar</th><th>{"Holat"}</th><th>Amal</th></tr></thead>
          <tbody>
            {safeArr(data).map(g => (
              <tr key={g.id}>
                <td className="pos-mono" style={{ color: "var(--pos-accent)" }}>#{g.movementId}</td>
                <td style={{ fontSize: 12 }}>{g.stageName}</td>
                <td style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>
                  {g.glEntries.slice(0, 2).map((e, i) => (
                    <span key={`${e.accountCode ?? "e"}-${i}`}>{e.accountCode ?? "—"}{e.debit ? ` D:${e.debit}` : ""}{e.credit ? ` C:${e.credit}` : ""} </span>
                  ))}
                </td>
                <td><span className="pos-badge pos-badge-yellow" style={{ fontSize: 10 }}>{g.status}</span></td>
                <td><button className="pos-btn pos-btn-success" style={{ fontSize: 11, padding: "3px 8px" }} onClick={() => onApprove(g.id)}>✅ Post</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!loading && !error && safeArr(data).length === 0 && <div style={{ textAlign: "center", padding: 24, color: "var(--pos-text-muted)" }}>Kutayotgan GL postinglar yo'q</div>}
    </div>
  );
}

export function AuditLogSection({ data, loading, error, onRefresh }: { data: AuditEntry[] | null; loading: boolean; error: string; onRefresh: () => void }) {
  return (
    <div className="pos-card">
      <SectionHeader title={"Audit log"} onRefresh={onRefresh} />
      <LoadingOrError loading={loading} error={error} />
      {!loading && !error && (
        <table className="pos-table">
          <thead><tr><th>Vaqt</th><th>Amal</th><th>Resurs</th><th>IP</th></tr></thead>
          <tbody>
            {safeArr(data).map(a => (
              <tr key={a.id}>
                <td style={{ fontSize: 11, color: "var(--pos-text-muted)", whiteSpace: "nowrap" }}>{a.createdAt ? new Date(a.createdAt).toLocaleString("uz-UZ") : "—"}</td>
                <td><span className="pos-badge pos-badge-gray" style={{ fontSize: 10 }}>{a.action}</span></td>
                <td style={{ fontSize: 12 }}>{a.resource ?? "—"}</td>
                <td className="pos-mono" style={{ fontSize: 11 }}>{a.ipAddress ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!loading && !error && safeArr(data).length === 0 && <div style={{ textAlign: "center", padding: 24, color: "var(--pos-text-muted)" }}>Audit yozuvlari mavjud emas.</div>}
    </div>
  );
}

export function fetchWarehouses() { return apiRequest<Warehouse[]>("GET", "/api/wms/warehouses"); }
export function fetchCategories() { return apiRequest<Category[]>("GET", "/api/admin/categories"); }
export function fetchUnits()      { return apiRequest<Unit[]>("GET", "/api/europrint-control/units"); }
export function fetchSuppliers()  { return apiRequest<Supplier[]>("GET", "/api/mm/supplier-performance"); }
export function fetchAuditLog()   { return apiRequest<AuditEntry[]>("GET", "/api/admin/audit?limit=50"); }
export function approveGlEntry(id: number) { return glApi.approve(id); }
