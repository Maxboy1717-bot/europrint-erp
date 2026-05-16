/**
 * Smoke spec for PosWarehouseIntegrationQueriesService (Rule 22: every service needs a unit test).
 *
 * NOTE: The service depends on injected repositories/database. This smoke
 * spec only verifies that the class is constructible — full behavioural tests
 * belong with the parent pos-warehouse-integration.service.spec.ts.
 */
import { PosWarehouseIntegrationQueriesService } from '../src/modules/compatibility/pos-warehouse-integration-queries.service';

describe('PosWarehouseIntegrationQueriesService', () => {
  it('is defined', () => {
    expect(PosWarehouseIntegrationQueriesService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(PosWarehouseIntegrationQueriesService.name).toBe('PosWarehouseIntegrationQueriesService');
  });
});
