/**
 * test/mm/mm-purchase-orders.controller.security.spec.ts
 *
 * PHASE 0 security fix: the MM purchase-order SoD control (creator != approver) compared two
 * CLIENT-SUPPLIED numbers — createPo read `createdBy` and approvePo read `approvedBy` from the
 * request body (the FE even hard-coded createdBy:1). Any caller could send two arbitrary ids
 * and defeat the control regardless of who was logged in. Fixed to derive BOTH ids from the
 * authenticated session (@CurrentUser). These tests pin that the command actor ids come from the
 * session and NOT the body, and that the (previously-unwired) Zod schema validates the real
 * contract. The SoD comparison itself is covered by approve-purchase-order.handler.spec.ts.
 */

import { MmPurchaseOrdersController } from '../../src/modules/mm/presentation/mm-purchase-orders.controller';
import { CreatePurchaseOrderCommand } from '../../src/modules/mm/application/commands/create-purchase-order.handler';
import { ApprovePurchaseOrderCommand } from '../../src/modules/mm/application/commands/approve-purchase-order.handler';
import { MmCreatePurchaseOrderSchema } from '../../src/modules/mm/dto/mm.dto';
import { Ok } from '../../src/common/result';

function make() {
  const commandBus = { execute: jest.fn().mockResolvedValue(Ok({ id: 1 })) };
  const i18n = { t: jest.fn() };
  const ctrl = new MmPurchaseOrdersController(commandBus as never, i18n as never);
  return { ctrl, commandBus };
}
const VALID_BODY = { supplierId: 100, items: [{ materialId: 5, quantity: 10, unitPrice: 1000 }] };

describe('MmPurchaseOrdersController — SoD actor ids come from the session (security)', () => {
  it('createPo sets createdBy from @CurrentUser, never from the body', async () => {
    const { ctrl, commandBus } = make();
    await ctrl.createPo(VALID_BODY as never, { id: 42 } as never);
    const cmd = commandBus.execute.mock.calls[0][0] as CreatePurchaseOrderCommand;
    expect(cmd).toBeInstanceOf(CreatePurchaseOrderCommand);
    expect(cmd.createdBy).toBe(42);
    // a smuggled body createdBy is ignored
    await ctrl.createPo({ ...VALID_BODY, createdBy: 999 } as never, { id: 42 } as never);
    expect((commandBus.execute.mock.calls[1][0] as CreatePurchaseOrderCommand).createdBy).toBe(42);
  });

  it('approvePo sets approvedBy from @CurrentUser, never from the body', async () => {
    const { ctrl, commandBus } = make();
    await ctrl.approvePo(1 as never, { id: 7 } as never);
    const cmd = commandBus.execute.mock.calls[0][0] as ApprovePurchaseOrderCommand;
    expect(cmd).toBeInstanceOf(ApprovePurchaseOrderCommand);
    expect(cmd.approvedBy).toBe(7);
    expect(cmd.poId).toBe(1);
  });

  describe('MmCreatePurchaseOrderSchema (now wired via ZodValidationPipe)', () => {
    it('accepts the real camelCase body', () => {
      expect(MmCreatePurchaseOrderSchema.safeParse(VALID_BODY).success).toBe(true);
    });
    it('rejects a malformed body (missing supplierId)', () => {
      expect(MmCreatePurchaseOrderSchema.safeParse({ items: VALID_BODY.items }).success).toBe(false);
    });
    it('rejects an empty items array', () => {
      expect(MmCreatePurchaseOrderSchema.safeParse({ supplierId: 100, items: [] }).success).toBe(false);
    });
    it('strips a smuggled createdBy (not part of the schema)', () => {
      const r = MmCreatePurchaseOrderSchema.safeParse({ ...VALID_BODY, createdBy: 999 });
      expect(r.success).toBe(true);
      if (r.success) expect((r.data as Record<string, unknown>).createdBy).toBeUndefined();
    });
  });
});
