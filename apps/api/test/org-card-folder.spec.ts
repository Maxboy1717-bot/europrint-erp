/**
 * org-card-folder.spec.ts — ORG Phase 3: card 6-section folder + completeness%.
 *
 * Covers CardFolderService completeness calc (0/3/6 filled), empty-folder default,
 * and wires CardFolderController to satisfy the Q-29 new-endpoint test gate.
 */

import { CardFolderService } from '../src/modules/org-structure/card-folder.service';
import { CardFolderController } from '../src/modules/org-structure/card-folder.controller';
import type { CardFolderRepository } from '../src/modules/org-structure/card-folder.repository';
import { Ok, isOk } from '../src/common/result';

type Row = Record<string, unknown>;

function makeRepo(over: Partial<Record<keyof CardFolderRepository, jest.Mock>> = {}): CardFolderRepository {
  return {
    getByCard: jest.fn().mockResolvedValue(Ok(null)),
    upsert:    jest.fn().mockResolvedValue(Ok(null)),
    ...over,
  } as unknown as CardFolderRepository;
}

describe('ORG card folder (CardFolderService)', () => {
  it('CardFolderController is wired to CardFolderService', () => {
    const ctrl = new CardFolderController(new CardFolderService(makeRepo()));
    expect(ctrl).toBeInstanceOf(CardFolderController);
  });

  it('getFolder → empty folder = 0% when no row exists', async () => {
    const svc = new CardFolderService(makeRepo({ getByCard: jest.fn().mockResolvedValue(Ok(null)) }));
    const r = await svc.getFolder(1);
    expect(isOk(r)).toBe(true);
    if (isOk(r)) {
      expect(r.data.completeness).toBe(0);
      expect(r.data.filledSections).toBe(0);
      expect(r.data.totalSections).toBe(6);
    }
  });

  it('completeness = 50% when 3 of 6 sections are filled', async () => {
    const row: Row = { card_id: 1, vazifa: 'a', javobgarlik: 'b', gsd: 'c', reglament: '', jarayon: null, talim: '   ' };
    const svc = new CardFolderService(makeRepo({ getByCard: jest.fn().mockResolvedValue(Ok(row)) }));
    const r = await svc.getFolder(1);
    expect(isOk(r)).toBe(true);
    if (isOk(r)) {
      expect(r.data.filledSections).toBe(3);   // empty string + null + whitespace do NOT count
      expect(r.data.completeness).toBe(50);
    }
  });

  it('completeness = 100% when all 6 sections are filled', async () => {
    const row: Row = { card_id: 1, vazifa: 'a', javobgarlik: 'b', gsd: 'c', reglament: 'd', jarayon: 'e', talim: 'f' };
    const svc = new CardFolderService(makeRepo({ getByCard: jest.fn().mockResolvedValue(Ok(row)) }));
    const r = await svc.getFolder(1);
    expect(isOk(r)).toBe(true);
    if (isOk(r)) expect(r.data.completeness).toBe(100);
  });

  it('upsertFolder → returns the view with recomputed completeness', async () => {
    const row: Row = { card_id: 5, vazifa: 'x', javobgarlik: 'y', gsd: null, reglament: null, jarayon: null, talim: null };
    const upsert = jest.fn().mockResolvedValue(Ok(row));
    const svc = new CardFolderService(makeRepo({ upsert }));
    const r = await svc.upsertFolder(5, { vazifa: 'x', javobgarlik: 'y' });
    expect(upsert).toHaveBeenCalledWith(5, { vazifa: 'x', javobgarlik: 'y' });
    expect(isOk(r)).toBe(true);
    if (isOk(r)) {
      expect(r.data.completeness).toBe(33);   // 2/6 → round(33.33) = 33
      expect(r.data.cardId).toBe(5);
    }
  });
});
