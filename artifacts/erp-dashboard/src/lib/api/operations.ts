/**
 * @module operations
 * @description Frontend utility / library module.
 */

import { apiRequest } from "@/lib/queryClient";

export const operationsApi = {
  // Barcode Warehouse
  barcodeQcDecision: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/barcode-warehouse/barcodes/${id}/qc-decision`, data),
  barcodeQc: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/barcode-warehouse/barcodes/${id}/qc`, data),
  completePicking: (taskId: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/barcode-warehouse/picking/${taskId}/complete`, data),
  notifyExitSecurity: (id: number | string) =>
    apiRequest("POST", `/api/barcode-warehouse/exit/${id}/notify-security`),
  issueBarcode: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/barcode-warehouse/issue", data),

  // IoT
  acknowledgeIotAlert: (id: number | string) =>
    apiRequest("POST", `/api/iot/alerts/${id}/acknowledge`),
  createIotEnhancedMaterialKit: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/iot-enhanced/material-kits", data),
  addIotEnhancedKitItem: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/iot-enhanced/material-kits/${id}/items`, data),
  createIotMaterialKit: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/iot/material-kits", data),
  generateIotMaterialKit: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/iot/material-kits/generate", data),

  // Integration
  approveMro: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/integration/mro/${id}/approve`, data),

  // Planning
  createSchedule: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/planning/schedule", data),

  // SaaS / SAP
  updateTenant: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/saas/tenants/${id}`, data),
  updateSapSalesOrder: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/sap/sales-orders/${id}`, data),

  // Technology
  optimizeTechnologyCard: (id: number | string) =>
    apiRequest("POST", `/api/technology/cards/${id}/optimize`),
  aiCheckTechnologyOrder: (id: number | string) =>
    apiRequest("POST", `/api/technology/orders/${id}/ai-check`),

  // Notifications
  markAllMyNotificationsRead: () =>
    apiRequest("POST", "/api/notifications/my/mark-all-read"),
  updateNotificationPreferences: (data: Record<string, unknown>) =>
    apiRequest("PUT", "/api/notifications/preferences", data),
  markDesignNotificationRead: (id: number | string) =>
    apiRequest("PATCH", `/api/design/notifications/${id}/read`),

  // Filters
  createFilter: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/filters", data),
  updateFilter: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/filters/${id}`, data),
  deleteFilter: (id: number | string) =>
    apiRequest("DELETE", `/api/filters/${id}`),

  // Security
  exitVisitor: (id: number | string) =>
    apiRequest("POST", `/api/security/visitors/${id}/exit`),

  // POS v2
  testPrinterConfig: (id: number | string) =>
    apiRequest("POST", `/api/v2/pos/printer-config/${id}/test`),

  // POS
  createPosProduct: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/pos/products", data),
  createPosTransaction: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/pos/transactions", data),
  refundPosTransaction: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/pos/transactions/${id}/refund`, data),

  // Warehouse Rental
  closeWarehouseRentalRecord: (id: number | string) =>
    apiRequest("POST", `/api/warehouse-rental/records/${id}/close`),
  markWarehouseRentalPaid: (id: number | string) =>
    apiRequest("POST", `/api/warehouse-rental/records/${id}/mark-paid`),

  // Kanban
  updateKanbanChecklist: (checklistId: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/kanban/checklists/${checklistId}`, data),
  updateKanbanFlow: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/kanban/flows/${id}`, data),
  updateKanbanRobot: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/kanban/robots/${id}`, data),
  updateKanbanBoard: (boardId: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/kanban/boards/${boardId}`, data),
  deleteKanbanBoard: (boardId: number | string) =>
    apiRequest("DELETE", `/api/kanban/boards/${boardId}`),

  // Employee status (compat route)
  updateEmployeeStatusCompat: (id: number | string, status: string) =>
    apiRequest("PATCH", `/api/hr/employees/${id}/status`, { status }),
};
