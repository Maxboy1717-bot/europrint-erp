/**
 * test/iot/anomaly-detected.handler.spec.ts
 *
 * Unit tests for AnomalyDetectedHandler. The handler persists an iot_alerts row
 * via db.execute and looks up per-sensor threshold / the related production
 * session via typedExecute — both @shared/db and @shared/db/typed-execute are
 * mocked so no real DB is needed.
 *
 * VISION-3340 #20 (2026-07-08): severity was hardcoded to 'high' and the handler
 * never touched production_sessions. It now derives severity from the
 * value/threshold ratio (IOT_ANOMALY_CRITICAL_THRESHOLD_RATIO) and, on a
 * CRITICAL breach, additionally dispatches MES's PauseSessionCommand via
 * CommandBus (mirrors IotTabletController.reportProductionDefect's own
 * cross-module CommandBus dispatch — see that controller's
 * iot-tablet.controller.defect-report-tx.spec.ts for the same
 * `{ provide: CommandBus, useValue: { execute: jest.fn() } }` mock shape).
 * These new tests cover both the severity branch and the additive pause
 * dispatch, without weakening the pre-existing no-throw/log coverage above.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

// Mock @shared/db before importing the handler so the module-level import is intercepted.
const mockDbExecute = jest.fn().mockResolvedValue({ rows: [] });
jest.mock('@shared/db', () => ({
  db: {
    execute: mockDbExecute,
  },
}));

// Mock typed-execute so the threshold lookup and the production_sessions lookup
// are fully deterministic (no real Postgres pool from schema.ts).
const mockTypedExecute = jest.fn().mockResolvedValue([]);
jest.mock('@shared/db/typed-execute', () => ({
  typedExecute: mockTypedExecute,
}));

import { AnomalyDetectedHandler } from '../../src/modules/iot/infrastructure/event-handlers/anomaly-detected.handler';
import { AnomalyDetectedEvent } from '../../src/modules/iot/domain/events';
import { PauseSessionCommand } from '../../src/modules/mes/application/commands/pause-session.command';
import { IOT_ANOMALY_CRITICAL_THRESHOLD_RATIO } from '../../src/common/constants/business.constants';

async function build(
  commandBusOverrides: { execute?: jest.Mock } = {},
): Promise<{ handler: AnomalyDetectedHandler; commandBus: { execute: jest.Mock } }> {
  const commandBus = { execute: commandBusOverrides.execute ?? jest.fn().mockResolvedValue({ ok: true }) };
  const module: TestingModule = await Test.createTestingModule({
    providers: [AnomalyDetectedHandler, { provide: CommandBus, useValue: commandBus }],
  }).compile();
  return { handler: module.get(AnomalyDetectedHandler), commandBus };
}

describe('AnomalyDetectedHandler', () => {
  beforeEach(() => {
    mockDbExecute.mockReset().mockResolvedValue({ rows: [] });
    mockTypedExecute.mockReset().mockResolvedValue([]);
  });

  // A failed assertion inside a test body skips any mockRestore() below it, so a
  // Logger.prototype.warn spy from one test can otherwise leak into (and pollute
  // the spy call history of) every later test in this file.
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('handles event without throwing when payload is complete', async () => {
    const { handler } = await build();
    const ev = new AnomalyDetectedEvent('dev-1', 'mach-1', 'high_value', 150);

    await expect(handler.handle(ev)).resolves.toBeUndefined();
  });

  it('logs a warn entry containing the deviceId and anomaly type on success', async () => {
    // No threshold configured (typedExecute resolves []) => ratio cannot be computed
    // => not critical => exactly one warn call (the iot_alerts persistence log),
    // same as before this fix.
    const { handler } = await build();
    const spy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const ev = new AnomalyDetectedEvent('dev-9', 'mach-9', 'high_value', 200);

    await handler.handle(ev);

    expect(spy).toHaveBeenCalledTimes(1);
    const firstArg = spy.mock.calls[0][0] as { deviceId: string; anomalyType: string; severity: string };
    expect(firstArg.deviceId).toBe('dev-9');
    expect(firstArg.anomalyType).toBe('high_value');
    expect(firstArg.severity).toBe('high');
    spy.mockRestore();
  });

  it('handles event with empty deviceId without throwing', async () => {
    const { handler } = await build();
    const ev = new AnomalyDetectedEvent('', '', 'unknown', 0);

    await expect(handler.handle(ev)).resolves.toBeUndefined();
  });

  it('handles event with negative value without throwing', async () => {
    const { handler } = await build();
    const ev = new AnomalyDetectedEvent('dev-1', 'mach-1', 'low_value', -50);

    await expect(handler.handle(ev)).resolves.toBeUndefined();
  });

  it('stays "high" and does not dispatch PauseSessionCommand when the ratio is just below the critical threshold', async () => {
    const threshold = 100;
    // value just under threshold * ratio-cutoff => strictly below the cutoff.
    const value = threshold * IOT_ANOMALY_CRITICAL_THRESHOLD_RATIO - 1;
    mockTypedExecute.mockResolvedValueOnce([{ max_threshold: String(threshold) }]);
    const { handler, commandBus } = await build();

    await handler.handle(new AnomalyDetectedEvent('7', '3', 'high_value', value));

    // Only the threshold lookup ran — the pause-lookup query is never reached.
    expect(mockTypedExecute).toHaveBeenCalledTimes(1);
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('classifies CRITICAL and dispatches PauseSessionCommand for the matched running session at/above the ratio cutoff (inclusive boundary)', async () => {
    const threshold = 100;
    // value = threshold * cutoff exactly => ratio === IOT_ANOMALY_CRITICAL_THRESHOLD_RATIO (>= is inclusive).
    const value = threshold * IOT_ANOMALY_CRITICAL_THRESHOLD_RATIO;
    mockTypedExecute
      .mockResolvedValueOnce([{ max_threshold: String(threshold) }]) // threshold lookup
      .mockResolvedValueOnce([{ id: 42 }]); // running production_sessions lookup
    const { handler, commandBus } = await build();
    const spy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

    await handler.handle(new AnomalyDetectedEvent('7', '3', 'high_value', value));

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const dispatched = commandBus.execute.mock.calls[0][0] as PauseSessionCommand;
    expect(dispatched).toBeInstanceOf(PauseSessionCommand);
    expect(dispatched.sessionId).toBe(42);
    expect(dispatched.reason).toContain('CRITICAL');

    // iot_alerts INSERT still ran with severity escalated to 'critical'.
    const insertLog = spy.mock.calls.find(
      (c) => (c[0] as { severity?: string })?.severity !== undefined,
    )?.[0] as { severity: string } | undefined;
    expect(insertLog?.severity).toBe('critical');
    spy.mockRestore();
  });

  it('does not dispatch PauseSessionCommand when CRITICAL but no running session matches the machine', async () => {
    mockTypedExecute
      .mockResolvedValueOnce([{ max_threshold: '50' }]) // threshold lookup — ratio 4.0, critical
      .mockResolvedValueOnce([]); // no running production_sessions row
    const { handler, commandBus } = await build();

    await expect(
      handler.handle(new AnomalyDetectedEvent('7', '3', 'high_value', 200)),
    ).resolves.toBeUndefined();

    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('does not dispatch PauseSessionCommand and does not throw when machineId is not a valid integer, even on a CRITICAL breach', async () => {
    mockTypedExecute.mockResolvedValueOnce([{ max_threshold: '10' }]); // ratio 50.0, critical
    const { handler, commandBus } = await build();

    await expect(
      handler.handle(new AnomalyDetectedEvent('7', 'not-a-machine-id', 'high_value', 500)),
    ).resolves.toBeUndefined();

    // Threshold lookup happened; the session-lookup query never fires because
    // machineId failed to parse before reaching it.
    expect(mockTypedExecute).toHaveBeenCalledTimes(1);
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('still persists the iot_alerts row even when the PauseSessionCommand dispatch fails', async () => {
    mockTypedExecute
      .mockResolvedValueOnce([{ max_threshold: '100' }])
      .mockResolvedValueOnce([{ id: 9 }]);
    const { handler, commandBus } = await build({
      execute: jest.fn().mockRejectedValue(new Error('mes command bus down')),
    });

    await expect(
      handler.handle(new AnomalyDetectedEvent('7', '3', 'high_value', 300)),
    ).resolves.toBeUndefined();

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    expect(mockDbExecute).toHaveBeenCalledTimes(1); // iot_alerts INSERT unaffected
  });
});
