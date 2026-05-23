/**
 * test/crm/deal.aggregate.spec.ts
 * Unit tests for Deal aggregate — pipeline status transitions
 * (qualification → won/lost) and assignment metadata.
 */
import { Deal, DealCreateProps } from '../../src/modules/crm/domain/aggregates/deal.aggregate';
import { DealStatus } from '../../src/modules/crm/domain/value-objects/deal-status.vo';
import { Money } from '../../src/modules/shared/domain/value-objects/money.vo';
import { dealFactory } from '../_fixtures/factories';

function status(value: 'qualification' | 'proposal' | 'negotiation' | 'won' | 'lost'): DealStatus {
  const r = DealStatus.create(value);
  if (!r.ok) throw new Error(`fixture: bad status ${value}`);
  return r.data;
}

function makeMoney(amount: number, currency: string): Money {
  const r = Money.of(amount, currency);
  if (!r.ok) throw new Error(`fixture: bad money ${amount} ${currency}`);
  return r.data;
}

function makeDealProps(overrides: Partial<DealCreateProps> = {}): DealCreateProps {
  const f = dealFactory();
  return {
    leadId: f.leadId,
    companyId: f.companyId,
    dealNumber: `D-${f.id}`,
    status: status('qualification'),
    totalAmount: makeMoney(f.amount, f.currency),
    currency: f.currency,
    assignedTo: 11,
    createdBy: f.createdBy,
    expectedClosureDate: f.expectedCloseDate,
    ...overrides,
  };
}

