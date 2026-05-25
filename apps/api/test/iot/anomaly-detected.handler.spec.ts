/**
 * test/iot/anomaly-detected.handler.spec.ts
 *
 * Unit tests for AnomalyDetectedHandler. The handler currently only logs the
 * event; we verify it accepts every event shape without throwing and exercise
 * the logger side-effect via a spy.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
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

  it('logs an error entry containing the deviceId and anomaly type', async () => {
    const handler = await build();
    const spy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
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
