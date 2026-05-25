/**
 * lead-status.vo.spec.ts — LeadStatus value object tests.
 *
 * Validates accepted enum members, error path on unknown values, and equality.
 */

import { LeadStatus, LeadStatusType } from '../../src/modules/crm/domain/value-objects/lead-status.vo';
import { leadFactory } from '../_fixtures/factories';

const VALID: LeadStatusType[] = [
  'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'lost',
];

describe('LeadStatus value object', () => {
  it.each(VALID)('returns Ok when input is the valid status %s', (status) => {
    const r = LeadStatus.create(status);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.getValue()).toBe(status);
  });

  it('returns Err with descriptive message when input is unknown string', () => {
    const r = LeadStatus.create('invalid_status');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.message).toMatch(/Invalid lead status/);
  });

  it('returns Err when input is empty string', () => {
    const r = LeadStatus.create('');
    expect(r.ok).toBe(false);
  });

  it('returns Err when input differs only by case from valid value', () => {
    const r = LeadStatus.create('NEW');
    expect(r.ok).toBe(false);
  });

  it('returns true from equals when two instances share the same value', () => {
    const a = LeadStatus.create('qualified');
    const b = LeadStatus.create('qualified');
    if (!a.ok || !b.ok) throw new Error('expected ok');
    expect(a.data.equals(b.data)).toBe(true);
  });

  it('returns false from equals when two instances differ', () => {
    const a = LeadStatus.create('qualified');
    const b = LeadStatus.create('lost');
    if (!a.ok || !b.ok) throw new Error('expected ok');
    expect(a.data.equals(b.data)).toBe(false);
  });

  it('accepts factory-generated lead status when fed into create', () => {
    const lead = leadFactory({ status: 'proposal' });
    const r = LeadStatus.create(lead.status);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.getValue()).toBe('proposal');
  });

  it('returns the underlying typed value when getValue is called', () => {
    const r = LeadStatus.create('converted');
    if (!r.ok) throw new Error('expected ok');
    const value: LeadStatusType = r.data.getValue();
    expect(value).toBe('converted');
  });
});
