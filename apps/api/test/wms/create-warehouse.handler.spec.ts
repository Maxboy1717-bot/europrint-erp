/**
 * test/wms/create-warehouse.handler.spec.ts
 *
 * Unit tests for CreateWarehouseHandler. IWmsRepository is mocked via WMS_REPO token
 * so the handler can exercise the create-warehouse use case without Postgres.
 */

import { Test } from '@nestjs/testing';
import { CreateWarehouseHandler } from '../../src/modules/wms/application/commands/create-warehouse.handler';
import { CreateWarehouseCommand } from '../../src/modules/wms/application/commands/create-warehouse.command';
import { WMS_REPO } from '../../src/modules/wms/domain/repositories/wms.repository';
import { Ok } from '../../src/common/result';

function makeRepoMock() {
  return {
    createWarehouse: jest.fn().mockImplementation(async (input: unknown) => Ok(input)),
    saveStock: jest.fn(),
    getStock: jest.fn(),
    getStockByMaterialAndWarehouse: jest.fn(),
    getFefoStock: jest.fn(),
    reserveMaterial: jest.fn(),
    issueGoods: jest.fn(),
    receiveFg: jest.fn(),
    getAllStockByStatus: jest.fn(),
    softDeleteStock: jest.fn(),
    withTransaction: jest.fn().mockImplementation((cb: (tx: unknown) => Promise<unknown>) => cb(undefined)),
  };
}

describe('CreateWarehouseHandler', () => {
  let handler: CreateWarehouseHandler;
  let repo: ReturnType<typeof makeRepoMock>;

  beforeEach(async () => {
    jest.clearAllMocks();
    repo = makeRepoMock();
    const moduleRef = await Test.createTestingModule({
      providers: [
        CreateWarehouseHandler,
        { provide: WMS_REPO, useValue: repo },
      ],
    }).compile();
    handler = moduleRef.get(CreateWarehouseHandler);
  });

  it('returns ok with generated id when command has required fields only', async () => {
    const cmd = new CreateWarehouseCommand('Main WH', 'Tashkent st. 1');

    const result = await handler.execute(cmd);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(typeof result.data.id).toBe('string');
      expect(result.data.name).toBe('Main WH');
      expect(result.data.address).toBe('Tashkent st. 1');
    }
  });

  it('defaults isFreeStorage to false and days to 30 when omitted', async () => {
    await handler.execute(new CreateWarehouseCommand('WH2', 'Addr 2'));

    expect(repo.createWarehouse).toHaveBeenCalledTimes(1);
    const row = repo.createWarehouse.mock.calls[0][0];
    expect(row.is_free_storage).toBe(false);
    expect(row.free_storage_days).toBe(30);
    expect(row.monthly_rate).toBeNull();
  });

  it('stores monthlyRate as a numeric string when provided', async () => {
    await handler.execute(
      new CreateWarehouseCommand('WH3', 'Addr 3', true, 14, 2500.5),
    );

    const row = repo.createWarehouse.mock.calls[0][0];
    expect(row.is_free_storage).toBe(true);
    expect(row.free_storage_days).toBe(14);
    expect(row.monthly_rate).toBe('2500.5');
  });

  it('calls repo.createWarehouse exactly once per execute', async () => {
    await handler.execute(new CreateWarehouseCommand('WH4', 'Addr 4'));

    expect(repo.createWarehouse).toHaveBeenCalledTimes(1);
  });

  it('emits unique ids when invoked multiple times', async () => {
    await handler.execute(new CreateWarehouseCommand('A', 'A'));
    const idA = repo.createWarehouse.mock.calls[0][0].id;
    await handler.execute(new CreateWarehouseCommand('B', 'B'));
    const idB = repo.createWarehouse.mock.calls[1][0].id;

    expect(idA).not.toEqual(idB);
  });
});
