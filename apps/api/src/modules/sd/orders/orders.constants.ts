
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
  confirmed: ['pending_advance', 'cancelled'],
  pending_advance: ['ready_for_planning', 'cancelled'],
  ready_for_planning: ['in_production', 'cancelled'],
  in_production: ['in_delivery'],
  in_delivery: ['delivered'],
  delivered: ['closed'],
  closed: [],
  cancelled: [],
};
