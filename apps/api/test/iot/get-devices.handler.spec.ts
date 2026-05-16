/**
 * test/iot/get-devices.handler.spec.ts
 *
 * Unit tests for GetDevicesHandler. ISensorRepo mocked.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { GetDevicesHandler } from '../../src/modules/iot/application/queries/get-devices.handler';
import { GetDevicesQuery } from '../../src/modules/iot/application/queries/get-devices.query';
import { SENSOR_REPO, ISensorRepo } from '../../src/modules/iot/domain/repositories/i-sensor.repo';
import { SensorDevice } from '../../src/modules/iot/domain/aggregates/sensor-device.aggregate';
import { SensorType } from '../../src/modules/iot/domain/enums/sensor-status.enum';
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

async function build(repo: ISensorRepo): Promise<GetDevicesHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      GetDevicesHandler,
      { provide: SENSOR_REPO, useValue: repo },
    ],
  }).compile();
  return module.get(GetDevicesHandler);
}

describe('GetDevicesHandler', () => {
  it('returns Ok with devices when repository succeeds', async () => {
    const repo = makeRepo();
    const device = SensorDevice.create('mach-1', 'Press-1', SensorType.TEMPERATURE);
    repo.findAllDevices.mockResolvedValue(Ok({ items: [device], total: 1 }));
    const handler = await build(repo);

    const r = await handler.execute(new GetDevicesQuery());

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.items).toHaveLength(1);
  });

  it('forwards status, type, page, limit to repository.findAllDevices', async () => {
    const repo = makeRepo();
    repo.findAllDevices.mockResolvedValue(Ok({ items: [], total: 0 }));
    const handler = await build(repo);

    await handler.execute(new GetDevicesQuery('active', 'temperature', 2, 50));

    expect(repo.findAllDevices).toHaveBeenCalledWith({
      status: 'active',
      type: 'temperature',
      page: 2,
      limit: 50,
    });
  });

  it('returns Err when repository.findAllDevices fails', async () => {
    const repo = makeRepo();
    repo.findAllDevices.mockResolvedValue(Err('db down'));
    const handler = await build(repo);

    const r = await handler.execute(new GetDevicesQuery());

    expect(r.ok).toBe(false);
  });

  it('uses defaults page=1, limit=20 when query omits pagination', async () => {
    const repo = makeRepo();
    repo.findAllDevices.mockResolvedValue(Ok({ items: [], total: 0 }));
    const handler = await build(repo);

    await handler.execute(new GetDevicesQuery());

    const args = repo.findAllDevices.mock.calls[0][0];
    expect(args.page).toBe(1);
    expect(args.limit).toBe(20);
  });
});
