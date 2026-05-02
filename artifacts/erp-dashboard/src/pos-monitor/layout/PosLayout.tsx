import { useState, useEffect, ReactNode } from "react";
import { useLocation, Link } from "wouter";
import { usePosI18n } from "../i18n/usePosI18n";
import { getPosSocket } from "../socket/pos-socket";
import PosOfflineBanner from "../components/PosOfflineBanner";
import PosNotificationsDrawer from "../components/PosNotificationsDrawer";

interface NavItem {
  icon: string;
  key: string;
  path: string;
  role?: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: "📊", key: "nav.dashboard",    path: "/pos-monitor" },
  { icon: "🏪", key: "nav.warehouses",   path: "/pos-monitor/warehouses" },
  { icon: "📦", key: "nav.materials",    path: "/pos-monitor/materials" },
  { icon: "🔄", key: "nav.movements",    path: "/pos-monitor/movements" },
  { icon: "👤", key: "nav.ledger",       path: "/pos-monitor/ledger" },
  { icon: "📋", key: "nav.requests",     path: "/pos-monitor/requests" },
  { icon: "📋", key: "nav.inventory",    path: "/pos-monitor/inventory" },
  { icon: "📈", key: "nav.reports",      path: "/pos-monitor/reports" },
  { icon: "⚙️", key: "nav.admin",        path: "/pos-monitor/admin" },
];

interface PosLayoutProps { children: ReactNode; }

export default function PosLayout({ children }: PosLayoutProps) {
  const [location, navigate] = useLocation();
  const { t, lang, toggleLang } = usePosI18n();
  const [mini, setMini] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [clock, setClock] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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
    try { localStorage.removeItem("pos_session"); } catch { /* noop */ }
    navigate("/pos-monitor/login");
  }

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
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#00D4FF,#0094B8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>📡</div>
            {!mini && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--pos-accent)", letterSpacing: 1 }}>POS MONITOR</div>
                <div style={{ fontSize: 10, color: "var(--pos-text-muted)" }}>EuroPrint ERP</div>
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
              ← ERP ga qaytish
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
        </div>

        {/* Collapse toggle */}
        <div style={{ padding: "12px 8px", borderTop: "1px solid var(--pos-border)" }}>
          <button
            className="pos-btn pos-btn-ghost"
            style={{ width: "100%", justifyContent: mini ? "center" : "flex-start" }}
            onClick={() => setMini(m => !m)}
          >
            <span>{mini ? "→" : "←"}</span>
            {!mini && <span style={{ fontSize: 12 }}>Yopish</span>}
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
