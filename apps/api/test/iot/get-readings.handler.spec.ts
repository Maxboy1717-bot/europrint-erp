/**
 * test/iot/get-readings.handler.spec.ts
 *
 * Unit tests for GetReadingsHandler. ISensorRepo mocked.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { GetReadingsHandler } from '../../src/modules/iot/application/queries/get-readings.handler';
import { GetReadingsQuery } from '../../src/modules/iot/application/queries/get-readings.query';
import { SENSOR_REPO, ISensorRepo } from '../../src/modules/iot/domain/repositories/i-sensor.repo';
import { SensorReading } from '../../src/modules/iot/domain/aggregates/sensor-reading.aggregate';
import { Ok, Err } from '../../src/common/result';

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

async function build(repo: ISensorRepo): Promise<GetReadingsHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      GetReadingsHandler,
      { provide: SENSOR_REPO, useValue: repo },
    ],
  }).compile();
  return module.get(GetReadingsHandler);
}

describe('GetReadingsHandler', () => {
  it('returns Ok with readings when repository succeeds', async () => {
    const repo = makeRepo();
    const readings = [SensorReading.create('dev-1', 25, 'C'), SensorReading.create('dev-1', 27, 'C')];
    repo.findReadings.mockResolvedValue(Ok(readings));
    const handler = await build(repo);

    const r = await handler.execute(new GetReadingsQuery('dev-1'));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toHaveLength(2);
  });

  it('forwards deviceId and pagination options to repository', async () => {
    const repo = makeRepo();
    repo.findReadings.mockResolvedValue(Ok([]));
    const handler = await build(repo);
    const from = new Date('2024-06-01');
    const to = new Date('2024-06-30');

    await handler.execute(new GetReadingsQuery('dev-7', from, to, 50));

    expect(repo.findReadings).toHaveBeenCalledWith('dev-7', { from, to, limit: 50 });
  });

  it('returns Err when repository.findReadings fails', async () => {
    const repo = makeRepo();
    repo.findReadings.mockResolvedValue(Err('db down'));
    const handler = await build(repo);

    const r = await handler.execute(new GetReadingsQuery('dev-1'));

    expect(r.ok).toBe(false);
  });

  it('uses default limit=100 when not provided in query', async () => {
    const repo = makeRepo();
    repo.findReadings.mockResolvedValue(Ok([]));
    const handler = await build(repo);

    await handler.execute(new GetReadingsQuery('dev-1'));

    const opts = repo.findReadings.mock.calls[0][1];
    expect(opts.limit).toBe(100);
  });
});
