/**
 * deal-status.vo.spec.ts — DealStatus value object tests.
 *
 * Validates the 5 allowed values, error paths, and equality.
 */

import { DealStatus, DealStatusType } from '../../src/modules/crm/domain/value-objects/deal-status.vo';
import { dealFactory } from '../_fixtures/factories';

const VALID: DealStatusType[] = ['qualification', 'proposal', 'negotiation', 'won', 'lost'];

describe('DealStatus value object', () => {
  it.each(VALID)('returns Ok when input is the valid status %s', (status) => {
    const r = DealStatus.create(status);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.getValue()).toBe(status);
  });

  it('returns Err with descriptive message when input is unknown string', () => {
    const r = DealStatus.create('bogus');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.message).toMatch(/Invalid deal status/);
  });

  it('returns Err when input is empty string', () => {
    const r = DealStatus.create('');
    expect(r.ok).toBe(false);
  });

  it('rejects lead-status values such as new when fed to DealStatus.create', () => {
    const r = DealStatus.create('new');
    expect(r.ok).toBe(false);
  });

  it('returns true from equals when two instances share the same value', () => {
    const a = DealStatus.create('won');
    const b = DealStatus.create('won');
    if (!a.ok || !b.ok) throw new Error('expected ok');
    expect(a.data.equals(b.data)).toBe(true);
  });

  it('returns false from equals when values differ', () => {
    const a = DealStatus.create('won');
    const b = DealStatus.create('lost');
    if (!a.ok || !b.ok) throw new Error('expected ok');
    expect(a.data.equals(b.data)).toBe(false);
  });

  it('accepts factory-generated deal status when fed into create', () => {
    const deal = dealFactory({ status: 'negotiation' });
    const r = DealStatus.create(deal.status);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.getValue()).toBe('negotiation');
  });

  it('returns the typed value when getValue is called', () => {
    const r = DealStatus.create('proposal');
    if (!r.ok) throw new Error('expected ok');
    const v: DealStatusType = r.data.getValue();
    expect(v).toBe('proposal');
  });
});
