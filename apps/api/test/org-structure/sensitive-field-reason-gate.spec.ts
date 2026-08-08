/**
 * test/org-structure/sensitive-field-reason-gate.spec.ts
 *
 * VISION-3340 #24: sensitive karta-field edits (razryad/salary/lifecycle-state/head) must
 * carry a caller-supplied reason. AuditInterceptor opportunistically CAPTURES a reason
 * (REASON_KEYS) but never REJECTED a request that omitted one. Fixed by:
 *   1. OrgNodeSchema (org-structure.controller.ts) gains a .superRefine() gate
 *      (requireReasonForSensitiveFields) that 400s any create()/update() body touching
 *      razryadLevelId/salaryType/minSalary/maxSalary/otdeleniyeNo/currentState/headUserId
 *      without a non-empty REASON_KEYS value — REASON_KEYS is imported straight from
 *      AuditInterceptor (single source of truth), not re-declared.
 *   2. CardFreezeSchema (card.controller.ts) — `reason` changed from optional to
 *      z.string().min(3) so a freeze (a sensitive lifecycle-state change) can never be
 *      submitted without one.
 *
 * Style: same as the other specs in this directory (org-structure.controller.roles.spec.ts,
 * org-mutations.repo.assign-dual-write.spec.ts) — controllers/repos instantiated directly
 * with hand-built dependency stubs, no HTTP bootstrap, no real DB. Zod's own .strict() mode
 * means only REASON_KEYS members that are ALSO declared fields on a given schema are usable
 * as a reason carrier there (OrgNodeSchema declares `reason` and `description`; it does not
 * declare `justification`/`comment`/`note` — those are simply rejected earlier as unrecognized
 * keys, still surfacing as a ZodError/400, so the "no silent bypass" guarantee holds either way).
 */

import 'reflect-metadata';
import { ZodError } from 'zod';
import { OrgStructureController } from '../../src/modules/org-structure/org-structure.controller';
import { CardController } from '../../src/modules/org-structure/card.controller';
import { REASON_KEYS } from '../../src/common/interceptors/audit.interceptor';

type OrgServiceStub = { create: jest.Mock; update: jest.Mock };

function makeOrgStructureController(overrides: Partial<OrgServiceStub> = {}) {
  const service = {
    create: overrides.create ?? jest.fn().mockResolvedValue({ id: 1 }),
    update: overrides.update ?? jest.fn().mockResolvedValue({ id: 1 }),
  } as unknown as ConstructorParameters<typeof OrgStructureController>[0];
  return new OrgStructureController(
    service,
    {} as ConstructorParameters<typeof OrgStructureController>[1],
    {} as ConstructorParameters<typeof OrgStructureController>[2],
    {} as ConstructorParameters<typeof OrgStructureController>[3],
  );
}

function makeCardController(freezeCard?: jest.Mock) {
  const service = {
    freezeCard: freezeCard ?? jest.fn().mockResolvedValue({ ok: true, data: { id: 1, status: 'frozen' } }),
  } as unknown as ConstructorParameters<typeof CardController>[0];
  return new CardController(service);
}

