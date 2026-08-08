/**
 * test/wms/wms-warehouses.controller.create.spec.ts
 *
 * Ombor tozalash (WMS-POS-FULL-AUDIT-2026-07-05, item 2, 2026-07-06):
 * WmsWarehousesController.create() never checked for an existing active
 * warehouse with the same name -- code has a DB UNIQUE constraint, name does
 * not. Proves the new duplicate-name guard.
 *
 * Strategy: mock @shared/db (rawSql) so no real DB call is made, mirroring
 * test/sd/drizzle-sd-customers-duplicate.repo.spec.ts (same pattern, prior
 * Residual Fix Loop task).
 */

const mockRawSql = jest.fn();

jest.mock('@shared/db', () => ({
  rawSql: (...args: unknown[]) => mockRawSql(...args),
}));

import { ConflictException } from '@nestjs/common';
import { WmsWarehousesController } from '../../src/modules/wms/presentation/wms-warehouses.controller';

function makeI18n() {
  return {
    t: jest.fn().mockImplementation(async (key: string) => key),
    translate: jest.fn().mockImplementation(async (key: string) => key),
  } as unknown as import('nestjs-i18n').I18nService;
}

describe('WmsWarehousesController.create (duplicate-name guard)', () => {
  let controller: WmsWarehousesController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new WmsWarehousesController(
      {} as ConstructorParameters<typeof WmsWarehousesController>[0],
      {} as ConstructorParameters<typeof WmsWarehousesController>[1],
      {} as ConstructorParameters<typeof WmsWarehousesController>[2],
      makeI18n(),
    );
  });

  const user = { id: 1 } as Parameters<WmsWarehousesController['create']>[1];

  it('throws ConflictException when an active warehouse already has this name', async () => {
    mockRawSql.mockResolvedValueOnce({ rows: [{ id: 5 }] }); // duplicate-check finds a match

    await expect(
      controller.create({ name: 'Asosiy ombor' }, user),
    ).rejects.toBeInstanceOf(ConflictException);

    // Only the duplicate-check query ran -- no INSERT was attempted.
    expect(mockRawSql).toHaveBeenCalledTimes(1);
  });

  it('creates the warehouse when no duplicate name exists', async () => {
    mockRawSql
      .mockResolvedValueOnce({ rows: [] }) // duplicate-check: none found
      .mockResolvedValueOnce({ rows: [{ id: 9, name: 'Yangi ombor', code: 'YO-1' }] }); // insert

    const result = await controller.create({ name: 'Yangi ombor' }, user);

    expect(result).toEqual({ id: 9, name: 'Yangi ombor', code: 'YO-1' });
    expect(mockRawSql).toHaveBeenCalledTimes(2);
  });
});
