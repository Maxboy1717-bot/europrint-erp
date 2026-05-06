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

export const WAREHOUSE_ROUTES: [string, React.ComponentType][] = [
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
