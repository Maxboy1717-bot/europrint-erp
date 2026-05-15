/**
 * @module StubRoutes
 * @description Frontend route definition.
 */

import { lazy } from "react";

const Stub = lazy(() => import("@/pages/StubPage"));

// ── Stub → real (session 2026-05-12) ─────────────────────────────────────────
const AgentsHubPage            = lazy(() => import("@/pages/agents/AgentsHub"));
const CameraAIAnalyticsPage    = lazy(() => import("@/pages/CameraAIAnalytics"));
const AIExamsPage              = lazy(() => import("@/pages/AIExams"));
const HRAIDashboardPage        = lazy(() => import("@/pages/HRAIDashboard"));
const AIProductionPlanningPage = lazy(() => import("@/pages/AIProductionPlanning"));
const AiCrmPageComponent       = lazy(() => import("@/pages/AiCrmPage"));
const WmsAnalyticsPage         = lazy(() => import("@/pages/WmsAnalytics"));
const IoTExtendedPage          = lazy(() => import("@/pages/IoTExtended"));
const IntegrationMgmtPage      = lazy(() => import("@/pages/IntegrationManagement"));
const POSDashboardPage         = lazy(() => import("@/pages/POSDashboard"));
const LessonPlayerPage         = lazy(() => import("@/pages/LessonPlayer"));
const MESWorkerAssignmentsPage = lazy(() => import("@/pages/MESWorkerAssignments"));
const AnalyticsPage            = lazy(() => import("@/pages/Analytics"));
// ── Real pages (prior sessions) ───────────────────────────────────────────────
const DisciplinePage      = lazy(() => import("@/pages/Discipline"));
const HRVacationPage      = lazy(() => import("@/pages/HRVacationSick"));
const GLDocumentsPage     = lazy(() => import("@/pages/GLDocuments"));
const AttendancePage      = lazy(() => import("@/pages/AttendanceMonitorPage"));
const PosMovementsPage    = lazy(() => import("@/pages/PosMovementsPage"));
const WeeklyPlansPage     = lazy(() => import("@/pages/WeeklyPlansPage"));
const ThreeWayMatchPage         = lazy(() => import("@/pages/ThreeWayMatchPage"));
const ProductionFactsPage       = lazy(() => import("@/pages/ProductionFactsPage"));
const WastePage                 = lazy(() => import("@/pages/WastePage"));
const MachineStatusPage         = lazy(() => import("@/pages/MachineStatusPage"));
const UsersPage                 = lazy(() => import("@/pages/UsersPage"));
const QualityDefectsCameraPage  = lazy(() => import("@/pages/QualityDefectsCameraPage"));
const IotSensorsPage            = lazy(() => import("@/pages/IotSensorsPage"));
const PosRequestsPage           = lazy(() => import("@/pages/PosRequestsPage"));
const ShiftReportsPage          = lazy(() => import("@/pages/ShiftReportsPage"));
const EmployeeZoneHistoryPage   = lazy(() => import("@/pages/EmployeeZoneHistoryPage"));
export const STUB_ROUTES: [string, React.ComponentType][] = [
  // ── Previously Stub → now real ─────────────────────────────────────────────
          // Customer 360° view
  ['/ai',                        AgentsHubPage],            // AI agents hub
  ['/ai-camera',                 CameraAIAnalyticsPage],    // Camera AI analytics
  ['/ai-exam',                   AIExamsPage],              // AI-generated exams
  ['/ai/hr',                     HRAIDashboardPage],        // HR AI dashboard
  ['/ai/marketing',              AiCrmPageComponent],       // AI CRM / marketing
  ['/ai-planning',               AIProductionPlanningPage], // AI production planning
  ['/ai/wms',                    WmsAnalyticsPage],         // WMS analytics
  ['/assignments',               MESWorkerAssignmentsPage], // MES worker assignments
  ['/insights',                  AnalyticsPage],            // BI analytics / insights
  ['/integration/requests',      IntegrationMgmtPage],      // Integration management
         // Advanced POS inventory
  ['/iot-enhanced',              IoTExtendedPage],          // Extended IoT dashboard
  ['/pos/mini-app',              POSDashboardPage],         // POS dashboard
  ['/video-progress',            LessonPlayerPage],         // Video lesson player

  // ── Still Stub (no real backend/page built yet) ───────────────────────────
  ['/auth',                      Stub],   // auth handled by auth system
  ['/export',                    Stub],   // export module not yet built
  ['/gpt',                       Stub],   // external GPT, deferred
  ['/micro-modules',             Stub],   // LMS micro-modules, deferred
  ['/modules',                   Stub],   // module manager, deferred
  ['/pos/printer-config',        Stub],   // printer HW config, deferred
  ['/sap',                       Stub],   // SAP integration, deferred
  ['/v2/pos/printer-config',     Stub],   // duplicate, deferred

  // ── Real pages (prior sessions) ───────────────────────────────────────────
  ['/3way-match',                ThreeWayMatchPage],

  ['/daily-attendance',          AttendancePage],
  ['/discipline-records',        DisciplinePage],

  ['/employee-zone-history',     EmployeeZoneHistoryPage],

  ['/gl',                        GLDocumentsPage],
  ['/hr/leave',                  HRVacationPage],

  ['/iot-sensors',               IotSensorsPage],
  ['/machine-status-current',    MachineStatusPage],

  ['/pos/movements',             PosMovementsPage],
  ['/pos/requests',              PosRequestsPage],
  ['/production-facts',          ProductionFactsPage],
  ['/production/shift-reports',  ShiftReportsPage],
  ['/quality-defects-camera',    QualityDefectsCameraPage],

  ['/users',                     UsersPage],
  ['/waste',                     WastePage],
  ['/weekly-plans',              WeeklyPlansPage],
];
