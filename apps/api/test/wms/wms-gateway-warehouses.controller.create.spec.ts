/**
 * test/wms/wms-gateway-warehouses.controller.create.spec.ts
 *
 * Ombor tozalash (WMS-POS-FULL-AUDIT-2026-07-05, item 2, 2026-07-06):
 * WmsGatewayWarehousesController.createWarehouse() never checked for an
 * existing active warehouse with the same name -- code has a DB UNIQUE
 * constraint, name does not. Proves the new duplicate-name guard (same
 * pattern as wms-warehouses.controller.create.spec.ts).
 */

const mockRawSql = jest.fn();

jest.mock('@shared/db', () => ({
  rawSql: (...args: unknown[]) => mockRawSql(...args),
}));

import { ConflictException } from '@nestjs/common';
import { WmsGatewayWarehousesController } from '../../src/modules/wms/presentation/wms-gateway-warehouses.controller';

describe('WmsGatewayWarehousesController.createWarehouse (duplicate-name guard)', () => {
  let controller: WmsGatewayWarehousesController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new WmsGatewayWarehousesController(
      {} as ConstructorParameters<typeof WmsGatewayWarehousesController>[0],
    );
  });

  const user = { id: 1 } as Parameters<WmsGatewayWarehousesController['createWarehouse']>[1];

  it('throws ConflictException when an active warehouse already has this name', async () => {
    mockRawSql.mockResolvedValueOnce({ rows: [{ id: 5 }] }); // duplicate-check finds a match

    await expect(
      controller.createWarehouse({ name: 'Asosiy ombor' }, user),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(mockRawSql).toHaveBeenCalledTimes(1);
  });

  it('creates the warehouse when no duplicate name exists', async () => {
    mockRawSql
      .mockResolvedValueOnce({ rows: [] }) // duplicate-check: none found
      .mockResolvedValueOnce({ rows: [{ id: 9, name: 'Yangi ombor', code: 'YO-1' }] }); // insert

    const result = await controller.createWarehouse({ name: 'Yangi ombor' }, user);

    expect(result).toEqual({ id: 9, name: 'Yangi ombor', code: 'YO-1' });
    expect(mockRawSql).toHaveBeenCalledTimes(2);
  });
});
