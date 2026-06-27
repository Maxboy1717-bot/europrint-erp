/**
 * @module PosHome
 * @description Ombor POS-Terminal BOSH EKRAN — do'kon-kassasi/POS uslubi (katta tugma, tez amal).
 *
 * Egasi spec 2026-06-27 (OMBOR-TERMINAL-INTERFEYS-SPEC):
 *   • TEPADA: joriy ombor nomi + "ombor almashtirish" (GET /api/pos/my-warehouses,
 *     is_primary default; bitta bo'lsa switcher YASHIRIN).
 *   • MARKAZDA: KATTA RANGLI amal-tugmalari grid —
 *       KIRIM=yashil · CHIQIM=qizil · KO'CHIRISH=ko'k · QAYTARISH=sariq ·
 *       ZARAR=to'q-sariq · INVENTAR=binafsha — katta ikona + nom, bosilsa ekranga route.
 *   • pos-theme (--pos-action-* token), katta sensorli tugma.
 *
 * Q-43: bu sahifa o'zi forma saqlamaydi — har amal-tugma tegishli ekranga olib boradi
 * (kirim/chiqim real saqlash o'sha ekranlarda). Ombor tanlovi localStorage'da saqlanadi
 * (pos_active_warehouse) — boshqa POS ekranlar shu kontekstni o'qiydi.
 */

import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { usePosI18n } from "../i18n/usePosI18n";
import { useAuth } from "@/hooks/useAuth";

// ─── My-warehouses (GET /api/pos/my-warehouses) — BE: warehouse-open.controller ──
// Shared api faylga tegmaslik uchun (parallel sessiya izolyatsiyasi, Q-31) bu yerda
// ERP SSO cookie bilan to'g'ridan-to'g'ri chaqiramiz — pos-monitor.api posReq bilan bir xil.

const _base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

interface MyWarehouse {
  warehouseId:   number;
  warehouseCode: string;
  warehouseName: string;
  warehouseType: string;
  role:          string;
  isPrimary:     boolean;
}

const ACTIVE_WH_KEY = "pos_active_warehouse";

async function fetchMyWarehouses(): Promise<MyWarehouse[]> {
  const res = await fetch(`${_base}/api/pos/my-warehouses`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    let msg = res.statusText;
    try { const j = (await res.json()) as { message?: string }; msg = j.message ?? msg; } catch { /* noop */ }
    throw new Error(msg);
  }
  const json: unknown = await res.json();
  // Result wrapperlarni ochish ({ isSuccess, value } | { ok, data } | xom array)
  const unwrap = (v: unknown): unknown => {
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      if ("isSuccess" in o && "value" in o) return o.value;
      if ("ok" in o && "data" in o) return o.data;
    }
    return v;
  };
  const val = unwrap(json);
  return Array.isArray(val) ? (val as MyWarehouse[]) : [];
}

// ─── Ombor-turi → ikonka (sidebar bilan moslashgan) ──────────────────────────
const WH_TYPE_ICON: Record<string, string> = {
  RAW_MATERIAL:   "📦",
  FINISHED_GOODS: "✅",
  WIP:            "⚙️",
  SCRAP:          "♻️",
  QUARANTINE:     "🔒",
  TOOLS:          "🔧",
  HOUSEHOLD:      "🏠",
  MRO:            "🛠️",
  MAIN:           "🏭",
};

function whIcon(type: string): string {
  return WH_TYPE_ICON[(type ?? "").toUpperCase()] ?? "🏪";
}

// ─── Bosh-ekran amal-tugmalari (egasi spec — 6 amal, rang-kodli) ─────────────
interface ActionDef {
  key:      string;
  icon:     string;
  /** pos-theme amal-rang class (token-driven) */
  variant:  "kirim" | "chiqim" | "transfer" | "return" | "damage" | "inventory";
  nameKey:  string;
  nameFallback: string;
  subKey:   string;
  subFallback:  string;
  to:       string;
}

