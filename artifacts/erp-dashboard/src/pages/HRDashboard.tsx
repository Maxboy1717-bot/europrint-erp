/**
 * @module HRDashboard
 * @description Route-level HR Dashboard page. Owns all data-fetching (useQuery),
 * derived state computation, and top-level JSX orchestration. UI components are
 * split into HRDashboardCards, HRDashboardSections, and HRDashboardV2Tab.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, selectArray } from "@/lib/queryClient";
import { PillTabs } from "@/components/ui/pill-tabs";
import { EPPageHeader, EPErrorState } from "@/components/ep";
import type { AbcAnalysis, DisciplineRecord, Attendance } from "@shared/schema";
import { useTranslation } from "@/lib/i18n";
import type { UserWithAnalysis, AlertsResponse, RiskScoresResponse, EmployeeWithGrade } from "./hr-dashboard/types";
import { HR_TABS } from "./hr-dashboard/types";
import { RiskTab } from "./hr-dashboard/RiskTab";
import { TurnoverTab } from "./hr-dashboard/TurnoverTab";
import { DisciplineTab } from "./hr-dashboard/DisciplineTab";
import { SafetyTab } from "./hr-dashboard/SafetyTab";
import type {
  BirthdayEmployee, ExpiringContract, DailyStats, GamLeaderboard,
  UpcomingMilestone, AdaptationRiskEmployee, AiInterviewSession, AiPipeline,
} from "./HRDashboardTypes";
import { MODULE_LINKS } from "./HRDashboardTypes";
import { KpiGrid, HrV2QuickStats, OperatorReportsWidget } from "./HRDashboardCards";
import {
  ExpiringContractsWidget, BirthdayMilestoneWidgets, OverviewTab,
} from "./HRDashboardSections";
import { AlertsTab, PerformersTab } from "./HRDashboardTabs";
import {
  V2LiveKpiRow, AiPipelineCard, DailyReportsCard,
  BlockedEmployeesList, AdaptationAtRiskList, ModuleLinksGrid,
} from "./HRDashboardV2Tab";

export default function HRDashboard() {
  const { t } = useTranslation('common');
  const { t: tHr, language } = useTranslation("hr");
  const [activeTab, setActiveTab] = useState("overview");

  // -------------------------------------------------------------------------
  // Data queries
  // -------------------------------------------------------------------------

  // P1.1.1: use HR employees endpoint (not auth /api/users)
  const { data: employees = [], isLoading: isLoadingEmployees, isError, error, refetch } =
    useQuery<UserWithAnalysis[]>({
      queryKey: ["/api/hr/employees"],
      select: (data: unknown) => {
        if (Array.isArray(data)) return data as UserWithAnalysis[];
        const d = data as Record<string, unknown>;
        return Array.isArray(d?.items) ? (d.items as UserWithAnalysis[]) : [];
      },
    });

  const { data: abcAnalysis = [], isLoading: isLoadingABC } =
    useQuery<AbcAnalysis[]>({ queryKey: ["/api/hr/abc-analysis"] });

  const { data: disciplineRecords = [], isLoading: isLoadingDiscipline } =
    useQuery<DisciplineRecord[]>({ queryKey: ["/api/hr/discipline-records"] });

  const { data: attendanceRecords = [], isLoading: isLoadingAttendance } =
    useQuery<Attendance[]>({ queryKey: ["/api/hr/attendance"] });

  const { data: resignationReasons = [] } =
    useQuery<{ reason: string; count: number; color: string }[]>({ queryKey: ["/api/hr/resignation-stats", language] });

  const { data: monthlyTrend = [] } =
    useQuery<{ month: string; newHires: number; resignations: number }[]>({ queryKey: ["/api/hr/monthly-trend", language] });

  const { data: alertsData, isLoading: isLoadingAlerts } =
    useQuery<AlertsResponse>({ queryKey: ["/api/hr/alerts"], refetchInterval: 60_000 });

  const { data: riskData, isLoading: isLoadingRisk } =
    useQuery<RiskScoresResponse>({ queryKey: ["/api/hr/risk-scores"], refetchInterval: 300_000 });

  const { data: safetySummaryData } =
    useQuery<{ incidentsThisMonth: number; ppeCompliancePercent: number; expiringTrainings: number; openIncidents: number }>({
      queryKey: ["/api/hr/safety/summary"], refetchInterval: 120_000,
    });

  const { data: safetyIncidentsData = [] } =
    useQuery<{ id: string; userName?: string; incidentType: string; severity: string; incidentDate: string; status: string }[]>({
      queryKey: ["/api/hr/safety/incidents"],
    });

  // HR V2 queries
  const { data: blockedEmps } =
    useQuery<Record<string, unknown>[]>({ queryKey: ["/api/hr/discipline/blocked"] });

  const { data: activePips } =
    useQuery<Record<string, unknown>[]>({ queryKey: ["/api/hr-v2/pip"], queryFn: () => apiRequest("GET", "/api/hr-v2/pip?status=active") });

  const { data: gamLeaderboard } =
    useQuery<GamLeaderboard>({ queryKey: ["/api/hr/gamification/leaderboard/monthly"], queryFn: () => apiRequest("GET", "/api/hr/gamification/leaderboard?period=monthly") });

  const { data: activeSurveys } =
    useQuery<Record<string, unknown>[]>({ queryKey: ["/api/hr-v2/enps"], queryFn: () => apiRequest("GET", "/api/hr-v2/enps") });

  const { data: aiSessions } =
    useQuery<AiInterviewSession[]>({ queryKey: ["/api/hr/ai-interview/sessions"], enabled: activeTab === "v2" });

  const { data: dailyStats } =
    useQuery<DailyStats>({ queryKey: ["/api/hr-v2/daily-reports/stats"], queryFn: () => apiRequest("GET", "/api/hr-v2/daily-reports/stats") });

  const { data: atRiskEmps } =
    useQuery<AdaptationRiskEmployee[]>({ queryKey: ["/api/hr/adaptation/at-risk"], enabled: activeTab === "v2" });

  const { data: offboardingStats } =
    useQuery<{ active: string | number; completed: string | number; cancelled: string | number; total: string | number }>({
      queryKey: ["/api/hr/offboarding/cases/stats"], refetchInterval: 120_000,
    });

  const { data: expiringContracts = [] } =
    useQuery<ExpiringContract[]>({
      queryKey: ["/api/hr/contracts/expiring"],
      queryFn: () => apiRequest("GET", "/api/hr/contracts/expiring?days=30"),
      refetchInterval: 300_000,
      select: selectArray<ExpiringContract>,
    });

  const { data: todayBirthdays = [] } =
    useQuery<BirthdayEmployee[]>({
      queryKey: ["/api/hr/birthdays/today"],
      queryFn: () => apiRequest("GET", "/api/hr/birthdays/today"),
      refetchInterval: 3600_000,
      select: selectArray<BirthdayEmployee>,
    });

  const { data: upcomingBirthdays = [] } =
    useQuery<BirthdayEmployee[]>({
      queryKey: ["/api/hr/birthdays/upcoming"],
      queryFn: () => apiRequest("GET", "/api/hr/birthdays/upcoming?days=7"),
      refetchInterval: 3600_000,
      select: selectArray<BirthdayEmployee>,
    });

  const { data: upcomingMilestones = [] } =
    useQuery<UpcomingMilestone[]>({
      queryKey: ["/api/hr/milestones/upcoming"],
      queryFn: () => apiRequest("GET", "/api/hr/milestones/upcoming"),
      refetchInterval: 300_000,
      select: selectArray<UpcomingMilestone>,
    });

  // -------------------------------------------------------------------------
  // Derived state
  // -------------------------------------------------------------------------

  const isLoading = isLoadingEmployees || isLoadingABC || isLoadingDiscipline || isLoadingAttendance;

  const operatorReportsToday = dailyStats?.operatorStats?.submitted ?? 0;
  const operatorTotal        = dailyStats?.operatorStats?.total    ?? 0;

  const blockedCount           = Array.isArray(blockedEmps) ? blockedEmps.length : 0;
  const activePipCount         = Array.isArray(activePips)  ? activePips.length  : 0;
  const adaptationAtRiskCount  = Array.isArray(atRiskEmps)  ? atRiskEmps.length  : 0;
  const topGamer               = gamLeaderboard?.leaderboard?.[0];
  const activeSurveyCount      = Array.isArray(activeSurveys) ? activeSurveys.length : 0;
  const activeOffboardingCount = parseInt(String(offboardingStats?.active ?? 0)) || 0;

  const aiPipeline: AiPipeline = { pending: 0, active: 0, completed: 0 };
  if (Array.isArray(aiSessions)) {
    aiSessions.forEach((s) => {
      if      (s.status === "pending")   aiPipeline.pending++;
      else if (s.status === "active")    aiPipeline.active++;
      else if (s.status === "completed") aiPipeline.completed++;
    });
  }

  const employeesWithGrades: EmployeeWithGrade[] = (Array.isArray(employees) ? employees : []).map((emp) => {
    const analysis = (Array.isArray(abcAnalysis) ? abcAnalysis : []).find((a) => a.userId === emp.id);
    return {
      id: emp.id,
      fullName: emp.fullName || "",
      grade: analysis?.grade ?? null,
      score: analysis?.score ?? 0,
      performanceRate: analysis?.performanceRate ?? 0,
      attendanceRate:  analysis?.attendanceRate  ?? 0,
      disciplineScore: analysis?.disciplineScore ?? 0,
    };
  });

  const topPerformers    = [...employeesWithGrades].sort((a, b) => b.score - a.score).slice(0, 10);
  const bottomPerformers = [...employeesWithGrades].sort((a, b) => a.score - b.score).slice(0, 10);

  const warningsCount  = (Array.isArray(disciplineRecords) ? disciplineRecords : []).filter((r) => r.type === "warning").length;
  const penaltiesSum   = (Array.isArray(disciplineRecords) ? disciplineRecords : []).filter((r) => r.type === "penalty").reduce((sum, r) => sum + (r.amount || 0), 0);
  const rewardsSum     = (Array.isArray(disciplineRecords) ? disciplineRecords : []).filter((r) => r.type === "reward" ).reduce((sum, r) => sum + (r.amount || 0), 0);
  const lateArrivals   = (Array.isArray(attendanceRecords) ? attendanceRecords : []).filter((a) => a.isLate).length;
  const totalResignations = (Array.isArray(resignationReasons) ? resignationReasons : []).reduce((sum, r) => sum + r.count, 0);

  const alerts      = alertsData?.alerts || [];
  const alertStats  = alertsData?.stats  || { critical: 0, warning: 0, info: 0, total: 0 };
  const riskEmployees = riskData?.scores || [];
  const riskSummary   = riskData?.stats  || { low: 0, medium: 0, high: 0, critical: 0 };
  const atRiskCount   = (riskSummary.high || 0) + (riskSummary.critical || 0);

  if (isError) {
    return (
      <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
        <EPPageHeader
          breadcrumb={<>{t('dashboard')} · <b className="text-foreground">{t('hrPanel')}</b></>}
          title={tHr('humanResources')}
          subtitle={tHr('humanResourcesSubtitle')}
        />
        <EPErrorState onRetry={refetch}  error={error} />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex flex-col p-5 lg:p-6 gap-5">
      <EPPageHeader
        breadcrumb={<>{t('dashboard')} · <b className="text-foreground">{t('hrPanel')}</b></>}
        title={tHr('humanResources')}
        subtitle={tHr('humanResourcesSubtitle')}
      />

      <KpiGrid
        isLoading={isLoading}
        employeeCount={employees.length}
        warningsCount={warningsCount}
        lateArrivals={lateArrivals}
        criticalAlerts={alertStats.critical}
        atRiskCount={atRiskCount}
        rewardsSum={rewardsSum}
      />

      <ExpiringContractsWidget contracts={expiringContracts} />

      <BirthdayMilestoneWidgets
        todayBirthdays={todayBirthdays}
        upcomingBirthdays={upcomingBirthdays}
        upcomingMilestones={upcomingMilestones}
      />

      <OperatorReportsWidget
        operatorReportsToday={operatorReportsToday}
        operatorTotal={operatorTotal}
        dailyStats={dailyStats}
      />

      <HrV2QuickStats
        blockedCount={blockedCount}
        activePipCount={activePipCount}
        topGamer={topGamer}
        activeSurveys={activeSurveys}
      />

      <PillTabs tabs={HR_TABS.map(tab => ({ ...tab, label: tHr(`tabs.${tab.key}`) }))} active={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" && (
        <OverviewTab
          isLoading={isLoading}
          topPerformers={topPerformers}
          alerts={alerts}
          isLoadingAlerts={isLoadingAlerts}
          safetySummaryData={safetySummaryData}
          onViewAllAlerts={() => setActiveTab("alerts")}
          onViewSafety={() => setActiveTab("safety")}
        />
      )}

      {activeTab === "performers" && (
        <PerformersTab topPerformers={topPerformers} bottomPerformers={bottomPerformers} />
      )}

      {activeTab === "alerts" && (
        <AlertsTab alerts={alerts} alertStats={alertStats} isLoadingAlerts={isLoadingAlerts} />
      )}

      {activeTab === "risk"       && <RiskTab riskEmployees={riskEmployees} riskSummary={riskSummary} isLoading={isLoadingRisk} />}
      {activeTab === "turnover"   && <TurnoverTab resignationReasons={resignationReasons} monthlyTrend={monthlyTrend} totalResignations={totalResignations} />}
      {activeTab === "discipline" && <DisciplineTab disciplineRecords={disciplineRecords} warningsCount={warningsCount} penaltiesSum={penaltiesSum} rewardsSum={rewardsSum} lateArrivals={lateArrivals} />}
      {activeTab === "safety"     && <SafetyTab safetySummary={safetySummaryData} incidents={safetyIncidentsData} />}

      {activeTab === "v2" && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-foreground">{tHr('hrV2LiveStatus')}</h2>

          <V2LiveKpiRow
            blockedCount={blockedCount}
            adaptationAtRiskCount={adaptationAtRiskCount}
            activePipCount={activePipCount}
            activeSurveyCount={activeSurveyCount}
            activeOffboardingCount={activeOffboardingCount}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AiPipelineCard pipeline={aiPipeline} />
            <DailyReportsCard dailyStats={dailyStats} operatorReportsToday={operatorReportsToday} operatorTotal={operatorTotal} />
          </div>

          <BlockedEmployeesList blockedEmps={blockedEmps as never} blockedCount={blockedCount} />
          <AdaptationAtRiskList atRiskEmps={atRiskEmps} adaptationAtRiskCount={adaptationAtRiskCount} />
          <ModuleLinksGrid modules={MODULE_LINKS} />
        </div>
      )}
    </div>
  );
}
