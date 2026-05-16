/**
 * @module DashboardPanel
 * @description React page component. Route-level UI.
 */

import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ListTodo, CheckCheck, AlertTriangle, Play, MessageSquare,
  TrendingUp, Timer, Users, BarChart3, Clock, RefreshCw,
} from "lucide-react";
import { type T, type TeamMetrics, type TaskStats } from "./kanban-types";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

type OverdueInboxData = {
  count: number;
  cards: {
    cardId: string;
    cardTitle: string;
    boardName: string;
    columnName: string;
    createdAt: string;
    ownerFullName: string | null;
    priority: string;
    hoursOverdue: number;
  }[];
};

export function DashboardPanel({ t }: { t: (key: string) => string }) {
  const { data: metrics, isLoading: metricsLoading } = useQuery<TeamMetrics>({
    queryKey: ['/api/kanban/dashboard/team-metrics'],
  });

  const { data: taskStats, isLoading: statsLoading } = useQuery<TaskStats>({
    queryKey: ['/api/kanban/task-stats'],
  });

  const { data: employees = [] } = useQuery<{ id: string; fullName: string; profileImageUrl?: string | null }[]>({
    queryKey: ['/api/kanban/employees'],
  });

  const { data: overdueInbox } = useQuery<OverdueInboxData>({
    queryKey: ['/api/kanban/overdue-inbox'],
    refetchInterval: 5 * 60 * 1000,
  });

  const isLoading = metricsLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6" data-testid="dashboard-loading">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {([...Array(5)]).map((_, i) => (
            <Skeleton key={`k-${i}`} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, "0")}`;
  };

  const getEmployeeName = (userId: string) => {
    const emp = (Array.isArray(employees) ? employees : []).find(e => e.id === userId);
    return emp?.fullName || 'Noma\'lum';
  };

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label={t("refresh")}><RefreshCw className="h-4 w-4" /></Button>
    <div className="p-4 space-y-6" data-testid="dashboard-panel">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="p-4" data-testid="metric-total-tasks">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ListTodo className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-3xl font-bold">{taskStats?.summary?.totalTasks || metrics?.totalTasks || 0}</p>
              <p className="text-sm text-muted-foreground">{t("total")}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4" data-testid="metric-completed-tasks">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCheck className="h-6 w-6 text-[var(--ep-green)]" />
            </div>
            <div>
              <p className="text-3xl font-bold text-[var(--ep-green)]">{taskStats?.summary?.completedTasks || 0}</p>
              <p className="text-sm text-muted-foreground">{t("Bajarildi")}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4" data-testid="metric-overdue-tasks">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-[var(--ep-red)]" />
            </div>
            <div>
              <p className="text-3xl font-bold text-[var(--ep-red)]">{taskStats?.summary?.overdueTasks || metrics?.overdueTasks || 0}</p>
              <p className="text-sm text-muted-foreground">{t("kechikkan")}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4" data-testid="metric-in-progress">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Play className="h-6 w-6 text-[var(--ep-yellow)]" />
            </div>
            <div>
              <p className="text-3xl font-bold">{taskStats?.summary?.acceptedNotCompleted || 0}</p>
              <p className="text-sm text-muted-foreground">{t("inProgress")}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4" data-testid="metric-telegram-tasks">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-[var(--ep-blue)]" />
            </div>
            <div>
              <p className="text-3xl font-bold text-[var(--ep-blue)]">{taskStats?.summary?.telegramTasks || 0}</p>
              <p className="text-sm text-muted-foreground">{t("telegram")}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4" data-testid="metric-completion-rate">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-[var(--ep-green)]" />
            </div>
            <div>
              <p className="text-3xl font-bold text-[var(--ep-green)]">{taskStats?.summary?.completionRate || 0}%</p>
              <p className="text-sm text-muted-foreground">{t("progress5")}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4" data-testid="metric-avg-completion">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Timer className="h-6 w-6 text-[var(--ep-purple)]" />
            </div>
            <div>
              <p className="text-3xl font-bold text-[var(--ep-purple)]">{taskStats?.summary?.avgCompletionDays || 0}</p>
              <p className="text-sm text-muted-foreground">{t("ortachaKun")}</p>
            </div>
          </div>
        </Card>

        <Card
          className="p-4 border-red-200 dark:border-red-800"
          style={overdueInbox && overdueInbox.count > 0 ? { borderColor: "#ef4444" } : undefined}
          data-testid="metric-overdue-inbox"
        >
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${overdueInbox && overdueInbox.count > 0 ? "bg-red-500/20" : "bg-slate-200/50"}`}>
              <Clock className={`h-6 w-6 ${overdueInbox && overdueInbox.count > 0 ? "text-[var(--ep-red)]" : "text-slate-400"}`} />
            </div>
            <div>
              <p className={`text-3xl font-bold ${overdueInbox && overdueInbox.count > 0 ? "text-[var(--ep-red)]" : "text-slate-400"}`}>
                {overdueInbox?.count ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">{t("k24sQoida")}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* ── 24h rule overdue inbox detail ────────────────────────── */}
      {overdueInbox && overdueInbox.count > 0 && (
        <Card className="p-4 border-red-200 dark:border-red-800" style={{ borderColor: "#ef4444" }}>
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-[var(--ep-red)] dark:text-red-400">
            <Clock className="h-4 w-4" />
            24-Soat Qoida Buzilganlari ({overdueInbox.count} ta)
          </h3>
          <div className="space-y-2 max-h-[200px] overflow-auto">
            {overdueInbox.cards.slice(0, 10).map((card) => (
              <div key={card.cardId} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{card.cardTitle}</p>
                  <p className="text-xs text-muted-foreground truncate">{card.boardName} → {card.columnName}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-xs font-bold text-[var(--ep-red)]">{card.hoursOverdue}s</span>
                  {card.ownerFullName && (
                    <p className="text-[10px] text-muted-foreground">{card.ownerFullName}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t("haftalikTrend1")}
          </h3>
          <div className="space-y-3">
            {taskStats?.weeklyTrend?.map((day) => (
              <div key={day.date} className="flex items-center gap-4">
                <span className="w-12 text-sm font-medium">{day.dayName}</span>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-blue-500" 
                      style={{ width: `${Math.min((day.created / (Math.max(...taskStats.weeklyTrend?.map(d => d.created + d.completed)) || 1)) * 50, 50)}%` }}
                    />
                    <div 
                      className="h-full bg-green-500" 
                      style={{ width: `${Math.min((day.completed / (Math.max(...taskStats.weeklyTrend?.map(d => d.created + d.completed)) || 1)) * 50, 50)}%` }}
                    />
                  </div>
                  <span className="text-xs w-20 text-right">+{day.created} / -{day.completed}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span>{t("Yaratilgan")}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>{t("bajarilgan")}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t("xodimlarSamaradorligi")}
          </h3>
          <div className="space-y-3 max-h-[300px] overflow-auto">
            {taskStats?.employeeStats?.slice(0, 10).map((emp) => {
              const completionRate = emp.assigned > 0 ? Math.round((emp.completed / emp.assigned) * 100) : 0;
              return (
                <div key={emp.userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getEmployeeName(emp.userId).split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{getEmployeeName(emp.userId)}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{emp.assigned} topshiriq</span>
                      <span className="text-[var(--ep-green)]">{emp.completed} bajarildi</span>
                      {emp.late > 0 && <span className="text-[var(--ep-red)]">{emp.late} kech</span>}
                      {emp.avgCompletionTime > 0 && <span className="text-[var(--ep-purple)]">~{emp.avgCompletionTime}k</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${completionRate >= 80 ? 'text-[var(--ep-green)]' : completionRate >= 50 ? 'text-[var(--ep-yellow)]' : 'text-[var(--ep-red)]'}`}>
                      {completionRate}%
                    </span>
                  </div>
                </div>
              );
            })}
            {(!taskStats?.employeeStats || taskStats.employeeStats.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">{t("malumotMavjudEmas")}</p>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Timer className="h-5 w-5" />
            {t("vaqtKuzatuvi")}
          </h3>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{taskStats?.timeTracking?.totalTrackedHours || 0}</p>
              <p className="text-xs text-muted-foreground">{t("jamiSoat")}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{formatMinutes(metrics?.todayTimeMinutes || 0)}</p>
              <p className="text-xs text-muted-foreground">{t("today")}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
    </>
  );
}
