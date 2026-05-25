/**
 * @module delivery-status.enum
 * @description Source module. See exports for details.
 */

export enum DeliveryStatus {
  PENDING = 'pending',
  DISPATCHED = 'dispatched',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  ASSIGNED = 'assigned',
}
