/**
 * test/pp/pp-reason-codes.controller.spec.ts
 *
 * Controller-boundary test for the PP reason-code catalog endpoints
 * (GET/POST/PATCH /api/pp/reason-codes). The controller is transport-only
 * (Rule 6): validate the Zod DTO, delegate to PpReasonCodesService, unwrap the
 * Result. The repo SQL/behaviour is covered by pp-reason-codes.repo.spec.ts;
 * these tests prove the delegation + the DTO gate (esp. the required `category`).
 */

import { PpReasonCodesController } from '../../src/modules/pp/reason-codes/pp-reason-codes.controller';
import type { PpReasonCodesService } from '../../src/modules/pp/reason-codes/pp-reason-codes.service';

function build(overrides: Record<string, unknown> = {}) {
  const svc = {
    findActive: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    create: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    update: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    ...overrides,
  } as unknown as jest.Mocked<PpReasonCodesService>;
  return { ctrl: new PpReasonCodesController(svc), svc };
}

describe('PpReasonCodesController', () => {
  it('list wraps the active codes in an {items,total} envelope', async () => {
    const { ctrl } = build({
      findActive: jest.fn().mockResolvedValue({ ok: true, data: [{ id: 1, code: 'A' }, { id: 2, code: 'B' }] }),
    });
    expect(await ctrl.list()).toEqual({ items: [{ id: 1, code: 'A' }, { id: 2, code: 'B' }], total: 2 });
  });

  it('list returns an honest empty envelope when no codes exist (Q-40)', async () => {
    const { ctrl } = build();
    expect(await ctrl.list()).toEqual({ items: [], total: 0 });
  });

  it('create parses the DTO and delegates to the service', async () => {
    const { ctrl, svc } = build();
    await ctrl.create({ code: 'DELAY', name: 'Kechikish', category: 'delay' });
    expect(svc.create).toHaveBeenCalledWith({ code: 'DELAY', name: 'Kechikish', category: 'delay' });
  });

  it('create rejects a body missing the required category (NOT NULL column) before the service', async () => {
    const { ctrl, svc } = build();
    await expect(ctrl.create({ code: 'X', name: 'Y' })).rejects.toBeDefined();
    expect(svc.create).not.toHaveBeenCalled();
  });

  it('update rejects an empty patch (Zod refine) before the service', async () => {
    const { ctrl, svc } = build();
    await expect(ctrl.update(1, {})).rejects.toBeDefined();
    expect(svc.update).not.toHaveBeenCalled();
  });

  it('update surfaces a not-found Result as a thrown 404', async () => {
    const { ctrl } = build({
      update: jest.fn().mockResolvedValue({ ok: false, error: { code: 'NOT_FOUND', message: 'topilmadi' } }),
    });
    await expect(ctrl.update(99, { is_active: false })).rejects.toBeDefined();
  });
});
