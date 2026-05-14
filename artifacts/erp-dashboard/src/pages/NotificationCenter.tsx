/**
 * NotificationCenter.tsx
 * ERP — Markaziy xabarnomalar sahifasi.
 * URL: /wms/notifications
 */
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, CheckCheck, Filter } from "lucide-react";
import { EPStatusPill } from "@/components/ep";

interface Notification {
  id: number;
  type: string;
  title: string;
  body: string;
  entityType?: string;
  entityId?: number;
  isRead: boolean;
  createdAt: string;
}

const TYPE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  MOVEMENT_CREATED:  { icon: "🔄", color: "bg-blue-100 text-blue-800",      label: "Yangi harakat" },
  MOVEMENT_PENDING:  { icon: "⏳", color: "bg-amber-100 text-amber-800",    label: "Tasdiqlash kerak" },
  MOVEMENT_APPROVED: { icon: "✅", color: "bg-emerald-100 text-emerald-800", label: "Tasdiqlangan" },
  MOVEMENT_REJECTED: { icon: "❌", color: "bg-red-100 text-red-800",        label: "Rad etilgan" },
  QC_PENDING:        { icon: "🔬", color: "bg-violet-100 text-violet-800",  label: "QC kerak" },
  QUARANTINE_EXPIRED:{ icon: "⏰", color: "bg-amber-100 text-amber-800",    label: "Karantin 48+ soat" },
  LOW_STOCK:         { icon: "⚠️", color: "bg-red-100 text-red-800",        label: "Past stok" },
  GL_POSTED:         { icon: "📒", color: "bg-emerald-100 text-emerald-800", label: "GL yozuv" },
  DAMAGE_ACT:        { icon: "⚡", color: "bg-red-100 text-red-800",        label: "Zarar akti" },
  REQUEST_APPROVED:  { icon: "📋", color: "bg-emerald-100 text-emerald-800", label: "So'rov tasdiqlangan" },
};

function fmtDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60_000) return "hozir";
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)} daqiqa oldin`;
    if (diff < 86400_000) return `${Math.floor(diff / 3600_000)} soat oldin`;
    return d.toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" });
  } catch { return iso; }
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiRequest<Notification[] | { rows: Notification[] }>("GET", "/api/pos/notifications");
      const list = Array.isArray(r) ? r : (r as { rows: Notification[] })?.rows ?? [];
      setNotifications(list);
    } catch { setNotifications([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 30000);
    return () => clearInterval(t);
  }, []);

  const markRead = async (id: number) => {
    try {
      await apiRequest("POST", `/api/pos/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch { /* noop */ }
  };

  const markAllRead = async () => {
    try {
      await apiRequest("POST", "/api/pos/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch { /* noop */ }
  };

  const filtered = notifications.filter(n => {
    if (filter === "unread" && n.isRead) return false;
    if (filter === "read" && !n.isRead) return false;
    if (typeFilter !== "all" && n.type !== typeFilter) return false;
    return true;
  });

  const types = Array.from(new Set(notifications.map(n => n.type))).sort();
  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.isRead).length,
  };

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="h-8 w-8 text-[var(--ep-yellow)]" />
        <div className="flex-1">
          <div className="text-xs text-gray-500 font-semibold">XABARNOMALAR MARKAZI</div>
          <h1 className="text-2xl font-bold">Bildirishnomalar</h1>
          <p className="text-sm text-gray-500">
            {stats.total} ta jami · <b className="text-[var(--ep-yellow)]">{stats.unread} ta o'qilmagan</b>
          </p>
        </div>
        <Button onClick={load} variant="outline">🔄</Button>
        {stats.unread > 0 && (
          <Button onClick={markAllRead} className="bg-emerald-600 hover:bg-[var(--ep-green)]/90">
            <CheckCheck className="h-4 w-4 mr-1" /> Hammasini o'qilgan deb belgilash
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 items-center">
        <div className="flex gap-1 bg-white border rounded-lg p-1">
          {(["all", "unread", "read"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-sm ${
                filter === f ? "bg-[var(--ep-blue)] text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {f === "all" ? "Barchasi" : f === "unread" ? `O'qilmagan (${stats.unread})` : "O'qilgan"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Filter className="h-4 w-4 text-gray-400" />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-1.5 border rounded text-sm">
            <option value="all">Barcha turlar</option>
            {types.map(t => <option key={t} value={t}>{TYPE_CONFIG[t]?.label ?? t}</option>)}
          </select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading && <div className="p-10 text-center text-gray-500">⏳ Yuklanmoqda...</div>}

          {!loading && filtered.length === 0 && (
            <div className="p-10 text-center text-gray-400">
              <Bell className="h-10 w-10 mx-auto mb-2 opacity-50" />
              Xabarnomalar yo'q
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="divide-y divide-gray-100">
              {filtered.map(n => {
                const cfg = TYPE_CONFIG[n.type] ?? { icon: "📬", color: "bg-gray-100 text-gray-700", label: n.type };
                return (
                  <div
                    key={n.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition ${!n.isRead ? "bg-blue-50/30" : ""}`}
                    onClick={() => !n.isRead && markRead(n.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{cfg.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-semibold text-sm">{n.title}</div>
                          {!n.isRead && <EPStatusPill tone="info">Yangi</EPStatusPill>}
                          <Badge variant="outline" className={`text-xs ${cfg.color}`}>{cfg.label}</Badge>
                        </div>
                        <div className="text-sm text-gray-600">{n.body}</div>
                        <div className="text-xs text-gray-400 mt-1">{fmtDate(n.createdAt)}</div>
                      </div>
                      {!n.isRead && (
                        <Button onClick={(e) => { e.stopPropagation(); void markRead(n.id); }} size="sm" variant="ghost">
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
