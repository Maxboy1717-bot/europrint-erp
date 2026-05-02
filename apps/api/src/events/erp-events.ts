
export enum ErpEvents {
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED',
  HITL_APPROVAL_REQUESTED = 'HITL_APPROVAL_REQUESTED',
  HITL_APPROVED = 'HITL_APPROVED',
  HITL_REJECTED = 'HITL_REJECTED',
}
export class OrderCreatedEvent { constructor(public order: Record<string, unknown>) {} }
export class HitlApprovalRequestedEvent { constructor(public approval: Record<string, unknown>) {} }

export const ERP_EVENTS = {
  ORDER_CREATED: 'order.created',
  ORDER_ADVANCE_PAID: 'order.advance_paid',
  ORDER_STATUS_CHANGED: 'order.status_changed',
  BOM_APPROVED: 'bom.approved',
  PRODUCTION_ORDER_CREATED: 'production_order.created',
  PRODUCTION_ORDER_STATUS_CHANGED: 'production_order.status_changed',
  APPROVAL_REQUESTED: 'approval.requested',
  APPROVAL_APPROVED: 'approval.approved',
  APPROVAL_REJECTED: 'approval.rejected',
};
