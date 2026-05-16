/**
 * test/logistics/complete-delivery.handler.spec.ts
 * Unit tests for CompleteDeliveryHandler. EventBus is mocked.
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
import { CompleteDeliveryHandler } from '../../src/modules/logistics/application/commands/complete-delivery.handler';
import { CompleteDeliveryCommand } from '../../src/modules/logistics/application/commands/dispatch-delivery.command';
import { DeliveryCompletedEvent } from '../../src/modules/logistics/domain/events';

interface BusMock { publish: jest.Mock }
function makeBus(): BusMock { return { publish: jest.fn() }; }

describe('CompleteDeliveryHandler', () => {
  let handler: CompleteDeliveryHandler;
  let bus: BusMock;

  beforeEach(async () => {
    bus = makeBus();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CompleteDeliveryHandler,
        { provide: EventBus, useValue: bus },
      ],
    }).compile();
    handler = moduleRef.get(CompleteDeliveryHandler);
  });

  it('returns Ok with the deliveryId when invoked', async () => {
    const r = await handler.execute(new CompleteDeliveryCommand('d-1', 99));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBe('d-1');
  });

  it('publishes DeliveryCompletedEvent with deliveryId + orderId when invoked', async () => {
    await handler.execute(new CompleteDeliveryCommand('d-1', 99));

    expect(bus.publish).toHaveBeenCalledTimes(1);
    const ev = bus.publish.mock.calls[0][0] as DeliveryCompletedEvent;
    expect(ev).toBeInstanceOf(DeliveryCompletedEvent);
    expect(ev.deliveryId).toBe('d-1');
    expect(ev.orderId).toBe(99);
  });

  it('emits one event per invocation when called twice', async () => {
    await handler.execute(new CompleteDeliveryCommand('d-1', 1));
    await handler.execute(new CompleteDeliveryCommand('d-2', 2));

    expect(bus.publish).toHaveBeenCalledTimes(2);
  });

  it('passes through command values verbatim when constructed by caller', async () => {
    const r = await handler.execute(new CompleteDeliveryCommand('uuid-xx', 123));

    const ev = bus.publish.mock.calls[0][0] as DeliveryCompletedEvent;
    expect(r.ok).toBe(true);
    expect(ev.orderId).toBe(123);
    expect(ev.deliveryId).toBe('uuid-xx');
  });
});
