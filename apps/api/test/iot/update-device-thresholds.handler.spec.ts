/**
 * test/iot/update-device-thresholds.handler.spec.ts
 *
 * Unit tests for UpdateDeviceThresholdsHandler. Mocks @shared/db.runQuery for
 * the two raw SQL calls (existence check + UPDATE … RETURNING).
 */

interface QueryResult { rows: Array<Record<string, unknown>> }

const runQueryMock = jest.fn();

jest.mock('@shared/db', () => ({
  db: {},
  runQuery: runQueryMock,
}));

import { Test, TestingModule } from '@nestjs/testing';
import { UpdateDeviceThresholdsHandler } from '../../src/modules/iot/application/commands/update-device-thresholds.handler';
import { UpdateDeviceThresholdsCommand } from '../../src/modules/iot/application/commands/update-device-thresholds.command';
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

async function build(): Promise<UpdateDeviceThresholdsHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      UpdateDeviceThresholdsHandler,
      { provide: SENSOR_REPO, useValue: makeRepo() },
    ],
  }).compile();
  return module.get(UpdateDeviceThresholdsHandler);
}

const cmd = new UpdateDeviceThresholdsCommand('dev-1', { min: 5, max: 95, unit: 'C' });

describe('UpdateDeviceThresholdsHandler', () => {
  it('returns NOT_FOUND when device does not exist', async () => {
    queue({ rows: [] });
    const handler = await build();

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('returns Err when UPDATE returns no rows', async () => {
    queue(
      { rows: [{ id: 'dev-1' }] },
      { rows: [] },
    );
    const handler = await build();

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(false);
  });

  it('returns Ok with updated thresholds on success', async () => {
    queue(
      { rows: [{ id: 'dev-1' }] },
      {
        rows: [{
          id: 'dev-1',
          name: 'Temp',
          type: 'temperature',
          min_threshold: 5,
          max_threshold: 95,
          created_at: '2024-01-01T00:00:00Z',
        }],
      },
    );
    const handler = await build();

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.thresholds?.min).toBe(5);
      expect(r.data.thresholds?.max).toBe(95);
    }
  });

  it('runs existence check before UPDATE (two queries total)', async () => {
    queue(
      { rows: [{ id: 'dev-1' }] },
      {
        rows: [{
          id: 'dev-1',
          name: 'Temp',
          type: 'temperature',
          min_threshold: null,
          max_threshold: null,
          created_at: '2024-01-01T00:00:00Z',
        }],
      },
    );
    const handler = await build();

    await handler.execute(cmd);

    expect(runQueryMock).toHaveBeenCalledTimes(2);
  });

  it('returns undefined min/max when database row has null threshold values', async () => {
    queue(
      { rows: [{ id: 'dev-1' }] },
      {
        rows: [{
          id: 'dev-1',
          name: 'Temp',
          type: 'temperature',
          min_threshold: null,
          max_threshold: null,
          created_at: '2024-01-01T00:00:00Z',
        }],
      },
    );
    const handler = await build();

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.thresholds?.min).toBeUndefined();
      expect(r.data.thresholds?.max).toBeUndefined();
    }
  });
});
