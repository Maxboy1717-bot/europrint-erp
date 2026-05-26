/**
 * test/design/request-design.handler.spec.ts
 * Unit tests for RequestDesignHandler. EventBus + TelegramService are mocked; DesignOrder real.
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
import { RequestDesignHandler } from '../../src/modules/design/application/commands/request-design.handler';
import { RequestDesignCommand } from '../../src/modules/design/application/commands/request-design.command';
import { DesignRequestedEvent } from '../../src/modules/design/domain/events';
import { TELEGRAM_SENDER } from '../../src/modules/notifications/domain/ports/i-telegram-sender.port';

interface BusMock { publish: jest.Mock }
interface TgMock { sendAlert: jest.Mock }
function makeBus(): BusMock { return { publish: jest.fn() }; }
function makeTg(): TgMock { return { sendAlert: jest.fn().mockResolvedValue(undefined) }; }

describe('RequestDesignHandler', () => {
  let handler: RequestDesignHandler;
  let bus: BusMock;
  let tg: TgMock;

  beforeEach(async () => {
    bus = makeBus();
    tg = makeTg();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        RequestDesignHandler,
        { provide: EventBus, useValue: bus },
        { provide: TELEGRAM_SENDER, useValue: tg },
      ],
    }).compile();
    handler = moduleRef.get(RequestDesignHandler);
  });

  it('returns Ok with a generated UUID when design is requested', async () => {
    const r = await handler.execute(new RequestDesignCommand(11, 22, 'desc', 99));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('sends Telegram alert to design_team channel when invoked', async () => {
    await handler.execute(new RequestDesignCommand(11, 22, 'desc', 99));

    expect(tg.sendAlert).toHaveBeenCalledTimes(1);
    expect(tg.sendAlert).toHaveBeenCalledWith(
      'design_team',
      expect.stringContaining('#11'),
    );
  });

  it('publishes DesignRequestedEvent with salesOrderId + customerId when invoked', async () => {
    const r = await handler.execute(new RequestDesignCommand(11, 22, 'desc', 99));

    expect(bus.publish).toHaveBeenCalledTimes(1);
    const ev = bus.publish.mock.calls[0][0] as DesignRequestedEvent;
    expect(ev).toBeInstanceOf(DesignRequestedEvent);
    expect(ev.salesOrderId).toBe(11);
    expect(ev.customerId).toBe(99);
    if (r.ok) expect(ev.designOrderId).toBe(r.data);
  });

  it('returns different UUIDs across two separate requests when invoked twice', async () => {
    const r1 = await handler.execute(new RequestDesignCommand(1, 1, 'a', 1));
    const r2 = await handler.execute(new RequestDesignCommand(1, 1, 'a', 1));

    expect(r1.ok && r2.ok).toBe(true);
    if (r1.ok && r2.ok) expect(r1.data).not.toBe(r2.data);
  });
});
