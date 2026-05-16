/**
 * @module pos-movement-status.constants
 * @description Status transition table + enum mappings extracted from
 *   pos-movement-status.service.ts to keep the service file <300 lines (Rule 16).
 */

import { movementConfirmations } from '@workspace/db';
import { QcDecision, MovementStatus } from '../../dto/movement.dto';

export type ConfirmStep     = typeof movementConfirmations.$inferInsert['step'];
export type ConfirmDecision = typeof movementConfirmations.$inferInsert['decision'];

export const VALID_TRANSITIONS: Record<string, string[]> = {
  draft:        ['karantin', 'qc_pending', 'pending', 'cancelled'],
  karantin:     ['qc_pending', 'cancelled'],
  qc_pending:   ['qc_approved', 'qc_rework', 'qc_rejected'],
  qc_approved:  ['pending', 'cancelled'],
  qc_rework:    ['qc_pending'],
  qc_rejected:  ['cancelled'],
  pending:      ['approved', 'cancelled'],
  approved:     ['ai_processing', 'completed'],
  ai_processing:['completed', 'cancelled'],
  completed:    [],
  cancelled:    [],
};

export function isTransitionAllowed(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Map movement status to pos_confirm_step_enum value */
export function statusToConfirmStep(status: string): ConfirmStep | null {
  const map: Record<string, ConfirmStep> = {
    qc_approved:    'QC',
    qc_rejected:    'QC',
    qc_rework:      'QC',
    approved:       'OMBOR',
    ai_processing:  'AI_GL',
    completed:      'FINANCE',
  };
  return map[status] ?? null;
}

/** Map movement status or decision to pos_confirm_decision_enum value */
export function statusToConfirmDecision(status: string): ConfirmDecision {
  if (status === 'qc_rejected' || status === 'cancelled') return 'REJECTED';
  if (status === 'qc_rework') return 'REWORK';
  return 'APPROVED';
}

export const STATUS_NOTIF_MAP: Record<string, { type: string; title: string; bodyFmt: (movNum: string, reason?: string) => string }> = {
  pending: {
    type: 'MOVEMENT_SUBMITTED',
    title: 'Harakat yuborildi',
    bodyFmt: (n) => `Harakat ${n} tasdiqlash uchun yuborildi`,
  },
  qc_pending: {
    type: 'MOVEMENT_QC_PENDING',
    title: 'QC tekshiruvi kutilmoqda',
    bodyFmt: (n) => `Harakat ${n} sifat nazoratiga yuborildi`,
  },
  qc_approved: {
    type: 'MOVEMENT_QC_PASSED',
    title: "QC tekshiruvi o'tdi",
    bodyFmt: (n) => `Harakat ${n} sifat nazoratidan otdi`,
  },
  qc_rework: {
    type: 'MOVEMENT_QC_REWORK',
    title: 'QC qayta ishlash',
    bodyFmt: (n, r) => `Harakat ${n} qayta ishlash uchun qaytarildi${r ? `: ${r}` : ''}`,
  },
  qc_rejected: {
    type: 'MOVEMENT_QC_REJECTED',
    title: 'QC rad etildi',
    bodyFmt: (n, r) => `Harakat ${n} sifat nazoratidan rad etildi${r ? `: ${r}` : ''}`,
  },
  approved: {
    type: 'MOVEMENT_APPROVED',
    title: 'Harakat tasdiqlandi',
    bodyFmt: (n) => `Harakat ${n} ombor mudiri tomonidan tasdiqlandi`,
  },
  ai_processing: {
    type: 'MOVEMENT_AI_PROCESSING',
    title: 'AI qayta ishlash',
    bodyFmt: (n) => `Harakat ${n} AI tomonidan qayta ishlanmoqda`,
  },
  completed: {
    type: 'MOVEMENT_COMPLETED',
    title: 'Harakat yakunlandi',
    bodyFmt: (n) => `Harakat ${n} muvaffaqiyatli yakunlandi`,
  },
  cancelled: {
    type: 'MOVEMENT_CANCELLED',
    title: 'Harakat bekor qilindi',
    bodyFmt: (n, r) => `Harakat ${n} bekor qilindi${r ? `: ${r}` : ''}`,
  },
};

export const QC_STATUS_MAP: Record<QcDecision, MovementStatus> = {
  [QcDecision.APPROVED]: MovementStatus.QC_APPROVED,
  [QcDecision.REWORK]:   MovementStatus.QC_REWORK,
  [QcDecision.REJECTED]: MovementStatus.QC_REJECTED,
};

export const QC_DECISION_MAP: Record<QcDecision, ConfirmDecision> = {
  [QcDecision.APPROVED]: 'APPROVED',
  [QcDecision.REWORK]:   'REWORK',
  [QcDecision.REJECTED]: 'REJECTED',
};

export const QC_TITLE_MAP: Record<QcDecision, string> = {
  [QcDecision.APPROVED]: 'QC tasdiqladi',
  [QcDecision.REWORK]:   'QC qayta ishlash',
  [QcDecision.REJECTED]: 'QC rad etdi',
};

export const QC_TYPE_MAP: Record<QcDecision, string> = {
  [QcDecision.APPROVED]: 'QC_APPROVED',
  [QcDecision.REWORK]:   'QC_REWORK',
  [QcDecision.REJECTED]: 'QC_REJECTED',
};

export const DIRECTION_MAP: Record<string, 'in' | 'out' | 'transfer'> = {
  EXTERNAL_IN:          'in',
  INTERNAL_RETURN:      'in',
  INVENTORY_ADJ_PLUS:   'in',
  EXTERNAL_OUT:         'out',
  INTERNAL_ISSUE:       'out',
  DAMAGE:               'out',
  INVENTORY_ADJ_MINUS:  'out',
  INTERNAL_TRANSFER:    'transfer',
};
