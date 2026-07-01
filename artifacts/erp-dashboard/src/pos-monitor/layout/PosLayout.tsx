/**
 * @module PosLayout
 * @description Source module. See exports for details.
 */

import { useState, useEffect, ReactNode } from "react";
import { Link } from "wouter";
import { usePosI18n } from "../i18n/usePosI18n";
import { useAuth } from "@/hooks/useAuth";
import { getPosSocket } from "../socket/pos-socket";
import PosOfflineBanner from "../components/PosOfflineBanner";
import PosNotificationsDrawer from "../components/PosNotificationsDrawer";

interface PosLayoutProps { children: ReactNode; }

// POS Monitor = FAQAT MA'LUMOT KIRITISH (data entry), bitta kirish nuqtasi (/pos-monitor).
// Doimiy nav-daraxt YO'Q — bosh-ekran (PosHome) tugma-panjarasi orqali navigatsiya (spec 2026-06-27).
export default function PosLayout({ children }: PosLayoutProps) {
  const { t, lang, toggleLang } = usePosI18n();
  const { user, logout } = useAuth();
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
    // ERP SSO: server httpOnly cookie'larni tozalaydi va /login ga yo'naltiradi.
    void logout();
  }

  const userLabel = user?.fullName || user?.username || "";
  const userRole  = user?.role ?? "";

  return (
    <div className="pos-root">
      <div className="pos-grid-bg" />

      {/* Topbar — bosh-ekranga qaytish (logo) + soat/holat/til/bildirishnoma/user/chiqish.
          Doimiy nav-daraxt YO'Q — barcha sahifalar PosHome tugma-panjarasidan ochiladi. */}
      <div className="pos-topbar">
        <Link href="/pos-monitor" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--ep-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>📡</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--pos-accent)", letterSpacing: 1 }}>{t('common.posMonitor')}</div>
            <div style={{ fontSize: 10, color: "var(--pos-text-muted)" }}>{t("europrintErp")}</div>
          </div>
        </Link>

        <a
          href="/accounting/cash-register"
          style={{ fontSize: 11, color: "var(--pos-text-muted)", textDecoration: "none", opacity: 0.7 }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "0.7")}
        >
          {t("erpGaQaytish")}
        </a>

        <div style={{ flex: 1 }} />

        {/* Clock */}
        <span className="pos-mono" style={{ fontSize: 14, color: "var(--pos-accent)", letterSpacing: 1 }}>
          {formatClock(clock)}
        </span>

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

      {/* Main area */}
      <div className="pos-main">
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
