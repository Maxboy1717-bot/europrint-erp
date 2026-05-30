/**
 * @module DesignNotifications
 * @description React UI component.
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

interface DesignOrderNotification {
  id: number;
  orderId: string;
  recipientId: string;
  recipientRole: 'sales' | 'design';
  notificationType: 'status_update' | 'message' | 'deadline';
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
}

export function DesignNotifications() {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);

  const { data: notifications = [] } = useQuery<DesignOrderNotification[]>({
    queryKey: ["/api/design/notifications"],
    refetchInterval: 60000,
    retry: false,
    enabled: false, // Disabled - requires design module authentication
    staleTime: Infinity,
  });

  const unreadCount = (Array.isArray(notifications) ? notifications : []).filter(n => !n.read).length;

  const markAsRead = async (notificationId: number) => {
    try {
      await apiRequest('PATCH', `/api/design/notifications/${notificationId}/read`);
      queryClient.invalidateQueries({ queryKey: ["/api/design/notifications"] });
    } catch {
      /* best-effort: marking a notification read is non-critical */
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'status_update':
        return <CheckCircle className="h-5 w-5 text-[var(--ep-green)]" />;
      case 'message':
        return <MessageCircle className="h-5 w-5 text-[var(--ep-blue)]" />;
      case 'deadline':
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
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 max-h-96 overflow-y-auto" align="end" data-testid="popover-notifications">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">{t("notifications")}</h4>
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
                    notification.read ? 'bg-background' : 'bg-blue-50 dark:bg-blue-950'
                  }`}
                  onClick={() => {
                    if (!notification.read) {
                      markAsRead(notification.id);
                    }
                  }}
                  data-testid={`notification-${notification.id}`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notification.notificationType)}</div>
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
