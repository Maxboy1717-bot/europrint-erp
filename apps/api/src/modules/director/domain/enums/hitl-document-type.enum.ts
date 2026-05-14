/**
 * @module hitl-document-type.enum
 * @description Source module. See exports for details.
 */

export enum HitlDocumentType {
  PURCHASE_ORDER = 'purchase_order', // PO > 50 mln UZS
  PAYMENT = 'payment', // To'lov > 100 mln UZS
  THREE_WAY_MATCH = 'three_way_match', // 3-way mismatch
  CREDIT_LIMIT_EXCEED = 'credit_limit_exceed',
  DISCOUNT_OVERRIDE = 'discount_override', // Chegirma > 15%
  EMPLOYEE_TARDINESS = 'employee_tardiness', // 60+ min kechikish
  QC_FAIL_CRITICAL = 'qc_fail_critical',
  MRO_REPAIR_HIGH_VALUE = 'mro_repair_high_value', // MRO > 20 mln
  EMPLOYEE_TERMINATION = 'employee_termination',
  INVENTORY_WRITEOFF = 'inventory_writeoff', // Inventar o'chirish > 10 mln
  ADVANCE_BYPASS = 'advance_bypass', // §8.1 avans bypass
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export const HITL_THRESHOLDS = {
  PURCHASE_ORDER_HIGH_VALUE: 50_000_000,
  PAYMENT_HIGH_VALUE: 100_000_000,
  DISCOUNT_PERCENT_MAX: 15,
  MRO_REPAIR_HIGH_VALUE: 20_000_000,
  INVENTORY_WRITEOFF_HIGH_VALUE: 10_000_000,
  EMPLOYEE_TARDINESS_MINUTES: 60,
} as const;
