import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest , selectArray } from "@/lib/queryClient";
import { ErrorState } from "@/components/ui/error-state";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PillTabs } from "@/components/ui/pill-tabs";
import { Users, Award, AlertTriangle, Clock, ShieldAlert, Bell, CheckCircle2, XCircle, Info, ChevronRight, Flame, Trophy, Lock, FileText, Star, MessageSquare, TrendingUp, UserMinus, CalendarClock, Cake, UserPlus, Flag, Wrench, Gauge } from "lucide-react";
import type { AbcAnalysis, DisciplineRecord, Attendance } from "@shared/schema";
import { useTranslation } from "@/lib/i18n";
import type { UserWithAnalysis, AlertsResponse, RiskScoresResponse, EmployeeWithGrade } from "./hr-dashboard/types";
import { HR_TABS, SEVERITY_CONFIG, getGradeBadge } from "./hr-dashboard/types";
import { RiskTab } from "./hr-dashboard/RiskTab";
import { TurnoverTab } from "./hr-dashboard/TurnoverTab";
import { DisciplineTab } from "./hr-dashboard/DisciplineTab";
import { SafetyTab } from "./hr-dashboard/SafetyTab";

interface BirthdayEmployee { id: number; full_name: string; department_name?: string; age?: number; birth_date?: string; }
interface ExpiringContract { id: number; urgency?: string; fullName?: string; contractNumber?: string; daysLeft: number; endDate?: string; }
interface DailyStats { operatorStats?: { submitted?: number; total?: number }; submitted?: number; absent?: number; pending?: number; stats?: { avg_operator_oee?: number; submitted_count?: number; auto_absent_count?: number; pending_count?: number }; }
interface GamLeaderboard { leaderboard?: Record<string, unknown>[]; }
interface UpcomingMilestone { id: number; due_date: string; milestone_months?: number; employee_name?: string; }
interface AdaptationRiskEmployee { id: number; employee_name?: string; employee_id?: number; department_name?: string; mentor_name?: string; adaptation_score?: number; progress_percent?: number; }
interface AiInterviewSession { status: string; }

