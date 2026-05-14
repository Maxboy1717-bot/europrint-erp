/**
 * @module schema-enums
 * @description Source module. See exports for details.
 */

import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', [
  'admin',
  'manager',
  'supervisor',
  'operator',
  'employee',
  'director',
  'accountant',
  'hr_manager',
  'warehouse_manager',
  'sales_manager',
  'super_admin',
]);

export const dealStatusEnum = pgEnum('deal_status', [
  'new',
  'in_progress',
  'won',
  'lost',
  'on_hold',
]);

export const salesOrderStatusEnum = pgEnum('sales_order_status', [
  'draft',
  'confirmed',
  'in_production',
  'ready',
  'delivered',
  'cancelled',
  'invoiced',
]);

export const productionStatusEnum = pgEnum('production_status', [
  'pending',
  'in_progress',
  'on_hold',
  'completed',
  'cancelled',
  'quality_check',
]);

export const mesSessionStatusEnum = pgEnum('mes_session_status', [
  'pending',
  'active',
  'paused',
  'completed',
  'cancelled',
]);

export const stockMovementTypeEnum = pgEnum('stock_movement_type', [
  'receipt',
  'issue',
  'transfer',
  'adjustment',
  'return',
  'scrap',
  'production_input',
  'production_output',
]);

export const purchaseOrderStatusEnum = pgEnum('purchase_order_status', [
  'draft',
  'pending',
  'approved',
  'partially_received',
  'received',
  'invoiced',
  'paid',
  'cancelled',
]);

export const qcStatusEnum = pgEnum('qc_status', [
  'pending',
  'in_progress',
  'passed',
  'failed',
  'on_hold',
]);

export const employeeStatusEnum = pgEnum('employee_status', [
  'active',
  'on_leave',
  'terminated',
  'inactive',
]);

export const payrollStatusEnum = pgEnum('payroll_status', [
  'pending',
  'processing',
  'completed',
  'paid',
]);

export const lmsEnrollmentStatusEnum = pgEnum('lms_enrollment_status', [
  'enrolled',
  'in_progress',
  'completed',
  'failed',
  'expired',
]);

export const invoiceStatusEnum = pgEnum('invoice_status', [
  'draft',
  'sent',
  'partially_paid',
  'paid',
  'overdue',
  'cancelled',
]);

export const deliveryStatusEnum = pgEnum('delivery_status', [
  'pending',
  'dispatched',
  'in_transit',
  'delivered',
  'cancelled',
  'returned',
]);

export const designStatusEnum = pgEnum('design_status', [
  'pending',
  'in_progress',
  'under_review',
  'approved',
  'rejected',
  'completed',
]);

export const maintenanceStatusEnum = pgEnum('maintenance_status', [
  'open',
  'assigned',
  'in_progress',
  'completed',
  'cancelled',
]);

export const maintenancePriorityEnum = pgEnum('maintenance_priority', [
  'low',
  'medium',
  'high',
  'critical',
]);

export const kanbanTaskStatusEnum = pgEnum('kanban_task_status', [
  'todo',
  'in_progress',
  'review',
  'done',
  'blocked',
]);

export const kanbanPriorityEnum = pgEnum('kanban_priority', [
  'low',
  'medium',
  'high',
  'urgent',
]);

export const campaignStatusEnum = pgEnum('campaign_status', [
  'draft',
  'scheduled',
  'active',
  'paused',
  'completed',
  'cancelled',
]);

export const campaignTypeEnum = pgEnum('campaign_type', [
  'email',
  'social_media',
  'advertising',
  'event',
  'content',
  'partnership',
]);

export const securityIncidentSeverityEnum = pgEnum('security_incident_severity', [
  'low',
  'medium',
  'high',
  'critical',
]);

export const securityIncidentStatusEnum = pgEnum('security_incident_status', [
  'open',
  'investigating',
  'resolved',
  'closed',
]);

export const notificationTypeEnum = pgEnum('notification_type', [
  'info',
  'warning',
  'error',
  'success',
  'task_assigned',
  'approval_required',
  'order_update',
  'production_alert',
]);

export const attendanceStatusEnum = pgEnum('attendance_status', [
  'present',
  'absent',
  'late',
  'on_leave',
  'sick_leave',
  'remote',
]);
