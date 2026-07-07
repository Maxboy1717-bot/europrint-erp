/**
 * test/auth/drizzle-auth.repo.blacklist-claim.spec.ts
 *
 * C7.6 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): blacklistToken()'s old ON CONFLICT ... DO UPDATE
 * SET is_revoked = true unconditionally "succeeded" whether this call was the token's first
 * revocation or its hundredth. Two concurrent auth.controller.ts refresh() calls with the same
 * old token could both pass a separate isTokenBlacklisted() check before either blacklisted,
 * both mint new pairs -> two live sessions from one single-use refresh token. The fix adds
 * `WHERE refresh_tokens.is_revoked = false` to the DO UPDATE + RETURNING, so blacklistToken()
 * now returns true only for the winning first-time claim; the controller calls it BEFORE
 * minting and rejects outright when it returns false.
 */

function sqlText(call: unknown): string {
  const chunks = (call as { queryChunks?: unknown[] })?.queryChunks ?? [];
  return chunks
    .map((c) => (c && typeof c === 'object' && 'value' in (c as object) ? (c as { value: string[] }).value.join('') : ''))
    .join(' ');
}

const mockRunQuery = jest.fn();
jest.mock('@shared/db', () => ({ runQuery: (...args: unknown[]) => mockRunQuery(...args) }));
jest.mock('drizzle-orm', () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
    queryChunks: strings.flatMap((s, i) => [{ value: [s] }, ...(i < values.length ? [{ value: [String(values[i])] }] : [])]),
  }),
}));

import { DrizzleAuthRepo } from '../../src/modules/auth/infrastructure/repositories/drizzle-auth.repo';

describe('DrizzleAuthRepo.blacklistToken — C7.6 atomic single-use claim', () => {
  let repo: DrizzleAuthRepo;

  beforeEach(() => {
    mockRunQuery.mockReset();
    repo = new DrizzleAuthRepo();
  });

  it('returns true when the guarded UPSERT returns a row (won the claim)', async () => {
    mockRunQuery.mockResolvedValue({ rows: [{ jti: 'abc' }] });

    const result = await repo.blacklistToken('some.jwt.token', new Date());

    expect(result).toBe(true);
    const text = sqlText(mockRunQuery.mock.calls[0][0]);
    expect(text).toContain('WHERE refresh_tokens.is_revoked = false');
    expect(text).toContain('RETURNING jti');
  });

  it('returns false when the guarded UPSERT excludes the row (already revoked / lost the race)', async () => {
    mockRunQuery.mockResolvedValue({ rows: [] });

    const result = await repo.blacklistToken('some.jwt.token', new Date());

    expect(result).toBe(false);
  });

  it('fails closed (returns false, does not throw) when the write itself errors', async () => {
    mockRunQuery.mockRejectedValue(new Error('connection reset'));

    const result = await repo.blacklistToken('some.jwt.token', new Date());

    expect(result).toBe(false);
  });
});
