/**
 * @module test/mes/production-session.aggregate.spec
 * @description Unit tests for the ProductionSession aggregate — verifies the
 * READY → CHECKLIST_PENDING → RUNNING → PAUSED/COMPLETED → SENT_TO_QC
 * lifecycle and downtime accounting via Result pattern.
 */

import {
  ProductionSession,
  MesStatus,
  ChecklistStatus,
} from '../../src/modules/mes/domain/aggregates/production-session.aggregate';

function makeSession(): ProductionSession {
  return new ProductionSession(1, 10, 3, 77, false);
}

/** Checklist where every required item is completed → start allowed. */
const PASSING_CHECKLIST: ChecklistStatus = { requiredTotal: 3, requiredIncomplete: [] };

/** Advance a session through the gate using a passing checklist (test helper). */
function passOk(s: ProductionSession): void {
  s.passChecklist(PASSING_CHECKLIST);
}

describe('ProductionSession.constructor', () => {
  it('initialises status to READY when created', () => {
    const s = makeSession();
    expect(s.getStatus()).toBe(MesStatus.READY);
  });

  it('exposes id, operatorId and certificationRequired from constructor args', () => {
    const s = new ProductionSession(42, 99, 5, 7, true);
    expect(s.getId()).toBe(42);
    expect(s.getOperatorId()).toBe(7);
    expect(s.getCertificationRequired()).toBe(true);
  });

  it('initialises downtimes list as empty when created', () => {
    const s = makeSession();
    expect(s.getDowntimes()).toEqual([]);
    expect(s.getTotalDowntime()).toBe(0);
  });
});

describe('ProductionSession.passChecklist (TB-safety gate — Q-40)', () => {
  it('moves READY session to CHECKLIST_PENDING when all required items are completed', () => {
    const s = makeSession();
    const r = s.passChecklist({ requiredTotal: 3, requiredIncomplete: [] });
    expect(r.ok).toBe(true);
    expect(s.getStatus()).toBe(MesStatus.CHECKLIST_PENDING);
  });

  it('BLOCKS and does NOT advance status when a required item is incomplete', () => {
    const s = makeSession();
    const r = s.passChecklist({
      requiredTotal: 3,
      requiredIncomplete: ['Material skani', 'TB-xavfsizlik'],
    });
    expect(r.ok).toBe(false);
    // status NOT advanced — stays READY
    expect(s.getStatus()).toBe(MesStatus.READY);
    if (!r.ok) {
      expect(r.error.code).toBe('BUSINESS_RULE_VIOLATION');
      expect(r.error.message).toMatch(/BLOCKED/);
      // lists the missing items
      expect(r.error.message).toContain('Material skani');
      expect(r.error.message).toContain('TB-xavfsizlik');
      const details = r.error.details as { incomplete?: string[] } | undefined;
      expect(details?.incomplete).toEqual(['Material skani', 'TB-xavfsizlik']);
    }
  });

  it('BLOCKS (fail-safe) and stays READY when no required checklist is configured', () => {
    const s = makeSession();
    const r = s.passChecklist({ requiredTotal: 0, requiredIncomplete: [] });
    expect(r.ok).toBe(false);
    expect(s.getStatus()).toBe(MesStatus.READY);
    if (!r.ok) {
      expect(r.error.code).toBe('BUSINESS_RULE_VIOLATION');
      expect(r.error.message).toMatch(/BLOCKED/);
      const details = r.error.details as { reason?: string } | undefined;
      expect(details?.reason).toBe('NO_CHECKLIST_CONFIGURED');
    }
  });

  it('rejects passChecklist when session is not in READY status', () => {
    const s = makeSession();
    passOk(s);
    const r = s.passChecklist(PASSING_CHECKLIST);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.message).toMatch(/tayyor/);
    }
  });
});

describe('ProductionSession.start', () => {
  it('starts session when status is CHECKLIST_PENDING', () => {
    const s = makeSession();
    passOk(s);
    const r = s.start();
    expect(r.ok).toBe(true);
    expect(s.getStatus()).toBe(MesStatus.RUNNING);
  });

  it('rejects start when session is still in READY status', () => {
    const s = makeSession();
    const r = s.start();
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.message).toMatch(/tekshiruv/);
    }
  });

  it('rejects start when session is already RUNNING', () => {
    const s = makeSession();
    passOk(s);
    s.start();
    const r = s.start();
    expect(r.ok).toBe(false);
  });
});

