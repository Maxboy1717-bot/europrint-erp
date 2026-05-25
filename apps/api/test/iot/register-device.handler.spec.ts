/**
 * test/iot/register-device.handler.spec.ts
 *
 * Unit tests for RegisterDeviceHandler.
 * The handler delegates to ISensorRepo.existsByCode + registerDevice — we mock those.
 */

jest.mock('@shared/db', () => ({ db: {}, runQuery: jest.fn() }));

import { Test, TestingModule } from '@nestjs/testing';
import { RegisterDeviceHandler } from '../../src/modules/iot/application/commands/register-device.handler';
import { RegisterDeviceCommand } from '../../src/modules/iot/application/commands/register-device.command';
import { SENSOR_REPO, ISensorRepo } from '../../src/modules/iot/domain/repositories/i-sensor.repo';
import { Ok, Err, AppErr } from '../../src/common/result';

function makeRepo(): jest.Mocked<ISensorRepo> {
  return {
    findDeviceById:   jest.fn(),
    findAllDevices:   jest.fn(),
    saveDevice:       jest.fn(),
    updateDevice:     jest.fn(),
    saveReading:      jest.fn(),
    findReadings:     jest.fn(),
    findAnomalies:    jest.fn(),
    existsByCode:     jest.fn(),
    registerDevice:   jest.fn(),
    updateThresholds: jest.fn(),
  } as jest.Mocked<ISensorRepo>;
}

async function build(repo: ReturnType<typeof makeRepo>): Promise<RegisterDeviceHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      RegisterDeviceHandler,
      { provide: SENSOR_REPO, useValue: repo },
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
    const repo = makeRepo();
    repo.existsByCode.mockResolvedValue(Ok(true));
    const handler = await build(repo);

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('CONFLICT');
  });

  it('inserts and returns the new device when code is unique', async () => {
    const repo = makeRepo();
    repo.existsByCode.mockResolvedValue(Ok(false));
    repo.registerDevice.mockResolvedValue(
      Ok({ id: 'new-1', name: 'Press Temp', type: 'temperature' } as never),
    );
    const handler = await build(repo);

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(true);
    if (r.ok) expect((r.data as never as { id: string }).id).toBe('new-1');
  });

  it('returns Err when repository fails to insert', async () => {
    const repo = makeRepo();
    repo.existsByCode.mockResolvedValue(Ok(false));
    repo.registerDevice.mockResolvedValue(Err(AppErr('INTERNAL', 'Insert failed')));
    const handler = await build(repo);

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(false);
  });

  it('checks existence before inserting (existsByCode then registerDevice)', async () => {
    const repo = makeRepo();
    repo.existsByCode.mockResolvedValue(Ok(false));
    repo.registerDevice.mockResolvedValue(
      Ok({ id: 'x', name: 'n', type: 'temperature' } as never),
    );
    const handler = await build(repo);

    await handler.execute(cmd);

    expect(repo.existsByCode).toHaveBeenCalledWith('SENSOR-001');
    expect(repo.registerDevice).toHaveBeenCalledTimes(1);
  });
});
