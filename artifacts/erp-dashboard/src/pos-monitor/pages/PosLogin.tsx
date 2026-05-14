/**
 * @module PosLogin
 * @description React page component. Route-level UI.
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { usePosI18n } from "../i18n/usePosI18n";
import "../styles/pos-theme.css";

interface PosLoginResponse {
  token: string;
  userId: number;
  role: string;
  username: string;
}

function GridParticles() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      <div className="pos-grid-bg" />
      {Array.from({ length: 12 }, (_, i) => (
        <div key={`particle-${i}`} style={{
          position: "absolute",
          width: 3, height: 3, borderRadius: "50%",
          background: i % 3 === 0 ? "#3B82F6" : i % 3 === 1 ? "#10B981" : "#F59E0B",
          left: `${(i * 13 + 5) % 100}%`,
          top: `${(i * 17 + 10) % 100}%`,
          opacity: 0.18 + (i % 5) * 0.04,
          animation: `pos-pulse ${2 + (i % 4)}s infinite`,
        }} />
      ))}
    </div>
  );
}

export default function PosLogin() {
  const [, navigate] = useLocation();
  const { t } = usePosI18n();
  const [username, setUsername]     = useState("");
  const [password, setPassword]     = useState("");
  const [remember, setRemember]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [showPass, setShowPass]     = useState(false);

  useEffect(() => {
    try {
      const sess = localStorage.getItem("pos_session");
      if (sess) {
        const parsed = JSON.parse(sess) as { token?: string };
        if (parsed.token) {
          const parts = parsed.token.split(".");
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1])) as { exp?: number };
            if (!payload.exp || payload.exp * 1000 > Date.now()) {
              navigate("/pos-monitor");
              return;
            }
          }
          localStorage.removeItem("pos_session");
        }
      }
    } catch { /* noop */ }
  }, [navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) { setError("Username va parol majburiy"); return; }
    setLoading(true); setError("");
    try {
      // Use dedicated POS auth endpoint — independent from the main ERP auth flow.
      const _apiBase = (import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "") + "/api";
      const res = await fetch(`${_apiBase}/pos/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        let msg = res.statusText;
        let raw = "";
        try {
          raw = await res.text();
          const j = JSON.parse(raw) as { message?: string; error?: string };
          msg = j.message ?? j.error ?? msg;
        } catch { /* noop */ }
        console.error(`[POS Login] ${res.status} ${res.statusText}`, raw);
        setError(`Kirish xatosi (${res.status}): ${msg}`);
        setLoading(false);
        return;
      }

      const data = await res.json() as PosLoginResponse;
      if (!data.token) { setError("Server noto'g'ri javob qaytardi"); setLoading(false); return; }

      try {
        localStorage.setItem("pos_session", JSON.stringify({
          token:    data.token,
          username: data.username,
          userId:   data.userId,
          role:     data.role,
          remember,
        }));
      } catch (le) {
        setError(`Storage xatolik: ${String(le)}`);
        setLoading(false);
        return;
      }
      navigate("/pos-monitor");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kirish xatosi. Qaytadan urinib ko'ring.");
      setLoading(false);
    }
  }

  return (
    <div className="pos-root pos-login-bg">
      <GridParticles />

      <div className="pos-login-card pos-fade-in">
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 18, margin: "0 auto 16px",
            background: "var(--ep-primary)",
            border: "1px solid rgba(0,212,255,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32,
            animation: "glow 3s infinite",
          }}>📡</div>
          <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: 1 }}>
            {t("auth.title")}
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "var(--pos-text-muted)" }}>
            {t("auth.subtitle")}
          </p>
        </div>

        {/* Decorative line */}
        <div style={{ height: 1, background: "var(--ep-primary)", marginBottom: 28 }} />

        <form onSubmit={(e) => void handleLogin(e)}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, color: "var(--pos-text-muted)", marginBottom: 6, fontWeight: 500 }}>
              {t("auth.username")}
            </label>
            <input
              className="pos-input"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              placeholder={t('common.admin1')}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, color: "var(--pos-text-muted)", marginBottom: 6, fontWeight: 500 }}>
              {t("auth.password")}
            </label>
            <div style={{ position: "relative" }}>
              <input
                className="pos-input"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--pos-text-muted)", fontSize: 16, padding: 4, lineHeight: 1,
                }}
                tabIndex={-1}
                aria-label={showPass ? "Parolni yashirish" : "Parolni ko'rsatish"}
              >
                {showPass ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
            <input
              type="checkbox"
              id="remember"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
              style={{ accentColor: "var(--pos-accent)" }}
            />
            <label htmlFor="remember" style={{ fontSize: 13, color: "var(--pos-text-muted)", cursor: "pointer" }}>
              {t("auth.rememberTerminal")}
            </label>
          </div>

          {error && (
            <div style={{
              background: "rgba(255,71,87,0.1)", border: "1px solid rgba(255,71,87,0.3)",
              borderRadius: 8, padding: "10px 14px", marginBottom: 16,
              fontSize: 13, color: "var(--pos-danger)",
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="pos-btn pos-btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: 14, fontWeight: 600 }}
            disabled={loading}
          >
            {loading ? (
              <><span className="pos-live">⏳</span> {t("auth.loggingIn")}</>
            ) : (
              <><span>🔐</span> {t("auth.loginBtn")}</>
            )}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 11, color: "var(--pos-text-muted)", opacity: 0.6 }}>
          POS Monitor v2.0 · EuroPrint ERP
        </div>
      </div>
    </div>
  );
}
