/**
 * @module PosLayout
 * @description Source module. See exports for details.
 */

import { useState, useEffect, ReactNode } from "react";
import { useLocation, Link } from "wouter";
import { usePosI18n } from "../i18n/usePosI18n";
import { useAuth } from "@/hooks/useAuth";
import { getPosSocket } from "../socket/pos-socket";
import { warehousesApi } from "../api/pos-monitor.api";
import PosOfflineBanner from "../components/PosOfflineBanner";
import PosNotificationsDrawer from "../components/PosNotificationsDrawer";

interface NavItem {
  icon: string;
  key: string;
  path: string;
  role?: string;
}

interface DynamicWarehouse {
  id: string;
  code: string | null;
  name: string | null;
  type: string | null;
}

// Ombor turi → ikonka
const WH_TYPE_ICON: Record<string, string> = {
  RAW_MATERIAL:   "📦",
  FINISHED_GOODS: "✅",
  WIP:            "⚙️",
  SCRAP:          "⚠️",
  QUARANTINE:     "🔒",
  TOOLS:          "🔧",
  HOUSEHOLD:      "🏠",
  MRO:            "🛠️",
  MAIN:           "🏭",
};

// POS Monitor = FAQAT MA'LUMOT KIRITISH (data entry)
// ERP = analytics, hisobotlar, audit
// Sidebar ixcham — 7 ta asosiy band + dinamik omborlar
const NAV_ITEMS: NavItem[] = [
  // ── Asosiy ──
  { icon: "📊", key: "nav.dashboard",     path: "/pos-monitor" },

  // ── Ma'lumot kiritish ──
  { icon: "📥", key: "nav.newKirim",      path: "/pos-monitor/movements/new/kirim" },
  { icon: "📤", key: "nav.newChiqim",     path: "/pos-monitor/movements/new/chiqim" },
  { icon: "➕", key: "nav.newMaterial",   path: "/pos-monitor/materials/new" },

  // ── Ko'rib chiqish ──
  { icon: "📦", key: "nav.materials",     path: "/pos-monitor/materials" },
  { icon: "🔬", key: "nav.qcreview",      path: "/pos-monitor/qc-review" },
  { icon: "🎒", key: "nav.myInventory",   path: "/pos-monitor/my-inventory" },

  // ── Topshirish / Import ──
  { icon: "🤝", key: "nav.handovers",     path: "/pos-monitor/handovers" },
  { icon: "🚢", key: "nav.inTransit",     path: "/pos-monitor/in-transit" },
];

interface PosLayoutProps { children: ReactNode; }

