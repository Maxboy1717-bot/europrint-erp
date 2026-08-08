/**
 * test/director/approval.dto.get-pending-coerce.spec.ts
 *
 * CE-2 (live console error, 2026-07-07): GET /api/director/approvals/pending?limit=5
 * returned 422. Root cause: GetPendingDtoSchema's page/limit used z.number(), but
 * @Query() values from an HTTP query string are always strings ("5", not 5) -- Zod's
 * z.number() rejects a string outright. Fixed with z.coerce.number(), matching the
 * established convention already used by every other query-param schema in this
 * module (workflow-rules/stat-regulation/okr/monthly-plan.controller.ts).
 */

import { GetPendingDtoSchema } from '../../src/modules/director/presentation/dto/approval.dto';

describe('GetPendingDtoSchema — CE-2 query-string coercion', () => {
  it('accepts string query values (as Fastify/Express @Query() actually delivers them)', () => {
    const parsed = GetPendingDtoSchema.parse({ limit: '5', page: '2' });
    expect(parsed).toEqual({ limit: 5, page: 2 });
  });

  it('reproduces the exact reported repro shape: ?limit=5 with no page', () => {
    const parsed = GetPendingDtoSchema.parse({ limit: '5' });
    expect(parsed.limit).toBe(5);
    expect(parsed.page).toBe(1); // default
  });

  it('still rejects an out-of-range coerced value', () => {
    expect(() => GetPendingDtoSchema.parse({ limit: '101' })).toThrow();
    expect(() => GetPendingDtoSchema.parse({ page: '0' })).toThrow();
  });

  it('still rejects a non-numeric string', () => {
    expect(() => GetPendingDtoSchema.parse({ limit: 'abc' })).toThrow();
  });

  it('defaults page/limit when omitted entirely', () => {
    const parsed = GetPendingDtoSchema.parse({});
    expect(parsed).toEqual({ page: 1, limit: 20 });
  });
});