describe('Deal aggregate', () => {
  describe('static create()', () => {
    it('initialises with id=0 placeholder before persistence', () => {
      const d = Deal.create(makeDealProps());
      expect(d.getId()).toBe(0);
    });

    it('records lead, company, and assignee identifiers', () => {
      const d = Deal.create(makeDealProps({ leadId: 5, companyId: 7, assignedTo: 9 }));
      expect(d.getLeadId()).toBe(5);
      expect(d.getCompanyId()).toBe(7);
      expect(d.getAssignedTo()).toBe(9);
    });

    it('exposes initial status value through getter', () => {
      const d = Deal.create(makeDealProps({ status: status('proposal') }));
      expect(d.getStatus()).toBe('proposal');
    });
  });

  describe('updateStatus()', () => {
    it('moves from qualification to proposal when status is a valid non-terminal value', () => {
      const d = Deal.create(makeDealProps({ status: status('qualification') }));
      const r = d.updateStatus('proposal');
      expect(r.ok).toBe(true);
      expect(d.getStatus()).toBe('proposal');
    });

    it('returns Err when status string is unknown', () => {
      const d = Deal.create(makeDealProps());
      const r = d.updateStatus('archived');
      expect(r.ok).toBe(false);
      expect(d.getStatus()).toBe('qualification');
    });

    it('returns Err when status string is empty', () => {
      const d = Deal.create(makeDealProps());
      const r = d.updateStatus('');
      expect(r.ok).toBe(false);
    });

    it('refuses to transition to won via updateStatus — must use markAsWon() instead', () => {
      const d = Deal.create(makeDealProps({ status: status('proposal') }));
      const r = d.updateStatus('won');
      expect(r.ok).toBe(false);
      expect(d.getStatus()).toBe('proposal');
    });

    it('refuses to transition to lost via updateStatus — must use markAsLost() instead', () => {
      const d = Deal.create(makeDealProps({ status: status('proposal') }));
      const r = d.updateStatus('lost');
      expect(r.ok).toBe(false);
      expect(d.getStatus()).toBe('proposal');
    });
  });

  describe('markAsWon()', () => {
    it('transitions proposal deal to won and emits DealWon domain event', () => {
      const d = Deal.create(makeDealProps({ status: status('proposal') }));
      const r = d.markAsWon();
      expect(r.ok).toBe(true);
      expect(d.getStatus()).toBe('won');
      const events = d.getDomainEvents() as Array<{ eventName: string }>;
      expect(events.some(e => e.eventName === 'DealWon')).toBe(true);
    });

    it('transitions negotiation deal to won when called with no actualAmount', () => {
      const d = Deal.create(makeDealProps({ status: status('negotiation') }));
      const r = d.markAsWon();
      expect(r.ok).toBe(true);
      expect(d.getStatus()).toBe('won');
    });

    it('updates totalAmount when actualAmount is provided on close', () => {
      const d = Deal.create(makeDealProps({ status: status('proposal'), totalAmount: makeMoney(1_000, 'UZS') }));
      const r = d.markAsWon(2_500_000);
      expect(r.ok).toBe(true);
      expect(d.getTotalAmount()).toBe(2_500_000);
    });

    it('refuses to mark a qualification-stage deal as won', () => {
      const d = Deal.create(makeDealProps({ status: status('qualification') }));
      const r = d.markAsWon();
      expect(r.ok).toBe(false);
      expect(d.getStatus()).toBe('qualification');
    });

    it('refuses to re-mark an already-won deal', () => {
      const d = Deal.create(makeDealProps({ status: status('proposal') }));
      d.markAsWon();
      const again = d.markAsWon();
      expect(again.ok).toBe(false);
    });
  });

  describe('markAsLost()', () => {
    it('transitions qualification deal to lost when given a reason', () => {
      const d = Deal.create(makeDealProps({ status: status('qualification') }));
      const r = d.markAsLost('budget constraints');
      expect(r.ok).toBe(true);
      expect(d.getStatus()).toBe('lost');
    });

    it('emits DealLost domain event with the provided reason', () => {
      const d = Deal.create(makeDealProps({ status: status('negotiation') }));
      d.markAsLost('competitor chosen');
      const events = d.getDomainEvents() as Array<{ eventName: string; data?: { reason: string } }>;
      const lostEvent = events.find(e => e.eventName === 'DealLost');
      expect(lostEvent).toBeDefined();
      expect(lostEvent?.data?.reason).toBe('competitor chosen');
    });

    it('refuses to mark a won deal as lost', () => {
      const d = Deal.create(makeDealProps({ status: status('proposal') }));
      d.markAsWon();
      const r = d.markAsLost('mistake');
      expect(r.ok).toBe(false);
      expect(d.getStatus()).toBe('won');
    });

    it('refuses to re-mark a lost deal', () => {
      const d = Deal.create(makeDealProps({ status: status('proposal') }));
      d.markAsLost('reason');
      const again = d.markAsLost('again');
      expect(again.ok).toBe(false);
    });

    it('rejects empty reason — a loss reason is mandatory', () => {
      const d = Deal.create(makeDealProps({ status: status('proposal') }));
      const r = d.markAsLost('');
      expect(r.ok).toBe(false);
      expect(d.getStatus()).toBe('proposal');
    });

    it('rejects whitespace-only reason', () => {
      const d = Deal.create(makeDealProps({ status: status('proposal') }));
      const r = d.markAsLost('   ');
      expect(r.ok).toBe(false);
    });
  });

  describe('getTotalAmount()', () => {
    it('returns the amount stored in the Money value object', () => {
      const d = Deal.create(makeDealProps({ totalAmount: makeMoney(12_345_678, 'UZS') }));
      expect(d.getTotalAmount()).toBe(12_345_678);
    });

    it('reflects zero amount when initialised with Money.of(0)', () => {
      const d = Deal.create(makeDealProps({ totalAmount: makeMoney(0, 'UZS') }));
      expect(d.getTotalAmount()).toBe(0);
    });
  });

  describe('AggregateRoot integration', () => {
    it('starts with empty domain events list', () => {
      const d = Deal.create(makeDealProps());
      expect(d.getDomainEvents()).toEqual([]);
    });

    it('clearDomainEvents() leaves the list empty', () => {
      const d = Deal.create(makeDealProps());
      d.clearDomainEvents();
      expect(d.getDomainEvents()).toEqual([]);
    });
  });
});
