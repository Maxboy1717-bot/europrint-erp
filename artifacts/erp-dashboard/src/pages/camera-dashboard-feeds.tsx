/**
 * @module camera-dashboard-feeds
 * @description Side-by-side alerts and recent-events scroll panels for the
 * Camera AI Monitoring dashboard.  Pure presentational component — no data
 * fetching.
 */

import { Badge }      from "@/components/ui/badge";
import { Button }     from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton }   from "@/components/ui/skeleton";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Link } from "wouter";
import {
  alertTypeIcons,
  eventTypeLabels,
  type CameraAlert,
  type CameraEvent,
} from "./camera-dashboard-types";
import { useTranslation } from '@/lib/i18n';

type Lang = "uz" | "ru";

export interface AlertsAndEventsPanelProps {
  pendingAlerts:  CameraAlert[];
  recentEvents:   CameraEvent[];
  alertsLoading:  boolean;
  eventsLoading:  boolean;
  totalEventCount: number;
  language: Lang;
  t: (key: string) => string;
}

/** Side-by-side pending-alerts and recent-events scroll panels. */
export function AlertsAndEventsPanel({
  pendingAlerts,
  recentEvents,
  alertsLoading,
  eventsLoading,
  totalEventCount,
  language,
  t,
}: AlertsAndEventsPanelProps) {
  const { t } = useTranslation("common");
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ---- Pending alerts ---- */}
      <Card
        className="bg-card border-none rounded-lg overflow-hidden shadow-none"
        data-testid="card-pending-alerts"
      >
        <CardHeader className="bg-muted/40/50 flex flex-row items-center justify-between gap-2 py-4">
          <div>
            <CardTitle className="text-[14px] font-semibold font-bold flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-5 w-5 text-[var(--ep-primary)]" />
              {language === "uz" ? "Kutilayotgan ogohlantirishlar" : "Ожидающие уведомления"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {pendingAlerts.length} {t("pending")}
            </CardDescription>
          </div>
          <Link href="/camera-alerts">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg font-semibold"
              data-testid="link-view-all-alerts"
            >
              {t("seeAll")}
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-4">
          <ScrollArea className="h-[300px]">
            {alertsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={`k-${i}`} className="h-20 rounded-lg" />
                ))}
              </div>
            ) : pendingAlerts.length > 0 ? (
              <div className="space-y-3">
                {pendingAlerts.slice(0, 5).map((alert) => {
                  const IconComponent = alertTypeIcons[alert.alertType] ?? AlertCircle;
                  return (
                    <div
                      key={alert.id}
                      className="flex items-start gap-4 p-4 rounded-lg bg-background border border-border hover:bg-muted/40 transition-colors group"
                      data-testid={`alert-item-${alert.id}`}
                    >
                      <div className={`p-2.5 rounded-lg ${
                        alert.severity === "critical" ? "bg-red-100 text-[var(--ep-red)]"    :
                        alert.severity === "high"     ? "bg-orange-100 text-[var(--ep-primary)]" :
                                                        "bg-yellow-100 text-[var(--ep-yellow)]"
                      }`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-bold text-foreground truncate">
                            {language === "uz" ? alert.title : (alert.titleRu || alert.title)}
                          </p>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            {new Date(alert.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                          {alert.message}
                        </p>
                        <Badge
                          className={`${
                            alert.severity === "critical" ? "bg-red-100 text-red-800"    :
                            alert.severity === "high"     ? "bg-orange-100 text-orange-800" :
                                                            "bg-yellow-100 text-yellow-800"
                          } border-none rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider`}
                          variant="outline"
                        >
                          {alert.severity}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <CheckCircle className="h-12 w-12 mb-2 text-[var(--ep-green)]" />
                <p>
                  {language === "uz"
                    ? "Kutilayotgan ogohlantirish yo'q"
                    : "Нет ожидающих уведомлений"}
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* ---- Recent events ---- */}
      <Card
        className="bg-card border-none rounded-lg overflow-hidden shadow-none"
        data-testid="card-recent-events"
      >
        <CardHeader className="bg-muted/40/50 flex flex-row items-center justify-between gap-2 py-4">
          <div>
            <CardTitle className="text-[14px] font-semibold font-bold flex items-center gap-2 text-foreground">
              <Activity className="h-5 w-5 text-[var(--ep-blue)]" />
              {language === "uz" ? "So'nggi hodisalar" : "Последние события"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {totalEventCount} {language === "uz" ? "hodisalar" : "события"}
            </CardDescription>
          </div>
          <Link href="/camera-alerts">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg font-semibold"
              data-testid="link-view-all-events"
            >
              {t("seeAll")}
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-4">
          <ScrollArea className="h-[300px]">
            {eventsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={`k-${i}`} className="h-20 rounded-lg" />
                ))}
              </div>
            ) : recentEvents.length > 0 ? (
              <div className="space-y-3">
                {recentEvents.slice(0, 5).map((event) => {
                  const label = eventTypeLabels[event.eventType] ?? {
                    uz: event.eventType,
                    ru: event.eventType,
                  };
                  return (
                    <div
                      key={event.id}
                      className="flex items-start gap-4 p-4 rounded-lg bg-background border border-border hover:bg-muted/40 transition-colors group"
                      data-testid={`event-item-${event.id}`}
                    >
                      <div className={`p-2.5 rounded-lg ${
                        event.severity === "critical" ? "bg-red-100 text-[var(--ep-red)]"    :
                        event.severity === "high"     ? "bg-orange-100 text-[var(--ep-primary)]" :
                        event.severity === "medium"   ? "bg-yellow-100 text-[var(--ep-yellow)]" :
                                                        "bg-blue-100 text-[var(--ep-blue)]"
                      }`}>
                        <AlertCircle className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-bold text-foreground">
                            {language === "uz" ? label.uz : label.ru}
                          </p>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            {event.eventTime || new Date(event.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                          {event.description}
                        </p>
                        <Badge
                          className={`${
                            event.severity === "critical" ? "bg-red-100 text-red-800"    :
                            event.severity === "high"     ? "bg-orange-100 text-orange-800" :
                            event.severity === "medium"   ? "bg-yellow-100 text-yellow-800" :
                                                            "bg-blue-100 text-blue-800"
                          } border-none rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider`}
                          variant="outline"
                        >
                          {event.severity}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                <Activity className="h-12 w-12 mb-4 opacity-20" />
                <p className="font-bold">
                  {language === "uz" ? "Bugun hodisa yo'q" : "Сегодня нет событий"}
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
