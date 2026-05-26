/**
 * test/integration/triggers/deal-won-to-so.spec.ts
 *
 * Trigger 2: DealWonEvent (CRM) → DealWonListener (SD) → CreateOrderCommand.
 * CommandBus and EventEmitter2 are mocked; the listener is wired through a
 * NestJS testing module so DI mirrors production.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DealWonListener } from '../../../src/modules/sd/infrastructure/event-handlers/deal-won.listener';
import { DealWonEvent } from '../../../src/modules/crm/domain/events/deal-won.event';
import { CreateOrderCommand } from '../../../src/modules/sd/application/commands/create-order.handler';

type CommandBusMock = { execute: jest.Mock };
type EventEmitterMock = { emit: jest.Mock };

function makeEvent(overrides: Partial<DealWonEvent> = {}): DealWonEvent {
  const evt = new DealWonEvent(
    overrides.dealId ?? 100,
    overrides.companyId ?? 5,
    overrides.totalAmount ?? 1_000_000,
    overrides.assignedTo ?? 7,
    overrides.currency ?? 'UZS',
  );
  return evt;
}

describe('Trigger 2: DealWon -> SalesOrder', () => {
  let listener: DealWonListener;
  let commandBus: CommandBusMock;
  let emitter: EventEmitterMock;

  beforeEach(async () => {
    commandBus = { execute: jest.fn() };
    emitter = { emit: jest.fn() };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        DealWonListener,
        { provide: CommandBus, useValue: commandBus },
        { provide: EventEmitter2, useValue: emitter },
      ],
    }).compile();

    listener = moduleRef.get(DealWonListener);
  });

  it('dispatches CreateOrderCommand when DealWonEvent is received', async () => {
    commandBus.execute.mockResolvedValue({
      ok: true,
      data: { getId: () => 555 },
    });

    await listener.handle(makeEvent({ companyId: 42, totalAmount: 2_500_000 }));

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const cmd: CreateOrderCommand = commandBus.execute.mock.calls[0][0];
    expect(cmd).toBeInstanceOf(CreateOrderCommand);
    expect(cmd.companyId).toBe(42);
    expect(cmd.totalAmount).toBe(2_500_000);
    expect(cmd.dealId).toBe(100);
  });

  it('forwards dealId and assignedTo when CreateOrderCommand is built', async () => {
    commandBus.execute.mockResolvedValue({
      ok: true,
      data: { getId: () => 1 },
    });

    await listener.handle(makeEvent({ dealId: 909, assignedTo: 13 }));

    const cmd: CreateOrderCommand = commandBus.execute.mock.calls[0][0];
    expect(cmd.dealId).toBe(909);
    expect(cmd.createdBy).toBe(13);
  });

  it('defaults currency to UZS when DealWonEvent omits currency', async () => {
    commandBus.execute.mockResolvedValue({ ok: true, data: { getId: () => 1 } });

    const evt = new DealWonEvent(100, 5, 1_000_000, 7);
    // Force-undefined currency simulates legacy publishers
    (evt as unknown as { currency: string | undefined }).currency = undefined;

    await listener.handle(evt);

    const cmd: CreateOrderCommand = commandBus.execute.mock.calls[0][0];
    expect(cmd.currency).toBe('UZS');
  });

  it('swallows CommandBus exception when execute rejects', async () => {
    commandBus.execute.mockRejectedValue(new Error('DB down'));

    await expect(listener.handle(makeEvent())).resolves.toBeUndefined();
    expect(commandBus.execute).toHaveBeenCalledTimes(1);
  });

  it('records error path when CommandBus returns ok=false', async () => {
    commandBus.execute.mockResolvedValue({
      ok: false,
      error: { code: 'DB_ERROR', message: 'save failed' },
    });

    await listener.handle(makeEvent({ dealId: 77 }));

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    // EventEmitter2 is injected but listener only uses CommandBus on this path —
    // verifying no extra fan-out is dispatched on failure.
    expect(emitter.emit).not.toHaveBeenCalled();
  });
});
