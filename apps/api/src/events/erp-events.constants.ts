/**
 * @module erp-events.constants
 * @description Named-constant exports (business thresholds, enums, lookup tables).
 */


export const ErpEventNames = {
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_STATUS_CHANGED: 'ORDER_STATUS_CHANGED',
  HITL_APPROVAL_REQUESTED: 'HITL_APPROVAL_REQUESTED',
};

export const ERP_EVENTS = {
  ORDER_CREATED: 'order.created',
  ORDER_ADVANCE_PAID: 'order.advance_paid',
  ORDER_STATUS_CHANGED: 'order.status_changed',
  BOM_APPROVED: 'bom.approved',
  PRODUCTION_ORDER_CREATED: 'production_order.created',
  PRODUCTION_ORDER_STATUS_CHANGED: 'production_order.status_changed',
};
