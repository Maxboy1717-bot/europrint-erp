/**
 * @module erp-events.constants (shim)
 * @description Re-exports the canonical ERP_EVENTS constant from
 *   @common/constants/erp-events.constants. The local copy previously here
 *   was an incomplete subset (6 keys vs 40+ in canon).
 *
 *   New code MUST import from @common/constants/erp-events.constants directly.
 */
export { ERP_EVENTS, ErpEventKey, ErpEventValue, ErpEventPayload } from '../common/constants/erp-events.constants';

/**
 * @deprecated Use ERP_EVENTS from @common/constants/erp-events.constants.
 * Kept for any stray callers that specifically import ErpEventNames.
 */
export const ErpEventNames = {
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_STATUS_CHANGED: 'ORDER_STATUS_CHANGED',
  HITL_APPROVAL_REQUESTED: 'HITL_APPROVAL_REQUESTED',
} as const;
