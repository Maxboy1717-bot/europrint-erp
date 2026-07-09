/**
 * test/marketing/drizzle-marketing-group2.softdelete.spec.ts
 *
 * Fix-loop item 3: DrizzleMarketingGroup2Repository.softDeleteLead is the LIVE handler for
 * DELETE /marketing/leads/:id. It did `.where(eq(marketingLeads.id, Number(id)))` — but
 * marketing_leads.id is varchar (slug ids like "demo-lead-004"), so Number(id)=NaN matched
 * 0 rows and the method STILL returned Ok({message:"Lead o'chirildi"}) — a fake delete.
 * Fixed to bind the string id via sql`` + a returning-count guard so a miss no longer
 * reports success. These tests pin both: success only when a row is flagged; the emitted
 * SQL is a string comparison (no Number/NaN coercion).
 */

import { makeDbChain } from '../_setup/db-mock';
import { PgDialect } from 'drizzle-orm/pg-core';

const dbStub = makeDbChain([]);

jest.mock('@shared/db', () => ({ db: dbStub, runQuery: jest.fn().mockResolvedValue({ rows: [] }) }));

jest.mock('@europrint/schemas', () => ({
  marketingLeads: { id: 'ml.id', deletedAt: 'ml.deleted_at' },
  blogPosts: { id: 'bp.id' },
  marketingBudgetItems: { id: 'mbi.id' },
  marketingCalendarEvents: { id: 'mce.id' },
  marketingLeadContacts: { id: 'mlc.id' },
  sdCustomerCompetitors: { id: 'scc.id' },
}));

import { DrizzleMarketingGroup2Repository } from '../../src/modules/marketing/infrastructure/repositories/drizzle-marketing-group2.repo';

describe('DrizzleMarketingGroup2Repository.softDeleteLead (item 3 — real string id, no fake success)', () => {
  let repo: DrizzleMarketingGroup2Repository;
  beforeEach(() => { repo = new DrizzleMarketingGroup2Repository(); (dbStub.returning as jest.Mock).mockClear(); });

  it('returns Ok only when a row was actually flagged', async () => {
    dbStub.__setResolved([{ id: 'demo-lead-004' }]);
    const r = await repo.softDeleteLead('demo-lead-004');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.message).toContain("o'chirildi");
  });

  it('returns Err (not fake success) when the id matches no row', async () => {
    dbStub.__setResolved([]);
    const r = await repo.softDeleteLead('demo-lead-004');
    expect(r.ok).toBe(false); // old code returned Ok here — the fake-delete
  });

  it('binds the string id via a sql comparison (no Number()/NaN coercion)', async () => {
    dbStub.__setResolved([{ id: 'demo-lead-004' }]);
    await repo.softDeleteLead('demo-lead-004');
    const whereArg = (dbStub.where as jest.Mock).mock.calls.at(-1)?.[0];
    expect(whereArg).toBeDefined();
    const { params } = new PgDialect().sqlToQuery(whereArg);
    // the raw string id is bound as a parameter (old code bound Number(id)=NaN)
    expect(params).toContain('demo-lead-004');
    expect(params.some(p => typeof p === 'number' && Number.isNaN(p))).toBe(false);
  });
});
