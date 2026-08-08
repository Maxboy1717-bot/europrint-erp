/**
 * org-card-template.spec.ts — CardTemplateService: CRUD NOT_FOUND guards + applyTemplate
 * merge/whitelist logic (shablon `field_defaults` + override → CardInput → CardService.create).
 *
 * applyTemplate is the one piece of real business logic in this service (Q-40): it merges
 * two plain objects (override wins over template defaults) and filters the result down to
 * the CARD_FIELD_KEYS whitelist before handing it to CardService.create. This spec asserts
 * that merge/whitelist behavior with real objects — not just "service is defined".
 */

import { CardTemplateService } from '../src/modules/org-structure/card-template.service';
import type { CardTemplateRepository, CardTemplateInput } from '../src/modules/org-structure/card-template.repository';
import { CardService } from '../src/modules/org-structure/card.service';
import type { CardRepository, CardInput } from '../src/modules/org-structure/card.repository';
import { Ok, Err, AppErr, isOk, isErr } from '../src/common/result';

function makeTemplateRepo(
  over: Partial<Record<keyof CardTemplateRepository, jest.Mock>> = {},
): CardTemplateRepository {
  return {
    list:       jest.fn().mockResolvedValue(Ok([])),
    findById:   jest.fn().mockResolvedValue(Ok(null)),
    create:     jest.fn().mockResolvedValue(Ok({ id: 1 })),
    update:     jest.fn().mockResolvedValue(Ok(null)),
    softDelete: jest.fn().mockResolvedValue(Ok(null)),
    ...over,
  } as unknown as CardTemplateRepository;
}

/** Real CardService wired to a mock CardRepository — lets us inspect the exact CardInput
 * that applyTemplate() builds by asserting on the args CardRepository.create was called with. */
function makeCardService(createImpl?: jest.Mock): { cardService: CardService; createSpy: jest.Mock } {
  const createSpy = createImpl ?? jest.fn().mockResolvedValue(Ok({ id: 42 }));
  const cardRepo = { create: createSpy } as unknown as CardRepository;
  return { cardService: new CardService(cardRepo), createSpy };
}

