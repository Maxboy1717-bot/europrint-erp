/**
 * test/crm/crm-bitrix-compat-invoice-id.spec.ts
 *
 * Pass-2 re-scan find: invoices.id is a uuid, but the compat controller did
 * `parseInt(id, 10) || 0` on it — parseInt('61566977-...') -> NaN -> 0, then the
 * repo bound eq(invoices.id, '0') which threw "invalid syntax for uuid" (500), so
 * PATCH /invoices/:id/stage and DELETE /invoices/:id never touched the intended row.
 * The controller now passes the raw uuid string through. This pins that.
 */

import { CrmBitrixCompatController } from '../../src/modules/crm/presentation/crm-bitrix-compat.controller';
import { Ok } from '../../src/common/result';

const UUID = '61566977-329e-41d8-b6bf-29438d403e19';

describe('CrmBitrixCompatController — invoice uuid id passthrough', () => {
  it('forwards the raw uuid to updateInvoiceStage (not parseInt->0)', async () => {
    const svc = {
      updateInvoiceStage: jest.fn().mockResolvedValue(Ok({ id: UUID, status: 'paid' })),
    };
    const ctrl = new CrmBitrixCompatController(svc as never);
    await ctrl.updateInvoiceStage(UUID, { status: 'paid' });
    expect(svc.updateInvoiceStage).toHaveBeenCalledWith(UUID, 'paid');
  });

  it('forwards the raw uuid to deleteInvoice (not parseInt->0)', async () => {
    const svc = {
      deleteInvoice: jest.fn().mockResolvedValue(Ok({ deleted: true })),
    };
    const ctrl = new CrmBitrixCompatController(svc as never);
    await ctrl.deleteInvoice(UUID);
    expect(svc.deleteInvoice).toHaveBeenCalledWith(UUID);
  });
});