export default function HRDashboard() {
  const { t, language } = useTranslation("hr");
  const [activeTab, setActiveTab] = useState("overview");

  const { data: employees = [], isLoading: isLoadingEmployees, isError, refetch } = useQuery<UserWithAnalysis[]>({ queryKey: ["/api/users"] });
  const { data: abcAnalysis = [], isLoading: isLoadingABC } = useQuery<AbcAnalysis[]>({ queryKey: ["/api/hr/abc-analysis"] });
  const { data: disciplineRecords = [], isLoading: isLoadingDiscipline } = useQuery<DisciplineRecord[]>({ queryKey: ["/api/hr/discipline-records"] });
  const { data: attendanceRecords = [], isLoading: isLoadingAttendance } = useQuery<Attendance[]>({ queryKey: ["/api/hr/attendance"] });
  const { data: resignationReasons = [] } = useQuery<{ reason: string; count: number; color: string }[]>({ queryKey: ["/api/hr/resignation-stats", language] });
  const { data: monthlyTrend = [] } = useQuery<{ month: string; newHires: number; resignations: number }[]>({ queryKey: ["/api/hr/monthly-trend", language] });
  const { data: alertsData, isLoading: isLoadingAlerts } = useQuery<AlertsResponse>({ queryKey: ["/api/hr/alerts"], refetchInterval: 60_000 });
  const { data: riskData, isLoading: isLoadingRisk } = useQuery<RiskScoresResponse>({ queryKey: ["/api/hr/risk-scores"], refetchInterval: 300_000 });
  const { data: safetySummaryData } = useQuery<{ incidentsThisMonth: number; ppeCompliancePercent: number; expiringTrainings: number; openIncidents: number }>({ queryKey: ["/api/hr/safety/summary"], refetchInterval: 120_000 });
  const { data: safetyIncidentsData = [] } = useQuery<{ id: string; userName?: string; incidentType: string; severity: string; incidentDate: string; status: string }[]>({ queryKey: ["/api/hr/safety/incidents"] });

  // HR V2 quick stats
  const { data: blockedEmps } = useQuery<Record<string, unknown>[]>({ queryKey: ["/api/hr/discipline/blocked"] });
  const { data: activePips } = useQuery<Record<string, unknown>[]>({ queryKey: ["/api/hr-v2/pip"], queryFn: () => apiRequest("GET", "/api/hr-v2/pip?status=active") });
  const { data: gamLeaderboard } = useQuery<GamLeaderboard>({ queryKey: ["/api/hr/gamification/leaderboard/monthly"], queryFn: () => apiRequest("GET", "/api/hr/gamification/leaderboard?period=monthly") });
  const { data: activeSurveys } = useQuery<Record<string, unknown>[]>({ queryKey: ["/api/hr-v2/enps"], queryFn: () => apiRequest("GET", "/api/hr-v2/enps") });
  const { data: aiSessions } = useQuery<AiInterviewSession[]>({ queryKey: ["/api/hr/ai-interview/sessions"], enabled: activeTab === "v2" });
  const { data: dailyStats } = useQuery<DailyStats>({ queryKey: ["/api/hr-v2/daily-reports/stats"], queryFn: () => apiRequest("GET", "/api/hr-v2/daily-reports/stats") });
  const { data: atRiskEmps } = useQuery<AdaptationRiskEmployee[]>({ queryKey: ["/api/hr/adaptation/at-risk"], enabled: activeTab === "v2" });
  const { data: offboardingStats } = useQuery<{ active: string | number; completed: string | number; cancelled: string | number; total: string | number }>({
    queryKey: ["/api/hr/offboarding/cases/stats"],
    refetchInterval: 120_000,
  });
  const { data: expiringContracts = [] } = useQuery<ExpiringContract[]>({
    queryKey: ["/api/hr/contracts/expiring"],
    queryFn: () => apiRequest("GET", "/api/hr/contracts/expiring?days=30"),
    refetchInterval: 300_000,
    select: selectArray<ExpiringContract>,
  });

  const { data: todayBirthdays = [] } = useQuery<BirthdayEmployee[]>({
    queryKey: ["/api/hr/birthdays/today"],
    queryFn: () => apiRequest("GET", "/api/hr/birthdays/today"),
    refetchInterval: 3600_000,
    select: selectArray<BirthdayEmployee>,
  });

  const { data: upcomingBirthdays = [] } = useQuery<BirthdayEmployee[]>({
    queryKey: ["/api/hr/birthdays/upcoming"],
    queryFn: () => apiRequest("GET", "/api/hr/birthdays/upcoming?days=7"),
    refetchInterval: 3600_000,
    select: selectArray<BirthdayEmployee>,
  });

  const { data: upcomingMilestones = [] } = useQuery<UpcomingMilestone[]>({
    queryKey: ["/api/hr/milestones/upcoming"],
    queryFn: () => apiRequest("GET", "/api/hr/milestones/upcoming"),
    refetchInterval: 300_000,
    select: selectArray<UpcomingMilestone>,
  });

  const operatorReportsToday = dailyStats?.operatorStats?.submitted ?? 0;
  const operatorTotal = dailyStats?.operatorStats?.total ?? 0;

  const blockedCount = Array.isArray(blockedEmps) ? blockedEmps.length : 0;
  const activePipCount = Array.isArray(activePips) ? activePips.length : 0;
  const adaptationAtRiskCount = Array.isArray(atRiskEmps) ? atRiskEmps.length : 0;
  const topGamer = gamLeaderboard?.leaderboard?.[0];
  const activeSurveyCount = Array.isArray(activeSurveys) ? activeSurveys.length : 0;
  const activeOffboardingCount = parseInt(String(offboardingStats?.active ?? 0)) || 0;

  const aiPipeline = { pending: 0, active: 0, completed: 0 };
  if (Array.isArray(aiSessions)) {
    (Array.isArray(aiSessions) ? aiSessions : []).forEach((s) => {
      if (s.status === "pending") aiPipeline.pending++;
      else if (s.status === "active") aiPipeline.active++;
      else if (s.status === "completed") aiPipeline.completed++;
    });
  }
  const isLoading = isLoadingEmployees || isLoadingABC || isLoadingDiscipline || isLoadingAttendance;

  const employeesWithGrades: EmployeeWithGrade[] = (Array.isArray(employees) ? employees : []).map((emp) => {
    const analysis = (Array.isArray(abcAnalysis) ? abcAnalysis : []).find((a) => a.userId === emp.id);
    return { id: emp.id, fullName: emp.fullName || "", grade: analysis?.grade ?? null, score: analysis?.score ?? 0, performanceRate: analysis?.performanceRate ?? 0, attendanceRate: analysis?.attendanceRate ?? 0, disciplineScore: analysis?.disciplineScore ?? 0 };
  });

  const topPerformers = (Array.isArray(employeesWithGrades) ? [...employeesWithGrades] : []).sort((a, b) => b.score - a.score).slice(0, 10);

  const warningsCount = (Array.isArray(disciplineRecords) ? disciplineRecords : []).filter((r) => r.type === "warning").length;
  const penaltiesSum = (Array.isArray(disciplineRecords) ? disciplineRecords : []).filter((r) => r.type === "penalty").reduce((sum, r) => sum + (r.amount || 0), 0);
  const rewardsSum = (Array.isArray(disciplineRecords) ? disciplineRecords : []).filter((r) => r.type === "reward").reduce((sum, r) => sum + (r.amount || 0), 0);
  const lateArrivals = (Array.isArray(attendanceRecords) ? attendanceRecords : []).filter((a) => a.isLate).length;
  const totalResignations = (Array.isArray(resignationReasons) ? resignationReasons : []).reduce((sum, r) => sum + r.count, 0);

  const alerts = alertsData?.alerts || [];
  const alertStats = alertsData?.stats || { critical: 0, warning: 0, info: 0, total: 0 };
  const riskEmployees = riskData?.scores || [];
  const riskSummary = riskData?.stats || { low: 0, medium: 0, high: 0, critical: 0 };
  const atRiskCount = (riskSummary.high || 0) + (riskSummary.critical || 0);

  if (isError) return <ErrorState onRetry={refetch} />;

  const kpiItems = [
    { label: "Xodimlar", value: employees.length, icon: Users, accent: "text-primary", testId: "text-total-employees" },
    { label: "Ogohlantirishlar", value: warningsCount, icon: AlertTriangle, accent: "text-amber-500", testId: "text-warnings" },
    { label: "Kech kelish", value: lateArrivals, icon: Clock, accent: "text-orange-500", testId: "text-late" },
    { label: "Kritik alertlar", value: alertStats.critical, icon: ShieldAlert, accent: "text-red-500", testId: "text-critical-alerts" },
    { label: "Xavf ostida", value: atRiskCount, icon: Flame, accent: "text-red-500", testId: "text-at-risk" },
    { label: "Mukofot", value: rewardsSum.toLocaleString(), icon: Award, accent: "text-green-500", testId: "text-rewards" },
  ];

  return (
    <div className="flex-1 overflow-auto bg-surface p-6 space-y-6">
      <h1 className="text-4xl font-light tracking-tight text-on-surface">Xodimlar <span className="font-bold text-primary">Resurslari</span></h1>
      <p className="text-on-surface-variant -mt-4">Xodimlar samaradorligi, intizom va kadrlar almashinuvi</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {isLoading ? ([0,1,2,3,4,5]).map(i => (
          <div key={`k-${i}`} className="bg-surface-container-lowest rounded-lg p-4 space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-7 w-16" /></div>
        )) : (kpiItems ?? []).map((item, i) => (
          <div key={`k-${i}`} className="bg-surface-container-lowest rounded-lg p-4" data-testid={item.testId}>
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{item.label}</p>
            <p className="text-2xl font-bold tracking-tight text-on-surface mt-1">{item.value}</p>
            <item.icon className={`w-3.5 h-3.5 ${item.accent} mt-1`} />
          </div>
        ))}
      </div>

      {/* Muddati yaqin shartnomalar widget */}
      {expiringContracts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4" data-testid="widget-expiring-contracts">
          <div className="flex items-center gap-2 mb-3">
            <CalendarClock className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-amber-800">Muddati yaqin shartnomalar (30 kun ichida)</h2>
            <span className="ml-auto bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">{expiringContracts.length} ta</span>
          </div>
          <div className="space-y-2">
            {(Array.isArray(expiringContracts) ? expiringContracts : []).slice(0, 5).map((contract) => (
              <div key={contract.id} className={`flex items-center justify-between p-2.5 rounded-lg ${contract.urgency === "critical" ? "bg-red-50 border border-red-200" : contract.urgency === "warning" ? "bg-orange-50 border border-orange-200" : "bg-white border border-amber-100"}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className={`h-3.5 w-3.5 shrink-0 ${contract.urgency === "critical" ? "text-red-500" : "text-amber-500"}`} />
                  <span className="text-sm font-medium text-on-surface truncate">{contract.fullName || "—"}</span>
                  <span className="text-xs text-on-surface-variant truncate hidden sm:inline">{contract.contractNumber}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-semibold ${contract.daysLeft <= 7 ? "text-red-700" : contract.daysLeft <= 15 ? "text-orange-700" : "text-amber-700"}`}>
                    {contract.daysLeft} kun
                  </span>
                  <span className="text-xs text-on-surface-variant">{contract.endDate}</span>
                </div>
              </div>
            ))}
            {expiringContracts.length > 5 && (
              <p className="text-xs text-amber-600 text-center pt-1">+ {expiringContracts.length - 5} ta boshqa shartnoma</p>
            )}
          </div>
        </div>
      )}

      {/* Birthday + Milestone widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Birthday widget */}
        <div className="bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-100 rounded-xl p-4" data-testid="widget-birthdays">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Cake className="h-4 w-4 text-pink-500" />
              <h2 className="text-sm font-semibold text-pink-800">Tug'ilgan Kunlar</h2>
            </div>
            <Link href="/hr/birthdays">
              <Button size="sm" variant="ghost" className="h-6 text-xs text-pink-600">Barchasi <ChevronRight className="w-3 h-3 ml-1" /></Button>
            </Link>
          </div>
          {todayBirthdays.length > 0 && (
            <div className="mb-2 space-y-1">
              <p className="text-xs font-medium text-pink-700">🎂 Bugun:</p>
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
              <p className="text-xs font-medium text-purple-700">📅 7 kun ichida:</p>
              {(Array.isArray(upcomingBirthdays) ? upcomingBirthdays : []).slice(0, 3).map((emp) => (
                <div key={emp.id} className="flex items-center gap-2 bg-white/60 rounded px-2 py-1">
                  <span className="text-xs">{emp.full_name}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">{emp.birth_date ? new Date(emp.birth_date).toLocaleDateString("uz-UZ", { day: "numeric", month: "short" }) : ""}</span>
                </div>
              ))}
            </div>
          ) : todayBirthdays.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">Yaqin tug'ilgan kun yo'q</p>
          ) : null}
        </div>

        {/* Milestone widget */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100 rounded-xl p-4" data-testid="widget-milestones">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-purple-600" />
              <h2 className="text-sm font-semibold text-purple-800">Yaqin Milestonelar</h2>
              {upcomingMilestones.length > 0 && (
                <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{upcomingMilestones.length} ta</span>
              )}
            </div>
            <Link href="/hr/milestones">
              <Button size="sm" variant="ghost" className="h-6 text-xs text-purple-600">Barchasi <ChevronRight className="w-3 h-3 ml-1" /></Button>
            </Link>
          </div>
          {upcomingMilestones.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">Yaqin milestone yo'q</p>
          ) : (
            <div className="space-y-1">
              {(Array.isArray(upcomingMilestones) ? upcomingMilestones : []).slice(0, 4).map((m) => {
                const daysLeft = Math.ceil((new Date(m.due_date).getTime() - Date.now()) / 86400000);
                return (
                  <div key={m.id} className="flex items-center gap-2 bg-white/70 rounded px-2 py-1.5">
                    <span className="text-sm">{m.milestone_months === 1 ? "🌱" : m.milestone_months === 3 ? "🌿" : "🌳"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{m.employee_name}</p>
                      <p className="text-[10px] text-muted-foreground">{m.milestone_months} oylik milestone</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${daysLeft <= 0 ? "bg-red-100 text-red-700" : daysLeft <= 3 ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                      {daysLeft <= 0 ? "Bugun!" : `${daysLeft}k`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Operator Reports Widget */}
      {operatorTotal > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4" data-testid="widget-operator-reports">
          <div className="flex items-center gap-2 mb-3">
            <Wrench className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-blue-800">Bugun operator hisobotlari</h2>
            <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full">
              {operatorReportsToday}/{operatorTotal}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/70 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{operatorReportsToday}</p>
              <p className="text-xs text-muted-foreground">Topshirdi</p>
            </div>
            <div className="bg-white/70 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-red-500">{Math.max(0, operatorTotal - operatorReportsToday)}</p>
              <p className="text-xs text-muted-foreground">Topshirmadi</p>
            </div>
            <div className="bg-white/70 rounded-lg p-3 text-center">
              <Gauge className="h-5 w-5 mx-auto text-blue-500 mb-0.5" />
              <p className="text-xs font-semibold text-blue-700">
                {dailyStats?.stats?.avg_operator_oee ? `${dailyStats.stats.avg_operator_oee}%` : "—"}
              </p>
              <p className="text-xs text-muted-foreground">O'rtacha OEE</p>
            </div>
          </div>
        </div>
      )}

      {/* HR V2 Quick Stats */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant mb-3">HR V2 Tizim</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {([
            {
              label: "Bloklangan xodimlar",
              value: blockedCount,
              icon: Lock,
              accent: blockedCount > 0 ? "text-red-500" : "text-green-500",
              href: "/discipline",
              desc: blockedCount > 0 ? "Faol bloklash" : "Bloklash yo'q",
            },
            {
              label: "Faol PIP Rejalar",
              value: activePipCount,
              icon: FileText,
              accent: activePipCount > 0 ? "text-amber-500" : "text-slate-400",
              href: "/hr/pip",
              desc: "Rivojlanish rejasi",
            },
            {
              label: "Reyting lideri",
              value: topGamer ? `${topGamer.first_name} ${topGamer.last_name}` : "—",
              icon: Trophy,
              accent: "text-yellow-500",
              href: "/hr/gamification",
              desc: topGamer ? `${topGamer.monthly_points || 0} ball (oylik)` : "Hali ma'lumot yo'q",
            },
            {
              label: "eNPS So'rovlar",
              value: Array.isArray(activeSurveys) ? activeSurveys.length : 0,
              icon: MessageSquare,
              accent: "text-blue-500",
              href: "/hr/enps",
              desc: "Faol so'rovlar",
            },
          ]).map(card => (
            <Link key={card.href} href={card.href}>
              <div className="bg-surface-container-lowest rounded-lg p-4 hover:bg-surface-container-low transition-colors cursor-pointer group">
                <div className="flex items-center gap-2 mb-2">
                  <card.icon className={`w-4 h-4 ${card.accent}`} />
                  <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{card.label}</span>
                </div>
                <div className="text-xl font-bold text-on-surface truncate">{card.value}</div>
                <div className="text-xs text-on-surface-variant mt-1">{card.desc}</div>
                <div className="flex items-center gap-1 mt-2 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Batafsil <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <PillTabs tabs={HR_TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-surface-container-lowest rounded-xl p-6">
              <CardHeader className="p-0 mb-4"><CardTitle className="flex items-center gap-2 text-sm text-on-surface"><Award className="h-4 w-4 text-green-500" />Eng Samarali Xodimlar (Top 5)</CardTitle></CardHeader>
              {isLoading ? <div className="space-y-2">{([1,2,3,4,5]).map(i => <Skeleton key={`k-${i}`} className="h-10 w-full" />)}</div> : (
                <Table>
                  <TableHeader><TableRow>
                    {(["#","Xodim","Daraja","Ball"]).map(h => <TableHead key={h} className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-4">{h}</TableHead>)}
                  </TableRow></TableHeader>
                  <TableBody>
                    {topPerformers.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-on-surface-variant text-sm" data-testid="text-no-top-performers">Ma'lumot yo'q</TableCell></TableRow>
                    ) : (Array.isArray(topPerformers) ? topPerformers : []).slice(0, 5).map((emp, idx) => {
                      const cls = getGradeBadge(emp.grade);
                      return (
                        <TableRow key={emp.id} data-testid={`row-top-${emp.id}`} className="hover:bg-surface-container-low transition-colors">
                          <TableCell className="font-semibold text-on-surface-variant text-sm w-8 px-4">{idx + 1}</TableCell>
                          <TableCell className="text-sm font-medium text-on-surface px-4">{emp.fullName}</TableCell>
                          <TableCell className="px-4">{cls ? <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{emp.grade}</span> : <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-surface-container text-on-surface-variant">—</span>}</TableCell>
                          <TableCell className="px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-surface-container rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${emp.score}%` }} /></div>
                              <span className="text-xs font-semibold text-on-surface-variant">{emp.score}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-6">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="flex items-center justify-between gap-2 text-sm text-on-surface">
                  <span className="flex items-center gap-2"><Bell className="h-4 w-4 text-amber-500" />So'nggi Alertlar</span>
                  <Button size="sm" variant="ghost" onClick={() => setActiveTab("alerts")} data-testid="button-view-all-alerts">Barchasi <ChevronRight className="w-3.5 h-3.5 ml-1" /></Button>
                </CardTitle>
              </CardHeader>
              {isLoadingAlerts ? <div className="space-y-2">{([1,2,3]).map(i => <Skeleton key={`k-${i}`} className="h-14 w-full" />)}</div> : alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-on-surface-variant gap-2"><CheckCircle2 className="w-8 h-8 text-green-500" /><span className="text-sm">Hech qanday alert yo'q</span></div>
              ) : (
                <div className="space-y-2">
                  {(Array.isArray(alerts) ? alerts : []).slice(0, 4).map((alert) => {
                    const cfg = SEVERITY_CONFIG[alert.severity];
                    return (
                      <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg border ${cfg.bg} ${cfg.border}`} data-testid={`alert-${alert.id}`}>
                        {alert.severity === "critical" ? <XCircle className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.color}`} /> : alert.severity === "warning" ? <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.color}`} /> : <Info className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.color}`} />}
                        <div className="min-w-0"><p className={`text-xs font-semibold ${cfg.color}`}>{alert.title}</p><p className="text-xs text-on-surface-variant truncate">{alert.description}</p></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-0">
            <div className="lg:col-span-3 bg-surface-container-lowest rounded-xl p-6">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="flex items-center justify-between gap-2 text-sm text-on-surface">
                  <span className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-red-500" />Xavfsizlik Holati</span>
                  <Button size="sm" variant="ghost" onClick={() => setActiveTab("safety")} data-testid="button-view-safety">Barchasi <ChevronRight className="w-3.5 h-3.5 ml-1" /></Button>
                </CardTitle>
              </CardHeader>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {([
                  { label: "Bu oydagi hodisalar", value: safetySummaryData?.incidentsThisMonth ?? 0, color: "text-red-600" },
                  { label: "PPE Compliance", value: safetySummaryData?.ppeCompliancePercent !== undefined ? `${safetySummaryData.ppeCompliancePercent}%` : "0%", color: "text-green-600" },
                  { label: "Muddati tugayotgan treninglar", value: safetySummaryData?.expiringTrainings ?? 0, color: "text-orange-600" },
                  { label: "Ochiq hodisalar", value: safetySummaryData?.openIncidents ?? 0, color: "text-blue-600" },
                ]).map((item, i) => (
                  <div key={`k-${i}`} className="text-center p-3 rounded-lg bg-surface-container" data-testid={`overview-safety-${i}`}>
                    <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                    <p className="text-xs text-on-surface-variant mt-1">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "performers" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {([{ title: "Top 10 Xodim — Samaradorlik", data: topPerformers, icon: <Award className="h-4 w-4 text-green-500" /> },
            { title: "Eng Past 10 Xodim", data: [...employeesWithGrades].sort((a, b) => a.score - b.score).slice(0, 10), icon: <span className="h-4 w-4 text-red-500">↓</span> }
          ]).map((section, si) => (
            <div key={si} className="bg-surface-container-lowest rounded-xl p-6">
              <CardHeader className="p-0 mb-4"><CardTitle className="flex items-center gap-2 text-sm text-on-surface">{section.icon}{section.title}</CardTitle></CardHeader>
              <Table>
                <TableHeader><TableRow>
                  {(["#","Xodim","Davomat","Unumdorlik","Daraja"]).map(h => <TableHead key={h} className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-4">{h}</TableHead>)}
                </TableRow></TableHeader>
                <TableBody>
                  {(Array.isArray(section.data) ? section.data : []).map((emp, idx) => {
                    const cls = getGradeBadge(emp.grade);
                    return (
                      <TableRow key={emp.id} className="hover:bg-surface-container-low transition-colors">
                        <TableCell className="text-sm font-semibold text-on-surface-variant w-8 px-4">{idx + 1}</TableCell>
                        <TableCell className="text-sm font-medium text-on-surface px-4">{emp.fullName}</TableCell>
                        <TableCell className="text-sm text-on-surface-variant px-4">{emp.attendanceRate}%</TableCell>
                        <TableCell className="text-sm text-on-surface-variant px-4">{emp.performanceRate}%</TableCell>
                        <TableCell className="px-4">{cls ? <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{emp.grade}</span> : <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-surface-container text-on-surface-variant">—</span>}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ))}
        </div>
      )}

      {activeTab === "alerts" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {([
              { label: "Jami", value: alertStats.total, icon: Bell, accent: "text-on-surface", bg: "bg-surface-container-lowest" },
              { label: "Kritik", value: alertStats.critical, icon: XCircle, accent: "text-red-500", bg: "bg-red-50" },
              { label: "Ogohlantirish", value: alertStats.warning, icon: AlertTriangle, accent: "text-amber-500", bg: "bg-amber-50" },
              { label: "Ma'lumot", value: alertStats.info, icon: Info, accent: "text-blue-500", bg: "bg-blue-50" },
            ]).map((item, i) => (
              <div key={`k-${i}`} className={`${item.bg} rounded-lg p-5`} data-testid={`stat-alert-${item.label.toLowerCase()}`}>
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{item.label}</p>
                <p className="text-3xl font-bold tracking-tight text-on-surface mt-1">{item.value}</p>
                <item.icon className={`w-4 h-4 ${item.accent} mt-2`} />
              </div>
            ))}
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-6">
            <CardHeader className="p-0 mb-4"><CardTitle className="flex items-center gap-2 text-sm text-on-surface"><Bell className="h-4 w-4 text-amber-500" />Barcha Alertlar</CardTitle></CardHeader>
            {isLoadingAlerts ? <div className="space-y-3">{([1,2,3,4,5]).map(i => <Skeleton key={`k-${i}`} className="h-16 w-full" />)}</div> : alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-on-surface-variant"><CheckCircle2 className="w-12 h-12 text-green-400" /><p className="text-base font-medium">Hech qanday alert mavjud emas</p></div>
            ) : (
              <div className="space-y-3">
                {(Array.isArray(alerts) ? alerts : []).map((alert) => {
                  const cfg = SEVERITY_CONFIG[alert.severity];
                  return (
                    <div key={alert.id} className={`flex items-start justify-between gap-4 p-4 rounded-lg border ${cfg.bg} ${cfg.border}`} data-testid={`alert-row-${alert.id}`}>
                      <div className="flex items-start gap-3 min-w-0">
                        {alert.severity === "critical" ? <XCircle className={`w-5 h-5 mt-0.5 shrink-0 ${cfg.color}`} /> : alert.severity === "warning" ? <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${cfg.color}`} /> : <Info className={`w-5 h-5 mt-0.5 shrink-0 ${cfg.color}`} />}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`text-sm font-semibold ${cfg.color}`}>{alert.title}</p>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.color} border ${cfg.border}`}>{cfg.label}</span>
                          </div>
                          <p className="text-sm text-on-surface-variant mt-0.5">{alert.description}</p>
                          {alert.employeeName && <p className="text-xs text-on-surface-variant mt-1 flex items-center gap-1"><Users className="w-3 h-3" /> {alert.employeeName}</p>}
                        </div>
                      </div>
                      {alert.action && <span className={`text-xs font-medium shrink-0 ${cfg.color} underline underline-offset-2 cursor-pointer`}>{alert.action}</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "risk" && <RiskTab riskEmployees={riskEmployees} riskSummary={riskSummary} isLoading={isLoadingRisk} />}
      {activeTab === "turnover" && <TurnoverTab resignationReasons={resignationReasons} monthlyTrend={monthlyTrend} totalResignations={totalResignations} />}
      {activeTab === "discipline" && <DisciplineTab disciplineRecords={disciplineRecords} warningsCount={warningsCount} penaltiesSum={penaltiesSum} rewardsSum={rewardsSum} lateArrivals={lateArrivals} />}
      {activeTab === "safety" && <SafetyTab safetySummary={safetySummaryData} incidents={safetyIncidentsData} />}

      {activeTab === "v2" && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-on-surface">HR V2 — Jonli Holat</h2>

          {/* Live KPI widgets row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {([
              { label: "Bloklangan", value: blockedCount, icon: Lock, accent: blockedCount > 0 ? "text-red-500" : "text-green-500", bg: blockedCount > 0 ? "bg-red-500/10" : "bg-green-500/10", desc: blockedCount > 0 ? "Faol bloklash" : "Bloklash yo'q" },
              { label: "Xavf ostida", value: adaptationAtRiskCount, icon: Flame, accent: "text-amber-500", bg: "bg-amber-500/10", desc: "Moslashuv balli < 3.0" },
              { label: "Faol PIP", value: activePipCount, icon: TrendingUp, accent: "text-blue-500", bg: "bg-blue-500/10", desc: "Rivojlanish rejasi" },
              { label: "eNPS So'rov", value: activeSurveyCount, icon: MessageSquare, accent: "text-purple-500", bg: "bg-purple-500/10", desc: "Faol so'rov" },
              { label: "Offboarding", value: activeOffboardingCount, icon: UserMinus, accent: activeOffboardingCount > 0 ? "text-orange-500" : "text-green-500", bg: activeOffboardingCount > 0 ? "bg-orange-500/10" : "bg-green-500/10", desc: activeOffboardingCount > 0 ? "Faol jarayon" : "Jarayon yo'q" },
            ]).map(w => (
              <div key={w.label} className={`rounded-xl p-4 flex items-center gap-3 ${w.bg} border border-border/30`}>
                <w.icon className={`w-7 h-7 shrink-0 ${w.accent}`} />
                <div>
                  <div className={`text-2xl font-bold ${w.accent}`}>{w.value}</div>
                  <div className="text-xs font-medium text-on-surface">{w.label}</div>
                  <div className="text-[10px] text-on-surface-variant">{w.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* AI Interview pipeline + Daily stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* AI Interview pipeline */}
            <div className="bg-surface-container-lowest rounded-xl border border-border/40 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-on-surface flex items-center gap-2">
                  <span className="text-lg">🤖</span> AI Intervyu Pipeline
                </h3>
                <a href="/ai-hr/interviews" className="text-xs text-primary hover:underline flex items-center gap-1">
                  Barchasi <ChevronRight className="w-3 h-3" />
                </a>
              </div>
              <div className="flex gap-3">
                {([
                  { label: "Kutmoqda", val: aiPipeline.pending, color: "text-amber-400", bar: "bg-amber-400" },
                  { label: "Faol",     val: aiPipeline.active,  color: "text-blue-400",  bar: "bg-blue-400"  },
                  { label: "Tugagan", val: aiPipeline.completed, color: "text-green-400", bar: "bg-green-400" },
                ]).map(p => {
                  const total = aiPipeline.pending + aiPipeline.active + aiPipeline.completed || 1;
                  return (
                    <div key={p.label} className="flex-1 text-center">
                      <div className={`text-2xl font-bold ${p.color}`}>{p.val}</div>
                      <div className="text-xs text-on-surface-variant mb-1">{p.label}</div>
                      <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                        <div className={`h-full ${p.bar} rounded-full transition-all`} style={{ width: `${(p.val / total) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              {(aiPipeline.pending + aiPipeline.active + aiPipeline.completed) === 0 && (
                <p className="text-xs text-on-surface-variant/60 text-center mt-3">AI intervyu sessiyalari yo'q</p>
              )}
            </div>

            {/* Daily reports stats */}
            <div className="bg-surface-container-lowest rounded-xl border border-border/40 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-on-surface flex items-center gap-2">
                  <span className="text-lg">📋</span> Kunlik Hisobotlar (bugun)
                </h3>
                <a href="/hr/daily-reports" className="text-xs text-primary hover:underline flex items-center gap-1">
                  Barchasi <ChevronRight className="w-3 h-3" />
                </a>
              </div>
              <div className="flex gap-3 mb-3">
                {([
                  { label: "Topshirdi",   val: dailyStats?.stats?.submitted_count   ?? dailyStats?.submitted   ?? "—", color: "text-green-400", icon: CheckCircle2 },
                  { label: "Yo'q",        val: dailyStats?.stats?.auto_absent_count ?? dailyStats?.absent     ?? "—", color: "text-red-400",   icon: XCircle },
                  { label: "Kutilmoqda", val: dailyStats?.stats?.pending_count     ?? dailyStats?.pending    ?? "—", color: "text-amber-400", icon: Clock },
                ]).map(s => (
                  <div key={s.label} className="flex-1 flex flex-col items-center gap-1">
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                    <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
                    <div className="text-xs text-on-surface-variant">{s.label}</div>
                  </div>
                ))}
              </div>
              {operatorTotal > 0 && (
                <div className="border-t border-border pt-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-blue-600">
                    <Wrench className="w-3.5 h-3.5" />
                    <span className="font-medium">Operatorlar:</span>
                    <span className="font-bold">{operatorReportsToday}/{operatorTotal}</span>
                  </div>
                  {dailyStats?.stats?.avg_operator_oee && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Gauge className="w-3 h-3" />
                      <span>OEE: <span className="font-semibold text-blue-600">{dailyStats.stats.avg_operator_oee}%</span></span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Blocked employees list */}
          {blockedCount > 0 && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
              <h3 className="font-semibold text-red-500 flex items-center gap-2 mb-3">
                <Lock className="w-4 h-4" /> Bloklangan xodimlar ({blockedCount})
              </h3>
              <div className="space-y-2">
                {(Array.isArray(blockedEmps) ? blockedEmps.slice(0, 5) : []).map((emp: { id?: number | string; employeeName?: string; employee_name?: string; employee_id?: number; blockType?: string; block_type?: string }) => (
                  <div key={emp.id} className="flex items-center justify-between bg-surface-container-lowest rounded-lg px-3 py-2 text-sm">
                    <span className="font-medium text-on-surface">{emp.employeeName ?? emp.employee_name ?? `ID: ${emp.employee_id ?? emp.id}`}</span>
                    <span className="text-xs text-red-400">{emp.blockType ?? emp.block_type ?? "Bloklangan"}</span>
                  </div>
                ))}
                {blockedCount > 5 && (
                  <a href="/discipline" className="text-xs text-primary hover:underline block text-center mt-1">
                    + {blockedCount - 5} ta boshqa...
                  </a>
                )}
              </div>
            </div>
          )}

          {/* At-risk employees (adaptation score < 3.0) list */}
          {adaptationAtRiskCount > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5">
              <h3 className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2 mb-3">
                <Flame className="w-4 h-4" /> Moslashuv xavf ostida — ball &lt; 3.0 ({adaptationAtRiskCount})
              </h3>
              <div className="space-y-2">
                {(Array.isArray(atRiskEmps) ? atRiskEmps.slice(0, 5) : []).map((emp) => (
                  <div key={emp.id} className="flex items-center justify-between bg-surface-container-lowest rounded-lg px-3 py-2 text-sm">
                    <div>
                      <span className="font-medium text-on-surface">{emp.employee_name ?? `ID: ${emp.employee_id}`}</span>
                      {emp.department_name && (
                        <span className="text-xs text-on-surface-variant ml-2">{emp.department_name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {emp.mentor_name && (
                        <span className="text-xs text-on-surface-variant">Mentor: {emp.mentor_name}</span>
                      )}
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        {emp.adaptation_score ?? Math.round((emp.progress_percent ?? 0) / 20 * 10) / 10} / 5.0
                      </span>
                    </div>
                  </div>
                ))}
                {adaptationAtRiskCount > 5 && (
                  <a href="/hr/employees" className="text-xs text-primary hover:underline block text-center mt-1">
                    + {adaptationAtRiskCount - 5} ta boshqa...
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Module quick links */}
          <div>
            <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Modullar</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {([
                { title: "Hujjat Oqimi", desc: "Ta'til, avans, buyruq hujjatlari va tasdiqlash zanjiri", href: "/hr/documents", color: "bg-blue-500", icon: "📄" },
                { title: "Intizom V2", desc: "Buzilish katalogi, ogohlantirish va bloklash", href: "/discipline", color: "bg-red-500", icon: "⚖️" },
                { title: "Gamifikatsiya", desc: "Xodimlar reytingi, badge va ballar tizimi", href: "/hr/gamification", color: "bg-yellow-500", icon: "🏆" },
                { title: "Kunlik Hisobot", desc: "Har kuni xodim hisoboti va HR nazorati", href: "/hr/daily-reports", color: "bg-green-500", icon: "📋" },
                { title: "PIP Rejalar", desc: "Rivojlanish rejasi va progress kuzatuv", href: "/hr/pip", color: "bg-orange-500", icon: "📈" },
                { title: "eNPS So'rov", desc: "Xodimlar sodiqlik indeksi va tahlil", href: "/hr/enps", color: "bg-purple-500", icon: "📊" },
                { title: "Reception", desc: "Mehmonlar kirish-chiqish nazorati", href: "/hr/reception", color: "bg-teal-500", icon: "🏢" },
                { title: "Malakalar Matritsasi", desc: "Xodim va lavozim malaka xaritasi", href: "/skills-matrix", color: "bg-indigo-500", icon: "🎯" },
                { title: "AI Intervyu", desc: "Token orqali kandidat intervyusi", href: "/ai-hr/interviews", color: "bg-pink-500", icon: "🤖" },
              ]).map((mod) => (
                <a key={mod.href} href={mod.href}
                  className="bg-surface-container-lowest rounded-xl p-4 border border-surface-container hover:border-primary transition-all group cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg ${mod.color} flex items-center justify-center text-lg shrink-0`}>{mod.icon}</div>
                    <div>
                      <p className="font-semibold text-sm text-on-surface group-hover:text-primary transition-colors">{mod.title}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{mod.desc}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
