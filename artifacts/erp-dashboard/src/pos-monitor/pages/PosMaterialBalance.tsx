/**
 * PosMaterialBalance.tsx
 * POS Monitor — Material Balans (aggregat, qiymat bo'yicha)
 * URL: /pos-monitor/material-balance
 */
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { materialsApi } from "../api/pos-monitor.api";

import { useTranslation } from '@/lib/i18n';
interface Material {
  id: number;
  code: string | null;
  name: string | null;
  category: string | null;
  unit: string | null;
  material_type: string | null;
  available_qty: string | number | null;
  last_purchase_price: string | number | null;
}

function fmt(n: number, max = 2): string {
  return n.toLocaleString("uz-UZ", { maximumFractionDigits: max });
}

function fmtMoney(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + " mlrd";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + " mln";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + " ming";
  return fmt(n, 0);
}

export default function PosMaterialBalance() {
  const { t } = useTranslation('common');
  const [, navigate] = useLocation();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const r = await materialsApi.getAll({ limit: 500 });
      setMaterials(Array.isArray(r) ? (r as Material[]) : []);
    } catch { setMaterials([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const categories = Array.from(new Set(materials.map(m => m.category).filter(Boolean))) as string[];

  const filtered = materials.filter(m => {
    if (categoryFilter !== "all" && m.category !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (m.name ?? "").toLowerCase().includes(q)
          || (m.code ?? "").toLowerCase().includes(q);
    }
    return true;
  });

  const enriched = filtered.map(m => {
    const qty = Number(m.available_qty ?? 0);
    const price = Number(m.last_purchase_price ?? 0);
    return { ...m, qty, price, value: qty * price };
  }).sort((a, b) => b.value - a.value);

  const totalValue = enriched.reduce((s, m) => s + m.value, 0);
  const totalQty = enriched.reduce((s, m) => s + m.qty, 0);

  // ABC clasification
  let cumulative = 0;
  const abcItems = enriched.map(m => {
    cumulative += m.value;
    const pct = totalValue > 0 ? (cumulative / totalValue) * 100 : 0;
    const abc = pct <= 80 ? "A" : pct <= 95 ? "B" : "C";
    return { ...m, cumulativePct: pct, abc };
  });

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>{t('materialBalans')}</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Aggregat balans</h1>
          <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
            Material qiymati bo'yicha guruhlangan — ABC tahlil (A: 80%, B: 15%, C: 5%)
          </p>
        </div>
        <button onClick={load} style={{ padding: "8px 16px", background: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
          🔄
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 16 }}>
        <Kpi label={t('jamiMaterial1')} value={String(enriched.length)} color="#1F2937" />
        <Kpi label="JAMI QIYMAT" value={fmtMoney(totalValue) + " UZS"} color="#10B981" />
        <Kpi label="JAMI MIQDOR" value={fmt(totalQty, 0)} color="#3B82F6" />
        <Kpi label="A-GURUH (80%)" value={String(abcItems.filter(i => i.abc === "A").length)} color="#EF4444" />
        <Kpi label="B-GURUH (15%)" value={String(abcItems.filter(i => i.abc === "B").length)} color="#F59E0B" />
        <Kpi label="C-GURUH (5%)" value={String(abcItems.filter(i => i.abc === "C").length)} color="#10B981" />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          placeholder={t('materialQidirish')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 250, padding: "8px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13 }}
        />
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          style={{ padding: "8px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13 }}
        >
          <option value="all">Barcha kategoriyalar</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div style={{ background: "#FFF", borderRadius: 12, border: "1px solid #E5E7EB", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>⏳ Yuklanmoqda...</div>
        ) : (
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead style={{ background: "#F9FAFB" }}>
              <tr>
                <th style={th}>ABC</th>
                <th style={th}>{t('Material')}</th>
                <th style={th}>Kod</th>
                <th style={th}>Kategoriya</th>
                <th style={{ ...th, textAlign: "right" }}>Miqdor</th>
                <th style={th}>Birlik</th>
                <th style={{ ...th, textAlign: "right" }}>Narx</th>
                <th style={{ ...th, textAlign: "right" }}>Qiymat</th>
                <th style={{ ...th, textAlign: "right" }}>Ulush</th>
              </tr>
            </thead>
            <tbody>
              {abcItems.slice(0, 200).map(m => (
                <tr key={m.id} style={{ borderTop: "1px solid #F3F4F6", cursor: "pointer" }}
                    onClick={() => navigate(`/pos-monitor/materials/360/${m.id}`)}>
                  <td style={td}>
                    <span style={{
                      padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 800,
                      background: m.abc === "A" ? "#FEE2E2" : m.abc === "B" ? "#FEF3C7" : "#D1FAE5",
                      color: m.abc === "A" ? "#991B1B" : m.abc === "B" ? "#92400E" : "#065F46",
                    }}>
                      {m.abc}
                    </span>
                  </td>
                  <td style={td}>{m.name ?? `#${m.id}`}</td>
                  <td style={{ ...td, fontFamily: "monospace", fontSize: 11, color: "#9CA3AF" }}>{m.code ?? "—"}</td>
                  <td style={td}>{m.category ?? "—"}</td>
                  <td style={{ ...td, textAlign: "right", fontFamily: "monospace" }}>{fmt(m.qty)}</td>
                  <td style={td}>{m.unit ?? "—"}</td>
                  <td style={{ ...td, textAlign: "right", fontFamily: "monospace" }}>{fmtMoney(m.price)}</td>
                  <td style={{ ...td, textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#059669" }}>
                    {fmtMoney(m.value)}
                  </td>
                  <td style={{ ...td, textAlign: "right", fontFamily: "monospace", fontSize: 11, color: "#6B7280" }}>
                    {m.cumulativePct.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: "#FFF", borderRadius: 12, padding: 14, border: "1px solid #E5E7EB" }}>
      <div style={{ fontSize: 11, color: "#9CA3AF" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color, marginTop: 4 }}>{value}</div>
    </div>
  );
}

const th: React.CSSProperties = { padding: "10px 14px", textAlign: "left", fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase" };
const td: React.CSSProperties = { padding: "10px 14px", fontSize: 13 };
