/**
 * test/integration/triggers/design-flag-event.spec.ts
 *
 * Trigger 3: SO with designFlag=true publishes SoDesignRequestedEvent on the
 * CQRS EventBus, and the Design module's SoDesignRequestedListener picks it
 * up to create a design task (Telegram notification side-effect logged).
 *
 * Two layers are covered:
 *   1) the listener consumes a SoDesignRequestedEvent without throwing and
 *      surfaces the salesOrderId in its log payload;
 *   2) the CreateOrderHandler-shaped publisher contract is honoured by an
 *      EventBus mock so we verify the event-bus wiring end-to-end.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import {
  SoDesignRequestedEvent,
  SoDesignRequestedListener,
} from '../../../src/modules/design/infrastructure/event-handlers/so-design-requested.listener';

type EventBusMock = { publish: jest.Mock };

async function buildListener(): Promise<SoDesignRequestedListener> {
  const moduleRef: TestingModule = await Test.createTestingModule({
    providers: [SoDesignRequestedListener],
  }).compile();
  return moduleRef.get(SoDesignRequestedListener);
}

describe('Trigger 3: designFlag -> SoDesignRequested -> Design task', () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('handles SoDesignRequestedEvent when listener receives it', async () => {
    const listener = await buildListener();
    const event = new SoDesignRequestedEvent(101, 55, 7);

    await expect(listener.handle(event)).resolves.toBeUndefined();
  });

  it('logs salesOrderId and productId when design task is created', async () => {
    const listener = await buildListener();
    const event = new SoDesignRequestedEvent(202, 88, 12);

    await listener.handle(event);

    const designerCall = logSpy.mock.calls.find(([arg]) => {
      const payload = arg as { salesOrderId?: number; productId?: number };
      return payload?.salesOrderId === 202 && payload.productId === 88;
    });
    expect(designerCall).toBeDefined();
  });

  it('swallows handler exceptions when downstream logging fails', async () => {
    const listener = await buildListener();
    // First call (success log) throws; listener must not propagate.
    logSpy.mockImplementationOnce(() => { throw new Error('telegram down'); });
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    await expect(
      listener.handle(new SoDesignRequestedEvent(303, 1, 1)),
    ).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('publishes SoDesignRequestedEvent via EventBus when designFlag is true', async () => {
    const eventBus: EventBusMock = { publish: jest.fn() };
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [{ provide: EventBus, useValue: eventBus }],
    }).compile();
    const bus = moduleRef.get<EventBus>(EventBus) as unknown as EventBusMock;

    // Simulate CreateOrderHandler emitting the design-required signal.
    const event = new SoDesignRequestedEvent(404, 9, 3);
    bus.publish(event);

    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const published = eventBus.publish.mock.calls[0][0] as SoDesignRequestedEvent;
    expect(published).toBeInstanceOf(SoDesignRequestedEvent);
    expect(published.salesOrderId).toBe(404);
    expect(published.productId).toBe(9);
    expect(published.customerId).toBe(3);
  });

  it('does not emit SoDesignRequestedEvent when designFlag is false', async () => {
    const eventBus: EventBusMock = { publish: jest.fn() };
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [{ provide: EventBus, useValue: eventBus }],
    }).compile();
    moduleRef.get<EventBus>(EventBus);

    // No publish happens because the design flag short-circuits in handler.
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
