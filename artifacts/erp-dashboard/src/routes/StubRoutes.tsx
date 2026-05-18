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
const Customer360Page          = lazy(() => import("@/pages/Customer360Page"));
const AnalyticsPage            = lazy(() => import("@/pages/Analytics"));
const POSInventoryPage         = lazy(() => import("@/pages/POSInventoryPage"));

// ── Real pages (prior sessions) ───────────────────────────────────────────────
const DisciplinePage      = lazy(() => import("@/pages/Discipline"));
const HRVacationPage      = lazy(() => import("@/pages/HRVacationSick"));
const GLDocumentsPage     = lazy(() => import("@/pages/GLDocuments"));
const AttendancePage      = lazy(() => import("@/pages/AttendanceMonitorPage"));
const OkrPage             = lazy(() => import("@/pages/OkrPage"));
const MaterialCardsPage   = lazy(() => import("@/pages/MaterialCardsPage"));
const PosMovementsPage    = lazy(() => import("@/pages/PosMovementsPage"));
const EquipmentPage       = lazy(() => import("@/pages/EquipmentPage"));
const OrgDepartmentsPage  = lazy(() => import("@/pages/OrgDepartmentsPage"));
const WeeklyPlansPage     = lazy(() => import("@/pages/WeeklyPlansPage"));
const CandidatesPage      = lazy(() => import("@/pages/CandidatesPage"));
const EmployeeFilesPage   = lazy(() => import("@/pages/EmployeeFilesPage"));
const HRZnoPage           = lazy(() => import("@/pages/HRZnoPage"));
const HRZvsPage           = lazy(() => import("@/pages/HRZvsPage"));
const PosBarcPage         = lazy(() => import("@/pages/PosBarcPage"));
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
const PosInventoryCountsPage    = lazy(() => import("@/pages/PosInventoryCountsPage"));
const PosRequestsPage           = lazy(() => import("@/pages/PosRequestsPage"));
const ShiftReportsPage          = lazy(() => import("@/pages/ShiftReportsPage"));
const RaciCrisisPage            = lazy(() => import("@/pages/RaciCrisisPage"));
const CalendarEventsPage        = lazy(() => import("@/pages/CalendarEventsPage"));
const ApplicationResponsesPage  = lazy(() => import("@/pages/ApplicationResponsesPage"));
const QuestionsPage             = lazy(() => import("@/pages/QuestionsPage"));
const AttemptsPage              = lazy(() => import("@/pages/AttemptsPage"));
const EmployeeZoneHistoryPage   = lazy(() => import("@/pages/EmployeeZoneHistoryPage"));
const QuestionnaireQuestionsPage = lazy(() => import("@/pages/QuestionnaireQuestionsPage"));

export const STUB_ROUTES: [string, React.ComponentType][] = [
  // ── Previously Stub → now real ─────────────────────────────────────────────
  ['/360',                       Customer360Page],          // Customer 360° view
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
  ['/inventory/advanced',        POSInventoryPage],         // Advanced POS inventory
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
  ['/achievements',              AchievementsPage],
  ['/ai/automation',             AiAutomationPage],
  ['/application-responses',     ApplicationResponsesPage],
  ['/approval-workflow',         ApprovalWorkflowPage],
  ['/attempts',                  AttemptsPage],
  ['/calendar-events',           CalendarEventsPage],
  ['/candidates',                CandidatesPage],
  ['/company-state',             CompanyStatePage],
  ['/daily-attendance',          AttendancePage],
  ['/discipline-records',        DisciplinePage],
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
  ['/org-departments',           OrgDepartmentsPage],
  ['/pos/barcode',               PosBarcPage],
  ['/pos/inventory-counts',      PosInventoryCountsPage],
  ['/pos/movements',             PosMovementsPage],
  ['/pos/requests',              PosRequestsPage],
  ['/production-facts',          ProductionFactsPage],
  ['/production/shift-reports',  ShiftReportsPage],
  ['/quality-defects-camera',    QualityDefectsCameraPage],
  ['/questionnaire-questions',   QuestionnaireQuestionsPage],
  ['/questions',                 QuestionsPage],
  ['/raci-crisis',               RaciCrisisPage],
  ['/raw-materials',             RawMaterialsPage],
  ['/safety-violations',         SafetyViolationsPage],
  ['/users',                     UsersPage],
  ['/waste',                     WastePage],
  ['/weekly-plans',              WeeklyPlansPage],
];
