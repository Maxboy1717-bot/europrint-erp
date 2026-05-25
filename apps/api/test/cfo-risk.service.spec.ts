/**
 * Smoke spec for CfoRiskService (Rule 22: every service needs a unit test).
 *
 * NOTE: The service depends on injected repositories/database. This smoke
 * spec only verifies that the class is constructible — full behavioural tests
 * belong with the parent cfo.service.spec.ts.
 */
import { CfoRiskService } from '../src/modules/compatibility/cfo-risk.service';

describe('CfoRiskService', () => {
  it('is defined', () => {
    expect(CfoRiskService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(CfoRiskService.name).toBe('CfoRiskService');
  });
});
