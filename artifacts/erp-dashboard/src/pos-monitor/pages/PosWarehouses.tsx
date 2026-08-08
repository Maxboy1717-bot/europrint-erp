/**
 * POS Omborlar — WMS modulidan real ma'lumotlar
 * Barcha omborlar warehouses jadvalidan yuklanadi.
 */
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { usePosI18n } from "../i18n/usePosI18n";
import { warehousesApi } from "../api/pos-monitor.api";
import { useTranslation } from '@/lib/i18n';
import { tLabel } from '@/lib/i18n/tLabel';

interface Warehouse {
  id: string;
  code: string | null;
  name: string | null;
  type: string | null;
  isActive: boolean;
  departmentCode: string | null;
  totalMaterials: number;
  totalQty: number;
}

const TYPE_CFG: Record<string, { icon: string; bg: string; text: string; badge: string; label: string }> = {
  // ERP standart 9 ta ombor turi (warehouse-9-types-seed.sql ga muvofiq)
  RAW_MATERIAL:  { icon: "📦", bg: "#FEF3C7", text: "#92400E", badge: "var(--pos-warning)", label: tLabel('common.PosWarehouses.typeRawMaterial', "Xom ashyo") },
  FINISHED_GOODS:{ icon: "✅",  bg: "#ECFDF5", text: "#064E3B", badge: "var(--pos-success)", label: tLabel('common.PosWarehouses.typeFinishedGoods', "Tayyor mahsulot") },
  WIP:           { icon: "⚙️",  bg: "#F5F3FF", text: "#4C1D95", badge: "#8B5CF6", label: tLabel('common.PosWarehouses.typeWip', "Yarim tayyor") },
  SCRAP:         { icon: "⚠️",  bg: "#FFF1F2", text: "#881337", badge: "#F43F5E", label: tLabel('common.PosWarehouses.typeScrap', "Brak") },
  QUARANTINE:    { icon: "🔒", bg: "#FEF3C7", text: "#92400E", badge: "#D97706", label: tLabel('common.PosWarehouses.typeQuarantine', "Karantin") },
  TOOLS:         { icon: "🔧", bg: "var(--pos-accent-soft)", text: "var(--pos-accent)", badge: "var(--pos-accent)", label: tLabel('common.PosWarehouses.typeTools', "Asbob-uskuna") },
  HOUSEHOLD:     { icon: "🏠", bg: "#FFF7ED", text: "#7C2D12", badge: "#F97316", label: tLabel('common.PosWarehouses.typeHousehold', "Xo'jalik") },
  MRO:           { icon: "🛠️", bg: "#F0F9FF", text: "#0C4A6E", badge: "#0EA5E9", label: "MRO" },

  // Eski turlar uchun fallback (legacy WH-* omborlar — endi nofaol)
  MAIN:          { icon: "🏭", bg: "var(--pos-accent-soft)", text: "var(--pos-accent)", badge: "var(--pos-accent)", label: tLabel('common.PosWarehouses.typeMain', "Asosiy") },
  PRODUCTION:    { icon: "⚙️",  bg: "#F5F3FF", text: "#4C1D95", badge: "#8B5CF6", label: tLabel('common.PosWarehouses.typeProduction', "Ishlab chiqarish") },
  DEPARTMENT:    { icon: "🏢", bg: "#FFF7ED", text: "#7C2D12", badge: "#F97316", label: tLabel('common.PosWarehouses.typeDepartment', "Bo'lim") },
  DEFECTIVE:     { icon: "⚠️",  bg: "#FFF1F2", text: "#881337", badge: "#F43F5E", label: tLabel('common.PosWarehouses.typeDefective', "Nuqsonli") },
  QC:            { icon: "🔬", bg: "#F0FDF4", text: "#14532D", badge: "#22C55E", label: "QC" },
};

function getTypeCfg(type: string | null) {
  return type ? (TYPE_CFG[type] ?? TYPE_CFG["RAW_MATERIAL"]) : TYPE_CFG["RAW_MATERIAL"];
}

