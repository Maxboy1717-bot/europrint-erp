import { lazy } from "react";

const CoordinationPage = lazy(() => import("@/pages/CoordinationPage"));
const ERPDailyReports = lazy(() => import("@/pages/ERPDailyReports"));
const EmployeeProfile = lazy(() => import("@/pages/EmployeeProfile"));
const EuroprintControlCenter = lazy(() => import("@/pages/EuroprintControlCenter"));
const AuditorPanel = lazy(() => import("@/pages/AuditorPanel"));
const AccountantView = lazy(() => import("@/pages/AccountantView"));
const StrategicTasksPanel = lazy(() => import("@/pages/StrategicTasksPanel"));
const EmployeeDailyKPIPanel = lazy(() => import("@/pages/EmployeeDailyKPIPanel"));
const WasteTracking = lazy(() => import("@/pages/WasteTracking"));
const ReportsHub = lazy(() => import("@/pages/ReportsHub"));
const DirectorExtended = lazy(() => import("@/pages/DirectorExtended"));
const IdealRasmPage = lazy(() => import("@/pages/IdealRasmPage"));
const DirectorAiAudit = lazy(() => import("@/pages/DirectorAiAudit"));

export const DIRECTOR_ROUTES: [string, React.ComponentType][] = [
  ['/coordination',             CoordinationPage],
  ['/erp-daily-reports',        ERPDailyReports],
  ['/erp/employee/:id',         EmployeeProfile],
  ['/europrint/control',        EuroprintControlCenter],
  ['/europrint/auditor',        AuditorPanel],
  ['/europrint/accountant',     AccountantView],
  ['/europrint/strategic',      StrategicTasksPanel],
  ['/strategic-tasks',          StrategicTasksPanel],
  ['/europrint/employee-kpi',   EmployeeDailyKPIPanel],
  ['/europrint/waste-tracking', WasteTracking],
  ['/europrint/reports-hub',    ReportsHub],
  ['/director/ai-summary',      DirectorExtended],
  ['/director/problem-points',  DirectorExtended],
  ['/director/production',      DirectorExtended],
  ['/director/hr-stats',        DirectorExtended],
  ['/director/finance',         DirectorExtended],
  ['/director/kpis',            DirectorExtended],
  ['/ideal-rasm',               IdealRasmPage],
  ['/director/ai-audit',        DirectorAiAudit],
];
