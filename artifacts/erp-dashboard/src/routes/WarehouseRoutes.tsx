/**
 * @module WarehouseRoutes
 * @description Frontend route definition.
 */

import { lazy } from "react";

const WarehouseHub = lazy(() => import("@/pages/WarehouseHub12"));
const BarcodeWarehouse = lazy(() => import("@/pages/BarcodeWarehouse"));
const WarehouseDirectory = lazy(() => import("@/pages/WarehouseDirectory"));
const InventoryCount = lazy(() => import("@/pages/InventoryCount"));
const GoodsReceiving = lazy(() => import("@/pages/GoodsReceiving"));
const StockReservation = lazy(() => import("@/pages/StockReservation"));
const WarehouseReports = lazy(() => import("@/pages/WarehouseReports"));
const BarcodeSystem = lazy(() => import("@/pages/BarcodeSystem"));
const WarehouseIntegrations = lazy(() => import("@/pages/WarehouseIntegrations"));
const MMVendors = lazy(() => import("@/pages/MMVendors"));
const MMPurchaseOrders = lazy(() => import("@/pages/MMPurchaseOrders"));
const MMDashboard = lazy(() => import("@/pages/MMDashboard"));
const SupplyChainDashboard = lazy(() => import("@/pages/SupplyChainDashboard"));
const MMExtended = lazy(() => import("@/pages/MMExtended"));
const WMSExtended = lazy(() => import("@/pages/WMSExtended"));
const WarehouseRental = lazy(() => import("@/pages/WarehouseRental"));
const WMSDashboard = lazy(() => import("@/pages/WMSDashboard"));
const MaterialBalance = lazy(() => import("@/pages/MaterialBalance"));
const BarcodeScanner = lazy(() => import("@/pages/BarcodeScanner"));
const WMSMaterials = lazy(() => import("@/pages/WMSMaterials"));
const LogisticsDashboard = lazy(() => import("@/pages/LogisticsDashboard"));
const WmsAnalytics = lazy(() => import("@/pages/WmsAnalytics"));
const WarehouseKpiHub = lazy(() => import("@/pages/WarehouseKpiHub"));
const WarehouseReportsAll = lazy(() => import("@/pages/WarehouseReportsAll"));
const WarehouseMaterial360 = lazy(() => import("@/pages/WarehouseMaterial360"));
const WarehouseQuarantine = lazy(() => import("@/pages/WarehouseQuarantine"));
const WarehouseBarcodeQueue = lazy(() => import("@/pages/WarehouseBarcodeQueue"));
const WarehouseInventoryPassport = lazy(() => import("@/pages/WarehouseInventoryPassport"));
const WarehouseQCReview = lazy(() => import("@/pages/WarehouseQCReview"));
const EmployeeInventory = lazy(() => import("@/pages/EmployeeInventory"));
const WarehouseKirimWizard = lazy(() => import("@/pages/WarehouseKirimWizard"));
const NotificationCenter = lazy(() => import("@/pages/NotificationCenter"));
const WarehouseAuditLog = lazy(() => import("@/pages/WarehouseAuditLog"));
const ProcurementPage = lazy(() => import("@/pages/ProcurementPage"));
const WarehousesPage = lazy(() => import("@/pages/WarehousesPage"));
const WarehouseTypePage = lazy(() => import("@/pages/WarehouseTypePage"));
const WarehouseStockPage = lazy(() => import("@/pages/WarehouseStockPage"));

export const WAREHOUSE_ROUTES: [string, React.ComponentType][] = [
  ['/wms/procurement',            ProcurementPage],
  ['/wms/warehouses',             WarehousesPage],
  ['/wms/warehouse-stock/:id',    WarehouseStockPage],
  ['/wms/warehouses/:type',       WarehouseTypePage],
  ['/warehouse/hub',              WarehouseHub],
  ['/warehouse/hub/:code',        WarehouseHub],
  ['/warehouse/barcode-ops',      BarcodeWarehouse],
  ['/warehouse-directory',        WarehouseDirectory],
  ['/warehouse/inventory-count',  InventoryCount],
  ['/warehouse/goods-receiving',  GoodsReceiving],
  ['/warehouse/reservations',     StockReservation],
  ['/warehouse/reports',          WarehouseReports],
  ['/warehouse/barcodes',         BarcodeSystem],
  ['/warehouse/integrations',     WarehouseIntegrations],
  ['/barcode-warehouse',          BarcodeWarehouse],
  ['/mm/vendors',                 MMVendors],
  ['/mm/purchase-orders',         MMPurchaseOrders],
  ['/mm/dashboard',               MMDashboard],
  ['/mm/supply-chain',            SupplyChainDashboard],
  ['/mm/check-bot',               MMExtended],
  ['/mm/creditor-debts',          MMExtended],
  ['/mm/supplier-portal',         MMExtended],
  ['/wms/grn',                    GoodsReceiving],
  ['/wms/reservation',            StockReservation],
  ['/wms/inventory',              InventoryCount],
  ['/wms/production-balance',     WMSExtended],
  ['/wms/transfer',               WMSExtended],
  ['/wms/lot-traceability',       WMSExtended],
  ['/wms/internal-requests',      WMSExtended],
  ['/wms/kpi',                    WMSExtended],
  ['/wms/rental',                 WarehouseRental],
  ['/wms/dashboard',              WMSDashboard],
  ['/wms/analytics',              WmsAnalytics],
  ['/wms/kpi-hub',                WarehouseKpiHub],
  ['/wms/reports',                WarehouseReportsAll],
  ['/wms/reports-all',            WarehouseReportsAll],
  ['/wms/material/360/:id',       WarehouseMaterial360],
  ['/wms/quarantine',             WarehouseQuarantine],
  ['/wms/barcodes-queue',         WarehouseBarcodeQueue],
  ['/wms/passports',              WarehouseInventoryPassport],
  ['/wms/qc-review',              WarehouseQCReview],
  ['/wms/employee-inventory',     EmployeeInventory],
  ['/wms/kirim-new',              WarehouseKirimWizard],
  ['/wms/notifications',          NotificationCenter],
  ['/wms/audit-log',              WarehouseAuditLog],
  ['/wms/material-balance',       MaterialBalance],
  ['/wms/scanner',                BarcodeScanner],
  ['/inventory/materials',        WMSMaterials],
  ['/inventory/materials/:id',    WMSMaterials],
  ['/logistics',                  LogisticsDashboard],
  ['/logistics/transport',        LogisticsDashboard],
  ['/logistics/route-planning',   LogisticsDashboard],
  ['/logistics/gps',              LogisticsDashboard],
  ['/logistics/fuel',             LogisticsDashboard],
  ['/logistics/drivers',          LogisticsDashboard],
  ['/logistics/vehicle-schedule', LogisticsDashboard],
];
