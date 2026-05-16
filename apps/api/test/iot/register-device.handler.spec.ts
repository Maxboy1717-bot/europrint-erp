/**
 * test/iot/register-device.handler.spec.ts
 *
 * Unit tests for RegisterDeviceHandler. The handler runs raw SQL via runQuery;
 * we mock @shared/db.runQuery and the ISensorRepo (which is injected but not
 * used by the existing code path).
 */

interface QueryResult { rows: Array<Record<string, unknown>> }

const runQueryMock = jest.fn();

jest.mock('@shared/db', () => ({
  db: {},
  runQuery: runQueryMock,
}));

import { Test, TestingModule } from '@nestjs/testing';
import { RegisterDeviceHandler } from '../../src/modules/iot/application/commands/register-device.handler';
import { RegisterDeviceCommand } from '../../src/modules/iot/application/commands/register-device.command';
import { SENSOR_REPO, ISensorRepo } from '../../src/modules/iot/domain/repositories/i-sensor.repo';

function makeRepo(): jest.Mocked<ISensorRepo> {
  return {
    findDeviceById: jest.fn(),
    findAllDevices: jest.fn(),
    saveDevice: jest.fn(),
    updateDevice: jest.fn(),
    saveReading: jest.fn(),
    findReadings: jest.fn(),
    findAnomalies: jest.fn(),
  } as jest.Mocked<ISensorRepo>;
}

function queue(...replies: QueryResult[]): void {
  runQueryMock.mockReset();
  let i = 0;
  runQueryMock.mockImplementation(() => Promise.resolve(replies[i++] ?? { rows: [] }));
}

async function build(): Promise<RegisterDeviceHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      RegisterDeviceHandler,
      { provide: SENSOR_REPO, useValue: makeRepo() },
    ],
  }).compile();
  return module.get(RegisterDeviceHandler);
}

const cmd = new RegisterDeviceCommand(
  'SENSOR-001', 'Press Temp', 'Hall A', 'temperature',
  { min: 10, max: 100, unit: 'C' },
);

describe('RegisterDeviceHandler', () => {
  it('returns CONFLICT when device code already exists', async () => {
    queue({ rows: [{ id: 'existing' }] });
    const handler = await build();

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('CONFLICT');
  });

  it('inserts and returns the new device when code is unique', async () => {
    queue(
      { rows: [] },
      { rows: [{ id: 'new-1', name: 'Press Temp', type: 'temperature', created_at: '2024-01-01T00:00:00Z' }] },
    );
    const handler = await build();

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.id).toBe('new-1');
  });

  it('returns Err when INSERT returns no rows', async () => {
    queue(
      { rows: [] },
      { rows: [] },
    );
    const handler = await build();

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(false);
  });

  it('runs lookup query before insert query (two runQuery calls total)', async () => {
    queue(
      { rows: [] },
      { rows: [{ id: 'x', name: 'n', type: 'temperature', created_at: '2024-01-01T00:00:00Z' }] },
    );
    const handler = await build();

    await handler.execute(cmd);

    expect(runQueryMock).toHaveBeenCalledTimes(2);
  });
});
