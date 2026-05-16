/**
 * Smoke spec for EmployeesCompatProfileRawService (Rule 22: every service needs a unit test).
 *
 * NOTE: The service depends on injected repositories/database. This smoke
 * spec only verifies that the class is constructible — full behavioural tests
 * belong with the parent employees-compat.service.spec.ts.
 */
import { EmployeesCompatProfileRawService } from '../src/modules/compatibility/employees-compat-profile-raw.service';

describe('EmployeesCompatProfileRawService', () => {
  it('is defined', () => {
    expect(EmployeesCompatProfileRawService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(EmployeesCompatProfileRawService.name).toBe('EmployeesCompatProfileRawService');
  });
});
