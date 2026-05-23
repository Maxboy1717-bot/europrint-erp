/**
 * @module sales-order-transitions.constants
 * @description State machine constants for SalesOrder aggregate (Rule 16 split).
 */

export const SO_VALID_STATUSES: readonly string[] = [
  'draft', 'pending_approval', 'approved', 'pending_advance',
  'ready_for_planning', 'in_planning', 'completed_planning',
  'ready_for_production', 'in_production', 'ready_for_shipment',
  'shipped', 'delivered', 'closed', 'cancelled', 'on_hold',
];

export const SO_VALID_TRANSITIONS: Record<string, string[]> = {
  draft:                ['pending_approval', 'cancelled'],
  pending_approval:     ['approved', 'rejected', 'cancelled'],
  approved:             ['pending_advance', 'on_hold', 'cancelled'],
  pending_advance:      ['ready_for_planning', 'on_hold', 'cancelled'],
  ready_for_planning:   ['in_planning', 'on_hold', 'cancelled'],
  in_planning:          ['completed_planning', 'on_hold', 'cancelled'],
  completed_planning:   ['ready_for_production', 'on_hold', 'cancelled'],
  ready_for_production: ['in_production', 'on_hold', 'cancelled'],
  in_production:        ['ready_for_shipment', 'on_hold', 'cancelled'],
  ready_for_shipment:   ['shipped', 'on_hold', 'cancelled'],
  shipped:              ['delivered', 'cancelled'],
  delivered:            ['closed', 'cancelled'],
  closed:               [],
  cancelled:            [],
  on_hold:              ['pending_approval', 'pending_advance', 'ready_for_planning', 'cancelled'],
};