describe('CardTemplateService', () => {
  describe('findById', () => {
    it('returns NOT_FOUND when the template is absent', async () => {
      const { cardService } = makeCardService();
      const svc = new CardTemplateService(makeTemplateRepo(), cardService);
      const r = await svc.findById(999);
      expect(isErr(r)).toBe(true);
      if (isErr(r)) expect(r.error.code).toBe('NOT_FOUND');
    });

    it('returns the template row when present', async () => {
      const { cardService } = makeCardService();
      const repo = makeTemplateRepo({
        findById: jest.fn().mockResolvedValue(Ok({ id: 5, position_type: 'operator' })),
      });
      const svc = new CardTemplateService(repo, cardService);
      const r = await svc.findById(5);
      expect(isOk(r)).toBe(true);
      if (isOk(r)) expect((r.data as { id: number }).id).toBe(5);
    });
  });

  describe('update', () => {
    it('returns NOT_FOUND when nothing was updated', async () => {
      const { cardService } = makeCardService();
      const svc = new CardTemplateService(makeTemplateRepo(), cardService);
      const r = await svc.update(1, {} as CardTemplateInput);
      expect(isErr(r)).toBe(true);
      if (isErr(r)) expect(r.error.code).toBe('NOT_FOUND');
    });
  });

  describe('softDelete', () => {
    it('returns NOT_FOUND when nothing was archived', async () => {
      const { cardService } = makeCardService();
      const svc = new CardTemplateService(makeTemplateRepo(), cardService);
      const r = await svc.softDelete(1);
      expect(isErr(r)).toBe(true);
      if (isErr(r)) expect(r.error.code).toBe('NOT_FOUND');
    });

    it('returns the archived row on success', async () => {
      const { cardService } = makeCardService();
      const repo = makeTemplateRepo({
        softDelete: jest.fn().mockResolvedValue(Ok({ id: 3, is_active: false })),
      });
      const svc = new CardTemplateService(repo, cardService);
      const r = await svc.softDelete(3);
      expect(isOk(r)).toBe(true);
      if (isOk(r)) expect((r.data as { is_active: boolean }).is_active).toBe(false);
    });
  });

  describe('applyTemplate', () => {
    it('propagates NOT_FOUND when the template id does not exist', async () => {
      const { cardService, createSpy } = makeCardService();
      const svc = new CardTemplateService(makeTemplateRepo(), cardService);
      const r = await svc.applyTemplate(404, {});
      expect(isErr(r)).toBe(true);
      if (isErr(r)) expect(r.error.code).toBe('NOT_FOUND');
      expect(createSpy).not.toHaveBeenCalled();
    });

    it('propagates repository errors from findById', async () => {
      const { cardService } = makeCardService();
      const repo = makeTemplateRepo({
        findById: jest.fn().mockResolvedValue(Err(AppErr('INTERNAL', 'db down'))),
      });
      const svc = new CardTemplateService(repo, cardService);
      const r = await svc.applyTemplate(1, {});
      expect(isErr(r)).toBe(true);
      if (isErr(r)) expect(r.error.code).toBe('INTERNAL');
    });

    it('seeds a card from field_defaults alone when no override is given', async () => {
      const { cardService, createSpy } = makeCardService();
      const repo = makeTemplateRepo({
        findById: jest.fn().mockResolvedValue(Ok({
          id: 10,
          field_defaults: { positionName: 'Operator', departmentId: 7, salaryType: 'fixed' },
        })),
      });
      const svc = new CardTemplateService(repo, cardService);
      const r = await svc.applyTemplate(10, {});

      expect(isOk(r)).toBe(true);
      expect(createSpy).toHaveBeenCalledTimes(1);
      const cardInput = createSpy.mock.calls[0][0] as CardInput;
      expect(cardInput).toEqual({ positionName: 'Operator', departmentId: 7, salaryType: 'fixed' });
    });

    it('override wins over field_defaults for overlapping keys, and merges non-overlapping keys', async () => {
      const { cardService, createSpy } = makeCardService();
      const repo = makeTemplateRepo({
        findById: jest.fn().mockResolvedValue(Ok({
          id: 11,
          field_defaults: { positionName: 'Operator', departmentId: 7, level: 1 },
        })),
      });
      const svc = new CardTemplateService(repo, cardService);
      await svc.applyTemplate(11, { positionName: 'Senior Operator', razryadLevelId: 3 });

      const cardInput = createSpy.mock.calls[0][0] as CardInput;
      expect(cardInput).toEqual({
        positionName: 'Senior Operator', // override beats template default
        departmentId: 7,                 // kept from template default (not overridden)
        level: 1,                        // kept from template default
        razryadLevelId: 3,               // added by override
      });
    });

    it('drops keys that are not in the CARD_FIELD_KEYS whitelist (e.g. template bookkeeping fields)', async () => {
      const { cardService, createSpy } = makeCardService();
      const repo = makeTemplateRepo({
        findById: jest.fn().mockResolvedValue(Ok({
          id: 12,
          field_defaults: {
            positionName: 'Operator',
            // not a real CardInput field — must be stripped by the whitelist
            unknownTemplateField: 'should-not-leak',
          },
        })),
      });
      const svc = new CardTemplateService(repo, cardService);
      await svc.applyTemplate(12, { alsoUnknown: 'nope' });

      const cardInput = createSpy.mock.calls[0][0] as Record<string, unknown>;
      expect(cardInput).toEqual({ positionName: 'Operator' });
      expect(cardInput.unknownTemplateField).toBeUndefined();
      expect(cardInput.alsoUnknown).toBeUndefined();
    });

    it('tolerates a template with no field_defaults (null) and an override-only apply', async () => {
      const { cardService, createSpy } = makeCardService();
      const repo = makeTemplateRepo({
        findById: jest.fn().mockResolvedValue(Ok({ id: 13, field_defaults: null })),
      });
      const svc = new CardTemplateService(repo, cardService);
      await svc.applyTemplate(13, { positionName: 'From override only' });

      const cardInput = createSpy.mock.calls[0][0] as CardInput;
      expect(cardInput).toEqual({ positionName: 'From override only' });
    });
  });
});
