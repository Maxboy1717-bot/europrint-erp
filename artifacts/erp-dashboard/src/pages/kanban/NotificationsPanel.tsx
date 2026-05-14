/**
 * @module NotificationsPanel
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PopoverContent } from "@/components/ui/popover";
import { Bell, CheckSquare, Clock, Zap, ChevronLeft, ChevronRight, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { TaskNotification } from "@shared/schema";
import { type T, type NotificationCategory } from "./kanban-types";
import { EPStatusPill } from "@/components/ep";

export function NotificationsPanel({
  open,
  onOpenChange,
  t,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  t: typeof T.uz;
}) {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>("all");
  const [selectedNotification, setSelectedNotification] = useState<TaskNotification | null>(null);

  const { data: notifications = [] } = useQuery<TaskNotification[]>({
    queryKey: ["/api/kanban/notifications"],
    enabled: open,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PUT", `/api/kanban/notifications/${id}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/notifications/unread-count"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", "/api/kanban/notifications/read-all", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/notifications/unread-count"] });
      toast({ title: "Bildirishnomalar o'qildi", description: "Barcha bildirishnomalar o'qilgan deb belgilandi" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Bildirishnomalarni belgilab bo'lmadi", variant: "destructive" });
    },
  });

  const categories = [
    { id: "all" as NotificationCategory, label: t.notifications.allCategory || "Hammasi", icon: Bell },
    { id: "task" as NotificationCategory, label: t.notifications.taskCategory || "Vazifalar", icon: CheckSquare },
    { id: "reminder" as NotificationCategory, label: t.notifications.reminderCategory || "Eslatmalar", icon: Clock },
    { id: "automation" as NotificationCategory, label: t.notifications.automationCategory || "Avtomatik", icon: Zap },
  ];

  const getNotificationCategory = (notif: TaskNotification): NotificationCategory => {
    const notifType = notif.type || "";
    if (notifType.includes("reminder") || notifType.includes("deadline")) return "reminder";
    if (notifType.includes("robot") || notifType.includes("automation")) return "automation";
    return "task";
  };

  const filteredNotifications = activeCategory === "all" 
    ? notifications 
    : (Array.isArray(notifications) ? notifications : []).filter(n => getNotificationCategory(n) === activeCategory);

  const unreadCounts = {
    all: (Array.isArray(notifications) ? notifications : []).filter(n => !n.isRead).length,
    task: (Array.isArray(notifications) ? notifications : []).filter(n => !n.isRead && getNotificationCategory(n) === "task").length,
    reminder: (Array.isArray(notifications) ? notifications : []).filter(n => !n.isRead && getNotificationCategory(n) === "reminder").length,
    automation: (Array.isArray(notifications) ? notifications : []).filter(n => !n.isRead && getNotificationCategory(n) === "automation").length,
  };

  return (
    <PopoverContent className="w-[480px] p-0" align="end">
      <div className="flex h-[400px]">
        <div className="w-full sm:w-[140px] border-r bg-muted/30 flex flex-col">
          <div className="p-2 border-b">
            <h4 className="text-xs font-medium text-muted-foreground">{t.notifications.categories || "Kategoriyalar"}</h4>
          </div>
          <div className="flex-1 p-1 space-y-0.5">
            {(Array.isArray(categories) ? categories : []).map(cat => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-start h-9 text-xs"
                onClick={() => setActiveCategory(cat.id)}
                data-testid={`notification-category-${cat.id}`}
              >
                <cat.icon className="h-3 w-3 mr-1.5" />
                {cat.label}
                {unreadCounts[cat.id] > 0 && (
                  <EPStatusPill tone="danger" className="ml-auto h-4 px-1 text-[10px]">
                    {unreadCounts[cat.id]}
                  </EPStatusPill>
                )}
              </Button>
            ))}
          </div>
          <div className="p-2 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-xs h-7"
              onClick={() => markAllReadMutation.mutate()} 
              disabled={markAllReadMutation.isPending}
              data-testid="button-mark-all-read"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              {t.notifications.markAllRead}
            </Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between p-2 border-b">
            <h3 className="font-semibold text-sm">{t.notifications.title}</h3>
            <span className="text-xs text-muted-foreground">
              {filteredNotifications.length} {t.notifications.items || "ta"}
            </span>
          </div>

          {selectedNotification ? (
            <div className="flex-1 p-3 space-y-3">
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setSelectedNotification(null)}>
                <ChevronLeft className="h-3 w-3 mr-1" />
                Orqaga
              </Button>
              <div className="space-y-2">
                <h4 className="font-medium">{selectedNotification.title}</h4>
                <p className="text-sm text-muted-foreground">{selectedNotification.message}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                  <Clock className="h-3 w-3" />
                  {selectedNotification.createdAt && format(new Date(selectedNotification.createdAt), "dd.MM.yyyy HH:mm")}
                </div>
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                  <Bell className="h-8 w-8 mb-2 opacity-30" />
                  <span className="text-sm">{t.notifications.empty}</span>
                </div>
              ) : (
                <div className="divide-y">
                  {(Array.isArray(filteredNotifications) ? filteredNotifications : []).map((notif) => {
                    const category = getNotificationCategory(notif);
                    const CategoryIcon = category === "reminder" ? Clock : category === "automation" ? Zap : CheckSquare;
                    
                    return (
                      <div
                        key={notif.id}
                        className={`p-2.5 hover-elevate cursor-pointer flex items-start gap-2 ${!notif.isRead ? "bg-primary/5" : ""}`}
                        onClick={() => {
                          if (!notif.isRead) markReadMutation.mutate(notif.id);
                          setSelectedNotification(notif);
                        }}
                        data-testid={`notification-${notif.id}`}
                      >
                        <div className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                          category === "reminder" ? "bg-amber-500/20 text-[var(--ep-yellow)]" :
                          category === "automation" ? "bg-purple-500/20 text-[var(--ep-purple)]" :
                          "bg-blue-500/20 text-[var(--ep-blue)]"
                        }`}>
                          <CategoryIcon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {!notif.isRead && <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />}
                            <p className="text-sm font-medium truncate">{notif.title}</p>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{notif.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {notif.createdAt && format(new Date(notif.createdAt), "dd.MM HH:mm")}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          )}
        </div>
      </div>
    </PopoverContent>
  );
}
