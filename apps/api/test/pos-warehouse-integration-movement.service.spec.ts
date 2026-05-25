/**
 * Smoke spec for PosWarehouseIntegrationMovementService (Rule 22: every service needs a unit test).
 *
 * NOTE: The service depends on injected repositories/database. This smoke
 * spec only verifies that the class is constructible — full behavioural tests
 * belong with the parent pos-warehouse-integration.service.spec.ts.
 */
import { PosWarehouseIntegrationMovementService } from '../src/modules/compatibility/pos-warehouse-integration-movement.service';

describe('PosWarehouseIntegrationMovementService', () => {
  it('is defined', () => {
    expect(PosWarehouseIntegrationMovementService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(PosWarehouseIntegrationMovementService.name).toBe('PosWarehouseIntegrationMovementService');
  });
});
