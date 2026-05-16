/**
 * test/iot/record-sensor-reading.handler.spec.ts
 *
 * Unit tests for RecordSensorReadingHandler. EventBus and TelegramService mocked,
 * SensorReading aggregate is real.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { RecordSensorReadingHandler } from '../../src/modules/iot/application/commands/record-sensor-reading.handler';
import { RecordSensorReadingCommand } from '../../src/modules/iot/application/commands/record-sensor-reading.command';
import { AnomalyDetectedEvent } from '../../src/modules/iot/domain/events';
import { TelegramService } from '../../src/modules/notifications/domain/services/telegram.service';

interface TelegramMock {
  sendAlert: jest.Mock;
}

async function build(bus: EventBus, telegram: TelegramMock): Promise<RecordSensorReadingHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      RecordSensorReadingHandler,
      { provide: EventBus, useValue: bus },
      { provide: TelegramService, useValue: telegram },
    ],
  }).compile();
  return module.get(RecordSensorReadingHandler);
}

describe('RecordSensorReadingHandler', () => {
  it('returns Ok with the reading id when value is within threshold', async () => {
    const publish = jest.fn();
    const telegram: TelegramMock = { sendAlert: jest.fn().mockResolvedValue(undefined) };
    const handler = await build({ publish } as unknown as EventBus, telegram);

    const r = await handler.execute(new RecordSensorReadingCommand('dev-1', 'mach-1', 50, 'C'));

    expect(r.ok).toBe(true);
    expect(publish).not.toHaveBeenCalled();
    expect(telegram.sendAlert).not.toHaveBeenCalled();
  });

  it('publishes AnomalyDetectedEvent when value exceeds threshold', async () => {
    const publish = jest.fn();
    const telegram: TelegramMock = { sendAlert: jest.fn().mockResolvedValue(undefined) };
    const handler = await build({ publish } as unknown as EventBus, telegram);

    await handler.execute(new RecordSensorReadingCommand('dev-1', 'mach-9', 120, 'C'));

    expect(publish).toHaveBeenCalledTimes(1);
    expect(publish.mock.calls[0][0]).toBeInstanceOf(AnomalyDetectedEvent);
  });

  it('sends a Telegram alert when an anomaly is detected', async () => {
    const publish = jest.fn();
    const telegram: TelegramMock = { sendAlert: jest.fn().mockResolvedValue(undefined) };
    const handler = await build({ publish } as unknown as EventBus, telegram);

    await handler.execute(new RecordSensorReadingCommand('dev-1', 'mach-9', 120, 'C'));

    expect(telegram.sendAlert).toHaveBeenCalledTimes(1);
    expect(telegram.sendAlert.mock.calls[0][0]).toBe('iot_channel');
  });

  it('does not publish or alert when value equals the threshold of 90', async () => {
    const publish = jest.fn();
    const telegram: TelegramMock = { sendAlert: jest.fn().mockResolvedValue(undefined) };
    const handler = await build({ publish } as unknown as EventBus, telegram);

    const r = await handler.execute(new RecordSensorReadingCommand('dev-1', 'mach-1', 90, 'C'));

    expect(r.ok).toBe(true);
    expect(publish).not.toHaveBeenCalled();
    expect(telegram.sendAlert).not.toHaveBeenCalled();
  });

  it('returns Ok and forwards machineId+value into the published event', async () => {
    const publish = jest.fn();
    const telegram: TelegramMock = { sendAlert: jest.fn().mockResolvedValue(undefined) };
    const handler = await build({ publish } as unknown as EventBus, telegram);

    await handler.execute(new RecordSensorReadingCommand('dev-2', 'mach-7', 150, 'C'));

    const evt = publish.mock.calls[0][0] as AnomalyDetectedEvent;
    expect(evt.machineId).toBe('mach-7');
    expect(evt.value).toBe(150);
    expect(evt.deviceId).toBe('dev-2');
  });
});
