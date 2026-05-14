/**
 * @module ChatNotificationBell
 * @description React UI component.
 */

import { useState, useEffect, useCallback } from "react";
import { Bell, X, MessageSquare, AtSign, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useNavigate } from "@/hooks/use-navigate";
import { useChatStore } from "@/store/chatStore";
import { getSharedSocket } from "@/hooks/chat/useChatSocket";

interface ChatNotification {
  id: string;
  type: "MENTION" | "REPLY" | "REACTION" | "MESSAGE" | "SYSTEM";
  roomId: string;
  messageId: string;
  roomName?: string;
  title: string;
  body?: string;
  isRead: boolean;
  createdAt: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "hozirgina";
  if (mins < 60) return `${mins} daq oldin`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} soat oldin`;
  const days = Math.floor(hours / 24);
  return `${days} kun oldin`;
}

export function ChatNotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<ChatNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const setActiveRoomId = useChatStore((s) => s.setActiveRoomId);

  const [unreadBadge, setUnreadBadge] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await apiRequest("GET", "/api/chat/unread") as { count: number };
      setUnreadBadge(res.count ?? 0);
    } catch { /* ignore */ }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest("GET", "/api/chat/notifications") as { notifications: ChatNotification[]; unreadCount: number };
      setNotifications(Array.isArray(res.notifications) ? res.notifications : []);
      if (typeof res.unreadCount === 'number') setUnreadBadge(res.unreadCount);
    } catch {
      // Silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    fetchNotifications();
    const unreadInterval = setInterval(fetchUnreadCount, 15000);
    const notifInterval = setInterval(fetchNotifications, 30000);
    return () => { clearInterval(unreadInterval); clearInterval(notifInterval); };
  }, [fetchUnreadCount, fetchNotifications]);

  // Listen for real-time mention notifications
  useEffect(() => {
    const socket = getSharedSocket();
    if (!socket) return;
    const handler = (data: Omit<ChatNotification, "id" | "isRead" | "createdAt"> & { messageId: string }) => {
      const notif: ChatNotification = {
        id: Math.random().toString(36).slice(2),
        type: "MENTION",
        roomId: data.roomId,
        messageId: data.messageId,
        roomName: data.roomName,
        title: data.title || `@mention`,
        body: data.body,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications(prev => [notif, ...prev].slice(0, 50));
    };
    socket.on("notification:mention", handler);
    return () => { socket.off("notification:mention", handler); };
  }, []);

  const unreadCount = unreadBadge > 0 ? unreadBadge : (Array.isArray(notifications) ? notifications : []).filter(n => !n.isRead).length;

  const handleMarkAllRead = async () => {
    try {
      await apiRequest("PATCH", "/api/chat/notifications/read-all");
      setNotifications(prev => (Array.isArray(prev) ? prev : []).map(n => ({ ...n, isRead: true })));
    } catch { /* ignore */ }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await apiRequest("PATCH", `/api/chat/notifications/${id}/read`);
      setNotifications(prev => (Array.isArray(prev) ? prev : []).map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch { /* ignore */ }
  };

  const handleClickNotif = useCallback((notif: ChatNotification) => {
    handleMarkRead(notif.id);
    if (notif.roomId) {
      setActiveRoomId(notif.roomId);
      const socket = getSharedSocket();
      if (socket) {
        socket.emit("room:join", { roomId: notif.roomId });
        socket.emit("messages:list", { roomId: notif.roomId });
      }
    }
    setOpen(false);
    window.location.hash = "#/chat";
  }, [setActiveRoomId]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => { setOpen(p => !p); if (!open) fetchNotifications(); }}
        aria-label={`Chat bildirishnomalar${unreadCount > 0 ? ` — ${unreadCount} yangi` : ""}`}
        className={cn(
          "relative w-9 h-9 flex items-center justify-center rounded-lg",
          "text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150",
          open && "bg-muted text-foreground"
        )}
      >
        <MessageSquare className="w-4.5 h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-primary text-white flex items-center justify-center text-[9px] font-bold leading-none ring-2 ring-background">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 top-11 z-40 w-80 bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold">Chat Bildirishnomalar</h2>
                {unreadCount > 0 && (
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {unreadCount} yangi
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 px-2 py-1 rounded-md hover:bg-primary/5"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Barchasi
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Notifications list */}
            {loading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">Yuklanmoqda...</div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center px-4">
                <Bell className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm font-medium">Yangi bildirishnoma yo'q</p>
                <p className="text-xs text-muted-foreground mt-0.5">Barcha xabarlar o'qildi</p>
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-border/50">
                {notifications.slice(0, 10).map(notif => (
                  <button
                    key={notif.id}
                    onClick={() => handleClickNotif(notif)}
                    className={cn(
                      "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors",
                      !notif.isRead && "bg-primary/[0.03]"
                    )}
                  >
                    {!notif.isRead && (
                      <span className="absolute left-2 mt-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {notif.type === "MENTION" ? (
                        <AtSign className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <MessageSquare className="w-3.5 h-3.5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-medium truncate", !notif.isRead && "font-semibold")}>
                        {notif.title}
                      </p>
                      {notif.body && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{notif.body}</p>
                      )}
                      {notif.roomName && (
                        <p className="text-[10px] text-primary/70 mt-0.5">#{notif.roomName}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(notif.createdAt)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 border-t border-border">
                <a
                  href="#/chat"
                  className="text-xs text-primary hover:underline w-full text-center block"
                  onClick={() => setOpen(false)}
                >
                  Chat sahifasiga o'tish →
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
