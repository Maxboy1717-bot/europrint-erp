/**
 * @module status-machines.constants
 * @description Named-constant exports (business thresholds, enums, lookup tables).
 */

// §12 - 25 ob'ekt status mashinalari

// Sales Order - 20+ holat
export const SO_TRANSITIONS: Record<string, string[]> = {
  draft: ['incomplete', 'cancelled'],
  incomplete: ['waiting_customer_input', 'cancelled'],
  waiting_customer_input: ['pending_design', 'pending_sample_lab', 'pending_technology'],
  pending_design: ['pending_manager_completion', 'cancelled'],
  pending_sample_lab: ['pending_manager_completion', 'cancelled'],
  pending_manager_completion: ['pending_technology'],
  pending_technology: ['tech_rejected', 'pending_advance'],
  tech_rejected: ['pending_technology', 'cancelled'],
  pending_advance: ['ready_for_planning'],
  ready_for_planning: ['planned'],
  planned: ['released_to_production'],
  released_to_production: ['in_production'],
  in_production: ['pending_qc_final'],
  pending_qc_final: ['qc_failed', 'ready_for_fg_warehouse'],
  qc_failed: ['rework', 'cancelled'],
  rework: ['pending_qc_final'],
  ready_for_fg_warehouse: ['in_fg_warehouse'],
  in_fg_warehouse: ['delivery_planned'],
  delivery_planned: ['in_delivery'],
  in_delivery: ['delivered'],
  delivered: ['partially_paid', 'fully_paid'],
  partially_paid: ['fully_paid'],
  fully_paid: ['closed'],
  closed: [],
  cancelled: [],
  on_hold: ['confirmed', 'cancelled'],
}

// Lead - 10 holat
export const LEAD_TRANSITIONS: Record<string, string[]> = {
  new: ['contacted', 'rejected'],
  contacted: ['qualified', 'unqualified'],
  qualified: ['negotiation', 'lost'],
  negotiation: ['won', 'lost'],
  won: ['converted_to_deal'],
  converted_to_deal: ['active'],
  active: ['inactive'],
  inactive: [],
  unqualified: [],
  rejected: [],
  lost: [],
}

// Deal - 12 holat
export const DEAL_TRANSITIONS: Record<string, string[]> = {
  prospecting: ['qualification', 'lost'],
  qualification: ['negotiation_initiation', 'lost'],
  negotiation_initiation: ['proposal_development', 'lost'],
  proposal_development: ['proposal_review', 'lost'],
  proposal_review: ['negotiation_closure', 'lost'],
  negotiation_closure: ['won', 'lost'],
  won: ['order_created'],
  order_created: ['closed'],
  closed: [],
  lost: [],
}

// Design - DesignOrder aggregate holatlari (design-status.enum.ts bilan mos)
// NOTE (2026-07-05): oldingi versiya (not_started/in_progress/review/...) hech qachon
// DesignOrder.status haqiqiy qiymatlari (DesignStatus enum) bilan mos kelmagan edi —
// isTransitionAllowed() har doim false qaytargan (masalan waiting_customer_approval
// kaliti mavjud emas edi), ya'ni UpdateDesignStatusHandler orqali approve/reject
// haqiqatda hech qachon o'tmasdi. AIDesignGenerator.tsx ni shu path'ga ulash uchun
// tuzatildi (A8, PP Trigger 5 golden-thread fix).
// ai_generated -> approved/rejected qo'shildi: AIDesignGenerator.tsx "Natijalar"
// tab'ida generatsiyadan keyin (status=ai_generated) staff bitta tugma bilan
// approve/reject qiladi (designer_review/waiting_customer_approval bosqichlarini
// UI hali alohida ekranda o'tkazmaydi) — bu real, ishlab turgan UX oqimi (Q-46),
// shuning uchun to'g'ridan-to'g'ri sakrash qonuniy tranzitsiya sifatida saqlangan.
export const DESIGN_TRANSITIONS: Record<string, string[]> = {
  new: ['ai_generated'],
  ai_generated: ['designer_review', 'approved', 'rejected'],
  designer_review: ['waiting_customer_approval', 'revision_requested', 'rejected'],
  waiting_customer_approval: ['approved', 'rejected', 'revision_requested'],
  revision_requested: ['ai_generated', 'designer_review'],
  approved: [],
  rejected: [],
}

