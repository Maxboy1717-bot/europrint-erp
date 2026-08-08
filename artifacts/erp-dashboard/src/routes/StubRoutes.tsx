/**
 * @module StubRoutes
 * @description Frontend route definition.
 */

import { lazy } from "react";

// ── Stub → real (session 2026-05-12) ─────────────────────────────────────────
const AgentsHubPage            = lazy(() => import("@/pages/agents/AgentsHub"));
const CameraAIAnalyticsPage    = lazy(() => import("@/pages/CameraAIAnalytics"));
const AIExamsPage              = lazy(() => import("@/pages/AIExams"));
const HRAIDashboardPage        = lazy(() => import("@/pages/HRAIDashboard"));
const AIProductionPlanningPage = lazy(() => import("@/pages/AIProductionPlanning"));
const AiCrmPageComponent       = lazy(() => import("@/pages/AiCrmPage"));
const IoTExtendedPage          = lazy(() => import("@/pages/IoTExtended"));
const IntegrationMgmtPage      = lazy(() => import("@/pages/IntegrationManagement"));
const LessonPlayerPage         = lazy(() => import("@/pages/LessonPlayer"));
const MESWorkerAssignmentsPage = lazy(() => import("@/pages/MESWorkerAssignments"));
const Customer360Page          = lazy(() => import("@/pages/Customer360Page"));
const AnalyticsPage            = lazy(() => import("@/pages/Analytics"));
const WmsAnalyticsPage         = lazy(() => import("@/pages/WmsAnalyticsPage"));

// ── Real pages (prior sessions) ───────────────────────────────────────────────
const HRVacationPage      = lazy(() => import("@/pages/HRVacationSick"));
const GLDocumentsPage     = lazy(() => import("@/pages/GLDocuments"));
const AttendancePage      = lazy(() => import("@/pages/AttendanceMonitorPage"));
const OkrPage             = lazy(() => import("@/pages/OkrPage"));
const MaterialCardsPage   = lazy(() => import("@/pages/MaterialCardsPage"));
const EquipmentPage       = lazy(() => import("@/pages/EquipmentPage"));
const WeeklyPlansPage     = lazy(() => import("@/pages/WeeklyPlansPage"));
const CandidatesPage      = lazy(() => import("@/pages/CandidatesPage"));
const EmployeeFilesPage   = lazy(() => import("@/pages/EmployeeFilesPage"));
const HRZnoPage           = lazy(() => import("@/pages/HRZnoPage"));
const HRZvsPage           = lazy(() => import("@/pages/HRZvsPage"));
const AchievementsPage    = lazy(() => import("@/pages/AchievementsPage"));
const AiAutomationPage          = lazy(() => import("@/pages/AiAutomationPage"));
const EuroprintControlPage      = lazy(() => import("@/pages/EuroprintControlPage"));
const CompanyStatePage          = lazy(() => import("@/pages/CompanyStatePage"));
const ThreeWayMatchPage         = lazy(() => import("@/pages/ThreeWayMatchPage"));
const ApprovalWorkflowPage      = lazy(() => import("@/pages/ApprovalWorkflowPage"));
const ProductionFactsPage       = lazy(() => import("@/pages/ProductionFactsPage"));
const WastePage                 = lazy(() => import("@/pages/WastePage"));
const RawMaterialsPage          = lazy(() => import("@/pages/RawMaterialsPage"));
const SafetyViolationsPage      = lazy(() => import("@/pages/SafetyViolationsPage"));
const EmployeeProductivityPage  = lazy(() => import("@/pages/EmployeeProductivityPage"));
const MentorsPage               = lazy(() => import("@/pages/MentorsPage"));
const MentorshipsPage           = lazy(() => import("@/pages/MentorshipsPage"));
const MachineStatusPage         = lazy(() => import("@/pages/MachineStatusPage"));
const UsersPage                 = lazy(() => import("@/pages/UsersPage"));
const QualityDefectsCameraPage  = lazy(() => import("@/pages/QualityDefectsCameraPage"));
const IotSensorsPage            = lazy(() => import("@/pages/IotSensorsPage"));
const OrderStatusPage           = lazy(() => import("@/pages/OrderStatusPage"));
const ShiftReportsPage          = lazy(() => import("@/pages/ShiftReportsPage"));
const RaciCrisisPage            = lazy(() => import("@/pages/RaciCrisisPage"));
const CalendarEventsPage        = lazy(() => import("@/pages/CalendarEventsPage"));
const ApplicationResponsesPage  = lazy(() => import("@/pages/ApplicationResponsesPage"));
const QuestionsPage             = lazy(() => import("@/pages/QuestionsPage"));
const AttemptsPage              = lazy(() => import("@/pages/AttemptsPage"));
const EmployeeZoneHistoryPage   = lazy(() => import("@/pages/EmployeeZoneHistoryPage"));