export default function PosLayout({ children }: PosLayoutProps) {
  const [location] = useLocation();
  const { t, lang, toggleLang } = usePosI18n();
  const { user, logout } = useAuth();
  const [mini, setMini] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [clock, setClock] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [warehouses, setWarehouses] = useState<DynamicWarehouse[]>([]);

  // Sidebar uchun barcha omborlarni yuklash
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await warehousesApi.getAll();
        if (!cancelled && Array.isArray(r)) {
          setWarehouses(r as DynamicWarehouse[]);
        }
      } catch { /* noop */ }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const tick = setInterval(() => setClock(new Date()), 1000);
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => { clearInterval(tick); window.removeEventListener("online", handleOnline); window.removeEventListener("offline", handleOffline); };
  }, []);

  useEffect(() => {
    try {
      const sock = getPosSocket();
      sock.on("notification.new", () => setNotifCount(c => c + 1));
      sock.on("stock.alert", () => setNotifCount(c => c + 1));
      return () => { sock.off("notification.new"); sock.off("stock.alert"); };
    } catch { return undefined; }
  }, []);

  const formatClock = (d: Date) => d.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  function handleLogout() {
    // ERP SSO: server httpOnly cookie'larni tozalaydi va /login ga yo'naltiradi.
    void logout();
  }

  const userLabel = user?.fullName || user?.username || "";
  const userRole  = user?.role ?? "";

  const isActive = (path: string) => {
    if (path === "/pos-monitor") return location === "/pos-monitor" || location === "/pos-monitor/";
    return location.startsWith(path);
  };

  return (
    <div className="pos-root" style={{ display: "flex" }}>
      <div className="pos-grid-bg" />

      {/* Sidebar */}
      <nav className={`pos-sidebar ${mini ? "mini" : ""}`} style={{ zIndex: 100 }}>
        {/* Logo */}
        <div style={{ padding: "20px 16px", borderBottom: "1px solid var(--pos-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--ep-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>📡</div>
            {!mini && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--pos-accent)", letterSpacing: 1 }}>{t('common.posMonitor')}</div>
                <div style={{ fontSize: 10, color: "var(--pos-text-muted)" }}>{t("europrintErp")}</div>
              </div>
            )}
          </div>
          {!mini && (
            <a
              href="/accounting/cash-register"
              style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 10, fontSize: 11, color: "var(--pos-text-muted)", textDecoration: "none", opacity: 0.7 }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "0.7")}
            >
              {t("erpGaQaytish")}
            </a>
          )}
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {NAV_ITEMS.map(item => (
            <Link key={item.path} href={item.path}>
              <div
                className={`pos-sidebar-item ${isActive(item.path) ? "active" : ""}`}
                title={mini ? t(item.key) : undefined}
              >
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                {!mini && <span>{t(item.key)}</span>}
              </div>
            </Link>
          ))}

          {/* ── HAR OMBOR ALOHIDA — dinamik ── */}
          {warehouses.length > 0 && (
            <>
              {!mini && (
                <div style={{
                  fontSize: 10, fontWeight: 700, color: "var(--pos-text-muted)",
                  letterSpacing: 1, padding: "12px 16px 4px",
                  textTransform: "uppercase",
                }}>
                  Omborlar ({warehouses.length})
                </div>
              )}
              {warehouses.map(w => {
                const icon = WH_TYPE_ICON[(w.type ?? "").toUpperCase()] ?? "🏪";
                const path = `/pos-monitor/warehouses/${w.id}`;
                return (
                  <Link key={w.id} href={path}>
                    <div
                      className={`pos-sidebar-item ${isActive(path) ? "active" : ""}`}
                      title={mini ? (w.name ?? w.code ?? w.id) : undefined}
                    >
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
                      {!mini && (
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 13, whiteSpace: "nowrap", overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}>
                            {w.name ?? w.code ?? `Ombor #${w.id}`}
                          </div>
                          {w.code && w.name && (
                            <div style={{
                              fontSize: 9, color: "var(--pos-text-muted)",
                              fontFamily: "monospace", lineHeight: 1.2,
                            }}>
                              {w.code}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </>
          )}
        </div>

        {/* Collapse toggle */}
        <div style={{ padding: "12px 8px", borderTop: "1px solid var(--pos-border)" }}>
          <button
            className="pos-btn pos-btn-ghost"
            style={{ width: "100%", justifyContent: mini ? "center" : "flex-start" }}
            onClick={() => setMini(m => !m)}
          >
            <span>{mini ? "→" : "←"}</span>
            {!mini && <span style={{ fontSize: 12 }}>{t("close2")}</span>}
          </button>
        </div>
      </nav>

      {/* Main area */}
      <div className={`pos-main ${mini ? "mini" : ""}`} style={{ flex: 1 }}>
        {/* Topbar */}
        <div className={`pos-topbar ${mini ? "mini" : ""}`}>
          {/* Clock */}
          <span className="pos-mono" style={{ fontSize: 14, color: "var(--pos-accent)", letterSpacing: 1 }}>
            {formatClock(clock)}
          </span>

          <div style={{ flex: 1 }} />

          {/* Online status */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: isOnline ? "var(--pos-success)" : "var(--pos-danger)", display: "inline-block" }} />
            <span style={{ color: isOnline ? "var(--pos-success)" : "var(--pos-danger)" }}>
              {isOnline ? t("common.online") : t("common.offline")}
            </span>
          </div>

          {/* Lang toggle */}
          <button className="pos-btn pos-btn-ghost" style={{ fontSize: 12, padding: "4px 10px" }} onClick={toggleLang}>
            🌐 {lang.toUpperCase()}
          </button>

          {/* Notifications */}
          <button
            className="pos-btn pos-btn-ghost"
            style={{ position: "relative", padding: "6px 10px" }}
            onClick={() => { setShowNotif(true); setNotifCount(0); }}
          >
            🔔
            {notifCount > 0 && (
              <span style={{ position: "absolute", top: 2, right: 2, background: "var(--pos-danger)", borderRadius: "50%", width: 16, height: 16, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                {notifCount > 9 ? "9+" : notifCount}
              </span>
            )}
          </button>

          {/* Current user (ERP SSO) */}
          {userLabel && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", lineHeight: 1.2, marginRight: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--pos-text)" }}>{userLabel}</span>
              {userRole && <span style={{ fontSize: 10, color: "var(--pos-text-muted)" }}>{userRole}</span>}
            </div>
          )}

          {/* Logout */}
          <button className="pos-btn pos-btn-ghost" style={{ fontSize: 12, padding: "4px 10px" }} onClick={handleLogout}>
            🚪 {t("auth.logout")}
          </button>
        </div>

        {/* Content */}
        <div className="pos-content" style={{ position: "relative", zIndex: 1 }}>
          <PosOfflineBanner />
          {children}
        </div>
      </div>

      {/* Notifications drawer */}
      {showNotif && <PosNotificationsDrawer onClose={() => setShowNotif(false)} />}
    </div>
  );
}
