/**
 * test/auth/card-gate-precheck.service.spec.ts
 *
 * VISION-3340 (2026-07-08): the card-gate pre-check MUST use the SAME "blocked"
 * predicate as the authoritative login gate (login.service.ts:129):
 *   non-exempt AND activeCardCount === 0  (activeCardCount = live employee_cards).
 * The gate does NOT look at users.card_id for the block decision. An earlier
 * version of this service added `AND NOT has_direct_card` (card_id IS NULL),
 * making it MORE lenient than the real gate — it could report a user with
 * card_id set but 0 employee_cards as "not blocked" while login blocked them.
 *
 * These tests render the real parameterised SQL (via drizzle-orm's PgDialect —
 * the same conversion Drizzle performs before the pg driver) and assert the
 * block predicate no longer references card_id / has_direct_card and still
 * gates on active_card_count = 0. The SQL-text assertion is what would have
 * caught the original divergence.
 */

import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';

const runQueryMock = jest.fn();
jest.mock('@shared/db', () => ({
  runQuery: (q: SQL) => runQueryMock(q),
}));

import { CardGatePrecheckService } from '../../src/modules/auth/application/services/card-gate-precheck.service';

const dialect = new PgDialect();
const render = (q: SQL): string => dialect.sqlToQuery(q).sql.replace(/\s+/g, ' ').trim();

describe('CardGatePrecheckService — gate parity (VISION-3340)', () => {
  let svc: CardGatePrecheckService;

  beforeEach(() => {
    runQueryMock.mockReset();
    svc = new CardGatePrecheckService();
  });

  it('block predicate uses active_card_count=0 ALONE — no card_id / has_direct_card (would have caught the divergence)', async () => {
    const seen: string[] = [];
    runQueryMock.mockImplementation((q: SQL) => {
      seen.push(render(q));
      // 1st call = summary, 2nd = per-role breakdown
      return seen.length === 1
        ? { rows: [{ active_users_total: 32, exempt_total: 5, cardless_blocked: 0, carded_non_exempt: 27 }] }
        : { rows: [] };
    });

    const r = await svc.summarize();
    expect(r.ok).toBe(true);

    const [summarySql, byRoleSql] = seen;
    // The exact bug: the old predicate carried "NOT has_direct_card" / referenced card_id.
    expect(summarySql).not.toMatch(/has_direct_card/i);
    expect(summarySql).not.toMatch(/card_id/i);
    expect(byRoleSql).not.toMatch(/has_direct_card/i);
    expect(byRoleSql).not.toMatch(/card_id/i);
    // ...and it MUST still gate on 0 live employee_cards, mirroring the real gate.
    expect(summarySql).toMatch(/active_card_count = 0/i);
    expect(byRoleSql).toMatch(/active_card_count = 0/i);
    // exempt roles still bypass
    expect(summarySql.toLowerCase()).toContain("'super_admin', 'admin', 'director'");
  });

  it('safeToEnable is true iff cardlessBlocked === 0', async () => {
    // clean case: nobody blocked
    runQueryMock.mockImplementation((q: SQL) => {
      const s = render(q);
      return /GROUP BY role/i.test(s)
        ? { rows: [] }
        : { rows: [{ active_users_total: 32, exempt_total: 5, cardless_blocked: 0, carded_non_exempt: 27 }] };
    });
    const clean = await svc.summarize();
    expect(clean.ok).toBe(true);
    if (clean.ok) {
      expect(clean.data.cardlessBlocked).toBe(0);
      expect(clean.data.safeToEnable).toBe(true);
    }

    // divergence-shaped case: a non-exempt user with a card_id but 0 employee_cards
    // is now counted as blocked (cardless_blocked > 0) -> NOT safe. Under the old
    // predicate this user was invisible and safeToEnable would have been wrongly true.
    runQueryMock.mockImplementation((q: SQL) => {
      const s = render(q);
      return /GROUP BY role/i.test(s)
        ? { rows: [{ role: 'operator', n: 2 }] }
        : { rows: [{ active_users_total: 32, exempt_total: 5, cardless_blocked: 2, carded_non_exempt: 25 }] };
    });
    const blocked = await svc.summarize();
    expect(blocked.ok).toBe(true);
    if (blocked.ok) {
      expect(blocked.data.cardlessBlocked).toBe(2);
      expect(blocked.data.safeToEnable).toBe(false);
      expect(blocked.data.cardlessByRole).toEqual([{ role: 'operator', count: 2 }]);
    }
  });

  it('returns Err on empty summary result (no fabrication)', async () => {
    runQueryMock.mockResolvedValue({ rows: [] });
    const r = await svc.summarize();
    expect(r.ok).toBe(false);
  });
});
