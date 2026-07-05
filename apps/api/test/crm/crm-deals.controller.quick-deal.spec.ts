/**
 * B14 (2026-07-05): createQuickDeal() never threaded the authenticated user's id
 * into DealsService.create(), leaving crm_deals/deals.created_by_id NULL for every
 * quick-created deal (confirmed live: 1/5 rows had created_by_id NULL, matching the
 * DEAL-<timestamp> quick-create title pattern). This test proves the fix.
 */
import { CrmDealsController } from '@modules/crm/presentation/crm-deals.controller';

describe('CrmDealsController.createQuickDeal', () => {
  function buildController(createSpy: jest.Mock) {
    const dealsService = { create: createSpy } as unknown as ConstructorParameters<typeof CrmDealsController>[2];
    return new CrmDealsController(
      {} as ConstructorParameters<typeof CrmDealsController>[0],
      {} as ConstructorParameters<typeof CrmDealsController>[1],
      dealsService,
      {} as ConstructorParameters<typeof CrmDealsController>[3],
    );
  }

  it('passes the authenticated user id as createdBy into DealsService.create', async () => {
    const createSpy = jest.fn().mockResolvedValue({ ok: true, data: { id: 'deal-1' } });
    const controller = buildController(createSpy);

    await controller.createQuickDeal(
      { customerName: 'Test Mijoz', amount: 100, companyId: 7 },
      { id: 42 } as unknown as Parameters<typeof controller.createQuickDeal>[1],
    );

    expect(createSpy).toHaveBeenCalledTimes(1);
    const [, createdBy] = createSpy.mock.calls[0];
    expect(createdBy).toBe(42);
  });

  it('still creates the deal when companyId/amount are the only fields supplied', async () => {
    const createSpy = jest.fn().mockResolvedValue({ ok: true, data: { id: 'deal-2' } });
    const controller = buildController(createSpy);

    await controller.createQuickDeal(
      { companyId: 3 },
      { id: 7 } as unknown as Parameters<typeof controller.createQuickDeal>[1],
    );

    const [dto, createdBy] = createSpy.mock.calls[0];
    expect(dto.companyId).toBe(3);
    expect(createdBy).toBe(7);
  });
});