const ACTIONS: ActionDef[] = [
  {
    key: "kirim", icon: "📥", variant: "kirim",
    nameKey: "nav.newKirim", nameFallback: "KIRIM",
    subKey: "posHome.kirimSub", subFallback: "Qabul · barkod majburiy",
    to: "/pos-monitor/movements/new/kirim",
  },
  {
    key: "chiqim", icon: "📤", variant: "chiqim",
    nameKey: "nav.newChiqim", nameFallback: "CHIQIM",
    subKey: "posHome.chiqimSub", subFallback: "Faqat skaner",
    to: "/pos-monitor/movements/new/chiqim",
  },
  {
    key: "transfer", icon: "🔁", variant: "transfer",
    nameKey: "posHome.transfer", nameFallback: "KO'CHIRISH",
    subKey: "posHome.transferSub", subFallback: "Ombor → ombor",
    to: "/pos-monitor/movements/new/chiqim?type=INTERNAL_TRANSFER",
  },
  {
    key: "return", icon: "↩️", variant: "return",
    nameKey: "posHome.return", nameFallback: "QAYTARISH",
    subKey: "posHome.returnSub", subFallback: "Bo'lim/xodim qaytaradi",
    to: "/pos-monitor/movements/new/chiqim?type=INTERNAL_RETURN",
  },
  {
    key: "damage", icon: "⚠️", variant: "damage",
    nameKey: "posHome.damage", nameFallback: "ZARAR",
    subKey: "posHome.damageSub", subFallback: "Zarar akti → QC",
    to: "/pos-monitor/movements/new/chiqim?type=DAMAGE",
  },
  {
    key: "inventory", icon: "📋", variant: "inventory",
    nameKey: "posHome.inventory", nameFallback: "INVENTAR",
    subKey: "posHome.inventorySub", subFallback: "Sikl-sanash",
    to: "/pos-monitor/inventory",
  },
];

