/**
 * test/iot/anomaly-detected.handler.spec.ts
 *
 * Unit tests for AnomalyDetectedHandler. The handler now persists an iot_alerts
 * row via db.execute. We mock @shared/db so no real DB is needed.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';

// Mock @shared/db before importing the handler so the module-level import is intercepted.
jest.mock('@shared/db', () => ({
  db: {
    execute: jest.fn().mockResolvedValue({ rows: [] }),
  },
}));

import { AnomalyDetectedHandler } from '../../src/modules/iot/infrastructure/event-handlers/anomaly-detected.handler';
import { AnomalyDetectedEvent } from '../../src/modules/iot/domain/events';

async function build(): Promise<AnomalyDetectedHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [AnomalyDetectedHandler],
  }).compile();
  return module.get(AnomalyDetectedHandler);
}

describe('AnomalyDetectedHandler', () => {
  it('handles event without throwing when payload is complete', async () => {
    const handler = await build();
    const ev = new AnomalyDetectedEvent('dev-1', 'mach-1', 'high_value', 150);

    await expect(handler.handle(ev)).resolves.toBeUndefined();
  });

  it('logs a warn entry containing the deviceId and anomaly type on success', async () => {
    // Handler now persists to iot_alerts via db.execute, then calls logger.warn
    // (not logger.error) when the insert succeeds.
    const handler = await build();
    const spy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const ev = new AnomalyDetectedEvent('dev-9', 'mach-9', 'high_value', 200);

    await handler.handle(ev);

    expect(spy).toHaveBeenCalledTimes(1);
    const firstArg = spy.mock.calls[0][0] as { deviceId: string; anomalyType: string };
    expect(firstArg.deviceId).toBe('dev-9');
    expect(firstArg.anomalyType).toBe('high_value');
    spy.mockRestore();
  });

  it('handles event with empty deviceId without throwing', async () => {
    const handler = await build();
    const ev = new AnomalyDetectedEvent('', '', 'unknown', 0);

    await expect(handler.handle(ev)).resolves.toBeUndefined();
  });

  it('handles event with negative value without throwing', async () => {
    const handler = await build();
    const ev = new AnomalyDetectedEvent('dev-1', 'mach-1', 'low_value', -50);

    await expect(handler.handle(ev)).resolves.toBeUndefined();
  });
});
