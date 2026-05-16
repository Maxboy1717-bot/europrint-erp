/**
 * test/wms/create-warehouse.handler.spec.ts
 *
 * Unit tests for CreateWarehouseHandler. The shared db client is mocked so the
 * handler can drive the insert path without touching Postgres.
 */

jest.mock('@shared/db', () => {
  const insert = jest.fn().mockReturnValue({
    values: jest.fn().mockResolvedValue(undefined),
  });
  return {
    db: { insert },
    warehouses: { __tableName: 'warehouses' },
    runQuery: jest.fn().mockResolvedValue({ rows: [] }),
  };
});

import { Test } from '@nestjs/testing';
import { CreateWarehouseHandler } from '../../src/modules/wms/application/commands/create-warehouse.handler';
import { CreateWarehouseCommand } from '../../src/modules/wms/application/commands/create-warehouse.command';
import { db } from '@shared/db';

interface InsertedRow {
  id: string;
  name: string;
  address: string;
  is_free_storage: boolean;
  free_storage_days: number;
  monthly_rate: string | null;
  created_at: Date;
}

function lastInsertedRow(): InsertedRow {
  const insertFn = (db as unknown as { insert: jest.Mock }).insert;
  const callIndex = insertFn.mock.calls.length - 1;
  const valuesFn = insertFn.mock.results[callIndex].value.values as jest.Mock;
  return valuesFn.mock.calls[0][0] as InsertedRow;
}

describe('CreateWarehouseHandler', () => {
  let handler: CreateWarehouseHandler;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [CreateWarehouseHandler],
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

    const row = lastInsertedRow();
    expect(row.is_free_storage).toBe(false);
    expect(row.free_storage_days).toBe(30);
    expect(row.monthly_rate).toBeNull();
  });

  it('stores monthlyRate as a numeric string when provided', async () => {
    await handler.execute(
      new CreateWarehouseCommand('WH3', 'Addr 3', true, 14, 2500.5),
    );

    const row = lastInsertedRow();
    expect(row.is_free_storage).toBe(true);
    expect(row.free_storage_days).toBe(14);
    expect(row.monthly_rate).toBe('2500.5');
  });

  it('calls db.insert exactly once per execute', async () => {
    await handler.execute(new CreateWarehouseCommand('WH4', 'Addr 4'));

    const insertFn = (db as unknown as { insert: jest.Mock }).insert;
    expect(insertFn).toHaveBeenCalledTimes(1);
  });

  it('emits unique ids when invoked multiple times', async () => {
    await handler.execute(new CreateWarehouseCommand('A', 'A'));
    const idA = lastInsertedRow().id;
    await handler.execute(new CreateWarehouseCommand('B', 'B'));
    const idB = lastInsertedRow().id;

    expect(idA).not.toEqual(idB);
  });
});
