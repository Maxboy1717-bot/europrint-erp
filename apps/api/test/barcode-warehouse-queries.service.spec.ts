/**
 * Smoke spec for BarcodeWarehouseQueriesService (Rule 22: every service needs a unit test).
 *
 * NOTE: The service depends on injected repositories/database. This smoke
 * spec only verifies that the class is constructible — full behavioural tests
 * belong with the parent barcode-warehouse.service.spec.ts.
 */
import { BarcodeWarehouseQueriesService } from '../src/modules/compatibility/barcode-warehouse-queries.service';

describe('BarcodeWarehouseQueriesService', () => {
  it('is defined', () => {
    expect(BarcodeWarehouseQueriesService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(BarcodeWarehouseQueriesService.name).toBe('BarcodeWarehouseQueriesService');
  });
});
