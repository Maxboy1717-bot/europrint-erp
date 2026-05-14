/**
 * @module PosNotificationsDrawer
 * @description React UI component.
 */

import { useEffect, useState } from "react";
import { usePosI18n } from "../i18n/usePosI18n";
import { notificationsApi } from "../api/pos-monitor.api";

interface Notification {
  id: number;
  notificationType: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  entityType?: string;
  entityId?: number;
}

const TYPE_ICONS: Record<string, string> = {
  MOVEMENT_CREATED:       "🔄",
  MOVEMENT_STATUS_CHANGED:"✅",
  STOCK_ALERT:            "⚠️",
  LOW_STOCK:              "📉",
  QC_REQUIRED:            "🔬",
  APPROVAL_NEEDED:        "📋",
  DEFAULT:                "🔔",
};

interface Props { onClose: () => void; }

export default function PosNotificationsDrawer({ onClose }: Props) {
  const { t } = usePosI18n();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const data = await notificationsApi.getAll();
        setItems((Array.isArray(data) ? data : []) as Notification[]);
      } catch { /* noop */ } finally { setLoading(false); }
    })();
  }, []);

  async function markRead(id: number) {
    await notificationsApi.markRead(id);
    setItems(prev => (Array.isArray(prev) ? prev : []).map(n => n.id === id ? { ...n, isRead: true } : n));
  }

  async function markAll() {
    await notificationsApi.markAllRead();
    setItems(prev => (Array.isArray(prev) ? prev : []).map(n => ({ ...n, isRead: true })));
  }

  const icon = (type: string) => TYPE_ICONS[type] ?? TYPE_ICONS["DEFAULT"];
  const fmt  = (d: string) => new Date(d).toLocaleString("uz-UZ");

  return (
    <>
      <div className="pos-drawer-overlay" onClick={onClose} />
      <div className="pos-drawer pos-slide-in-right">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ margin: 0, color: "var(--pos-text)", fontSize: 16, fontWeight: 600 }}>
            🔔 {t("notifications.title")}
          </h3>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="pos-btn pos-btn-ghost" style={{ fontSize: 11, padding: "4px 8px" }} onClick={() => void markAll()}>
              {t("notifications.markAllRead")}
            </button>
            <button className="pos-btn pos-btn-ghost" style={{ padding: "4px 8px" }} onClick={onClose}>✕</button>
          </div>
        </div>

        {loading && <p style={{ color: "var(--pos-text-muted)", textAlign: "center" }}>{t("common.loading")}</p>}

        {!loading && items.length === 0 && (
          <p style={{ color: "var(--pos-text-muted)", textAlign: "center", marginTop: 40 }}>
            {t("notifications.noItems")}
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(Array.isArray(items) ? items : []).map(notif => (
            <div
              key={notif.id}
              style={{
                background: notif.isRead ? "rgba(15,22,41,0.3)" : "rgba(0,212,255,0.05)",
                border: `1px solid ${notif.isRead ? "var(--pos-border)" : "rgba(0,212,255,0.2)"}`,
                borderRadius: 10,
                padding: "12px 14px",
                cursor: "pointer",
              }}
              onClick={() => !notif.isRead && void markRead(notif.id)}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{icon(notif.notificationType)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: notif.isRead ? 400 : 600, fontSize: 13, color: "var(--pos-text)" }}>
                    {notif.title}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--pos-text-muted)", marginTop: 2 }}>{notif.body}</div>
                  <div style={{ fontSize: 11, color: "var(--pos-text-muted)", marginTop: 6 }}>{fmt(notif.createdAt)}</div>
                </div>
                {!notif.isRead && (
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--pos-accent)", flexShrink: 0, marginTop: 4 }} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
