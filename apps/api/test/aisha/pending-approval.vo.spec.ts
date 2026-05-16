/**
 * @module pending-approval.vo.spec
 * @description PendingApproval lifecycle: pending → approved/rejected/expired.
 */

import { PendingApproval } from '../../src/modules/aisha/domain/value-objects/pending-approval.vo';

describe('PendingApproval', () => {
  it('creates a pending approval with stake level', () => {
    const r = PendingApproval.create({ toolCallId: 't1', stakeLevel: 'high' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.props.state).toBe('pending');
  });

  it('sets requiresPIN true for critical stake', () => {
    const r = PendingApproval.create({ toolCallId: 't1', stakeLevel: 'critical' });
    if (!r.ok) throw new Error('setup');
    expect(r.data.props.requiresPIN).toBe(true);
  });

  it('approve transitions state to approved', () => {
    const r = PendingApproval.create({ toolCallId: 't1', stakeLevel: 'high', nowMs: 0 });
    if (!r.ok) throw new Error('setup');
    const a = r.data.approve(1000);
    expect(a.ok && a.data.props.state).toBe('approved');
  });

  it('reject transitions state to rejected', () => {
    const r = PendingApproval.create({ toolCallId: 't1', stakeLevel: 'high' });
    if (!r.ok) throw new Error('setup');
    const a = r.data.reject();
    expect(a.ok && a.data.props.state).toBe('rejected');
  });

  it('approve rejects when 5 minutes elapsed', () => {
    const r = PendingApproval.create({ toolCallId: 't1', stakeLevel: 'high', nowMs: 0 });
    if (!r.ok) throw new Error('setup');
    const a = r.data.approve(6 * 60 * 1000);
    expect(a.ok).toBe(false);
  });

  it('rejects unknown stake level', () => {
    const r = PendingApproval.create({ toolCallId: 't1', stakeLevel: 'low' as unknown as 'high' });
    expect(r.ok).toBe(false);
  });
});