function WarehouseCard({ wh }: { wh: Warehouse }) {
  const { t } = useTranslation("common");
  const [, navigate] = useLocation();
  const cfg = getTypeCfg(wh.type);
  const maxQty = 1000; // for progress bar scaling
  const pct = Math.min(100, Math.round((wh.totalQty / maxQty) * 100));

  return (
    <div
      onClick={() => navigate(`/pos-monitor/warehouses/${wh.id}`)}
      style={{
        background: "var(--pos-card)", borderRadius: 12, border: "1px solid var(--pos-border)",
        overflow: "hidden", cursor: "pointer", display: "flex", flexDirection: "column",
        transition: "box-shadow 0.15s, transform 0.15s",
        opacity: wh.isActive ? 1 : 0.6,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "";
        (e.currentTarget as HTMLDivElement).style.transform = "";
      }}
    >
      {/* Header */}
      <div style={{
        background: cfg.bg, padding: "14px 16px",
        display: "flex", alignItems: "center", gap: 10,
        borderBottom: "1px solid var(--pos-border)",
      }}>
        <span style={{ fontSize: 28 }}>{cfg.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 700, fontSize: 14, color: "var(--pos-text)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {wh.name ?? wh.code ?? wh.id}
          </div>
          {wh.code && wh.name && (
            <div style={{ fontSize: 11, color: "var(--pos-text-muted)", fontFamily: "monospace" }}>{wh.code}</div>
          )}
        </div>
        <span style={{
          background: cfg.badge, color: "var(--pos-card)",
          borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap",
        }}>
          {cfg.label}
        </span>
      </div>

      {/* Stats */}
      <div style={{ padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{
          background: "var(--pos-bg)", borderRadius: 8, padding: "10px 12px", textAlign: "center",
        }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--pos-text)" }}>
            {wh.totalMaterials}
          </div>
          <div style={{ fontSize: 10, color: "var(--pos-text-muted)" }}>{t("materialTur")}</div>
        </div>
        <div style={{
          background: "var(--pos-bg)", borderRadius: 8, padding: "10px 12px", textAlign: "center",
        }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--pos-success)" }}>
            {wh.totalQty % 1 === 0 ? wh.totalQty.toLocaleString() : wh.totalQty.toFixed(1)}
          </div>
          <div style={{ fontSize: 10, color: "var(--pos-text-muted)" }}>{t("jamiQoldiq")}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ padding: "0 16px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--pos-text-muted)", marginBottom: 4 }}>
          <span>{t("toldirganlik")}</span>
          <span>{pct}%</span>
        </div>
        <div style={{ height: 6, background: "var(--pos-bg)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${pct}%`,
            background: pct > 80 ? "var(--pos-success)" : pct > 40 ? "var(--pos-warning)" : "var(--pos-danger)",
            borderRadius: 3, transition: "width 0.5s",
          }} />
        </div>
      </div>

      {/* Footer */}
      {(wh.departmentCode || !wh.isActive) && (
        <div style={{
          padding: "8px 16px", borderTop: "1px solid var(--pos-bg)",
          display: "flex", alignItems: "center", gap: 8, fontSize: 11,
        }}>
          {wh.departmentCode && (
            <span style={{ color: "var(--pos-text-muted)" }}>{t("bolim")}<b>{wh.departmentCode}</b></span>
          )}
          {!wh.isActive && (
            <span style={{
              marginLeft: "auto", background: "#FEE2E2", color: "var(--pos-danger)",
              borderRadius: 4, padding: "1px 6px", fontWeight: 600,
            }}>{t("inactive")}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default function PosWarehouses() {
  const { t }         = usePosI18n();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [search, setSearch]         = useState("");
  const [filterType, setFilterType] = useState("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await warehousesApi.getAll();
      const rows = (Array.isArray(data) ? data : []) as Warehouse[];
      setWarehouses(rows);
    } catch (e: unknown) {
      setError((e as Error).message ?? tLabel('common.PosWarehouses.loadError', "Omborlarni yuklashda xato"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const typeKeys = [...new Set(warehouses.map(w => w.type).filter(Boolean))] as string[];

  const filtered = warehouses.filter(w => {
    const matchSearch = !search
      || (w.name ?? "").toLowerCase().includes(search.toLowerCase())
      || (w.code ?? "").toLowerCase().includes(search.toLowerCase())
      || w.id.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || w.type === filterType;
    return matchSearch && matchType;
  });

  const stats = {
    total:    warehouses.length,
    active:   warehouses.filter(w => w.isActive).length,
    materials:warehouses.reduce((s, w) => s + w.totalMaterials, 0),
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--pos-bg)" }}>

      {/* Top bar */}
      <div style={{
        background: "var(--pos-card)", borderBottom: "1px solid var(--pos-border)",
        padding: "14px 20px", display: "flex", alignItems: "center",
        gap: 12, flexWrap: "wrap", position: "sticky", top: 0, zIndex: 10,
      }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--pos-text)" }}>
          {t("omborlar")}
        </h2>
        <div style={{ flex: 1 }} />
        <input
          style={{
            border: "1px solid var(--pos-border)", borderRadius: 8, padding: "8px 12px",
            fontSize: 13, outline: "none", width: 220, color: "var(--pos-text)", background: "var(--pos-bg)",
          }}
          placeholder={t("omborNomiYokiKodi")}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button
          onClick={() => void loadData()}
          style={{
            background: "var(--pos-bg)", border: "1px solid var(--pos-border)", borderRadius: 8,
            padding: "8px 12px", cursor: "pointer", fontSize: 13, color: "var(--pos-text-muted)",
          }}
        >
          🔄
        </button>
      </div>

      {/* Stats row */}
      {!loading && warehouses.length > 0 && (
        <div style={{
          background: "var(--pos-card)", borderBottom: "1px solid var(--pos-border)",
          padding: "10px 20px", display: "flex", gap: 20,
        }}>
          {[
            { label: tLabel('common.PosWarehouses.statTotal', "Jami ombor"), value: stats.total, color: "var(--pos-accent)" },
            { label: tLabel('common.PosWarehouses.statActive', "Faol ombor"), value: stats.active, color: "var(--pos-success)" },
            { label: tLabel('common.PosWarehouses.statMaterialTypes', "Material tur"), value: stats.materials, color: "var(--pos-warning)" },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</span>
              <span style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Type filter tabs */}
      {typeKeys.length > 1 && (
        <div style={{
          background: "var(--pos-card)", borderBottom: "1px solid var(--pos-border)",
          padding: "0 20px", display: "flex", gap: 4, overflowX: "auto",
        }}>
          {[{ key: "all", label: tLabel('common.PosWarehouses.filterAll', "Barchasi") }, ...typeKeys.map(k => ({ key: k, label: getTypeCfg(k).label }))].map(t => (
            <button
              key={t.key}
              onClick={() => setFilterType(t.key)}
              style={{
                padding: "10px 4px", border: "none", background: "none", cursor: "pointer",
                fontSize: 13, fontWeight: filterType === t.key ? 700 : 500,
                color: filterType === t.key ? "var(--pos-text)" : "var(--pos-text-muted)",
                borderBottom: filterType === t.key ? "2px solid var(--pos-warning)" : "2px solid transparent",
                marginRight: 12, whiteSpace: "nowrap", flexShrink: 0,
              }}
            >
              {getTypeCfg(t.key as string).icon} {t.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ padding: 20 }}>

        {/* Skeleton */}
        {loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{
                background: "var(--pos-card)", borderRadius: 12, border: "1px solid var(--pos-border)",
                overflow: "hidden", animation: "pos-pulse 1.4s ease-in-out infinite",
                animationDelay: `${i * 100}ms`,
              }}>
                <div style={{ height: 70, background: "var(--pos-bg)" }} />
                <div style={{ padding: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ height: 48, borderRadius: 8, background: "var(--pos-bg)" }} />
                  <div style={{ height: 48, borderRadius: 8, background: "var(--pos-bg)" }} />
                </div>
                <div style={{ padding: "0 14px 14px" }}>
                  <div style={{ height: 6, borderRadius: 3, background: "var(--pos-bg)" }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--pos-danger)", marginBottom: 8 }}>
              {t("omborlarYuklanmadi")}
            </div>
            <div style={{ fontSize: 12, color: "var(--pos-text-muted)", marginBottom: 20 }}>{error}</div>
            <button
              onClick={() => void loadData()}
              style={{
                background: "var(--pos-warning)", color: "var(--pos-card)", border: "none",
                borderRadius: 8, padding: "10px 24px", fontWeight: 700, cursor: "pointer",
              }}
            >
              {t("qaytaUrinish1")}
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--pos-text-muted)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏭</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--pos-text-muted)", marginBottom: 8 }}>
              {t("omborTopilmadi")}
            </div>
            <div style={{ fontSize: 13 }}>
              {search
                ? `"${search}" ${tLabel('common.PosWarehouses.noResultSuffix', "bo'yicha ombor yo'q")}`
                : tLabel('common.PosWarehouses.noWarehousesYet', "Hali ombor qo'shilmagan")}
            </div>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && filtered.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {filtered.map(wh => (
              <WarehouseCard key={wh.id} wh={wh} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
