export enum MovementTypeCode {
  EXTERNAL_IN         = 'EXTERNAL_IN',
  EXTERNAL_OUT        = 'EXTERNAL_OUT',
  INTERNAL_ISSUE      = 'INTERNAL_ISSUE',
  INTERNAL_RETURN     = 'INTERNAL_RETURN',
  DAMAGE              = 'DAMAGE',
  INTERNAL_TRANSFER   = 'INTERNAL_TRANSFER',
  INVENTORY_ADJ_PLUS  = 'INVENTORY_ADJ_PLUS',
  INVENTORY_ADJ_MINUS = 'INVENTORY_ADJ_MINUS',
}

export enum MovementStatus {
  DRAFT         = 'draft',
  QC_PENDING    = 'qc_pending',
  QC_APPROVED   = 'qc_approved',
  QC_REWORK     = 'qc_rework',
  QC_REJECTED   = 'qc_rejected',
  PENDING       = 'pending',
  APPROVED      = 'approved',
  AI_PROCESSING = 'ai_processing',
  COMPLETED     = 'completed',
  CANCELLED     = 'cancelled',
}

export enum QcDecision {
  APPROVED = 'APPROVED',
  REWORK   = 'REWORK',
  REJECTED = 'REJECTED',
}