// ─── Ombor switcher (bir nechta ombor bo'lsa) ────────────────────────────────
function WarehouseSwitcher({
  warehouses, activeId, onPick, onClose,
}: {
  warehouses: MyWarehouse[];
  activeId: number | null;
  onPick: (w: MyWarehouse) => void;
  onClose: () => void;
}) {
  const { t } = usePosI18n();
  return (
    <div className="pos-modal-overlay" onClick={onClose}>
      <div className="pos-modal" style={{ minWidth: 320, maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "var(--pos-text)" }}>
            {t("posHome.switchWarehouse") === "posHome.switchWarehouse" ? "Ombor almashtirish" : t("posHome.switchWarehouse")}
          </h3>
          <div style={{ flex: 1 }} />
          <button className="pos-btn pos-btn-ghost" onClick={onClose} style={{ fontSize: 16, padding: "4px 10px" }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {warehouses.map(w => {
            const active = w.warehouseId === activeId;
            return (
              <button
                key={w.warehouseId}
                onClick={() => onPick(w)}
                className="pos-card"
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                  cursor: "pointer", textAlign: "left", border: active ? "2px solid var(--pos-accent)" : "1px solid var(--pos-border)",
                  background: active ? "var(--pos-accent-soft)" : "var(--pos-card)", boxShadow: "none",
                }}
              >
                <span style={{ fontSize: 30 }}>{whIcon(w.warehouseType)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--pos-text)" }}>
                    {w.warehouseName || w.warehouseCode || `Ombor #${w.warehouseId}`}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--pos-text-muted)", fontFamily: "monospace" }}>
                    {w.warehouseCode}{w.isPrimary ? " · ⭐" : ""}
                  </div>
                </div>
                {active && <span style={{ color: "var(--pos-accent)", fontWeight: 800, fontSize: 18 }}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── BOSH EKRAN ──────────────────────────────────────────────────────────────
export default function PosHome() {
  const { t } = usePosI18n();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const [warehouses, setWarehouses] = useState<MyWarehouse[]>([]);
  const [activeId, setActiveId]     = useState<number | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [showSwitcher, setShowSwitcher] = useState(false);

  const persistActive = useCallback((w: MyWarehouse) => {
    setActiveId(w.warehouseId);
    try {
      localStorage.setItem(ACTIVE_WH_KEY, JSON.stringify({
        warehouseId: w.warehouseId, warehouseCode: w.warehouseCode,
        warehouseName: w.warehouseName, warehouseType: w.warehouseType,
      }));
    } catch { /* noop */ }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await fetchMyWarehouses();
      setWarehouses(rows);
      if (rows.length > 0) {
        // Saqlangan tanlov bor + hali biriktirilgan bo'lsa — uni tikla, aks holda is_primary (birinchi).
        let chosen = rows[0];
        try {
          const saved = localStorage.getItem(ACTIVE_WH_KEY);
          if (saved) {
            const parsed = JSON.parse(saved) as { warehouseId?: number };
            const match = rows.find(r => r.warehouseId === parsed.warehouseId);
            if (match) chosen = match;
          }
        } catch { /* noop */ }
        persistActive(chosen);
      } else {
        setActiveId(null);
      }
    } catch (e: unknown) {
      setError((e as Error)?.message ?? "Omborlarni yuklashda xato");
    } finally {
      setLoading(false);
    }
  }, [persistActive]);

  useEffect(() => { void load(); }, [load]);

  const active = warehouses.find(w => w.warehouseId === activeId) ?? null;
  const userLabel = user?.fullName || user?.username || "";

  const tt = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };

  return (
    <div className="pos-home">

      {/* ── TEPA: joriy ombor + almashtirish ── */}
      <div className="pos-home-header">
        <span style={{ fontSize: 38, lineHeight: 1 }}>
          {active ? whIcon(active.warehouseType) : "🏪"}
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--pos-text-muted)", letterSpacing: 0.6, textTransform: "uppercase" }}>
            {tt("posHome.activeWarehouse", "Joriy ombor")}
          </div>
          <div style={{ fontSize: 19, fontWeight: 800, color: "var(--pos-text)", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {loading
              ? "…"
              : active
                ? (active.warehouseName || active.warehouseCode || `Ombor #${active.warehouseId}`)
                : tt("posHome.noWarehouse", "Ombor biriktirilmagan")}
          </div>
          {active?.warehouseCode && (
            <div style={{ fontSize: 11, color: "var(--pos-text-muted)", fontFamily: "monospace" }}>
              {active.warehouseCode}{active.isPrimary ? " · ⭐" : ""}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {userLabel && (
          <div style={{ textAlign: "right", lineHeight: 1.2, marginRight: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--pos-text)" }}>{userLabel}</div>
            {user?.role && <div style={{ fontSize: 10, color: "var(--pos-text-muted)" }}>{user.role}</div>}
          </div>
        )}

        {/* Switcher — faqat bir nechta ombor bo'lsa ko'rinadi (bitta → yashirin) */}
        {warehouses.length > 1 && (
          <button
            className="pos-btn pos-btn-primary"
            style={{ fontSize: 13, padding: "10px 16px" }}
            onClick={() => setShowSwitcher(true)}
          >
            🔀 {tt("posHome.switchWarehouse", "Ombor almashtirish")}
          </button>
        )}
      </div>

      {/* ── Xato holati ── */}
      {!loading && error && (
        <div style={{ textAlign: "center", padding: "20px", marginBottom: 20, color: "var(--pos-danger)", background: "var(--pos-card)", border: "1px solid var(--pos-border)", borderRadius: 14 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{tt("posHome.loadError", "Omborlarni yuklashda xato")}</div>
          <div style={{ fontSize: 12, color: "var(--pos-text-muted)", marginBottom: 14 }}>{error}</div>
          <button className="pos-btn pos-btn-ghost" onClick={() => void load()}>🔄 {tt("posHome.retry", "Qayta urinish")}</button>
        </div>
      )}

      {/* ── MARKAZ: katta rangli amal-tugmalari ── */}
      <div className="pos-action-grid">
        {ACTIONS.map(a => (
          <button
            key={a.key}
            type="button"
            className={`pos-action-btn pos-action-${a.variant}`}
            onClick={() => navigate(a.to)}
            aria-label={tt(a.nameKey, a.nameFallback)}
          >
            <span className="pos-action-icon" aria-hidden="true">{a.icon}</span>
            <span className="pos-action-name">{tt(a.nameKey, a.nameFallback)}</span>
            <span className="pos-action-sub">{tt(a.subKey, a.subFallback)}</span>
          </button>
        ))}
      </div>

      {showSwitcher && (
        <WarehouseSwitcher
          warehouses={warehouses}
          activeId={activeId}
          onPick={w => { persistActive(w); setShowSwitcher(false); }}
          onClose={() => setShowSwitcher(false)}
        />
      )}
    </div>
  );
}