// Technology - 9 holat
export const TECHNOLOGY_TRANSITIONS: Record<string, string[]> = {
  not_started: ['in_progress'],
  in_progress: ['checkpoint_1', 'rejected'],
  checkpoint_1: ['checkpoint_2'],
  checkpoint_2: ['checkpoint_3'],
  checkpoint_3: ['approved', 'rejected'],
  approved: ['ready_for_planning'],
  rejected: ['in_progress'],
  ready_for_planning: [],
}

// Production Plan - 7 holat
export const PP_TRANSITIONS: Record<string, string[]> = {
  not_started: ['planning_in_progress'],
  planning_in_progress: ['plan_approved', 'rejected'],
  plan_approved: ['released_to_production'],
  released_to_production: ['in_production'],
  in_production: ['production_completed'],
  production_completed: [],
  rejected: [],
}

// MES - 8 holat
export const MES_TRANSITIONS: Record<string, string[]> = {
  scheduled: ['in_progress'],
  in_progress: ['completed', 'paused', 'failed'],
  paused: ['in_progress'],
  completed: ['quality_check'],
  quality_check: ['passed', 'failed'],
  passed: ['ready_for_warehouse'],
  failed: [],
  ready_for_warehouse: [],
}

// QC Inspection - 5 holat
export const QC_TRANSITIONS: Record<string, string[]> = {
  pending: ['in_progress'],
  in_progress: ['passed', 'failed'],
  passed: ['approved'],
  failed: ['rework_required'],
  rework_required: [],
  approved: [],
}

// Warehouse - 7 holat
export const WAREHOUSE_TRANSITIONS: Record<string, string[]> = {
  not_received: ['received'],
  received: ['stored'],
  stored: ['reserved', 'available'],
  reserved: ['issued'],
  issued: ['shipped'],
  available: [],
  shipped: [],
}

// Delivery - 8 holat
export const DELIVERY_TRANSITIONS: Record<string, string[]> = {
  planned: ['in_transit'],
  in_transit: ['delivered', 'failed'],
  delivered: ['confirmed', 'returned'],
  confirmed: ['completed'],
  completed: [],
  failed: ['rescheduled'],
  rescheduled: ['in_transit'],
  returned: [],
}

// Invoice - 7 holat
export const INVOICE_TRANSITIONS: Record<string, string[]> = {
  draft: ['issued'],
  issued: ['sent'],
  sent: ['viewed', 'partially_paid'],
  viewed: ['partially_paid', 'fully_paid'],
  partially_paid: ['fully_paid'],
  fully_paid: ['closed'],
  closed: [],
}

// Material Transfer - 6 holat
export const MATERIAL_TRANSFER_TRANSITIONS: Record<string, string[]> = {
  drafted: ['requested'],
  requested: ['approved', 'rejected'],
  approved: ['in_transit'],
  in_transit: ['received'],
  received: ['closed'],
  rejected: [],
  closed: [],
}

// HR Payroll - 5 holat
export const HR_PAYROLL_TRANSITIONS: Record<string, string[]> = {
  draft: ['calculated'],
  calculated: ['approved', 'rejected'],
  approved: ['paid'],
  rejected: [],
  paid: [],
}

// Validation function
export function isTransitionAllowed(
  transitions: Record<string, string[]>,
  from: string,
  to: string
): boolean {
  return (transitions[from] ?? []).includes(to)
}

export interface TransitionLog {
  fromStatus: string
  toStatus: string
  timestamp: Date
  userId: number
  reason?: string
}
