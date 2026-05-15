/**
 * @module DirectorRoutes
 * @description Frontend route definition.
 */

import { lazy } from "react";

// Original Coordination sahifasi saqlanadi — Kommunikatsiya Markazi shu yerda
// "baskets" tab sifatida joylashadi (sidebar -> coordination?tab=baskets).const AgentsHub                  = lazy(() => import("@/pages/agents/AgentsHub"));
const ProductionAgentDashboard   = lazy(() => import("@/pages/agents/ProductionDashboard"));
const HRPerformanceAgentDash     = lazy(() => import("@/pages/agents/HRPerformanceDashboard"));
const QualityAgentDashboard      = lazy(() => import("@/pages/agents/QualityDashboard"));
const StrategicAgentDashboard    = lazy(() => import("@/pages/agents/StrategicDashboard"));
const FacilitiesAgentDashboard   = lazy(() => import("@/pages/agents/FacilitiesDashboard"));
const ProcurementAgentDashboard  = lazy(() => import("@/pages/agents/ProcurementDashboard"));
const RollManagementPage         = lazy(() => import("@/pages/warehouse/RollManagementPage"));
const EuroprintControlCenter = lazy(() => import("@/pages/EuroprintControlCenter"));
const AuditorPanel = lazy(() => import("@/pages/AuditorPanel"));
const AccountantView = lazy(() => import("@/pages/AccountantView"));
const StrategicTasksPanel = lazy(() => import("@/pages/StrategicTasksPanel"));
const EmployeeDailyKPIPanel = lazy(() => import("@/pages/EmployeeDailyKPIPanel"));
const WasteTracking = lazy(() => import("@/pages/WasteTracking"));
const ReportsHub = lazy(() => import("@/pages/ReportsHub"));
const DirectorExtended = lazy(() => import("@/pages/DirectorExtended"));
const IdealRasmPage = lazy(() => import("@/pages/IdealRasmPage"));
export const DIRECTOR_ROUTES: [string, React.ComponentType][] = [

  ['/agents',                   AgentsHub],
  ['/agents/production',        ProductionAgentDashboard],
  ['/agents/hr-performance',    HRPerformanceAgentDash],
  ['/agents/quality',           QualityAgentDashboard],
  ['/agents/strategic',         StrategicAgentDashboard],
  ['/agents/facilities',        FacilitiesAgentDashboard],
  ['/agents/procurement',       ProcurementAgentDashboard],

  ['/warehouse/rolls',          RollManagementPage],
  ['/agents/:id',               AgentsHub],

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

  ['/ideal-rasm',               IdealRasmPage],

];