describe('ProductionSession.pause', () => {
  it('pauses session when status is RUNNING', () => {
    const s = makeSession();
    passOk(s);
    s.start();
    const r = s.pause('Material yetishmasligi');
    expect(r.ok).toBe(true);
    expect(s.getStatus()).toBe(MesStatus.PAUSED);
  });

  it('rejects pause when session is not RUNNING', () => {
    const s = makeSession();
    const r = s.pause('any');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.message).toMatch(/ishchi/);
    }
  });

  it('rejects pause when session is already PAUSED', () => {
    const s = makeSession();
    passOk(s);
    s.start();
    s.pause('first');
    const r = s.pause('second');
    expect(r.ok).toBe(false);
  });
});

describe('ProductionSession.complete', () => {
  it('completes RUNNING session when complete is called', () => {
    const s = makeSession();
    passOk(s);
    s.start();
    const r = s.complete();
    expect(r.ok).toBe(true);
    expect(s.getStatus()).toBe(MesStatus.COMPLETED);
  });

  it('completes PAUSED session when complete is called', () => {
    const s = makeSession();
    passOk(s);
    s.start();
    s.pause('break');
    const r = s.complete();
    expect(r.ok).toBe(true);
    expect(s.getStatus()).toBe(MesStatus.COMPLETED);
  });

  it('rejects complete when session has never started', () => {
    const s = makeSession();
    const r = s.complete();
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.message).toMatch(/ish jarayonida/);
    }
  });

  it('rejects complete when session is already COMPLETED', () => {
    const s = makeSession();
    passOk(s);
    s.start();
    s.complete();
    const r = s.complete();
    expect(r.ok).toBe(false);
  });
});

describe('ProductionSession.recordDowntime', () => {
  it('appends downtime entry when reason and positive duration are provided', () => {
    const s = makeSession();
    const r = s.recordDowntime('Mashina nosozligi', 15);
    expect(r.ok).toBe(true);
    expect(s.getDowntimes()).toHaveLength(1);
    expect(s.getTotalDowntime()).toBe(15);
  });

  it('accumulates totalDowntimeDuration when called multiple times', () => {
    const s = makeSession();
    s.recordDowntime('reason-1', 10);
    s.recordDowntime('reason-2', 25);
    expect(s.getTotalDowntime()).toBe(35);
    expect(s.getDowntimes()).toHaveLength(2);
  });

  it('rejects downtime when reason is empty string', () => {
    const s = makeSession();
    const r = s.recordDowntime('', 10);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.message).toMatch(/Sabab/);
    }
  });

  it('rejects downtime when reason is only whitespace', () => {
    const s = makeSession();
    const r = s.recordDowntime('   ', 10);
    expect(r.ok).toBe(false);
  });

  it('rejects downtime when duration is zero or negative', () => {
    const s = makeSession();
    const zero = s.recordDowntime('valid reason', 0);
    const neg = s.recordDowntime('valid reason', -5);
    expect(zero.ok).toBe(false);
    expect(neg.ok).toBe(false);
    expect(s.getDowntimes()).toHaveLength(0);
  });
});

describe('ProductionSession.moveToQc', () => {
  it('moves COMPLETED session to SENT_TO_QC when moveToQc is called', () => {
    const s = makeSession();
    passOk(s);
    s.start();
    s.complete();
    const r = s.moveToQc();
    expect(r.ok).toBe(true);
    expect(s.getStatus()).toBe(MesStatus.SENT_TO_QC);
  });

  it('rejects moveToQc when session is not COMPLETED', () => {
    const s = makeSession();
    passOk(s);
    s.start();
    const r = s.moveToQc();
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.message).toMatch(/tugallangan/);
    }
  });

  it('rejects moveToQc when session is already SENT_TO_QC', () => {
    const s = makeSession();
    passOk(s);
    s.start();
    s.complete();
    s.moveToQc();
    const r = s.moveToQc();
    expect(r.ok).toBe(false);
  });
});
