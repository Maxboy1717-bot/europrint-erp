/**
 * @module WarehouseRoutes
 * @description Frontend route definition. Toza kanonik ombor routelari (2026-05-30).
 *   Rasvo/stub sahifalar olib tashlandi: WarehouseHub12, WMSExtended, WmsAnalytics,
 *   SupplyChainDashboard, WarehouseDirectory, WarehouseReports, WarehouseIntegrations, BarcodeWarehouse.
 */

import { lazy } from "react";

const InventoryCount = lazy(() => import("@/pages/InventoryCount"));
const GoodsReceiving = lazy(() => import("@/pages/GoodsReceiving"));
const StockReservation = lazy(() => import("@/pages/StockReservation"));
const WarehouseReports = lazy(() => import("@/pages/WarehouseReports"));
const BarcodeSystem = lazy(() => import("@/pages/BarcodeSystem"));
const MMVendors = lazy(() => import("@/pages/MMVendors"));
const MMPurchaseOrders = lazy(() => import("@/pages/MMPurchaseOrders"));
const MMDashboard = lazy(() => import("@/pages/MMDashboard"));
const MMExtended = lazy(() => import("@/pages/MMExtended"));
const WarehouseRental = lazy(() => import("@/pages/WarehouseRental"));
const WMSDashboard = lazy(() => import("@/pages/WMSDashboard"));
const MaterialBalance = lazy(() => import("@/pages/MaterialBalance"));
const BarcodeScanner = lazy(() => import("@/pages/BarcodeScanner"));
const WMSMaterials = lazy(() => import("@/pages/WMSMaterials"));
const LogisticsDashboard = lazy(() => import("@/pages/LogisticsDashboard"));
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
const WarehouseDashboardPage = lazy(() => import("@/pages/WarehouseDashboardPage"));
const PosMonitorPage = lazy(() => import("@/pages/PosMonitorPage"));
const MaterialUnitPriceConfig = lazy(() => import("@/pages/MaterialUnitPriceConfig"));
const RulonCards = lazy(() => import("@/pages/RulonCards"));
const WarehouseBinsPage = lazy(() => import("@/pages/WarehouseBinsPage"));

export const WAREHOUSE_ROUTES: [string, React.ComponentType][] = [
  // YANGI toza ombor (ERP nazorat)
  ['/wms/overview',               WarehouseDashboardPage],
  ['/wms/procurement',            ProcurementPage],
  ['/wms/warehouses',             WarehousesPage],
  ['/wms/warehouse-stock/:id',    WarehouseStockPage],
  ['/wms/warehouses/:type',       WarehouseTypePage],
  ['/wms/pos-monitor',            PosMonitorPage],
  // Inventar / hisobot (ishlaydigan sahifalar)
  ['/warehouse/inventory-count',  InventoryCount],
  ['/warehouse/goods-receiving',  GoodsReceiving],
  ['/warehouse/reservations',     StockReservation],
  ['/warehouse/reports',          WarehouseReports],
  ['/warehouse/barcodes',         BarcodeSystem],
  ['/wms/grn',                    GoodsReceiving],
  ['/wms/reservation',            StockReservation],
  ['/wms/inventory',              InventoryCount],
  ['/wms/rental',                 WarehouseRental],
  ['/wms/dashboard',              WMSDashboard],
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
  ['/wms/material-unit-price',     MaterialUnitPriceConfig],  // config-mexanizm: birlik narx
  ['/wms/rulon-cards',             RulonCards],               // WMS rulon qog'oz karta CRUD
  ['/wms/bins',                    WarehouseBinsPage],         // WMS ombor binlari (yacheykalar) CRUD
  // Ta'minot (MM) — tz09 sidebar ishlatadi
  ['/mm/vendors',                 MMVendors],
  ['/mm/purchase-orders',         MMPurchaseOrders],
  ['/mm/dashboard',               MMDashboard],
  ['/mm/check-bot',               MMExtended],
  ['/mm/creditor-debts',          MMExtended],
  ['/mm/supplier-portal',         MMExtended],
  // Logistika — tz09 sidebar ishlatadi
  ['/logistics',                  LogisticsDashboard],
  ['/logistics/transport',        LogisticsDashboard],
  ['/logistics/route-planning',   LogisticsDashboard],
  ['/logistics/gps',              LogisticsDashboard],
  ['/logistics/fuel',             LogisticsDashboard],
  ['/logistics/drivers',          LogisticsDashboard],
  ['/logistics/vehicle-schedule', LogisticsDashboard],
];
