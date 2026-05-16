/**
 * test/iot/get-anomalies.handler.spec.ts
 *
 * Unit tests for GetAnomaliesHandler. ISensorRepo mocked.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { GetAnomaliesHandler } from '../../src/modules/iot/application/queries/get-anomalies.handler';
import { GetAnomaliesQuery } from '../../src/modules/iot/application/queries/get-anomalies.query';
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

async function build(repo: ISensorRepo): Promise<GetAnomaliesHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      GetAnomaliesHandler,
      { provide: SENSOR_REPO, useValue: repo },
    ],
  }).compile();
  return module.get(GetAnomaliesHandler);
}

describe('GetAnomaliesHandler', () => {
  it('returns Ok with anomaly items when repository succeeds', async () => {
    const repo = makeRepo();
    const reading = SensorReading.create('dev-1', 99, 'C');
    reading.markAsAnomaly();
    repo.findAnomalies.mockResolvedValue(Ok({ items: [reading], total: 1 }));
    const handler = await build(repo);

    const r = await handler.execute(new GetAnomaliesQuery(1, 20));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.items).toHaveLength(1);
  });

  it('forwards page and limit to repository.findAnomalies', async () => {
    const repo = makeRepo();
    repo.findAnomalies.mockResolvedValue(Ok({ items: [], total: 0 }));
    const handler = await build(repo);

    await handler.execute(new GetAnomaliesQuery(3, 50));

    expect(repo.findAnomalies).toHaveBeenCalledWith({ page: 3, limit: 50 });
  });

  it('returns Err when repository.findAnomalies fails', async () => {
    const repo = makeRepo();
    repo.findAnomalies.mockResolvedValue(Err('db down'));
    const handler = await build(repo);

    const r = await handler.execute(new GetAnomaliesQuery());

    expect(r.ok).toBe(false);
  });

  it('uses default page=1, limit=20 when query omits arguments', async () => {
    const repo = makeRepo();
    repo.findAnomalies.mockResolvedValue(Ok({ items: [], total: 0 }));
    const handler = await build(repo);

    await handler.execute(new GetAnomaliesQuery());

    expect(repo.findAnomalies).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });
});
