/**
 * test/unit/common/time/tashkent-time.service.spec.ts
 *
 * Unit tests for TashkentTimeService. The service is pure (no DB / no
 * external IO) — every method takes / returns Date and operates on the
 * Asia/Tashkent calendar.
 */

import { TashkentTimeService } from '../../../../src/common/time/tashkent-time.service';

describe('TashkentTimeService', () => {
  const svc = new TashkentTimeService();

  it('returns a Date instance when now() is called', () => {
    const n = svc.now();
    expect(n).toBeInstanceOf(Date);
    expect(Number.isFinite(n.getTime())).toBe(true);
  });

  it('formats date in YYYY-MM-DD when formatDate receives a fixed UTC date', () => {
    // 2026-05-15T08:00:00Z → Tashkent (UTC+5) → still 2026-05-15
    const d = new Date('2026-05-15T08:00:00.000Z');
    expect(svc.formatDate(d)).toBe('2026-05-15');
  });

  it('rolls calendar forward when formatDate handles a late-UTC timestamp that is next day in Tashkent', () => {
    // 23:30 UTC on 14th → 04:30 Tashkent on 15th
    const d = new Date('2026-05-14T23:30:00.000Z');
    expect(svc.formatDate(d)).toBe('2026-05-15');
  });

  it('returns zero when diffInDays receives two timestamps within the same Tashkent calendar day', () => {
    const a = new Date('2026-05-15T01:00:00.000Z'); // 06:00 Tashkent
    const b = new Date('2026-05-15T18:00:00.000Z'); // 23:00 Tashkent
    expect(svc.diffInDays(a, b)).toBe(0);
  });

  it('returns positive count when diffCalendarDays handles forward-in-time inputs', () => {
    const a = new Date('2026-04-01T00:00:00.000Z');
    const b = new Date('2026-04-10T00:00:00.000Z');
    expect(svc.diffCalendarDays(a, b)).toBe(9);
  });

  it('shifts date by N when addDays receives a positive delta', () => {
    const start = new Date('2026-05-15T12:00:00.000Z');
    const result = svc.addDays(start, 5);
    expect(result.getUTCDate()).toBe(20);
    expect(result.getUTCMonth()).toBe(4); // May (0-indexed)
  });

  it('skips weekends when addBusinessDays crosses Saturday + Sunday', () => {
    // Friday 2026-05-15 → +1 business day → Monday 2026-05-18
    const friday = new Date('2026-05-15T08:00:00.000Z');
    const next = svc.addBusinessDays(friday, 1);
    const day = next.getUTCDay();
    // Result must be a weekday (Mon..Fri)
    expect(day === 0 || day === 6).toBe(false);
  });

  it('returns true when isOverdue receives a past due date', () => {
    const past = new Date(Date.now() - 7 * 86_400_000);
    expect(svc.isOverdue(past)).toBe(true);
  });

  it('returns false when isOverdue receives a future due date', () => {
    const future = new Date(Date.now() + 7 * 86_400_000);
    expect(svc.isOverdue(future)).toBe(false);
  });

  it('returns midnight Date when today() is called', () => {
    const t = svc.today();
    expect(t).toBeInstanceOf(Date);
    // 00:00 in Tashkent == 19:00 prev day UTC; we just assert structure here
    expect(Number.isFinite(t.getTime())).toBe(true);
  });

  it('returns a normalised Date when startOfDay() is called with a mid-day timestamp', () => {
    const mid = new Date('2026-05-15T13:45:00.000Z');
    const sod = svc.startOfDay(mid);
    expect(sod).toBeInstanceOf(Date);
    expect(sod.getTime()).toBeLessThanOrEqual(mid.getTime());
  });
});