export const STUB_ROUTES: [string, React.ComponentType][] = [
  // ── Previously Stub → now real ─────────────────────────────────────────────
  ['/360',                       Customer360Page],          // Customer 360° view
  ['/ai',                        AgentsHubPage],            // AI agents hub
  ['/ai-camera',                 CameraAIAnalyticsPage],    // Camera AI analytics
  ['/ai-exam',                   AIExamsPage],              // AI-generated exams
  ['/ai/hr',                     HRAIDashboardPage],        // HR AI dashboard
  ['/ai/marketing',              AiCrmPageComponent],       // AI CRM / marketing
  ['/ai-planning',               AIProductionPlanningPage], // AI production planning
  ['/ai/wms',                    WmsAnalyticsPage],         // Ombor tahlili (turnover/dead-stock/ROP) — real BE
  ['/assignments',               MESWorkerAssignmentsPage], // MES worker assignments
  ['/insights',                  AnalyticsPage],            // BI analytics / insights
  ['/integration/requests',      IntegrationMgmtPage],      // Integration management
  ['/iot-enhanced',              IoTExtendedPage],          // Extended IoT dashboard
  ['/video-progress',            LessonPlayerPage],         // Video lesson player

  // ── Removed 2026-07-03 (3.13-stub-routes, Q-46) ────────────────────────────
  // /export            — real BE (5 CSV/PDF endpoints) already surfaced via
  //                       RemainingTabsHr.tsx download links (HR analytics).
  // /micro-modules     — real BE (list/create/view) already live at routed+
  //                       sidebar page /lms/micro-learning (MicroLearningTab).
  // /modules           — real BE (LMS module CRUD) already exercised via
  //                       AddModuleDialog inside routed page /courses/:id;
  //                       no vision requirement for a separate global module
  //                       manager page — would be new scope, not wiring.
  // /pos/printer-config — real BE (list/active/create/patch/test) but fully
  //                       duplicated by the already-live printer settings tab
  //                       in BarcodeSystem (uses /api/warehouse/printer-config).
  // /sap               — BE is an internal alias/shadow of sales_orders
  //                       (sap.repository.ts falls back to sales_orders table),
  //                       not a real external SAP integration; functionality
  //                       already covered by routed page /erp/sales
  //                       (SalesOrders.tsx). Real SAP integration = egasi-qaror
  //                       kutadi (CLAUDE.md F4), not built — kept out per Q-46.

  // ── Real pages (prior sessions) ───────────────────────────────────────────
  ['/3way-match',                ThreeWayMatchPage],
  ['/achievements',              AchievementsPage],
  ['/ai/automation',             AiAutomationPage],
  ['/application-responses',     ApplicationResponsesPage],
  ['/approval-workflow',         ApprovalWorkflowPage],
  ['/attempts',                  AttemptsPage],
  ['/calendar-events',           CalendarEventsPage],
  ['/candidates',                CandidatesPage],
  ['/company-state',             CompanyStatePage],
  ['/daily-attendance',          AttendancePage],
  ['/employee-files',            EmployeeFilesPage],
  ['/employee-productivity',     EmployeeProductivityPage],
  ['/employee-zone-history',     EmployeeZoneHistoryPage],
  ['/equipment',                 EquipmentPage],
  ['/europrint-control',         EuroprintControlPage],
  ['/gl',                        GLDocumentsPage],
  ['/hr/zno',                    HRZnoPage],
  ['/hr/zvs',                    HRZvsPage],
  ['/iot-sensors',               IotSensorsPage],
  ['/machine-status-current',    MachineStatusPage],
  ['/machine-status-logs',       MachineStatusPage],
  ['/material-cards',            MaterialCardsPage],
  ['/mentors',                   MentorsPage],
  ['/mentorships',               MentorshipsPage],
  ['/okr',                       OkrPage],
  ['/order-status',              OrderStatusPage],
  ['/production-facts',          ProductionFactsPage],
  ['/production/shift-reports',  ShiftReportsPage],
  ['/quality-defects-camera',    QualityDefectsCameraPage],
  ['/questions',                 QuestionsPage],
  ['/raci-crisis',               RaciCrisisPage],
  ['/raw-materials',             RawMaterialsPage],
  ['/safety-violations',         SafetyViolationsPage],
  ['/users',                     UsersPage],
  ['/waste',                     WastePage],
  ['/weekly-plans',              WeeklyPlansPage],
];