describe('VISION-3340 #24 — sensitive karta-field edits require a reason', () => {
  describe('REASON_KEYS — reused, not re-declared', () => {
    it('AuditInterceptor exports REASON_KEYS and it includes the two keys OrgNodeSchema can actually carry (reason, description)', () => {
      expect(REASON_KEYS).toEqual(
        expect.arrayContaining(['reason', 'justification', 'comment', 'note', 'description']),
      );
    });
  });

  describe('OrgStructureController.create() — OrgNodeSchema.superRefine gate', () => {
    it('rejects a razryadLevelId change with NO reason field at all', async () => {
      const controller = makeOrgStructureController();
      await expect(controller.create({ name: 'Test', razryadLevelId: 5 })).rejects.toBeInstanceOf(ZodError);
    });

    it('rejects a razryadLevelId change when reason is present but whitespace-only', async () => {
      const controller = makeOrgStructureController();
      await expect(
        controller.create({ name: 'Test', razryadLevelId: 5, reason: '   ' }),
      ).rejects.toBeInstanceOf(ZodError);
    });

    it.each([
      ['salaryType', 'oylik'],
      ['minSalary', 1000000],
      ['maxSalary', 2000000],
      ['otdeleniyeNo', 3],
      ['currentState', 'active'],
      ['headUserId', 9],
    ] as const)('rejects a bare %s change with no reason', async (field, value) => {
      const controller = makeOrgStructureController();
      await expect(controller.create({ name: 'Test', [field]: value })).rejects.toBeInstanceOf(ZodError);
    });

    it('accepts a razryadLevelId change WHEN `reason` is a non-empty string', async () => {
      const create = jest.fn().mockResolvedValue({ id: 1, razryadLevelId: 5 });
      const controller = makeOrgStructureController({ create });
      await expect(
        controller.create({ name: 'Test', razryadLevelId: 5, reason: "Malaka oshirish imtihonidan o'tdi" }),
      ).resolves.toEqual({ id: 1, razryadLevelId: 5 });
      expect(create).toHaveBeenCalledTimes(1);
    });

    it('accepts a razryadLevelId change WHEN `description` (a REASON_KEYS member also declared on the schema) carries the reason', async () => {
      const create = jest.fn().mockResolvedValue({ id: 1 });
      const controller = makeOrgStructureController({ create });
      await expect(
        controller.create({ name: 'Test', razryadLevelId: 5, description: "Sabab: yillik ko'rik natijasi" }),
      ).resolves.toBeDefined();
      expect(create).toHaveBeenCalledTimes(1);
    });

    it('non-sensitive edits pass WITHOUT any reason (no regression on plain renames)', async () => {
      const create = jest.fn().mockResolvedValue({ id: 1 });
      const controller = makeOrgStructureController({ create });
      await expect(controller.create({ name: 'Just a rename' })).resolves.toBeDefined();
      expect(create).toHaveBeenCalledTimes(1);
    });
  });

  describe('OrgStructureController.update() — same gate applied via .partial()', () => {
    it('rejects a currentState change with no reason', async () => {
      const controller = makeOrgStructureController();
      await expect(controller.update(7, { currentState: 'frozen' })).rejects.toBeInstanceOf(ZodError);
    });

    it('rejects a headUserId change with an empty-string reason', async () => {
      const controller = makeOrgStructureController();
      await expect(controller.update(7, { headUserId: 3, reason: '' })).rejects.toBeInstanceOf(ZodError);
    });

    it('accepts a currentState change WHEN reason is supplied, and threads it through to the service', async () => {
      const update = jest.fn().mockResolvedValue({ id: 7, currentState: 'frozen' });
      const controller = makeOrgStructureController({ update });
      await expect(
        controller.update(7, { currentState: 'frozen', reason: "Muzlatildi — HR buyrug'i" }),
      ).resolves.toBeDefined();
      expect(update).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ currentState: 'frozen', reason: "Muzlatildi — HR buyrug'i" }),
      );
    });

    it('leaves non-sensitive partial updates unaffected (no reason required)', async () => {
      const update = jest.fn().mockResolvedValue({ id: 7, name: 'Renamed' });
      const controller = makeOrgStructureController({ update });
      await expect(controller.update(7, { name: 'Renamed' })).resolves.toBeDefined();
      expect(update).toHaveBeenCalledTimes(1);
    });
  });

  describe('CardController.freeze() — CardFreezeSchema.reason is now z.string().min(3), not optional', () => {
    it('rejects a freeze request with no reason field at all', async () => {
      const controller = makeCardController();
      await expect(controller.freeze(1, { until: null })).rejects.toBeInstanceOf(ZodError);
    });

    it('rejects a freeze request with a reason under 3 characters', async () => {
      const controller = makeCardController();
      await expect(controller.freeze(1, { reason: 'ab' })).rejects.toBeInstanceOf(ZodError);
    });

    it('rejects a freeze request with a null reason (the old "no reason" escape hatch)', async () => {
      const controller = makeCardController();
      await expect(controller.freeze(1, { reason: null })).rejects.toBeInstanceOf(ZodError);
    });

    it('accepts a freeze request with a >=3 character reason and forwards it to the service unchanged', async () => {
      const freezeCard = jest.fn().mockResolvedValue({ ok: true, data: { id: 1, status: 'frozen' } });
      const controller = makeCardController(freezeCard);
      await expect(controller.freeze(1, { reason: "Ishdan bo'shatildi" })).resolves.toEqual({
        id: 1,
        status: 'frozen',
      });
      expect(freezeCard).toHaveBeenCalledWith(1, "Ishdan bo'shatildi", null);
    });
  });
});
