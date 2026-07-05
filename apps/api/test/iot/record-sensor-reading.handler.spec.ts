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
import { TELEGRAM_SENDER } from '../../src/modules/notifications/domain/ports/i-telegram-sender.port';
import { SENSOR_REPO } from '../../src/modules/iot/domain/repositories/i-sensor.repo';
import { Ok, Err } from '../../src/common/result';

interface TelegramMock {
  sendAlert: jest.Mock;
}

function makeSensorRepoMock() {
  return {
    saveReading: jest.fn().mockResolvedValue(Ok({ id: 'reading-1' })),
    // M6 (2026-07-05): detectAnomaly() now calls findDeviceById() to read
    // per-device min/max thresholds. Default: device has none configured,
    // so behavior falls back to the flat 90 threshold these existing tests
    // already assert -- individual tests override this to prove the
    // per-device threshold actually takes precedence when configured.
    findDeviceById: jest.fn().mockResolvedValue(Ok({ thresholds: undefined })),
    findAllDevices: jest.fn(),
    saveDevice: jest.fn(),
    updateDevice: jest.fn(),
    findReadings: jest.fn(),
    findAnomalies: jest.fn(),
    existsByCode: jest.fn(),
    registerDevice: jest.fn(),
    updateThresholds: jest.fn(),
  };
}

async function build(
  bus: EventBus,
  telegram: TelegramMock,
  sensorRepo: ReturnType<typeof makeSensorRepoMock> = makeSensorRepoMock(),
): Promise<RecordSensorReadingHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      RecordSensorReadingHandler,
      { provide: EventBus, useValue: bus },
      { provide: TELEGRAM_SENDER, useValue: telegram },
      // Handler now persists readings via SENSOR_REPO (Leverage #6 fix)
      { provide: SENSOR_REPO, useValue: sensorRepo },
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

  it('M6: uses the device\'s own max threshold instead of the flat 90 default', async () => {
    const publish = jest.fn();
    const telegram: TelegramMock = { sendAlert: jest.fn().mockResolvedValue(undefined) };
    const repo = makeSensorRepoMock();
    // Humidity sensor configured with max=50 -- a value of 60 must trip anomaly
    // even though it's well under the generic 90 default.
    repo.findDeviceById.mockResolvedValue(Ok({ thresholds: { min: 10, max: 50 } }));
    const handler = await build({ publish } as unknown as EventBus, telegram, repo);

    await handler.execute(new RecordSensorReadingCommand('dev-humid', 'mach-3', 60, '%'));

    expect(publish).toHaveBeenCalledTimes(1);
  });

  it('M6: a value under 90 that is still below the device\'s own min threshold is an anomaly', async () => {
    const publish = jest.fn();
    const telegram: TelegramMock = { sendAlert: jest.fn().mockResolvedValue(undefined) };
    const repo = makeSensorRepoMock();
    repo.findDeviceById.mockResolvedValue(Ok({ thresholds: { min: 10, max: 50 } }));
    const handler = await build({ publish } as unknown as EventBus, telegram, repo);

    await handler.execute(new RecordSensorReadingCommand('dev-humid', 'mach-3', 5, '%'));

    expect(publish).toHaveBeenCalledTimes(1);
  });

  it('M6: falls back to the flat 90 default when findDeviceById errors', async () => {
    const publish = jest.fn();
    const telegram: TelegramMock = { sendAlert: jest.fn().mockResolvedValue(undefined) };
    const repo = makeSensorRepoMock();
    repo.findDeviceById.mockResolvedValue(Err({ code: 'NOT_FOUND', message: 'no device' }));
    const handler = await build({ publish } as unknown as EventBus, telegram, repo);

    await handler.execute(new RecordSensorReadingCommand('dev-missing', 'mach-3', 120, 'C'));

    expect(publish).toHaveBeenCalledTimes(1);
  });
});
