/**
 * @module DesignNotifications
 * @description Global bell icon in AppShell. audit 2026-08-06 T16: was wired to
 *   /api/design/notifications — an endpoint that never existed — with enabled:false,
 *   so the badge could never show. Now uses the real unified notifications API
 *   (GET /api/notifications/my + /my/unread-count + PATCH /:id/read).
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, CheckCircle, MessageCircle, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTranslation } from '@/lib/i18n';
import { Link } from "wouter";

interface BellNotification {
  id: number;
  type?: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

interface RawItem {
  id: number | string;
  type?: string;
  notificationType?: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string | Date;
}

export function DesignNotifications() {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);

  const { data: notifications = [] } = useQuery<BellNotification[]>({
    queryKey: ["/api/notifications/my", "bell"],
    queryFn: async () => {
      const r = await apiRequest<RawItem[] | { items?: RawItem[] }>(
        "GET", "/api/notifications/my?limit=10",
      );
      const rows = Array.isArray(r) ? r : (r as { items?: RawItem[] })?.items ?? [];
      return rows.map((n): BellNotification => ({
        id: typeof n.id === "string" ? Number(n.id) : n.id,
        type: n.notificationType ?? n.type,
        title: n.title,
        body: n.body,
        isRead: Boolean(n.isRead),
        createdAt: typeof n.createdAt === "string" ? n.createdAt : new Date(n.createdAt).toISOString(),
      }));
    },
    refetchInterval: 30000,
    retry: false,
  });

  const { data: unreadData } = useQuery<{ unreadCount: number }>({
    queryKey: ["/api/notifications/my/unread-count"],
    queryFn: async () => {
      const r = await apiRequest<{ data?: { unreadCount?: number } }>(
        "GET", "/api/notifications/my/unread-count",
      );
      return { unreadCount: Number(r?.data?.unreadCount ?? 0) };
    },
    refetchInterval: 30000,
    retry: false,
  });

  const unreadCount = unreadData?.unreadCount ?? 0;

  const markAsRead = async (notificationId: number) => {
    try {
      await apiRequest('PATCH', `/api/notifications/${notificationId}/read`);
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/my", "bell"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/my/unread-count"] });
    } catch {
      /* best-effort: marking a notification read is non-critical */
    }
  };

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'MOVEMENT_APPROVED':
      case 'REQUEST_APPROVED':
      case 'GL_POSTED':
        return <CheckCircle className="h-5 w-5 text-[var(--ep-green)]" />;
      case 'message':
      case 'chat.mention':
        return <MessageCircle className="h-5 w-5 text-[var(--ep-blue)]" />;
      case 'MOVEMENT_PENDING':
      case 'QUARANTINE_EXPIRED':
        return <Clock className="h-5 w-5 text-[var(--ep-primary)]" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-xs bg-red-500"
              data-testid="badge-notification-count"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 max-h-96 overflow-y-auto" align="end" data-testid="popover-notifications">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">{t("notifications")}</h4>
            <Link href="/notifications" onClick={() => setOpen(false)} className="text-xs text-[var(--ep-blue)] hover:underline">
              {t("filterBarchasi")}
            </Link>
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t("bildirishnomalarYoq")}
            </p>
          ) : (
            <div className="space-y-2">
              {(Array.isArray(notifications) ? notifications : []).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border cursor-pointer hover-elevate ${
                    notification.isRead ? 'bg-background' : 'bg-blue-50 dark:bg-blue-950'
                  }`}
                  onClick={() => {
                    if (!notification.isRead) {
                      markAsRead(notification.id);
                    }
                  }}
                  data-testid={`notification-${notification.id}`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{notification.body}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(notification.createdAt), 'dd.MM.yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
