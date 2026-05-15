/**
 * @module ProductionRoutes
 * @description Frontend route definition.
 */

import { lazy } from "react";const ProductionReport = lazy(() => import("@/pages/ProductionReport"));
const ProductionOrder360 = lazy(() => import("@/pages/ProductionOrder360"));
const PlanningBoard = lazy(() => import("@/pages/PlanningBoard"));
const AIProductionPlanning = lazy(() => import("@/pages/AIProductionPlanning"));
const AIReservation = lazy(() => import("@/pages/AIReservation"));
const PapkaOrders = lazy(() => import("@/pages/PapkaOrders"));
const OrderCreationWizard = lazy(() => import("@/pages/OrderCreationWizard"));
const PPDashboard = lazy(() => import("@/pages/PPDashboard"));
const BOMManagement = lazy(() => import("@/pages/BOMManagement"));
const RoutingConfiguration = lazy(() => import("@/pages/RoutingConfiguration"));
const CapacityPlanning = lazy(() => import("@/pages/CapacityPlanning"));
const TechApproval = lazy(() => import("@/pages/TechApproval"));
const TechCards = lazy(() => import("@/pages/TechCards"));
const TechPPExtended = lazy(() => import("@/pages/TechPPExtended"));
const FinanceApproval = lazy(() => import("@/pages/FinanceApproval"));
const DesignApproval = lazy(() => import("@/pages/DesignApproval"));
const MESHomeDashboard = lazy(() => import("@/pages/MESHomeDashboard"));
const MESWorkCenters = lazy(() => import("@/pages/MESWorkCenters"));
const MESProducts = lazy(() => import("@/pages/MESProducts"));
const MESDowntimes = lazy(() => import("@/pages/MESDowntimes"));
const MESWorkerAssignments = lazy(() => import("@/pages/MESWorkerAssignments"));
const MESExtended = lazy(() => import("@/pages/MESExtended"));
const QCDashboard = lazy(() => import("@/pages/QCDashboard"));
const QCApproval = lazy(() => import("@/pages/QCApproval"));
const QCFinalInspection = lazy(() => import("@/pages/QCFinalInspection"));
const QCExtended = lazy(() => import("@/pages/QCExtended"));
const QCModule = lazy(() => import("@/pages/QCModule"));
const DesignDashboard = lazy(() => import("@/pages/DesignDashboard"));
const DesignOrders = lazy(() => import("@/pages/DesignOrders"));
const AIDesignGenerator = lazy(() => import("@/pages/AIDesignGenerator"));
const DesignExtended = lazy(() => import("@/pages/DesignExtended"));
const MRODashboard = lazy(() => import("@/pages/MRODashboard"));
const MROExtended = lazy(() => import("@/pages/MROExtended"));
const IoTTablet = lazy(() => import("@/pages/IoTTablet"));
const IoTDashboard = lazy(() => import("@/pages/IoTDashboard"));
const IoTExtended = lazy(() => import("@/pages/IoTExtended"));
const WarehouseDailyView = lazy(() => import("@/pages/WarehouseDailyView"));
// ARCHITECTURE.md §40 — TZ-06 AI Rejalashtirish dedicated sahifalar
const AIShiftManagementPage = lazy(() => import("@/pages/ai-planning/AIShiftManagementPage"));
const BottleneckAnalysisPage = lazy(() => import("@/pages/ai-planning/BottleneckAnalysisPage"));
const DemandForecastingPage = lazy(() => import("@/pages/ai-planning/DemandForecastingPage"));
const OEELiveMonitorPage = lazy(() => import("@/pages/ai-planning/OEELiveMonitorPage"));
const RushOrderPage = lazy(() => import("@/pages/ai-planning/RushOrderPage"));

// ARCHITECTURE.md §40 — TZ-04 QC dedicated
const PaperParametersPage = lazy(() => import("@/pages/qc/PaperParametersPage"));
const SupplierQualityPage = lazy(() => import("@/pages/qc/SupplierQualityPage"));
const DefectManagementPage = lazy(() => import("@/pages/qc/DefectManagementPage"));
const ReclamationsPage = lazy(() => import("@/pages/qc/ReclamationsPage"));
const QualityCertificatesPage = lazy(() => import("@/pages/qc/QualityCertificatesPage"));
const QualityTrendPage = lazy(() => import("@/pages/qc/QualityTrendPage"));

// ARCHITECTURE.md §40 — TZ-14 MRO dedicated
const PreventiveMaintenancePage = lazy(() => import("@/pages/mro/PreventiveMaintenancePage"));
const SparePartsPage = lazy(() => import("@/pages/mro/SparePartsPage"));
const UtilityReadingsPage = lazy(() => import("@/pages/mro/UtilityReadingsPage"));
const CleaningSchedulePage = lazy(() => import("@/pages/mro/CleaningSchedulePage"));
const FacilityInventoryPage = lazy(() => import("@/pages/mro/FacilityInventoryPage"));
const CanteenManagementPage = lazy(() => import("@/pages/mro/CanteenManagementPage"));

