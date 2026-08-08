/**
 * CRM module 13 — deal-lost transition (controller boundary).
 *
 * Before this route existed a deal could be marked WON (PATCH :id/won) but never LOST:
 * MarkDealLostHandler/Command were registered but no route dispatched the command, so the
 * loss-reason rollup stayed permanently empty. These tests pin the new PATCH :id/lost route:
 *   - parses the required reason (Zod: min 3 chars),
 *   - dispatches MarkDealLostCommand with the live uuid STRING id (NOT Number(uuid)=NaN),
 *   - does NOT pass the owner-gated lostReasonId (structured taxonomy column absent),
 *   - rejects a missing / too-short reason BEFORE any dispatch.
 * Mirrors crm-deals.controller.quick-deal.spec.ts (direct construction, positional args).
 */
import { CrmDealsController } from '@modules/crm/presentation/crm-deals.controller';
import { MarkDealLostCommand } from '@modules/crm/application/commands/mark-deal-lost.handler';

describe('CrmDealsController.markLost', () => {
  const UUID = '2b3d7a14-c41d-4088-9241-af5b0e655e34';

  function buildController(executeSpy: jest.Mock) {
    const commandBus = { execute: executeSpy } as unknown as ConstructorParameters<typeof CrmDealsController>[0];
    return new CrmDealsController(
      commandBus,
      {} as ConstructorParameters<typeof CrmDealsController>[1],
      {} as ConstructorParameters<typeof CrmDealsController>[2],
      {} as ConstructorParameters<typeof CrmDealsController>[3],
    );
  }

  it('dispatches MarkDealLostCommand with the uuid string id and the parsed reason', async () => {
    const executeSpy = jest.fn().mockResolvedValue({ ok: true, data: undefined });
    const controller = buildController(executeSpy);

    await controller.markLost(UUID, { reason: 'Narx yuqori' });

    expect(executeSpy).toHaveBeenCalledTimes(1);
    const cmd = executeSpy.mock.calls[0][0] as MarkDealLostCommand;
    expect(cmd).toBeInstanceOf(MarkDealLostCommand);
    // the uuid is threaded through as a string — never Number(uuid) = NaN
    expect(cmd.dealId).toBe(UUID);
    expect(typeof cmd.dealId).toBe('string');
    expect(Number.isNaN(Number(cmd.dealId))).toBe(true); // proves it is a non-numeric uuid, not coerced
    expect(cmd.reason).toBe('Narx yuqori');
    // owner-gated Guruh-B taxonomy id is deliberately not supplied by the route
    expect(cmd.lostReasonId).toBeUndefined();
  });

  it('rejects a missing reason before dispatching', async () => {
    const executeSpy = jest.fn();
    const controller = buildController(executeSpy);

    await expect(controller.markLost(UUID, {})).rejects.toBeTruthy();
    expect(executeSpy).not.toHaveBeenCalled();
  });

  it('rejects a too-short reason (< 3 chars) before dispatching', async () => {
    const executeSpy = jest.fn();
    const controller = buildController(executeSpy);

    await expect(controller.markLost(UUID, { reason: 'x' })).rejects.toBeTruthy();
    expect(executeSpy).not.toHaveBeenCalled();
  });
});
