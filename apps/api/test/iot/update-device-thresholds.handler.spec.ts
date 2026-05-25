/**
 * test/iot/update-device-thresholds.handler.spec.ts
 *
 * Unit tests for UpdateDeviceThresholdsHandler.
 * The handler delegates to ISensorRepo.updateThresholds — we mock that method.
 */

jest.mock('@shared/db', () => ({ db: {}, runQuery: jest.fn() }));

import { Test, TestingModule } from '@nestjs/testing';
import { UpdateDeviceThresholdsHandler } from '../../src/modules/iot/application/commands/update-device-thresholds.handler';
import { UpdateDeviceThresholdsCommand } from '../../src/modules/iot/application/commands/update-device-thresholds.command';
import { SENSOR_REPO, ISensorRepo } from '../../src/modules/iot/domain/repositories/i-sensor.repo';
import { Ok, Err, AppErr } from '../../src/common/result';

function makeRepo(): jest.Mocked<ISensorRepo> {
  return {
    findDeviceById:  jest.fn(),
    findAllDevices:  jest.fn(),
    saveDevice:      jest.fn(),
    updateDevice:    jest.fn(),
    saveReading:     jest.fn(),
    findReadings:    jest.fn(),
    findAnomalies:   jest.fn(),
    existsByCode:    jest.fn(),
    registerDevice:  jest.fn(),
    updateThresholds: jest.fn(),
  } as jest.Mocked<ISensorRepo>;
}

async function build(repo: ReturnType<typeof makeRepo>): Promise<UpdateDeviceThresholdsHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      UpdateDeviceThresholdsHandler,
      { provide: SENSOR_REPO, useValue: repo },
    ],
  }).compile();
  return module.get(UpdateDeviceThresholdsHandler);
}

const cmd = new UpdateDeviceThresholdsCommand('dev-1', { min: 5, max: 95, unit: 'C' });

describe('UpdateDeviceThresholdsHandler', () => {
  it('returns NOT_FOUND when device does not exist', async () => {
    const repo = makeRepo();
    repo.updateThresholds.mockResolvedValue(Err(AppErr('NOT_FOUND', 'Device not found')));
    const handler = await build(repo);

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('returns Err when repository reports update failure', async () => {
    const repo = makeRepo();
    repo.updateThresholds.mockResolvedValue(Err(AppErr('INTERNAL', 'Update failed')));
    const handler = await build(repo);

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(false);
  });

  it('returns Ok with updated thresholds on success', async () => {
    const repo = makeRepo();
    repo.updateThresholds.mockResolvedValue(
      Ok({ thresholds: { min: 5, max: 95 } } as never),
    );
    const handler = await build(repo);

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.thresholds?.min).toBe(5);
      expect(r.data.thresholds?.max).toBe(95);
    }
  });

  it('delegates to repository updateThresholds exactly once', async () => {
    const repo = makeRepo();
    repo.updateThresholds.mockResolvedValue(
      Ok({ thresholds: { min: 5, max: 95 } } as never),
    );
    const handler = await build(repo);

    await handler.execute(cmd);

    expect(repo.updateThresholds).toHaveBeenCalledTimes(1);
    // cmd has { min: 5, max: 95 } — both are non-null so ?? null keeps the values
    expect(repo.updateThresholds).toHaveBeenCalledWith('dev-1', { min: 5, max: 95 });
  });

  it('returns undefined min/max when repository row has no threshold values', async () => {
    const repo = makeRepo();
    repo.updateThresholds.mockResolvedValue(
      Ok({ thresholds: undefined } as never),
    );
    const handler = await build(repo);

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.thresholds?.min).toBeUndefined();
      expect(r.data.thresholds?.max).toBeUndefined();
    }
  });
});