export const PRODUCTION_ROUTES: [string, React.ComponentType][] = [

  ['/production/orders',          ProductionReport],
  ['/production/orders/:id',      ProductionOrder360],
  ['/planning',                   PlanningBoard],
  ['/ai-production-planning',     AIProductionPlanning],
  ['/pp/ai-reservation',          AIReservation],
  ['/papka-orders',               PapkaOrders],
  ['/order-create',               OrderCreationWizard],

  ['/pp/dashboard',               PPDashboard],
  ['/erp/pp/bom',                 BOMManagement],
  ['/erp/pp/routing',             RoutingConfiguration],
  ['/erp/pp/capacity',            CapacityPlanning],

  ['/tech-approval',              TechApproval],
  ['/tech-cards',                 TechCards],
  ['/tech/cards',                 TechCards],
  ['/tech/material-alternatives', TechPPExtended],
  ['/tech/machine-selection',     TechPPExtended],
  ['/tech/time-cost',             TechPPExtended],
  ['/tech/cost-optimization',     TechPPExtended],
  ['/tech/client-requirements',   TechPPExtended],
  ['/tech/change-history',        TechPPExtended],
  ['/tech/parallel-orders',       TechPPExtended],
  ['/pp/shift-management',        AIShiftManagementPage],     // dedicated (TZ-06)
  ['/pp/parallel-processes',      TechPPExtended],
  ['/pp/rush-orders',             RushOrderPage],              // dedicated (TZ-06)
  ['/pp/bottleneck',              BottleneckAnalysisPage],     // dedicated (TZ-06)

  ['/pp/demand-forecast',         DemandForecastingPage],      // dedicated (TZ-06)
  ['/pp/what-if',                 TechPPExtended],
  ['/pp/delivery-calculator',     TechPPExtended],
  ['/pp/energy-optimization',     TechPPExtended],
  ['/pp/oee-monitor',             OEELiveMonitorPage],         // dedicated (TZ-06)
  ['/pp/kpi-deviation',           TechPPExtended],
  ['/pp/realtime-progress',       TechPPExtended],
  ['/finance/approval',           FinanceApproval],
  ['/design/approval',            DesignApproval],
];

export const MES_ROUTES: [string, React.ComponentType][] = [
  ['/mes/dashboard-home',       MESHomeDashboard],
  ['/mes/work-centers',         MESWorkCenters],
  ['/mes/products',             MESProducts],
  ['/mes/downtimes',            MESDowntimes],
  ['/mes/workers',              MESWorkerAssignments],
  ['/mes/oee-monitor',          MESExtended],
  ['/mes/reason-log',           MESExtended],
  ['/mes/zone-management',      MESExtended],
  ['/mes/maintenance-request',  MESExtended],
  ['/mes/gamification',         MESExtended],
  ['/mes/machine-norms',        MESExtended],
  ['/mes/smena-handover',       MESExtended],
];

export const QC_ROUTES: [string, React.ComponentType][] = [
  ['/qc/dashboard-home',    QCDashboard],
  // Tabbed QCModule page hosts parameters / tests / standards. Each URL opens a
  // different initial tab — see getInitialTab() in QCModule.tsx:
  //   /qc/tests       → "physical" tab (default)
  //   /qc/parameters  → "physical" tab
  //   /qc/standards   → "standards" tab
  ['/qc-module',            QCModule],
  ['/qc/tests',             QCModule],
  ['/qc/parameters',        QCModule],
  ['/qc/standards',         QCModule],

  ['/qc/approval',          QCApproval],
  ['/qc/final',             QCFinalInspection],
  ['/qc/lab',               QCExtended],
  ['/qc/paper-parameters',  PaperParametersPage],         // dedicated (TZ-04)
  ['/qc/vendor-quality',    SupplierQualityPage],         // dedicated (TZ-04)
  ['/qc/defect-management', DefectManagementPage],        // dedicated (TZ-04)
  ['/qc/complaints',        ReclamationsPage],            // dedicated (TZ-04)
  ['/qc/certificates',      QualityCertificatesPage],     // dedicated (TZ-04)
  ['/qc/iso',               QCExtended],
  ['/qc/trends',            QualityTrendPage],            // dedicated (TZ-04)
  ['/qc/ai-analysis',       QCExtended],
  ['/qc/reports',           QCExtended],
  ['/qc/settings',          QCExtended],
];

export const DESIGN_ROUTES: [string, React.ComponentType][] = [
  ['/design/dashboard',        DesignDashboard],
  ['/design/orders',           DesignOrders],

  ['/design/generator',        AIDesignGenerator],
  ['/design/ai-review',        DesignExtended],
  ['/design/3d-mockup',        DesignExtended],
  ['/design/brand-guidelines', DesignExtended],
  ['/design/comparison',       DesignExtended],
  ['/design/templates',        DesignExtended],
  ['/design/tools',            DesignExtended],
  ['/design/costing',          DesignExtended],
  ['/design/library',          DesignExtended],
];

export const MRO_ROUTES: [string, React.ComponentType][] = [
  ['/mro/dashboard',          MRODashboard],
  ['/mro/preventive',         PreventiveMaintenancePage],   // dedicated (TZ-14)
  ['/mro/spare-parts',        SparePartsPage],              // dedicated (TZ-14)
  ['/mro/utilities',          UtilityReadingsPage],         // dedicated (TZ-14)
  ['/mro/expense-control',    MROExtended],
  ['/mro/kitchen',            CanteenManagementPage],       // dedicated (TZ-14)
  ['/mro/uniforms',           MROExtended],
  ['/mro/office-inventory',   FacilityInventoryPage],       // dedicated (TZ-14)
  ['/mro/cleaning',           CleaningSchedulePage],        // dedicated (TZ-14)
  ['/mro/sanitation',         MROExtended],
  ['/mro/building-inventory', FacilityInventoryPage],       // dedicated (TZ-14)
];

export const IOT_ROUTES: [string, React.ComponentType][] = [
  ['/iot/sensor-monitoring',      IoTExtended],
  ['/iot/predictive-maintenance', IoTExtended],
  ['/iot/oee-live',               IoTExtended],
  ['/iot/digital-twin',           IoTExtended],
  ['/iot/alerts',                 IoTExtended],
  ['/iot/tablet',                 IoTTablet],
  ['/iot/dashboard',              IoTDashboard],

  ['/iot/daily-view',             WarehouseDailyView],
];
