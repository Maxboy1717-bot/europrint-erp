/**
 * work-center.aggregate.spec.ts — PP WorkCenter aggregate tests.
 *
 * WorkCenter is a data-class aggregate (no behaviour methods). Tests verify
 * constructor assigns all fields verbatim across every WorkCenterType variant
 * and that read-only invariants hold.
 */

import {
  WorkCenter,
  WorkCenterType,
} from '../../src/modules/pp/domain/aggregates/work-center.aggregate';

function makeWorkCenter(overrides: Partial<{
  id: string;
  code: string;
  name: string;
  type: WorkCenterType;
  capacity: number;
  costPerHour: number;
  certificationLmsCourseId: string | null;
  department: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}> = {}): WorkCenter {
  const defaults = {
    id: 'wc-1',
    code: 'LINE-01',
    name: 'Asosiy chiziq',
    type: WorkCenterType.LINE,
    capacity: 1000,
    costPerHour: 50000,
    certificationLmsCourseId: null as string | null,
    department: 'Production' as string | null,
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
  };
  const props = { ...defaults, ...overrides };
  return new WorkCenter(
    props.id,
    props.code,
    props.name,
    props.type,
    props.capacity,
    props.costPerHour,
    props.certificationLmsCourseId,
    props.department,
    props.isActive,
    props.createdAt,
    props.updatedAt,
  );
}

describe('WorkCenter aggregate', () => {
  it('exposes id and code when constructed with valid params', () => {
    const wc = makeWorkCenter({ id: 'abc', code: 'LINE-99' });
    expect(wc.id).toBe('abc');
    expect(wc.code).toBe('LINE-99');
  });

  it('exposes name and department when constructed', () => {
    const wc = makeWorkCenter({ name: 'Bo\'yash sexi', department: 'QC' });
    expect(wc.name).toBe('Bo\'yash sexi');
    expect(wc.department).toBe('QC');
  });

  it('stores LINE type when constructed with line variant', () => {
    const wc = makeWorkCenter({ type: WorkCenterType.LINE });
    expect(wc.type).toBe(WorkCenterType.LINE);
    expect(wc.type).toBe('line');
  });

  it('stores MACHINE type when constructed with machine variant', () => {
    const wc = makeWorkCenter({ type: WorkCenterType.MACHINE });
    expect(wc.type).toBe(WorkCenterType.MACHINE);
    expect(wc.type).toBe('machine');
  });

  it('stores WORKSHOP type when constructed with workshop variant', () => {
    const wc = makeWorkCenter({ type: WorkCenterType.WORKSHOP });
    expect(wc.type).toBe(WorkCenterType.WORKSHOP);
  });

  it('stores MANUAL type when constructed with manual variant', () => {
    const wc = makeWorkCenter({ type: WorkCenterType.MANUAL });
    expect(wc.type).toBe(WorkCenterType.MANUAL);
  });

  it('stores numeric capacity and costPerHour when constructed', () => {
    const wc = makeWorkCenter({ capacity: 250, costPerHour: 100000 });
    expect(wc.capacity).toBe(250);
    expect(wc.costPerHour).toBe(100000);
  });

  it('stores null certificationLmsCourseId when omitted', () => {
    const wc = makeWorkCenter({ certificationLmsCourseId: null });
    expect(wc.certificationLmsCourseId).toBeNull();
  });

  it('stores explicit certificationLmsCourseId when provided', () => {
    const wc = makeWorkCenter({ certificationLmsCourseId: 'course-42' });
    expect(wc.certificationLmsCourseId).toBe('course-42');
  });

  it('stores isActive=false when constructed as inactive', () => {
    const wc = makeWorkCenter({ isActive: false });
    expect(wc.isActive).toBe(false);
  });

  it('preserves createdAt timestamp when constructed', () => {
    const created = new Date('2025-12-31T23:59:59Z');
    const wc = makeWorkCenter({ createdAt: created });
    expect(wc.createdAt).toBe(created);
  });

  it('allows mutation of updatedAt when reassigned', () => {
    const wc = makeWorkCenter();
    const newTime = new Date('2026-06-01');
    wc.updatedAt = newTime;
    expect(wc.updatedAt).toBe(newTime);
  });
});
