/**
 * @module common/events/erp-events.constants (shim)
 * @description Re-exports the canonical ERP_EVENTS from
 * `@common/constants/erp-events.constants`. This file had an incomplete subset
 * of 9 keys and had zero import sites. Canonical has 40+ keys.
 *
 * DO NOT add new constants here — use @common/constants/erp-events.constants.
 */
export {
  ERP_EVENTS,
  type ErpEventKey,
  type ErpEventValue,
  type ErpEventPayload,
} from '../constants/erp-events.constants';
