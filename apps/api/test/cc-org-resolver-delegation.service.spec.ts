/**
 * test/cc-org-resolver-delegation.service.spec.ts
 *
 * CC #33 — delegation chains resolve up to MAX 3 hops (A→B→C→D), deeper chains
 * are capped, and cycles (A→B→A) are broken by a visited-set so resolution
 * always terminates. checkDelegation used to be single-hop only.
 */

jest.mock('@shared/db', () => ({ runQuery: jest.fn() }));

import { runQuery } from '@shared/db';
import { CcOrgResolverService } from '../src/modules/communication-center/application/cc-org-resolver.service';

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

/** Simulate one cc_delegations lookup: `to` (a delegate) or null (no active delegation). */
function delegate(to: number | null) {
  return { rows: to === null ? [] : [{ to_user_id: to }] } as unknown as Awaited<ReturnType<typeof runQuery>>;
}

describe('CcOrgResolverService.checkDelegation — CC #33 depth cap + cycle guard', () => {
  let svc: { checkDelegation: (userId: number) => Promise<number | null> };

  beforeEach(() => {
    mockRunQuery.mockReset();
    svc = new CcOrgResolverService() as unknown as typeof svc;
  });

  it('follows the chain up to 3 hops and caps deeper chains (A->B->C->D->E returns D)', async () => {
    mockRunQuery
      .mockResolvedValueOnce(delegate(2)) // 1 -> 2
      .mockResolvedValueOnce(delegate(3)) // 2 -> 3
      .mockResolvedValueOnce(delegate(4)) // 3 -> 4  (3rd hop)
      .mockResolvedValueOnce(delegate(5)); // 4 -> 5 would be a 4th hop — must be capped

    const r = await svc.checkDelegation(1);

    expect(r).toBe(4);
    expect(mockRunQuery).toHaveBeenCalledTimes(3); // capped: never queries the 4th hop
  });

  it('breaks a cycle (A->B->A terminates, returns the last non-cyclic delegate)', async () => {
    mockRunQuery
      .mockResolvedValueOnce(delegate(2)) // 1 -> 2
      .mockResolvedValueOnce(delegate(1)); // 2 -> 1 (cycle back to origin)

    const r = await svc.checkDelegation(1);

    expect(r).toBe(2);
    expect(mockRunQuery).toHaveBeenCalledTimes(2); // stops on the cycle, no infinite loop
  });

  it('returns null when the user has no active delegation', async () => {
    mockRunQuery.mockResolvedValueOnce(delegate(null));

    const r = await svc.checkDelegation(1);

    expect(r).toBeNull();
    expect(mockRunQuery).toHaveBeenCalledTimes(1);
  });

  it('returns the single delegate for a one-hop chain (A->B, B has none)', async () => {
    mockRunQuery
      .mockResolvedValueOnce(delegate(2)) // 1 -> 2
      .mockResolvedValueOnce(delegate(null)); // 2 has no delegation

    const r = await svc.checkDelegation(1);

    expect(r).toBe(2);
    expect(mockRunQuery).toHaveBeenCalledTimes(2);
  });
});
