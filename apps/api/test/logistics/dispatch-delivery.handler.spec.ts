/**
 * test/logistics/dispatch-delivery.handler.spec.ts
 * Unit tests for DispatchDeliveryHandler. EventBus + TelegramService are mocked.
 */

let _uuidCnt = 0;
jest.mock('uuid', () => ({
  v4: () => {
    const n = (++_uuidCnt).toString(16).padStart(8, '0');
    return `${n}-0000-4000-8000-000000000000`;
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { DispatchDeliveryHandler } from '../../src/modules/logistics/application/commands/dispatch-delivery.handler';
import { DispatchDeliveryCommand } from '../../src/modules/logistics/application/commands/dispatch-delivery.command';
import { DeliveryDispatchedEvent } from '../../src/modules/logistics/domain/events';
import { TelegramService } from '../../src/modules/notifications/domain/services/telegram.service';

interface BusMock { publish: jest.Mock }
interface TgMock { sendAlert: jest.Mock; sendMessage?: jest.Mock }
function makeBus(): BusMock { return { publish: jest.fn() }; }
function makeTg(): TgMock {
  return { sendAlert: jest.fn().mockResolvedValue(undefined), sendMessage: jest.fn() };
}

describe('DispatchDeliveryHandler', () => {
  let handler: DispatchDeliveryHandler;
  let bus: BusMock;
  let tg: TgMock;

  beforeEach(async () => {
    bus = makeBus();
    tg = makeTg();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        DispatchDeliveryHandler,
        { provide: EventBus, useValue: bus },
        { provide: TelegramService, useValue: tg },
      ],
    }).compile();
    handler = moduleRef.get(DispatchDeliveryHandler);
  });

  it('returns Ok with deliveryId when invoked', async () => {
    const r = await handler.execute(new DispatchDeliveryCommand('d-1', 11, 7));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBe('d-1');
  });

  it('sends a Telegram alert to driver when invoked', async () => {
    await handler.execute(new DispatchDeliveryCommand('d-1', 11, 7));

    expect(tg.sendAlert).toHaveBeenCalledTimes(1);
    expect(tg.sendAlert).toHaveBeenCalledWith(
      'driver_7',
      expect.stringContaining('#11'),
    );
  });

  it('publishes DeliveryDispatchedEvent with all three ids when invoked', async () => {
    await handler.execute(new DispatchDeliveryCommand('d-1', 11, 7));

    expect(bus.publish).toHaveBeenCalledTimes(1);
    const ev = bus.publish.mock.calls[0][0] as DeliveryDispatchedEvent;
    expect(ev).toBeInstanceOf(DeliveryDispatchedEvent);
    expect(ev.deliveryId).toBe('d-1');
    expect(ev.orderId).toBe(11);
    expect(ev.driverId).toBe(7);
  });

  it('awaits Telegram delivery before publishing the event when invoked', async () => {
    let alertResolved = false;
    tg.sendAlert.mockImplementation(async () => { alertResolved = true; });
    bus.publish.mockImplementation(() => {
      expect(alertResolved).toBe(true);
    });

    await handler.execute(new DispatchDeliveryCommand('d-1', 11, 7));

    expect(tg.sendAlert).toHaveBeenCalledTimes(1);
    expect(bus.publish).toHaveBeenCalledTimes(1);
  });
});
