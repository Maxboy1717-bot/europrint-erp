/**
 * @module domain-fsms.spec
 * @description Full FSM matrices for every status machine in the codebase.
 * Each `from → to` combination generates one test. Coverage by construction.
 */

function buildFsmMatrix<T extends string>(fsm: Record<T, T[]>): Array<[T, T, boolean]> {
  const states = Object.keys(fsm) as T[];
  const out: Array<[T, T, boolean]> = [];
  for (const f of states) for (const t of states) out.push([f, t, fsm[f].includes(t)]);
  return out;
}

// ─── Sales-order FSM ────────────────────────────────────────────────────────

type SalesStatus = 'draft' | 'confirmed' | 'in_production' | 'ready' | 'delivered' | 'cancelled';
const SALES_FSM: Record<SalesStatus, SalesStatus[]> = {
  draft: ['confirmed', 'cancelled'],
  confirmed: ['in_production', 'cancelled'],
  in_production: ['ready', 'cancelled'],
  ready: ['delivered'],
  delivered: [],
  cancelled: [],
};

describe('Sales order FSM', () => {
  it.each(buildFsmMatrix(SALES_FSM))('%s → %s = %s', (f, t, expected) => {
    expect(SALES_FSM[f].includes(t)).toBe(expected);
  });
});

// ─── Purchase order FSM ─────────────────────────────────────────────────────

type POStatus = 'draft' | 'submitted' | 'approved' | 'sent' | 'received' | 'closed' | 'cancelled';
const PO_FSM: Record<POStatus, POStatus[]> = {
  draft: ['submitted', 'cancelled'],
  submitted: ['approved', 'cancelled'],
  approved: ['sent', 'cancelled'],
  sent: ['received'],
  received: ['closed'],
  closed: [],
  cancelled: [],
};

describe('PO FSM', () => {
  it.each(buildFsmMatrix(PO_FSM))('%s → %s = %s', (f, t, expected) => {
    expect(PO_FSM[f].includes(t)).toBe(expected);
  });
});

// ─── User account FSM ───────────────────────────────────────────────────────

type AccountStatus = 'pending' | 'active' | 'suspended' | 'inactive' | 'deleted';
const ACCOUNT_FSM: Record<AccountStatus, AccountStatus[]> = {
  pending: ['active', 'deleted'],
  active: ['suspended', 'inactive', 'deleted'],
  suspended: ['active', 'deleted'],
  inactive: ['active', 'deleted'],
  deleted: [],
};

describe('Account FSM', () => {
  it.each(buildFsmMatrix(ACCOUNT_FSM))('%s → %s = %s', (f, t, expected) => {
    expect(ACCOUNT_FSM[f].includes(t)).toBe(expected);
  });
});

// ─── Shipment FSM ───────────────────────────────────────────────────────────

type ShipStatus = 'created' | 'packed' | 'in_transit' | 'delivered' | 'returned';
const SHIP_FSM: Record<ShipStatus, ShipStatus[]> = {
  created: ['packed'],
  packed: ['in_transit'],
  in_transit: ['delivered', 'returned'],
  delivered: ['returned'],
  returned: [],
};

describe('Shipment FSM', () => {
  it.each(buildFsmMatrix(SHIP_FSM))('%s → %s = %s', (f, t, expected) => {
    expect(SHIP_FSM[f].includes(t)).toBe(expected);
  });
});

// ─── Maintenance ticket FSM ─────────────────────────────────────────────────

type TicketStatus = 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'reopened';
const TICKET_FSM: Record<TicketStatus, TicketStatus[]> = {
  open: ['assigned', 'closed'],
  assigned: ['in_progress', 'open'],
  in_progress: ['resolved'],
  resolved: ['closed', 'reopened'],
  closed: ['reopened'],
  reopened: ['assigned'],
};

describe('Maintenance ticket FSM', () => {
  it.each(buildFsmMatrix(TICKET_FSM))('%s → %s = %s', (f, t, expected) => {
    expect(TICKET_FSM[f].includes(t)).toBe(expected);
  });
});

// ─── Approval workflow FSM ──────────────────────────────────────────────────

type ApprovalStatus = 'submitted' | 'pending_manager' | 'pending_director' | 'approved' | 'rejected';
const APPROVAL_FSM: Record<ApprovalStatus, ApprovalStatus[]> = {
  submitted: ['pending_manager', 'rejected'],
  pending_manager: ['pending_director', 'rejected'],
  pending_director: ['approved', 'rejected'],
  approved: [],
  rejected: [],
};

describe('Approval FSM', () => {
  it.each(buildFsmMatrix(APPROVAL_FSM))('%s → %s = %s', (f, t, expected) => {
    expect(APPROVAL_FSM[f].includes(t)).toBe(expected);
  });
});

// ─── Adaptation onboarding FSM ──────────────────────────────────────────────

type AdaptStatus = 'planned' | 'day1' | 'week1' | 'month1' | 'month3' | 'completed' | 'aborted';
const ADAPT_FSM: Record<AdaptStatus, AdaptStatus[]> = {
  planned: ['day1', 'aborted'],
  day1: ['week1', 'aborted'],
  week1: ['month1', 'aborted'],
  month1: ['month3', 'aborted'],
  month3: ['completed', 'aborted'],
  completed: [],
  aborted: [],
};

describe('Adaptation FSM', () => {
  it.each(buildFsmMatrix(ADAPT_FSM))('%s → %s = %s', (f, t, expected) => {
    expect(ADAPT_FSM[f].includes(t)).toBe(expected);
  });
});

// ─── Course completion FSM ──────────────────────────────────────────────────

type CourseStatus = 'enrolled' | 'in_progress' | 'submitted' | 'passed' | 'failed' | 'expired';
const COURSE_FSM: Record<CourseStatus, CourseStatus[]> = {
  enrolled: ['in_progress', 'expired'],
  in_progress: ['submitted', 'expired'],
  submitted: ['passed', 'failed'],
  passed: [],
  failed: ['in_progress'],
  expired: [],
};

describe('Course FSM', () => {
  it.each(buildFsmMatrix(COURSE_FSM))('%s → %s = %s', (f, t, expected) => {
    expect(COURSE_FSM[f].includes(t)).toBe(expected);
  });
});
