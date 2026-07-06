/**
 * test/pos/gl-posting-log.repository.post-movement.spec.ts
 *
 * F3 (ACCOUNTING-STANDARDS-AUDIT-2026-07-06): GlPostingLogRepository.postMovementToLedger() now
 * routes the actual `entries` write through GlPostingService.postJournal() (the ONE engine) instead
 * of a bespoke raw INSERT. All upstream checks (movement lookup, idempotency, account mapping, CoA
 * resolution, amount<=0 / wash skip) are UNCHANGED — this covers only the new write path plus the
 * pre-existing skip branches to prove they still short-circuit before ever calling the engine.
 */

jest.mock('@workspace/db', () => ({
  db: {},
  eq: jest.fn(), desc: jest.fn(), and: jest.fn(),
  glPostingLog: { id: 'id', movementId: 'movementId', status: 'status' },
}));

let _queue: Array<unknown[] | Error> = [];
function queueResults(...results: Array<unknown[] | Error>) {
  _queue = [...results];
}

jest.mock('@shared/db/typed-execute', () => ({
  typedExecute: jest.fn(async () => {
    const next = _queue.shift();
    if (next instanceof Error) throw next;
    return next ?? [];
  }),
}));

import { Ok, Err } from '../../src/common/result';
import { GlPostingLogRepository } from '../../src/modules/pos/infrastructure/repositories/gl-posting-log.repository';
import type { GlPostingService } from '../../src/modules/finance/domain/services/gl-posting.service';

function makeGlMock(): jest.Mocked<Pick<GlPostingService, 'postJournal'>> {
  return { postJournal: jest.fn() };
}

describe('GlPostingLogRepository.postMovementToLedger() — F3 GL-engine migration', () => {
  let glMock: jest.Mocked<Pick<GlPostingService, 'postJournal'>>;
  let repo: GlPostingLogRepository;

  beforeEach(() => {
    _queue = [];
    glMock = makeGlMock();
    repo = new GlPostingLogRepository(glMock as unknown as GlPostingService);
  });

  it('posts through GlPostingService.postJournal with the resolved GL codes and postedBy attribution', async () => {
    queueResults(
      [{ movementType: 'EXTERNAL_IN', total: '25000' }],      // movement + line sum
      [],                                                       // idempotency check — not yet posted
      [{ debitAccount: '1010', creditAccount: '6000' }],       // gl_account_mappings
      [{ code: '1010', id: 5 }, { code: '6000', id: 19 }],      // accounts CoA
    );
    glMock.postJournal.mockResolvedValueOnce(Ok(123));

    const r = await repo.postMovementToLedger(2, 7);

    expect(glMock.postJournal).toHaveBeenCalledWith(
      [
        { accountCode: '1010', accountName: expect.any(String), debit: 25000, credit: 0 },
        { accountCode: '6000', accountName: expect.any(String), debit: 0, credit: 25000 },
      ],
      'POS-GL-2',
      7,
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual({ posted: true });
  });

  it('surfaces an engine rejection (e.g. period lock) as Err instead of silently skipping', async () => {
    queueResults(
      [{ movementType: 'EXTERNAL_IN', total: '25000' }],
      [],
      [{ debitAccount: '1010', creditAccount: '6000' }],
      [{ code: '1010', id: 5 }, { code: '6000', id: 19 }],
    );
    glMock.postJournal.mockResolvedValueOnce(Err('Davr yopilgan (EP-FIN-064): ...'));

    const r = await repo.postMovementToLedger(2, 7);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/EP-FIN-064/);
  });

  it('skips (soft Ok) when already posted — never calls the GL engine (pre-existing guard, unchanged)', async () => {
    queueResults(
      [{ movementType: 'EXTERNAL_IN', total: '25000' }],
      [{ id: 999 }], // already posted
    );

    const r = await repo.postMovementToLedger(2, 7);

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual({ posted: false, reason: 'already posted' });
    expect(glMock.postJournal).not.toHaveBeenCalled();
  });

  it('skips (soft Ok) when amount <= 0 — never calls the GL engine (pre-existing guard, unchanged)', async () => {
    queueResults(
      [{ movementType: 'INTERNAL_TRANSFER', total: '0' }],
      [],
      [{ debitAccount: '1010', creditAccount: '6000' }],
      [{ code: '1010', id: 5 }, { code: '6000', id: 19 }],
    );

    const r = await repo.postMovementToLedger(3, 7);

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.posted).toBe(false);
    expect(glMock.postJournal).not.toHaveBeenCalled();
  });

  it('skips (soft Ok) on same debit/credit account (wash) — never calls the GL engine (pre-existing guard, unchanged)', async () => {
    queueResults(
      [{ movementType: 'INTERNAL_TRANSFER', total: '5000' }],
      [],
      [{ debitAccount: '1010', creditAccount: '1010' }],
      [{ code: '1010', id: 5 }],
    );

    const r = await repo.postMovementToLedger(4, 7);

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.reason).toMatch(/wash/);
    expect(glMock.postJournal).not.toHaveBeenCalled();
  });
});
