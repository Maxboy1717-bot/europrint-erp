/**
 * @module status-machines.constants
 * @description Named-constant exports (business thresholds, enums, lookup tables).
 */

export const STATUS_MACHINES: Record<string, Record<string, string[]>> = {
  sd_order: {
    draft: ['confirmed'],
    confirmed: ['pending_advance'],
    pending_advance: ['ready_for_planning'],
    ready_for_planning: ['in_production'],
    in_production: ['in_delivery'],
    in_delivery: ['delivered'],
    delivered: ['closed'],
    closed: [],
    cancelled: [],
  },
  wms_movement: {
    draft: ['pending'],
    pending: ['in_transit'],
    in_transit: ['received'],
    received: [],
  },
  logistics_delivery: {
    planned: ['in_transit'],
    in_transit: ['delivered', 'failed', 'cancelled'],
    delivered: [],
    failed: [],
    cancelled: [],
  },
  mes_work_order: {
    created: ['released'],
    released: ['in_progress'],
    in_progress: ['completed', 'paused'],
    paused: ['in_progress'],
    completed: [],
  },
  sd_delivery: {
    PICKING: ['PACKING'],
    PACKING: ['GOODS_ISSUE'],
    GOODS_ISSUE: ['COMPLETED'],
    COMPLETED: [],
  },
  finance_payroll: {
    open: ['processing'],
    processing: ['closed'],
    closed: [],
  },
  pos_movement: {
    draft: ['pending'],
    pending: ['approved'],
    approved: ['completed'],
    completed: [],
  },
};

export function isTransitionAllowed(
  machineOrTransitions: string | Record<string, string[]>,
  currentStatus: string,
  newStatus: string,
): boolean {
  const transitions = typeof machineOrTransitions === 'string'
    ? (STATUS_MACHINES[machineOrTransitions]?.[currentStatus] || [])
    : (machineOrTransitions[currentStatus] || []);
  return transitions.includes(newStatus);
}
