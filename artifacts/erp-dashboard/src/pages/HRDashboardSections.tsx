/**
 * @module HRDashboardSections
 * @description Expiring-contracts widget, birthday/milestone widgets, and the
 * OverviewTab panel (top performers, recent alerts, safety summary).
 * AlertsTab/PerformersTab → HRDashboardTabs.tsx. V2 tab → HRDashboardV2Tab.tsx.
 */

import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Bell, Award, ShieldAlert, AlertTriangle, CalendarClock, Cake,
  Flag, FileText, ChevronRight, CheckCircle2, XCircle, Info, Users,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { SEVERITY_CONFIG } from "./hr-dashboard/types";
import type { EmployeeWithGrade } from "./hr-dashboard/types";
import type { BirthdayEmployee, ExpiringContract, UpcomingMilestone } from "./HRDashboardTypes";

// ---------------------------------------------------------------------------
// Helper: grade badge classname (inline so we avoid re-exporting from types)
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
// ExpiringContractsWidget
// ---------------------------------------------------------------------------

export function ExpiringContractsWidget({ contracts }: { contracts: ExpiringContract[] }) {
  const { t } = useTranslation("hr");
  if (contracts.length === 0) return null;
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4" data-testid="widget-expiring-contracts">
      <div className="flex items-center gap-2 mb-3">
        <CalendarClock className="h-4 w-4 text-[var(--ep-yellow)]" />
        <h2 className="text-sm font-semibold text-amber-800">{t("contracts.expiringTitle")}</h2>
        <span className="ml-auto bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">{t("common.countItems", { n: String(contracts.length) })}</span>
      </div>
      <div className="space-y-2">
        {(Array.isArray(contracts) ? contracts : []).slice(0, 5).map((c) => (
          <div key={c.id} className={`flex items-center justify-between p-2.5 rounded-lg ${c.urgency === "critical" ? "bg-red-50 border border-red-200" : c.urgency === "warning" ? "bg-orange-50 border border-orange-200" : "bg-white border border-amber-100"}`}>
            <div className="flex items-center gap-2 min-w-0">
              <FileText className={`h-3.5 w-3.5 shrink-0 ${c.urgency === "critical" ? "text-[var(--ep-red)]" : "text-[var(--ep-yellow)]"}`} />
              <span className="text-sm font-medium text-foreground truncate">{c.fullName || "—"}</span>
              <span className="text-xs text-muted-foreground truncate hidden sm:inline">{c.contractNumber}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs font-semibold ${c.daysLeft <= 7 ? "text-[var(--ep-red)]" : c.daysLeft <= 15 ? "text-[var(--ep-primary)]" : "text-[var(--ep-yellow)]"}`}>
                {t("contracts.daysSuffix", { n: String(c.daysLeft) })}
              </span>
              <span className="text-xs text-muted-foreground">{c.endDate}</span>
            </div>
          </div>
        ))}
        {contracts.length > 5 && (
          <p className="text-xs text-[var(--ep-yellow)] text-center pt-1">{t("contracts.othersSuffix", { n: String(contracts.length - 5) })}</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BirthdayMilestoneWidgets
// ---------------------------------------------------------------------------

interface BirthdayMilestoneProps {
  todayBirthdays: BirthdayEmployee[];
  upcomingBirthdays: BirthdayEmployee[];
  upcomingMilestones: UpcomingMilestone[];
}

export function BirthdayMilestoneWidgets({ todayBirthdays, upcomingBirthdays, upcomingMilestones }: BirthdayMilestoneProps) {
  const { t, language } = useTranslation("hr");
  const dateLocale = language === "ru" ? "ru-RU" : "uz-UZ";
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Birthday widget */}
      <div className="border border-pink-100 rounded-xl p-4" data-testid="widget-birthdays">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Cake className="h-4 w-4 text-pink-500" />
            <h2 className="text-sm font-semibold text-pink-800">{t("birthdays.title")}</h2>
          </div>
          <Link href="/hr/birthdays">
            <Button size="sm" variant="ghost" className="h-6 text-xs text-pink-600">{t("common.all")} <ChevronRight className="w-3 h-3 ml-1" /></Button>
          </Link>
        </div>
        {todayBirthdays.length > 0 && (
          <div className="mb-2 space-y-1">
            <p className="text-xs font-medium text-pink-700">🎂 {t("birthdays.today")}:</p>
            {(Array.isArray(todayBirthdays) ? todayBirthdays : []).slice(0, 3).map((emp) => (
              <div key={emp.id} className="flex items-center gap-2 bg-white/80 rounded px-2 py-1">
                <div className="w-5 h-5 rounded-full bg-pink-200 flex items-center justify-center text-[10px] font-bold text-pink-700">{emp.full_name?.charAt(0)}</div>
                <span className="text-xs font-medium">{emp.full_name}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{emp.department_name}</span>
              </div>
            ))}
          </div>
        )}
        {upcomingBirthdays.length > 0 ? (
          <div className="space-y-1">
            <p className="text-xs font-medium text-[var(--ep-purple)]">📅 {t("birthdays.in7Days")}:</p>
            {(Array.isArray(upcomingBirthdays) ? upcomingBirthdays : []).slice(0, 3).map((emp) => (
              <div key={emp.id} className="flex items-center gap-2 bg-white/60 rounded px-2 py-1">
                <span className="text-xs">{emp.full_name}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {emp.birth_date ? new Date(emp.birth_date).toLocaleDateString(dateLocale, { day: "numeric", month: "short" }) : ""}
                </span>
              </div>
            ))}
          </div>
        ) : todayBirthdays.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">{t("birthdays.empty")}</p>
        ) : null}
      </div>

      {/* Milestone widget */}
      <div className="border border-purple-100 rounded-xl p-4" data-testid="widget-milestones">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-[var(--ep-purple)]" />
            <h2 className="text-sm font-semibold text-purple-800">{t("milestones.upcomingTitle")}</h2>
            {upcomingMilestones.length > 0 && (
              <span className="bg-amber-100 text-[var(--ep-yellow)] text-[10px] font-bold px-1.5 py-0.5 rounded-full">{t("common.countItems", { n: String(upcomingMilestones.length) })}</span>
            )}
          </div>
          <Link href="/hr/milestones">
            <Button size="sm" variant="ghost" className="h-6 text-xs text-[var(--ep-purple)]">{t("common.all")} <ChevronRight className="w-3 h-3 ml-1" /></Button>
          </Link>
        </div>
        {upcomingMilestones.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">{t("milestones.empty")}</p>
        ) : (
          <div className="space-y-1">
            {(Array.isArray(upcomingMilestones) ? upcomingMilestones : []).slice(0, 4).map((m) => {
              const daysLeft = Math.ceil((new Date(m.due_date).getTime() - Date.now()) / 86400000);
              return (
                <div key={m.id} className="flex items-center gap-2 bg-white/70 rounded px-2 py-1.5">
                  <span className="text-sm">{m.milestone_months === 1 ? "🌱" : m.milestone_months === 3 ? "🌿" : "🌳"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{m.employee_name}</p>
                    <p className="text-[10px] text-muted-foreground">{t("milestones.monthsLabel", { n: String(m.milestone_months) })}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${daysLeft <= 0 ? "bg-red-100 text-[var(--ep-red)]" : daysLeft <= 3 ? "bg-amber-100 text-[var(--ep-yellow)]" : "bg-blue-100 text-[var(--ep-blue)]"}`}>
                    {daysLeft <= 0 ? t("milestones.todayMark") : t("milestones.daysShort", { n: String(daysLeft) })}
                  </span>
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
// OverviewTab — top performers table + recent alerts panel + safety summary
// ---------------------------------------------------------------------------

interface AlertItem {
  id: string | number;
  severity: string;
  title: string;
  description?: string;
  employeeName?: string;
  action?: string;
}

interface SafetySummary {
  incidentsThisMonth: number;
  ppeCompliancePercent: number;
  expiringTrainings: number;
  openIncidents: number;
}

interface OverviewTabProps {
  isLoading: boolean;
  topPerformers: EmployeeWithGrade[];
  alerts: AlertItem[];
  isLoadingAlerts: boolean;
  safetySummaryData: SafetySummary | undefined;
  onViewAllAlerts: () => void;
  onViewSafety: () => void;
}

export function OverviewTab({
  isLoading, topPerformers, alerts, isLoadingAlerts,
  safetySummaryData, onViewAllAlerts, onViewSafety,
}: OverviewTabProps) {
  const { t } = useTranslation("hr");
  const headers = [
    { key: "#",        label: "#" },
    { key: "employee", label: t("performers.employee") },
    { key: "grade",    label: t("performers.grade") },
    { key: "score",    label: t("performers.score") },
  ];
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top performers */}
        <div className="bg-card rounded-xl p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="flex items-center gap-2 text-sm text-foreground">
              <Award className="h-4 w-4 text-[var(--ep-green)]" />{t("performers.topTitle")}
            </CardTitle>
          </CardHeader>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3,4,5].map((i) => <Skeleton key={`k-${i}`} className="h-10 w-full rounded-lg" />)}</div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  {(Array.isArray(headers) ? headers : []).map((h) => (
                    <TableHead key={h.key} className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4">{h.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPerformers.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm" data-testid="text-no-top-performers">{t("common.noData")}</TableCell></TableRow>
                ) : (Array.isArray(topPerformers) ? topPerformers : []).slice(0, 5).map((emp, idx) => {
                  const cls = getGradeBadge(emp.grade);
                  return (
                    <TableRow key={emp.id} data-testid={`row-top-${emp.id}`} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-semibold text-muted-foreground text-sm w-8 px-4">{idx + 1}</TableCell>
                      <TableCell className="text-sm font-medium text-foreground px-4">{emp.fullName}</TableCell>
                      <TableCell className="px-4">{cls ? <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{emp.grade}</span> : <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-muted/60 text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-muted/60 rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${emp.score}%` }} /></div>
                          <span className="text-xs font-semibold text-muted-foreground">{emp.score}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table></div>
          )}
        </div>

        {/* Recent alerts */}
        <div className="bg-card rounded-xl p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="flex items-center justify-between gap-2 text-sm text-foreground">
              <span className="flex items-center gap-2"><Bell className="h-4 w-4 text-[var(--ep-yellow)]" />{t("alerts.recentTitle")}</span>
              <Button size="sm" variant="ghost" onClick={onViewAllAlerts} data-testid="button-view-all-alerts">{t("common.all")} <ChevronRight className="w-3.5 h-3.5 ml-1" /></Button>
            </CardTitle>
          </CardHeader>
          {isLoadingAlerts ? (
            <div className="space-y-2">{[1,2,3].map((i) => <Skeleton key={`k-${i}`} className="h-14 w-full rounded-lg" />)}</div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2"><CheckCircle2 className="w-8 h-8 text-[var(--ep-green)]" /><span className="text-sm">{t("alerts.empty")}</span></div>
          ) : (
            <div className="space-y-2">
              {(Array.isArray(alerts) ? alerts : []).slice(0, 4).map((alert) => {
                const cfg = SEVERITY_CONFIG[alert.severity as keyof typeof SEVERITY_CONFIG] ?? SEVERITY_CONFIG.info;
                return (
                  <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg border ${cfg.bg} ${cfg.border}`} data-testid={`alert-${alert.id}`}>
                    {alert.severity === "critical" ? <XCircle className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.color}`} /> : alert.severity === "warning" ? <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.color}`} /> : <Info className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.color}`} />}
                    <div className="min-w-0"><p className={`text-xs font-semibold ${cfg.color}`}>{alert.title}</p><p className="text-xs text-muted-foreground truncate">{alert.description}</p></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Safety summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-0">
        <div className="lg:col-span-3 bg-card rounded-xl p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="flex items-center justify-between gap-2 text-sm text-foreground">
              <span className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-[var(--ep-red)]" />{t("safety.statusTitle")}</span>
              <Button size="sm" variant="ghost" onClick={onViewSafety} data-testid="button-view-safety">{t("common.all")} <ChevronRight className="w-3.5 h-3.5 ml-1" /></Button>
            </CardTitle>
          </CardHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: t("safety.incidentsThisMonth"),     value: safetySummaryData?.incidentsThisMonth ?? 0,              color: "text-[var(--ep-red)]" },
              { label: t("safety.ppeCompliance"),          value: safetySummaryData?.ppeCompliancePercent !== undefined ? `${safetySummaryData.ppeCompliancePercent}%` : "0%", color: "text-[var(--ep-green)]" },
              { label: t("safety.expiringTrainings"),      value: safetySummaryData?.expiringTrainings ?? 0,             color: "text-[var(--ep-primary)]" },
              { label: t("safety.openIncidents"),          value: safetySummaryData?.openIncidents ?? 0,                   color: "text-[var(--ep-blue)]" },
            ].map((item, i) => (
              <div key={`k-${i}`} className="text-center p-3 rounded-lg bg-muted/60" data-testid={`overview-safety-${i}`}>
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

