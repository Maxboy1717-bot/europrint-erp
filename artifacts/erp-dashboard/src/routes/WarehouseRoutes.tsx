/**
 * @module WarehouseRoutes
 * @description Frontend route definition.
 */

import { lazy } from "react";

const WarehouseHub = lazy(() => import("@/pages/WarehouseHub12"));
const InventoryCount = lazy(() => import("@/pages/InventoryCount"));
const MMVendors = lazy(() => import("@/pages/MMVendors"));
const MMPurchaseOrders = lazy(() => import("@/pages/MMPurchaseOrders"));
const MMDashboard = lazy(() => import("@/pages/MMDashboard"));
const MMExtended = lazy(() => import("@/pages/MMExtended"));
const WMSExtended = lazy(() => import("@/pages/WMSExtended"));
const WarehouseRental = lazy(() => import("@/pages/WarehouseRental"));
const MaterialBalance = lazy(() => import("@/pages/MaterialBalance"));
const WMSMaterials = lazy(() => import("@/pages/WMSMaterials"));
const LogisticsDashboard = lazy(() => import("@/pages/LogisticsDashboard"));
const WmsAnalytics = lazy(() => import("@/pages/WmsAnalytics"));
const WarehouseKpiHub = lazy(() => import("@/pages/WarehouseKpiHub"));
const WarehouseReportsAll = lazy(() => import("@/pages/WarehouseReportsAll"));
const WarehouseQuarantine = lazy(() => import("@/pages/WarehouseQuarantine"));
const WarehouseBarcodeQueue = lazy(() => import("@/pages/WarehouseBarcodeQueue"));
const WarehouseInventoryPassport = lazy(() => import("@/pages/WarehouseInventoryPassport"));
const WarehouseQCReview = lazy(() => import("@/pages/WarehouseQCReview"));
const EmployeeInventory = lazy(() => import("@/pages/EmployeeInventory"));
const WarehouseKirimWizard = lazy(() => import("@/pages/WarehouseKirimWizard"));
const NotificationCenter = lazy(() => import("@/pages/NotificationCenter"));
const WarehouseAuditLog = lazy(() => import("@/pages/WarehouseAuditLog"));

export const WAREHOUSE_ROUTES: [string, React.ComponentType][] = [
  ['/warehouse/hub',              WarehouseHub],
  ['/warehouse/hub/:code',        WarehouseHub],

  ['/mm/vendors',                 MMVendors],
  ['/mm/purchase-orders',         MMPurchaseOrders],
  ['/mm/dashboard',               MMDashboard],

  ['/mm/check-bot',               MMExtended],
  ['/mm/creditor-debts',          MMExtended],
  ['/mm/supplier-portal',         MMExtended],

  ['/wms/inventory',              InventoryCount],
  ['/wms/production-balance',     WMSExtended],
  ['/wms/transfer',               WMSExtended],

  ['/wms/internal-requests',      WMSExtended],

  ['/wms/rental',                 WarehouseRental],

  ['/wms/analytics',              WmsAnalytics],
  ['/wms/kpi-hub',                WarehouseKpiHub],
  ['/wms/reports',                WarehouseReportsAll],
  ['/wms/reports-all',            WarehouseReportsAll],

  ['/wms/quarantine',             WarehouseQuarantine],
  ['/wms/barcodes-queue',         WarehouseBarcodeQueue],
  ['/wms/passports',              WarehouseInventoryPassport],
  ['/wms/qc-review',              WarehouseQCReview],
  ['/wms/employee-inventory',     EmployeeInventory],
  ['/wms/kirim-new',              WarehouseKirimWizard],
  ['/wms/notifications',          NotificationCenter],
  ['/wms/audit-log',              WarehouseAuditLog],
  ['/wms/material-balance',       MaterialBalance],

  ['/inventory/materials',        WMSMaterials],
  ['/inventory/materials/:id',    WMSMaterials],

  ['/logistics/transport',        LogisticsDashboard],
  ['/logistics/route-planning',   LogisticsDashboard],
  ['/logistics/gps',              LogisticsDashboard],
  ['/logistics/fuel',             LogisticsDashboard],
  ['/logistics/drivers',          LogisticsDashboard],
  ['/logistics/vehicle-schedule', LogisticsDashboard],
];
