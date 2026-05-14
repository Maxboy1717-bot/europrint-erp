/**
 * PosWarehouseDetail.tsx
 *
 * Ombor detail sahifasi — 6 ta tab:
 *   📦 Stok (o'lchov birligi bo'yicha guruhlangan)
 *   📥 Kirim (faqat shu ombor uchun)
 *   📤 Chiqim (faqat shu ombor uchun)
 *   🔬 Karantin / QC
 *   👥 Xodimlar
 *   🗂 Zonalar / Bin
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { usePosI18n } from "../i18n/usePosI18n";
import { warehousesApi, warehouseFeaturesApi } from "../api/pos-monitor.api";
import { useTranslation } from '@/lib/i18n';

interface WarehouseEmployee {
  id: number; userId: number; username: string; fullName: string;
  role: string; isPrimary: boolean; assignedAt: string;
}

interface StockRow {
  materialCardId: number;
  materialCode:   string | null;
  materialName:   string | null;
  unit:           string | null;
  availableQty:   number;
  reservedQty:    number;
  totalQty:       number;
  lastUpdated:    string | null;
}

interface Movement {
  id: number;
  movementNumber?: string;
  movementType: string;
  status: string;
  totalAmount?: number;
  createdAt: string;
  fromWarehouseId?: number | null;
  toWarehouseId?:   number | null;
}

const STATUS_BADGE: Record<string, string> = {
  draft: "pos-badge-gray", pending: "pos-badge-yellow", approved: "pos-badge-green",
  completed: "pos-badge-green", cancelled: "pos-badge-red", qc_pending: "pos-badge-yellow",
};

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  EXTERNAL_IN: "Tashqi Kirim",
  INTERNAL_RETURN: "Qaytarish",
  EXTERNAL_OUT: "Tashqi Chiqim",
  INTERNAL_ISSUE: "Bo'limga Berish",
  INTERNAL_TRANSFER: "Ombor Ko'chirish",
  DAMAGE: "Zarar Akti",
  INVENTORY_ADJUST: "Inventarizatsiya",
};

// Kirim turlari (in)
const INBOUND_TYPES = new Set(["EXTERNAL_IN", "INTERNAL_RETURN"]);
// Chiqim turlari (out)
const OUTBOUND_TYPES = new Set(["EXTERNAL_OUT", "INTERNAL_ISSUE", "DAMAGE"]);
// Transfer (qisman ikkala tomon)
const TRANSFER_TYPES = new Set(["INTERNAL_TRANSFER"]);

// O'lchov birligi gruppa
const UNIT_GROUP: Record<string, { icon: string; label: string; color: string }> = {
  KG:    { icon: "⚖️", label: "Kilogramm",  color: "#3B82F6" },
  KILOGRAMM: { icon: "⚖️", label: "Kilogramm", color: "#3B82F6" },
  L:     { icon: "💧", label: "Litr",       color: "#06B6D4" },
  LITR:  { icon: "💧", label: "Litr",       color: "#06B6D4" },
  ML:    { icon: "💧", label: "Millilitr",  color: "#06B6D4" },
  M:     { icon: "📏", label: "Metr",       color: "#10B981" },
  METR:  { icon: "📏", label: "Metr",       color: "#10B981" },
  CM:    { icon: "📏", label: "Santimetr",  color: "#10B981" },
  M2:    { icon: "🟦", label: "Kv. metr",   color: "#8B5CF6" },
  M3:    { icon: "🟪", label: "Kub. metr",  color: "#A855F7" },
  DONA:  { icon: "📦", label: "Dona",       color: "#F59E0B" },
  SHT:   { icon: "📦", label: "Dona",       color: "#F59E0B" },
  PCS:   { icon: "📦", label: "Dona",       color: "#F59E0B" },
  RULON: { icon: "🧻", label: "Rulon",      color: "#EC4899" },
  PALETA:{ icon: "🪧", label: "Paleta",     color: "#84CC16" },
  TON:   { icon: "🏋️", label: "Tonna",      color: "#0EA5E9" },
};

function getUnitGroup(unit: string | null | undefined) {
  if (!unit) return { icon: "❓", label: "Noma'lum", color: "#9CA3AF" };
  const up = String(unit).toUpperCase().trim().replace(/\./g, "").replace(/\s/g, "");
  return UNIT_GROUP[up] ?? { icon: "📦", label: unit, color: "#6B7280" };
}

function fmt(n: number | null | undefined, max = 3): string {
  const v = Number(n ?? 0);
  if (!Number.isFinite(v)) return "0";
  return v.toLocaleString("uz-UZ", { maximumFractionDigits: max });
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" }); } catch { return "—"; }
}

export default function PosWarehouseDetail() {
  const { t } = useTranslation("common");
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { t } = usePosI18n();
  const whId = params.id ?? "";
  const whIdNum = parseInt(whId, 10);

  type TabKey = "stock" | "inflow" | "outflow" | "quarantine" | "employees" | "bins";
  const [tab, setTab] = useState<TabKey>("stock");
  const [stock, setStock]             = useState<StockRow[]>([]);
  const [movements, setMovements]     = useState<Movement[]>([]);
  const [employees, setEmployees]     = useState<WarehouseEmployee[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [stockData, movData, empData] = await Promise.all([
        warehousesApi.getStock(whId).catch(() => []),
        warehousesApi.getMovements(whId, 200).catch(() => []),
        Number.isFinite(whIdNum)
          ? warehouseFeaturesApi.listEmployees(whIdNum).catch(() => [])
          : Promise.resolve([]),
      ]);
      setStock((Array.isArray(stockData) ? stockData : []) as StockRow[]);
      setMovements((Array.isArray(movData) ? movData : []) as Movement[]);
      setEmployees((Array.isArray(empData) ? empData : []) as WarehouseEmployee[]);
    } catch (e) {
      console.error("[PosWarehouseDetail] loadData:", e);
    } finally { setLoading(false); }
  }, [whId, whIdNum]);

  useEffect(() => { void loadData(); }, [loadData]);

  // ── Stok: birlik bo'yicha guruhlash ───────────────────────────────────────
  const filtered = useMemo(() => (Array.isArray(stock) ? stock : []).filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return String(r.materialCardId).includes(q)
        || (r.materialCode ?? "").toLowerCase().includes(q)
        || (r.materialName ?? "").toLowerCase().includes(q);
  }), [stock, search]);

  const stockByUnit = useMemo(() => {
    const groups = new Map<string, { unit: string; items: StockRow[]; total: number; reserved: number }>();
    for (const item of filtered) {
      const u = (item.unit ?? "").trim() || "—";
      if (!groups.has(u)) groups.set(u, { unit: u, items: [], total: 0, reserved: 0 });
      const g = groups.get(u)!;
      g.items.push(item);
      g.total += item.availableQty ?? 0;
      g.reserved += item.reservedQty ?? 0;
    }
    return Array.from(groups.values()).sort((a, b) => b.items.length - a.items.length);
  }, [filtered]);

  // ── Harakatlar: SHU OMBORGA tegishli + Kirim/Chiqim ajratish ──────────────
  // Backend allaqachon filter qiladi (/wms/warehouse/{id}/movements) — bu yerda
  // qo'shimcha himoya: faqat shu ombor uchun harakatlarni ko'rsatish
  const myMovements = useMemo(() =>
    (Array.isArray(movements) ? movements : []).filter(m =>
      (m.toWarehouseId   != null && String(m.toWarehouseId)   === String(whId)) ||
      (m.fromWarehouseId != null && String(m.fromWarehouseId) === String(whId))
    ), [movements, whId]);

  // Kirim: faqat shu omborga tushgan (to_warehouse_id = whId)
  const inflowMovements = useMemo(() =>
    myMovements.filter(m =>
      m.toWarehouseId != null && String(m.toWarehouseId) === String(whId)
    ), [myMovements, whId]);

  // Chiqim: faqat shu ombordan chiqqan (from_warehouse_id = whId)
  const outflowMovements = useMemo(() =>
    myMovements.filter(m =>
      m.fromWarehouseId != null && String(m.fromWarehouseId) === String(whId)
    ), [myMovements, whId]);

  // Karantin/QC: faqat shu omborning qc_pending/karantin holatlari
  const quarantineMovements = useMemo(() =>
    myMovements.filter(m =>
      m.status === "qc_pending" || m.status === "karantin" || m.status === "quarantine" || m.status === "qc_review"
    ), [myMovements]);

  // ── Totals ────────────────────────────────────────────────────────────────
  const totalBalance = (Array.isArray(stock) ? stock : []).reduce((s, r) => s + (r.availableQty ?? 0), 0);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <button className="pos-btn pos-btn-ghost" style={{ padding: "6px 10px" }} onClick={() => navigate("/pos-monitor/warehouses")}>
          ← {t("common.back")}
        </button>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Ombor #{whId}</h2>

        {/* Har ombordan to'g'ridan-to'g'ri yangi harakat */}
        <div style={{ display: "flex", gap: 6 }}>
          <button
            className="pos-btn"
            style={{ padding: "6px 12px", background: "#10B981", color: "#FFF", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13 }}
            onClick={() => navigate(`/pos-monitor/movements/new/kirim?warehouseId=${whId}`)}
            title={t("shuOmborgaYangiKirim")}
          >
            {t("kirim1")}
          </button>
          <button
            className="pos-btn"
            style={{ padding: "6px 12px", background: "#F59E0B", color: "#FFF", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13 }}
            onClick={() => navigate(`/pos-monitor/movements/new/chiqim?fromWarehouseId=${whId}`)}
            title={t("shuOmbordanYangiChiqim")}
          >
            {t("chiqim1")}
          </button>
        </div>

        <div style={{ flex: 1 }} />
        <div className="pos-card" style={{ padding: "8px 16px", display: "inline-flex", gap: 20 }}>
          <div>
            <div style={{ fontSize: 10, color: "var(--pos-text-muted)" }}>{t("materialTuri1")}</div>
            <div className="pos-mono" style={{ fontWeight: 700, color: "var(--pos-accent)" }}>{stock.length}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "var(--pos-text-muted)" }}>{t("kirim2")}</div>
            <div className="pos-mono" style={{ fontWeight: 700, color: "#10B981" }}>{inflowMovements.length}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "var(--pos-text-muted)" }}>{t("chiqim2")}</div>
            <div className="pos-mono" style={{ fontWeight: 700, color: "#EF4444" }}>{outflowMovements.length}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "var(--pos-text-muted)" }}>{t("xodimlar1")}</div>
            <div className="pos-mono" style={{ fontWeight: 700 }}>{employees.length}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="pos-tabs" style={{ display: "flex", gap: 4, overflowX: "auto" }}>
        <div className={`pos-tab ${tab === "stock"      ? "active" : ""}`} onClick={() => setTab("stock")}>📦 Stok ({stock.length})</div>
        <div className={`pos-tab ${tab === "inflow"     ? "active" : ""}`} onClick={() => setTab("inflow")}>📥 Kirim ({inflowMovements.length})</div>
        <div className={`pos-tab ${tab === "outflow"    ? "active" : ""}`} onClick={() => setTab("outflow")}>📤 Chiqim ({outflowMovements.length})</div>
        <div className={`pos-tab ${tab === "quarantine" ? "active" : ""}`} onClick={() => setTab("quarantine")}>🔬 Karantin ({quarantineMovements.length})</div>
        <div className={`pos-tab ${tab === "employees"  ? "active" : ""}`} onClick={() => setTab("employees")}>👥 Xodimlar ({employees.length})</div>
        <div className={`pos-tab ${tab === "bins"       ? "active" : ""}`} onClick={() => setTab("bins")}>{t("bin")}</div>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40, color: "var(--pos-text-muted)" }}>{t("yuklanmoqda")}</div>}

      {/* ─── STOK TAB — birlik bo'yicha guruhlangan ─── */}
      {!loading && tab === "stock" && (
        <>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <input
              className="pos-input" style={{ width: 280 }}
              placeholder={t('common.materialQidirish')}
              value={search} onChange={e => setSearch(e.target.value)}
            />
            <button className="pos-btn pos-btn-ghost" onClick={() => void loadData()}>{t("yangilash")}</button>
          </div>

          {/* O'lchov birligi xulosa */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 20 }}>
            {stockByUnit.map(g => {
              const ug = getUnitGroup(g.unit);
              return (
                <div key={g.unit} className="pos-card" style={{ padding: 12, borderLeft: `4px solid ${ug.color}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 22 }}>{ug.icon}</span>
                    <div style={{ fontSize: 11, color: "var(--pos-text-muted)", fontWeight: 600 }}>{ug.label}</div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4, color: ug.color }}>
                    {fmt(g.total, 2)} <span style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>{g.unit}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>
                    {g.items.length} ta material · Band: {fmt(g.reserved, 2)}
                  </div>
                </div>
              );
            })}
            {stockByUnit.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 20, color: "var(--pos-text-muted)" }}>
                {t("buOmbordaMateriallarYoq")}
              </div>
            )}
          </div>

          {/* Har birlik uchun alohida jadval */}
          {stockByUnit.map(g => {
            const ug = getUnitGroup(g.unit);
            return (
              <div key={g.unit} style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>{ug.icon}</span>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{ug.label} ({g.unit})</div>
                  <div style={{ flex: 1, height: 1, background: "var(--pos-border)" }} />
                  <div style={{ fontSize: 12, color: ug.color, fontWeight: 700 }}>
                    Jami: {fmt(g.total, 2)} {g.unit}
                  </div>
                </div>
                <div className="pos-card" style={{ overflowX: "auto" }}>
                  <table className="pos-table" style={{ width: "100%" }}>
                    <thead>
                      <tr>
                        <th>{t('common.Material')}</th>
                        <th>{t("code")}</th>
                        <th style={{ textAlign: "right" }}>{t("mavjud")}</th>
                        <th style={{ textAlign: "right" }}>{t("band")}</th>
                        <th style={{ textAlign: "right" }}>{t("total")}</th>
                        <th>{t("updated")}</th>
                        <th>{t("Amallar")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.items.map(r => (
                        <tr key={r.materialCardId}>
                          <td>
                            <button
                              className="pos-btn pos-btn-ghost"
                              style={{ padding: "2px 6px", fontSize: 12 }}
                              onClick={() => navigate(`/pos-monitor/materials/360/${r.materialCardId}`)}
                            >
                              {r.materialName ?? `#${r.materialCardId}`}
                            </button>
                          </td>
                          <td className="pos-mono" style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>
                            {r.materialCode ?? "—"}
                          </td>
                          <td className="pos-mono" style={{ textAlign: "right", fontWeight: 600, color: ug.color }}>
                            {fmt(r.availableQty)}
                          </td>
                          <td className="pos-mono" style={{ textAlign: "right", color: "var(--pos-text-muted)" }}>
                            {fmt(r.reservedQty)}
                          </td>
                          <td className="pos-mono" style={{ textAlign: "right" }}>
                            {fmt(r.totalQty)}
                          </td>
                          <td style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>{fmtDate(r.lastUpdated)}</td>
                          <td>
                            <button className="pos-btn pos-btn-ghost" style={{ padding: "3px 8px", fontSize: 11 }}
                              onClick={() => navigate(`/pos-monitor/materials/360/${r.materialCardId}`)}
                              title={t("material360")}
                            >🔭 360°</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* ─── KIRIM TAB ─── */}
      {!loading && tab === "inflow" && (
        <MovementsTable
          movements={inflowMovements}
          title={t("buOmborgaKirimlar")}
          color="#10B981"
          onClick={(id) => navigate(`/pos-monitor/movements/${id}`)}
          emptyMessage="Bu omborga kirimlar yo'q"
        />
      )}

      {/* ─── CHIQIM TAB ─── */}
      {!loading && tab === "outflow" && (
        <MovementsTable
          movements={outflowMovements}
          title={t("buOmbordanChiqimlar")}
          color="#EF4444"
          onClick={(id) => navigate(`/pos-monitor/movements/${id}`)}
          emptyMessage="Bu ombordan chiqimlar yo'q"
        />
      )}

      {/* ─── KARANTIN / QC TAB ─── */}
      {!loading && tab === "quarantine" && (
        <MovementsTable
          movements={quarantineMovements}
          title={t("karantinVaQcKutmoqda")}
          color="#F59E0B"
          onClick={(id) => navigate(`/pos-monitor/movements/${id}`)}
          emptyMessage="Karantinda hozir hech narsa yo'q"
        />
      )}

      {/* ─── XODIMLAR TAB ─── */}
      {!loading && tab === "employees" && (
        <div className="pos-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #E5E7EB", fontWeight: 600, fontSize: 14 }}>
            👥 Omborga biriktirilgan xodimlar ({employees.length})
          </div>
          {employees.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--pos-text-muted)" }}>
              {t("hechKimBiriktirilmagan")}
            </div>
          ) : (
            <table className="pos-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>{t("foydalanuvchi")}</th>
                  <th>{t('common.login')}</th>
                  <th>{t("role")}</th>
                  <th>{t("primary")}</th>
                  <th>{t("biriktirilganSana")}</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(e => (
                  <tr key={e.id}>
                    <td><b>{(e.fullName ?? "").trim() || `User #${e.userId}`}</b></td>
                    <td className="pos-mono" style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>{e.username}</td>
                    <td>
                      <span style={{
                        display: "inline-block", padding: "2px 8px", borderRadius: 6,
                        background: e.role === "manager" ? "#FEF3C7" : e.role === "qc_inspector" ? "#F0FDF4" : "#EFF6FF",
                        color: e.role === "manager" ? "#92400E" : e.role === "qc_inspector" ? "#14532D" : "#1E40AF",
                        fontSize: 11, fontWeight: 700,
                      }}>
                        {e.role === "manager" ? "👔 Menejer" :
                         e.role === "staff" ? "👷 Xodim" :
                         e.role === "keeper" ? "🔑 Saqlovchi" :
                         e.role === "qc_inspector" ? "🔬 QC nazoratchi" : "👁️ Kuzatuvchi"}
                      </span>
                    </td>
                    <td>{e.isPrimary ? "⭐ Ha" : ""}</td>
                    <td>{fmtDate(e.assignedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ─── BIN TAB ─── */}
      {!loading && tab === "bins" && (
        <div className="pos-card" style={{ padding: 24, textAlign: "center", color: "var(--pos-text-muted)" }}>
          🗂 Zonalar / Bin lokatsiyalar — Tez orada qo'shiladi
        </div>
      )}
    </div>
  );
}

// ─── Reusable Movements Table ────────────────────────────────────────────────

function MovementsTable({ movements, title, color, onClick, emptyMessage }: {
  movements: Movement[];
  title: string;
  color: string;
  onClick: (id: number) => void;
  emptyMessage: string;
}) {
  return (
    <div className="pos-card" style={{ overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #E5E7EB", fontWeight: 600, fontSize: 14,
                     borderLeft: `4px solid ${color}` }}>
        {title} ({movements.length})
      </div>
      {movements.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--pos-text-muted)" }}>
          {emptyMessage}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="pos-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>{t("hujjatRaqami")}</th>
                <th>{t("harakatTuri1")}</th>
                <th>{t("status28")}</th>
                <th style={{ textAlign: "right" }}>{t("summa")}</th>
                <th>{t("date")}</th>
              </tr>
            </thead>
            <tbody>
              {movements.map(m => (
                <tr key={m.id} style={{ cursor: "pointer" }} onClick={() => onClick(m.id)}>
                  <td className="pos-mono" style={{ color: "var(--pos-accent)", fontWeight: 600 }}>
                    {m.movementNumber ?? `#${m.id}`}
                  </td>
                  <td>
                    <span className="pos-badge pos-badge-blue" style={{ fontSize: 10 }}>
                      {MOVEMENT_TYPE_LABELS[m.movementType] ?? m.movementType}
                    </span>
                  </td>
                  <td>
                    <span className={`pos-badge ${STATUS_BADGE[m.status] ?? "pos-badge-gray"}`} style={{ fontSize: 10 }}>
                      {m.status}
                    </span>
                  </td>
                  <td className="pos-mono" style={{ textAlign: "right" }}>
                    {m.totalAmount != null ? fmt(m.totalAmount, 0) : "—"}
                  </td>
                  <td style={{ color: "var(--pos-text-muted)", fontSize: 12 }}>{fmtDate(m.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
