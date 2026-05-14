/**
 * @module design-status.enum
 * @description Source module. See exports for details.
 */

export enum DesignStatus {
  NEW = 'new',
  AI_GENERATED = 'ai_generated',
  DESIGNER_REVIEW = 'designer_review',
  WAITING_CUSTOMER_APPROVAL = 'waiting_customer_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REVISION_REQUESTED = 'revision_requested',
}
