/**
 * test/pp/pp-orders.controller.status.spec.ts
 *
 * Controller-boundary test for PATCH /api/pp/orders/:id/status (EP-PP-082).
 * The controller is transport-only (Rule 6): it validates the DTO (Zod), reads
 * the acting user, delegates to ProductionOrdersService.updateStatus, and
 * unwraps the Result. These tests prove that delegation + the DTO gate; the
 * lifecycle/transition logic itself is covered by production-orders.service.spec.
 */

import { PpOrdersController } from '../../src/modules/pp/presentation/pp-orders.controller';
import type { ProductionOrdersService } from '../../src/modules/pp/production-orders/production-orders.service';
import type { AuthenticatedUser } from '../../src/modules/auth/types';

function build(serviceResult: unknown) {
  const svc = {
    updateStatus: jest.fn().mockResolvedValue(serviceResult),
  } as unknown as jest.Mocked<ProductionOrdersService>;
  // commandBus / queryBus are unused by updateStatus.
  const ctrl = new PpOrdersController({} as never, {} as never, svc);
  return { ctrl, svc };
}

const USER = { id: 7 } as AuthenticatedUser;

describe('PpOrdersController.updateStatus (EP-PP-082 endpoint)', () => {
  it('parses the DTO and forwards id + status + acting user + reason to the service', async () => {
    const { ctrl, svc } = build({ ok: true, data: { id: 5, status: 'confirmed' } });

    const out = await ctrl.updateStatus(
      5 as unknown as number,
      { status: 'confirmed', reason: 'Rejaga muvofiq tasdiqlandi' },
      USER,
    );

    expect(svc.updateStatus).toHaveBeenCalledWith(5, 'confirmed', 7, 'Rejaga muvofiq tasdiqlandi');
    // unwrapOrThrow returns the Result's data on ok.
    expect(out).toEqual({ id: 5, status: 'confirmed' });
  });

  it('rejects a too-short reason at the DTO boundary (Zod min 5) without hitting the service', async () => {
    const { ctrl, svc } = build({ ok: true, data: {} });

    await expect(
      ctrl.updateStatus(5 as unknown as number, { status: 'confirmed', reason: 'no' }, USER),
    ).rejects.toBeDefined();
    expect(svc.updateStatus).not.toHaveBeenCalled();
  });

  it('surfaces a service failure Result as a thrown HTTP error (illegal transition)', async () => {
    const { ctrl } = build({ ok: false, error: { code: 'VALIDATION', message: 'Invalid transition' } });

    await expect(
      ctrl.updateStatus(5 as unknown as number, { status: 'completed', reason: 'noqonuniy sakrash' }, USER),
    ).rejects.toBeDefined();
  });
});
