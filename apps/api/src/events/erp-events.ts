/**
 * @module erp-events (shim — do NOT add new code here)
 * @description Back-compat re-export shim. This file previously defined weak
 *   local copies of domain event classes. Those classes are now replaced by
 *   canonical imports so existing relative-path callers continue to compile.
 *
 *   Canonical sources:
 *     - OrderCreatedEvent          → @modules/sd/domain/events/order-created.event
 *     - HitlApprovalRequestedEvent → @modules/director/domain/events/hitl-approval-requested.event
 *     - ERP_EVENTS constant        → @common/constants/erp-events.constants
 *
 *   New code MUST import directly from the canonical paths above.
 *   Do NOT add new exports here.
 */

export { OrderCreatedEvent } from '../modules/sd/domain/events/order-created.event';
export { HitlApprovalRequestedEvent } from '../modules/director/domain/events/hitl-approval-requested.event';
export { ERP_EVENTS } from '../common/constants/erp-events.constants';

/**
 * @deprecated Use ERP_EVENTS from @common/constants/erp-events.constants instead.
 * Kept only as a named re-export so stray `import { ErpEvents }` callers compile.
 */
export enum ErpEvents {
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED',
  HITL_APPROVAL_REQUESTED = 'HITL_APPROVAL_REQUESTED',
  HITL_APPROVED = 'HITL_APPROVED',
  HITL_REJECTED = 'HITL_REJECTED',
}
