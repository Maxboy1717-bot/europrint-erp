export const ERP_EVENTS = {
  // §10 - 20 ta majburiy trigger
  LEAD_ACCEPTED: 'crm.lead.accepted',
  DEAL_WON: 'crm.deal.won',
  SO_DESIGN_REQUESTED: 'sd.order.design_requested',
  SO_SAMPLE_REQUESTED: 'sd.order.sample_requested',
  DESIGN_AND_LAB_COMPLETED: 'sd.order.design_lab_completed',
  TECH_THREE_CHECKPOINT: 'pp.tech.three_checkpoint_passed',
  ADVANCE_APPROVED: 'fi.advance.approved',
  PP_RELEASED_TO_PRODUCTION: 'pp.order.released',
  WMS_GOODS_ISSUED: 'wms.goods.issued',
  MES_COMPLETED: 'mes.session.completed',
  QC_PASSED: 'qc.inspection.passed',
  WMS_FG_RECEIVED: 'wms.fg.received',
  DELIVERY_DISPATCHED: 'logistics.delivery.dispatched',
  DELIVERY_COMPLETED: 'logistics.delivery.completed',
  PAYMENT_CLOSED: 'fi.payment.closed',
  MES_TO_HR_360: 'mes.hr.360_recorded',
  LMS_CERT_EXPIRED: 'lms.certificate.expired',
  MRO_MAINTENANCE_STOP: 'mro.machine.stopped',
  SUPPLIER_QUALITY_FAIL: 'qc.supplier.failed',
  PAYMENT_FULL: 'fi.payment.full',

  // Qo'shimcha event'lar
  ORDER_CREATED: 'sd.order.created',
  ORDER_STATUS_CHANGED: 'sd.order.status_changed',
  INVOICE_CREATED: 'fi.invoice.created',
  QC_FAILED: 'qc.inspection.failed',
  STOCK_UPDATED: 'wms.stock.updated',
  USER_CREATED: 'auth.user.created',
  ROLE_CHANGED: 'auth.role.changed',
  MRO_MACHINE_STOPPED: 'mro.machine.stopped',
  MRO_MAINTENANCE_COMPLETED: 'mro.maintenance.completed',
  LOGISTICS_DELIVERY_COMPLETED: 'logistics.delivery.completed',
  HITL_APPROVAL_REQUESTED: 'hitl.request.requested',
  HITL_APPROVED: 'hitl.request.approved',
  HITL_REJECTED: 'hitl.request.rejected',

  // §10 Trigger 21/22 — Saytdan kelgan lead/buyurtma
  WEBSITE_ORDER_CREATED:    'ecommerce.website.order_created',
  WEBSITE_CONTACT_SUBMITTED: 'ecommerce.website.contact_submitted',

  // Trigger 5/6/9/17 qo'shimcha event'lari
  DESIGN_APPROVED:          'design.order.approved',
  LAB_TEST_PASSED:          'qc.lab.passed',
  WMS_GOODS_ISSUE:          'wms.goods.issue',
  LMS_CERT_EXPIRED_LIVE:    'lms.certificate.expired.live',
} as const

export type ErpEventKey = keyof typeof ERP_EVENTS
export type ErpEventValue = (typeof ERP_EVENTS)[ErpEventKey]

export interface ErpEventPayload {
  eventType: ErpEventValue
  orderId?: number
  leadId?: number
  dealId?: number
  userId: number
  timestamp: Date
  metadata?: Record<string, unknown>
}
