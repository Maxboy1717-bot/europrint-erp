/**
 * @module orders.constants
 * @description Named-constant exports (business thresholds, enums, lookup tables).
 */


export const ORDER_STATUS_MACHINE: Record<string, string[]> = {
  draft: ['confirmed'],
  confirmed: ['pending_advance'],
  pending_advance: ['ready_for_planning'],
  ready_for_planning: ['in_production'],
  in_production: ['in_delivery'],
  in_delivery: ['delivered'],
  delivered: ['closed'],
  closed: [],
  cancelled: [],
};

export const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['confirmed', 'cancelled'],
  confirmed: ['pending_advance', 'cancelled', 'on_hold'],
  pending_advance: ['ready_for_planning', 'cancelled', 'on_hold'],
  ready_for_planning: ['in_production', 'cancelled', 'on_hold'],
  in_production: ['in_delivery', 'on_hold'],
  in_delivery: ['delivered'],
  delivered: ['closed'],
  closed: [],
  cancelled: [],
  on_hold: ['confirmed', 'cancelled'],
};
