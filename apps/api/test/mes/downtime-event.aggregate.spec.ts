/**
 * @module test/mes/downtime-event.aggregate.spec
 * @description Unit tests for the DowntimeEvent value object — verifies field
 * preservation, the `isOngoing` derivation and the reason-code catalogue.
 */

import {
  DowntimeEvent,
  DOWNTIME_REASON_CODES,
} from '../../src/modules/mes/domain/aggregates/downtime-event.aggregate';

function makeEvent(overrides: Partial<{
  id: string;
  sessionId: string;
  workCenterId: string | null;
  eventType: string;
  reasonCode: string;
  startedAt: Date;
  endedAt: Date | null;
  durationMinutes: number | null;
  reportedBy: string;
  notes: string | null;
  createdAt: Date;
}> = {}): DowntimeEvent {
  const base = {
    id: 'DT-1',
    sessionId: 'SES-100',
    workCenterId: 'WC-1',
    eventType: 'unplanned',
    reasonCode: 'BREAK',
    startedAt: new Date('2026-05-01T08:00:00Z'),
    endedAt: null as Date | null,
    durationMinutes: null as number | null,
    reportedBy: 'op-7',
    notes: null as string | null,
    createdAt: new Date('2026-05-01T08:00:00Z'),
  };
  const m = { ...base, ...overrides };
  return new DowntimeEvent(
    m.id,
    m.sessionId,
    m.workCenterId,
    m.eventType,
    m.reasonCode,
    m.startedAt,
    m.endedAt,
    m.durationMinutes,
    m.reportedBy,
    m.notes,
    m.createdAt,
  );
}

describe('DowntimeEvent.constructor', () => {
  it('preserves every constructor argument when assembled', () => {
    const started = new Date('2026-05-01T10:00:00Z');
    const ended = new Date('2026-05-01T10:45:00Z');
    const createdAt = new Date('2026-05-01T11:00:00Z');
    const ev = makeEvent({
      id: 'DT-2',
      sessionId: 'SES-9',
      workCenterId: 'WC-7',
      eventType: 'planned',
      reasonCode: 'MAINT',
      startedAt: started,
      endedAt: ended,
      durationMinutes: 45,
      reportedBy: 'supervisor-3',
      notes: 'Profilaktik',
      createdAt,
    });
    expect(ev.id).toBe('DT-2');
    expect(ev.sessionId).toBe('SES-9');
    expect(ev.workCenterId).toBe('WC-7');
    expect(ev.eventType).toBe('planned');
    expect(ev.reasonCode).toBe('MAINT');
    expect(ev.startedAt).toBe(started);
    expect(ev.endedAt).toBe(ended);
    expect(ev.durationMinutes).toBe(45);
    expect(ev.reportedBy).toBe('supervisor-3');
    expect(ev.notes).toBe('Profilaktik');
    expect(ev.createdAt).toBe(createdAt);
  });

  it('accepts null workCenterId when no work centre is bound', () => {
    const ev = makeEvent({ workCenterId: null });
    expect(ev.workCenterId).toBeNull();
  });

  it('accepts null notes and null duration when not yet known', () => {
    const ev = makeEvent({ notes: null, durationMinutes: null });
    expect(ev.notes).toBeNull();
    expect(ev.durationMinutes).toBeNull();
  });
});

describe('DowntimeEvent.isOngoing', () => {
  it('returns true when endedAt is null', () => {
    const ev = makeEvent({ endedAt: null });
    expect(ev.isOngoing).toBe(true);
  });

  it('returns false when endedAt is a Date', () => {
    const ev = makeEvent({ endedAt: new Date('2026-05-01T08:30:00Z') });
    expect(ev.isOngoing).toBe(false);
  });

  it('returns false when endedAt is a future Date even before duration is known', () => {
    const ev = makeEvent({ endedAt: new Date('2099-01-01'), durationMinutes: null });
    expect(ev.isOngoing).toBe(false);
  });
});

describe('DOWNTIME_REASON_CODES catalogue', () => {
  it('exposes a non-empty list of reason codes when imported', () => {
    expect(Array.isArray(DOWNTIME_REASON_CODES)).toBe(true);
    expect(DOWNTIME_REASON_CODES.length).toBeGreaterThan(0);
  });

  it('contains the canonical MAINT, BREAK, MATERIAL and OTHER codes', () => {
    const codes = DOWNTIME_REASON_CODES.map((r) => r.code);
    expect(codes).toEqual(expect.arrayContaining(['MAINT', 'BREAK', 'MATERIAL', 'OTHER']));
  });

  it('provides a human-readable Uzbek name for each code', () => {
    for (const r of DOWNTIME_REASON_CODES) {
      expect(typeof r.code).toBe('string');
      expect(r.code.length).toBeGreaterThan(0);
      expect(typeof r.name).toBe('string');
      expect(r.name.length).toBeGreaterThan(0);
    }
  });

  it('uses unique codes throughout the catalogue', () => {
    const codes = DOWNTIME_REASON_CODES.map((r) => r.code);
    const unique = Array.from(new Set(codes));
    expect(unique.length).toBe(codes.length);
  });

  it('contains exactly eight reason codes when imported', () => {
    expect(DOWNTIME_REASON_CODES.length).toBe(8);
  });
});

describe('DowntimeEvent fields after closure', () => {
  it('records the duration in minutes when closed', () => {
    const ev = makeEvent({
      endedAt: new Date('2026-05-01T08:45:00Z'),
      durationMinutes: 45,
    });
    expect(ev.isOngoing).toBe(false);
    expect(ev.durationMinutes).toBe(45);
  });

  it('keeps reportedBy immutable after construction', () => {
    const ev = makeEvent({ reportedBy: 'op-11' });
    // readonly: TS would block reassignment, so we only assert the value sticks.
    expect(ev.reportedBy).toBe('op-11');
  });
});
