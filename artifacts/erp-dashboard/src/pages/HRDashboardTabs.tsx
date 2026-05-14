/**
 * @module HRDashboardTabs
 * @description Tab-panel components for the HR Dashboard: AlertsTab (full alert
 * list with stat strip) and PerformersTab (top/bottom 10 employee tables).
 */

import { CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Bell, Award, AlertTriangle, XCircle, Info, Users, CheckCircle2,
} from "lucide-react";
import { SEVERITY_CONFIG } from "./hr-dashboard/types";
import type { EmployeeWithGrade } from "./hr-dashboard/types";

// ---------------------------------------------------------------------------
// Shared helper: grade badge classname
// ---------------------------------------------------------------------------

function getGradeBadge(grade: string | null | undefined): string | null {
  switch (grade) {
    case "A": return "bg-green-100 text-[var(--ep-green)]";
    case "B": return "bg-blue-100 text-[var(--ep-blue)]";
    case "C": return "bg-yellow-100 text-[var(--ep-yellow)]";
    default:  return null;
  }
}

// ---------------------------------------------------------------------------
// AlertsTab
// ---------------------------------------------------------------------------

interface AlertItem {
  id: string | number;
  severity: string;
  title: string;
  description?: string;
  employeeName?: string;
  action?: string;
}

interface AlertStats { total: number; critical: number; warning: number; info: number; }

interface AlertsTabProps {
  alerts: AlertItem[];
  alertStats: AlertStats;
  isLoadingAlerts: boolean;
}

export function AlertsTab({ alerts, alertStats, isLoadingAlerts }: AlertsTabProps) {
  const statCards = [
    { label: "Jami",          value: alertStats.total,    icon: Bell,          accent: "text-foreground", bg: "bg-card" },
    { label: "Kritik",        value: alertStats.critical, icon: XCircle,       accent: "text-[var(--ep-red)]",    bg: "bg-red-50" },
    { label: "Ogohlantirish", value: alertStats.warning,  icon: AlertTriangle, accent: "text-[var(--ep-yellow)]",  bg: "bg-amber-50" },
    { label: "Ma'lumot",      value: alertStats.info,     icon: Info,          accent: "text-[var(--ep-blue)]",   bg: "bg-blue-50" },
  ];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((item, i) => (
          <div key={`k-${i}`} className={`${item.bg} rounded-lg p-5`} data-testid={`stat-alert-${item.label.toLowerCase()}`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</p>
            <p className="text-3xl font-bold tracking-tight text-foreground mt-1">{item.value}</p>
            <item.icon className={`w-4 h-4 ${item.accent} mt-2`} />
          </div>
        ))}
      </div>
      <div className="bg-card rounded-xl p-6">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="flex items-center gap-2 text-sm text-foreground">
            <Bell className="h-4 w-4 text-[var(--ep-yellow)]" />Barcha Alertlar
          </CardTitle>
        </CardHeader>
        {isLoadingAlerts ? (
          <div className="space-y-3">{[1,2,3,4,5].map((i) => <Skeleton key={`k-${i}`} className="h-16 w-full rounded-lg" />)}</div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <CheckCircle2 className="w-12 h-12 text-green-400" />
            <p className="text-base font-medium">Hech qanday alert mavjud emas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(Array.isArray(alerts) ? alerts : []).map((alert) => {
              const cfg = SEVERITY_CONFIG[alert.severity];
              return (
                <div key={alert.id} className={`flex items-start justify-between gap-4 p-4 rounded-lg border ${cfg.bg} ${cfg.border}`} data-testid={`alert-row-${alert.id}`}>
                  <div className="flex items-start gap-3 min-w-0">
                    {alert.severity === "critical"
                      ? <XCircle       className={`w-5 h-5 mt-0.5 shrink-0 ${cfg.color}`} />
                      : alert.severity === "warning"
                      ? <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${cfg.color}`} />
                      : <Info          className={`w-5 h-5 mt-0.5 shrink-0 ${cfg.color}`} />}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-semibold ${cfg.color}`}>{alert.title}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.color} border ${cfg.border}`}>{cfg.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{alert.description}</p>
                      {alert.employeeName && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Users className="w-3 h-3" /> {alert.employeeName}
                        </p>
                      )}
                    </div>
                  </div>
                  {alert.action && (
                    <span className={`text-xs font-medium shrink-0 ${cfg.color} underline underline-offset-2 cursor-pointer`}>{alert.action}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PerformersTab
// ---------------------------------------------------------------------------

interface PerformersTabProps {
  topPerformers: EmployeeWithGrade[];
  bottomPerformers: EmployeeWithGrade[];
}

export function PerformersTab({ topPerformers, bottomPerformers }: PerformersTabProps) {
  const sections = [
    { title: "Top 10 Xodim — Samaradorlik", data: topPerformers,    icon: <Award className="h-4 w-4 text-[var(--ep-green)]" /> },
    { title: "Eng Past 10 Xodim",           data: bottomPerformers, icon: <span className="h-4 w-4 text-[var(--ep-red)]">↓</span> },
  ];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {sections.map((section, si) => (
        <div key={si} className="bg-card rounded-xl p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="flex items-center gap-2 text-sm text-foreground">
              {section.icon}{section.title}
            </CardTitle>
          </CardHeader>
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                {["#","Xodim","Davomat","Unumdorlik","Daraja"].map((h) => (
                  <TableHead key={h} className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(section.data) ? section.data : []).map((emp, idx) => {
                const cls = getGradeBadge(emp.grade);
                return (
                  <TableRow key={emp.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="text-sm font-semibold text-muted-foreground w-8 px-4">{idx + 1}</TableCell>
                    <TableCell className="text-sm font-medium text-foreground px-4">{emp.fullName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground px-4">{emp.attendanceRate}%</TableCell>
                    <TableCell className="text-sm text-muted-foreground px-4">{emp.performanceRate}%</TableCell>
                    <TableCell className="px-4">
                      {cls
                        ? <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{emp.grade}</span>
                        : <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-muted/60 text-muted-foreground">—</span>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table></div>
        </div>
      ))}
    </div>
  );
}
