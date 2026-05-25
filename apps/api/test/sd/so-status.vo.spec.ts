/**
 * so-status.vo.spec.ts — SoStatus (sales order status) value object tests.
 *
 * Validates the 15 allowed statuses, error paths, and equality semantics.
 */

import { SoStatus, SoStatusType } from '../../src/modules/sd/domain/value-objects/so-status.vo';
import { salesOrderFactory } from '../_fixtures/factories';

const VALID: SoStatusType[] = [
  'draft', 'pending_approval', 'approved', 'pending_advance',
  'ready_for_planning', 'in_planning', 'completed_planning',
  'ready_for_production', 'in_production', 'ready_for_shipment',
  'shipped', 'delivered', 'closed', 'cancelled', 'on_hold',
];

describe('SoStatus value object', () => {
  it.each(VALID)('returns Ok when input is the valid status %s', (status) => {
    const r = SoStatus.create(status);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.getValue()).toBe(status);
  });

  it('returns Err with descriptive message when input is unknown string', () => {
    const r = SoStatus.create('invalid_so');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.message).toMatch(/Invalid SO status/);
  });

  it('returns Err when input is empty string', () => {
    const r = SoStatus.create('');
    expect(r.ok).toBe(false);
  });

  it('rejects deal-status value won when fed to SoStatus.create', () => {
    const r = SoStatus.create('won');
    expect(r.ok).toBe(false);
  });

  it('returns true from equals when two instances share the same value', () => {
    const a = SoStatus.create('in_production');
    const b = SoStatus.create('in_production');
    if (!a.ok || !b.ok) throw new Error('expected ok');
    expect(a.data.equals(b.data)).toBe(true);
  });

  it('returns false from equals when values differ', () => {
    const a = SoStatus.create('draft');
    const b = SoStatus.create('approved');
    if (!a.ok || !b.ok) throw new Error('expected ok');
    expect(a.data.equals(b.data)).toBe(false);
  });

  it('accepts factory-generated SO status when fed into create', () => {
    const so = salesOrderFactory({ status: 'shipped' });
    const r = SoStatus.create(so.status);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.getValue()).toBe('shipped');
  });

  it('returns the typed value when getValue is called', () => {
    const r = SoStatus.create('closed');
    if (!r.ok) throw new Error('expected ok');
    const v: SoStatusType = r.data.getValue();
    expect(v).toBe('closed');
  });
});
